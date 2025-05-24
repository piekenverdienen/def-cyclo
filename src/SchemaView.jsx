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
  for (let w = 1; w <= 6; w++) {
    for (let d = 0; d < days; d++) {
      const baseBlocks = planByLevel[level];
      schema.push({
        day: `Week ${w} - Dag ${d + 1}`,
        title: `Trainingsblok ${w}.${d + 1}`,
        blocks: baseBlocks,
      });
    }
  }
  return schema;
}

function generateFitWorkout(title) {
  const header = new Uint8Array([0x0e, 0x10, 0x00, 0x00, 0x2e, 0x46, 0x49, 0x54]);
  const text = new TextEncoder().encode(title);
  return new Blob([header, text], { type: 'application/octet-stream' });
}

function downloadFit(title) {
  const blob = generateFitWorkout(title);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.fit`;
  link.click();
}

export default function SchemaView({ intake, onUpdateFtp }) {
  const schema = generateSchema(intake);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Trainingsschema</h1>
        <p className="text-gray-600">
          Email: <strong>{intake.email}</strong> · Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · Gewicht: <strong>{intake.weight} kg</strong> · FTP: <strong>{intake.ftp} watt</strong>
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
                Download .fit
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
