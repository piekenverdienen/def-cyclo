function crc16(bytes) {
  const table = [
    0x0000,0xCC01,0xD801,0x1400,0xF001,0x3C00,0x2800,0xE401,
    0xA001,0x6C00,0x7800,0xB401,0x5000,0x9C01,0x8801,0x4400
  ];
  let crc = 0;
  for (let byte of bytes) {
    let tmp = table[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc ^= tmp ^ table[byte & 0xF];
    tmp = table[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc ^= tmp ^ table[(byte >> 4) & 0xF];
  }
  return crc;
}

class FitBuilder {
  constructor() {
    this.data = [];
    this.built = false;
    this.defs = {};
  }

  add(bytes) {
    this.data.push(...bytes);
  }

  addDefinition(localMsg, globalMsg, fields) {
    const header = 0x40 | (localMsg & 0xF);
    const bytes = [header, 0x00, 0x00, globalMsg & 0xFF, (globalMsg >> 8) & 0xFF, fields.length];
    fields.forEach(f => {
      bytes.push(f.num, f.size, f.base);
    });
    this.add(bytes);
    this.defs[localMsg] = {fields};
  }

  addData(localMsg, values) {
    const bytes = [localMsg & 0xF];
    values.forEach(v => bytes.push(...v));
    this.add(bytes);
  }

  build() {
    const headerSize = 14;
    const data = Uint8Array.from(this.data);
    const header = new Uint8Array(headerSize);
    header[0] = headerSize;
    header[1] = 0x10;
    header[2] = 0x00; // profile
    header[3] = 0x00;
    header[4] = data.length & 0xFF;
    header[5] = (data.length >> 8) & 0xFF;
    header[6] = (data.length >> 16) & 0xFF;
    header[7] = (data.length >> 24) & 0xFF;
    header[8] = 0x2E; // '.'
    header[9] = 0x46; // 'F'
    header[10] = 0x49; // 'I'
    header[11] = 0x54; // 'T'
    const crcHeader = crc16(header.slice(0, headerSize - 2));
    header[12] = crcHeader & 0xFF;
    header[13] = crcHeader >> 8;
    const crcData = crc16(data);
    const result = new Uint8Array(headerSize + data.length + 2);
    result.set(header, 0);
    result.set(data, headerSize);
    result[headerSize + data.length] = crcData & 0xFF;
    result[headerSize + data.length + 1] = crcData >> 8;
    this.built = true;
    return result;
  }
}

export function generateFitWorkout(title, blocks, ftp) {
  const b = new FitBuilder();

  // File ID message definition and record
  b.addDefinition(0, 0, [
    { num: 0, size: 1, base: 0x00 }, // type
    { num: 1, size: 2, base: 0x84 }, // manufacturer
    { num: 2, size: 2, base: 0x84 }  // product
  ]);
  b.addData(0, [
    [5], // FileType.WORKOUT
    [0xFF, 0xFF], // Manufacturer DEVELOPMENT
    [1, 0]
  ]);

  // Workout message definition and record
  b.addDefinition(1, 26, [
    { num: 4, size: 1, base: 0x00 }, // sport
    { num: 5, size: 16, base: 0x07 } // workout_name
  ]);
  const nameBytes = new Array(16).fill(0);
  const encoded = new TextEncoder().encode(title);
  nameBytes.splice(0, Math.min(encoded.length, 15), ...encoded.slice(0, 15));
  b.addData(1, [
    [2], // sport cycling
    nameBytes
  ]);

  // Workout step definition
  b.addDefinition(2, 27, [
    { num: 254, size: 2, base: 0x84 }, // message_index
    { num: 0, size: 1, base: 0x00 },   // duration_type
    { num: 1, size: 4, base: 0x86 },   // duration_value
    { num: 3, size: 1, base: 0x00 },   // target_type
    { num: 4, size: 4, base: 0x86 },   // target_value
    { num: 5, size: 1, base: 0x00 },   // intensity
    { num: 6, size: 16, base: 0x07 }   // notes
  ]);

  let index = 0;
  function pushStep(name, durMin, factor, intensity) {
    const target = Math.round(ftp * factor);
    const noteBytes = new Array(16).fill(0);
    const txt = new TextEncoder().encode(name);
    noteBytes.splice(0, Math.min(txt.length, 15), ...txt.slice(0, 15));
    b.addData(2, [
      [index & 0xFF, (index >> 8) & 0xFF],
      [0],
      [durMin * 60 & 0xFF, (durMin * 60 >> 8) & 0xFF, (durMin * 60 >> 16) & 0xFF, (durMin * 60 >> 24) & 0xFF],
      [4],
      [target & 0xFF, (target >> 8) & 0xFF, (target >> 16) & 0xFF, (target >> 24) & 0xFF],
      [intensity],
      noteBytes
    ]);
    index++;
  }

  blocks.forEach((block) => {
    if (block.type === 'interval') {
      for (let i = 0; i < block.repeats; i++) {
        pushStep(`Interval ${i + 1}`, block.minutes, block.factor, 1);
        pushStep(`Rust ${i + 1}`, block.rest, block.restFactor || 0.5, 0);
      }
    } else {
      const name = block.type.charAt(0).toUpperCase() + block.type.slice(1);
      const intensity = block.type === 'cooldown' ? 0 : 1;
      pushStep(name, block.minutes, block.factor, intensity);
    }
  });

  return b.build();
}
