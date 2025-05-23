function generateSchema({ level, days, ftp }) {
  const planByLevel = {
    beginner: [
      { type: 'warmup', minutes: 10, factor: 0.55 },
      { type: 'endurance', minutes: 30, factor: 0.65 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
    intermediate: [
      { type: 'warmup', minutes: 10, factor: 0.6 },
      { type: 'interval', minutes: 5, factor: 1.05, repeats: 4, rest: 3, restFactor: 0.6 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
    advanced: [
      { type: 'warmup', minutes: 10, factor: 0.65 },
      { type: 'interval', minutes: 6, factor: 1.1, repeats: 5, rest: 3, restFactor: 0.6 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
  };

  const schema = [];
  for (let w = 0; w < 6; w++) {
    for (let d = 0; d < days; d++) {
      const baseBlocks = planByLevel[level];
      schema.push({
        day: `Week ${w + 1} - Dag ${d + 1}`,
        title: `Training ${w * days + d + 1}`,
        blocks: baseBlocks,
      });
    }
  }
  return schema;
}

function crc16(buf) {
  let crc = 0;
  for (let b of buf) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      if (crc & 1) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}

function generateFitWorkout() {
  const header = new Uint8Array(14);
  header[0] = 14; // header size
  header[1] = 0x10; // protocol version 1.0
  header[2] = 0; // profile version low byte
  header[3] = 0; // profile version high byte
  header[4] = 0; // data size bytes 0-3 all zero (no data)
  header[5] = 0;
  header[6] = 0;
  header[7] = 0;
  header[8] = 0x2e; // '.'
  header[9] = 0x46; // 'F'
  header[10] = 0x49; // 'I'
  header[11] = 0x54; // 'T'
  const crc = crc16(header.slice(0, 12));
  header[12] = crc & 0xff;
  header[13] = (crc >> 8) & 0xff;
  return header;
}

function downloadFit(title) {
  const bytes = generateFitWorkout();
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.fit`;
  link.click();
}

export default function SchemaView({ intake, onUpdateFtp }) {
  const schema = generateSchema(intake);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Gewicht: <strong>{intake.weight} kg</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>

        <div className="grid gap-4">
          {schema.map((item, index) => (
            <div key={index} className="bg-blue-50 p-4 rounded shadow-sm border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-800">{item.day}</h2>
              <p className="text-gray-700 mb-2">Trainingsvorm: <strong>{item.title}</strong></p>
              <ul className="list-disc ml-5 text-gray-600">
                {item.blocks.map((b, i) => (
                  <li key={i}>
                    {b.type === 'interval'
                      ? `${b.repeats}x ${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt + ${b.rest} min rust @ ${Math.round(intake.ftp * b.restFactor)} watt`
                      : `${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt (${b.type})`}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => downloadFit(item.title)}
                className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Download .FIT
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <label className="block text-gray-700 font-medium mb-1">Update je FTP:</label>
          <input
            type="number"
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="Nieuwe FTP"
            onChange={(e) => onUpdateFtp(parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
