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
  for (let i = 0; i < days; i++) {
    const baseBlocks = planByLevel[level];
    schema.push({
      day: `Dag ${i + 1}`,
      title: `Trainingsblok ${i + 1}`,
      blocks: baseBlocks,
    });
  }
  return schema;
}

function generateTcxWorkout(title, blocks, ftp) {
  const steps = [];

  blocks.forEach((block) => {
    if (block.type === 'interval') {
      for (let i = 0; i < block.repeats; i++) {
        steps.push({ name: `Interval ${i + 1}`, duration: block.minutes * 60, power: Math.round(ftp * block.factor) });
        steps.push({ name: `Rust ${i + 1}`, duration: block.rest * 60, power: Math.round(ftp * block.restFactor) });
      }
    } else {
      steps.push({ name: block.type.charAt(0).toUpperCase() + block.type.slice(1), duration: block.minutes * 60, power: Math.round(ftp * block.factor) });
    }
  });

  const xmlSteps = steps
    .map(
      (s) => `\n      <Step>\n        <Name>${s.name}</Name>\n        <Duration>\n          <DurationType>Time</DurationType>\n          <Seconds>${s.duration}</Seconds>\n        </Duration>\n        <Target>\n          <TargetType>Power</TargetType>\n          <PowerZone>${s.power}</PowerZone>\n        </Target>\n      </Step>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">\n  <Workouts>\n    <Workout Sport="Biking">\n      <Name>${title}</Name>${xmlSteps}\n    </Workout>\n  </Workouts>\n</TrainingCenterDatabase>`;
}

function downloadTcx(title, blocks, ftp) {
  const xml = generateTcxWorkout(title, blocks, ftp);
  const blob = new Blob([xml], { type: 'application/xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.tcx`;
  link.click();
}

function downloadFit(title) {
  const header = new Uint8Array([14,0,0,0,0,0,0,0,0,0,0,0,0,0]);
  const blob = new Blob([header], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.fit`;
  link.click();
}

export default function SchemaView({ intake, onUpdateFtp }) {
  const schema = generateSchema(intake);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-700 to-black text-white p-6">
      <div className="max-w-3xl mx-auto bg-white/80 shadow rounded-lg p-6 space-y-6 text-black">
        <h1 className="text-3xl font-bold">Trainingsschema</h1>
        <p className="text-sm">
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
              <div className="mt-3 space-x-2">
                <button onClick={() => downloadTcx(item.title, item.blocks, intake.ftp)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Download .TCX
                </button>
                <button onClick={() => downloadFit(item.title)} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Download .FIT
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <label className="block font-medium mb-1">Update je FTP:</label>
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
