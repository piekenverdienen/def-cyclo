// Minimal FIT file generator for workouts

function crc16(bytes) {
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xA001;
      } else {
        crc >>>= 1;
      }
    }
  }
  return crc;
}

class FitBuilder {
  constructor() {
    this.data = [];
  }
  static BASE_ENUM = 0x00;
  static BASE_UINT8 = 0x02;
  static BASE_UINT16 = 0x84;
  static BASE_UINT32 = 0x86;
  static BASE_STRING = 0x07;

  b(v) { this.data.push(v & 0xff); }
  u16(v) { this.b(v & 0xff); this.b((v >> 8) & 0xff); }
  u32(v) { this.u16(v & 0xffff); this.u16(v >> 16); }
  str(s, size) {
    for (let i = 0; i < size; i++) {
      this.b(i < s.length ? s.charCodeAt(i) : 0);
    }
  }

  addDefinition(local, global, fields) {
    this.b(0x40 | local);
    this.b(0); // reserved
    this.b(0); // little endian
    this.u16(global);
    this.b(fields.length);
    for (const f of fields) {
      this.b(f.num);
      this.b(f.size);
      this.b(f.type);
    }
  }

  addData(local, fields, values) {
    this.b(local);
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const val = values[i];
      switch (f.type) {
        case FitBuilder.BASE_ENUM:
        case FitBuilder.BASE_UINT8:
          this.b(val);
          break;
        case FitBuilder.BASE_UINT16:
          this.u16(val);
          break;
        case FitBuilder.BASE_UINT32:
          this.u32(val);
          break;
        case FitBuilder.BASE_STRING:
          this.str(val || '', f.size);
          break;
        default:
          this.b(0);
      }
    }
  }

  build() {
    const data = new Uint8Array(this.data);
    const header = new Uint8Array(14);
    header[0] = 14; // header size
    header[1] = 0x10; // protocol version 1.0
    header[2] = 0; // profile version low byte
    header[3] = 0;
    header[4] = data.length & 0xff;
    header[5] = (data.length >> 8) & 0xff;
    header[6] = (data.length >> 16) & 0xff;
    header[7] = (data.length >> 24) & 0xff;
    header[8] = 0x46; // 'F'
    header[9] = 0x49; // 'I'
    header[10] = 0x54; // 'T'
    header[11] = 0x00;
    const headerCrc = crc16(header.slice(0, 12));
    header[12] = headerCrc & 0xff;
    header[13] = (headerCrc >> 8) & 0xff;

    const fileCrc = crc16(data);
    const out = new Uint8Array(header.length + data.length + 2);
    out.set(header, 0);
    out.set(data, header.length);
    out[out.length - 2] = fileCrc & 0xff;
    out[out.length - 1] = (fileCrc >> 8) & 0xff;
    return out.buffer;
  }
}

export function generateFitWorkout(title, blocks, ftp) {
  const steps = [];
  blocks.forEach((block) => {
    if (block.type === 'interval') {
      for (let i = 0; i < block.repeats; i++) {
        steps.push({
          name: `Interval ${i + 1}`,
          duration: block.minutes * 60,
          powerLow: Math.round(ftp * block.factor * 0.95),
          powerHigh: Math.round(ftp * block.factor * 1.05),
          intensity: 1,
        });
        steps.push({
          name: `Rest ${i + 1}`,
          duration: block.rest * 60,
          powerLow: Math.round(ftp * block.restFactor * 0.95),
          powerHigh: Math.round(ftp * block.restFactor * 1.05),
          intensity: 0,
        });
      }
    } else {
      steps.push({
        name: block.type,
        duration: block.minutes * 60,
        powerLow: Math.round(ftp * block.factor * 0.95),
        powerHigh: Math.round(ftp * block.factor * 1.05),
        intensity: block.type === 'warmup' || block.type === 'cooldown' ? 0 : 1,
      });
    }
  });

  const fb = new FitBuilder();

  // file_id message
  const fileIdFields = [{ num: 0, size: 1, type: FitBuilder.BASE_ENUM }];
  fb.addDefinition(0, 0, fileIdFields);
  fb.addData(0, fileIdFields, [6]); // workout file

  // workout message
  const workoutFields = [
    { num: 4, size: 1, type: FitBuilder.BASE_ENUM }, // sport
    { num: 6, size: 2, type: FitBuilder.BASE_UINT16 }, // num_valid_steps
    { num: 8, size: 16, type: FitBuilder.BASE_STRING }, // name
  ];
  fb.addDefinition(1, 26, workoutFields);
  fb.addData(1, workoutFields, [2, steps.length, title.slice(0, 15)]);

  // workout_step message
  const stepFields = [
    { num: 254, size: 2, type: FitBuilder.BASE_UINT16 },
    { num: 0, size: 1, type: FitBuilder.BASE_ENUM }, // duration_type (time=0)
    { num: 1, size: 4, type: FitBuilder.BASE_UINT32 }, // duration_value
    { num: 3, size: 1, type: FitBuilder.BASE_ENUM }, // target_type (power=1)
    { num: 5, size: 4, type: FitBuilder.BASE_UINT32 }, // low
    { num: 6, size: 4, type: FitBuilder.BASE_UINT32 }, // high
    { num: 7, size: 1, type: FitBuilder.BASE_ENUM }, // intensity
    { num: 8, size: 16, type: FitBuilder.BASE_STRING }, // notes
  ];
  fb.addDefinition(2, 27, stepFields);
  steps.forEach((s, idx) => {
    fb.addData(2, stepFields, [
      idx,
      0,
      s.duration,
      1,
      s.powerLow,
      s.powerHigh,
      s.intensity,
      s.name.slice(0, 15),
    ]);
  });

  return fb.build();
}

export function downloadFit(title, blocks, ftp) {
  const buffer = generateFitWorkout(title, blocks, ftp);
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.fit`;
  link.click();
}
