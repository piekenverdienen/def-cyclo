import FitEncoder from "fit-encoder";
function generateSchema({ level, days }) {
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
        title: `Trainingsblok ${d + 1}`,
        blocks: baseBlocks,
      });
    }
  }
  return schema;
}

// Workout generation in FIT format using the `fit-encoder` package
// Only basic fields are included for compatibility with Garmin Connect
function generateFitWorkout(title, blocks, ftp) {
  const steps = [];

  blocks.forEach((block, index) => {
    if (block.type === 'interval') {
      for (let i = 0; i < block.repeats; i++) {
        steps.push({
          name: `Interval ${i + 1}`,
          duration: block.minutes * 60,
          power: Math.round(ftp * block.factor),
        });
        steps.push({
          name: `Rust ${i + 1}`,
          duration: block.rest * 60,
          power: Math.round(ftp * block.restFactor),
        });
      }
    } else {
      steps.push({
        name: block.type.charAt(0).toUpperCase() + block.type.slice(1),
        duration: block.minutes * 60,
        power: Math.round(ftp * block.factor),
      });
    }
  });

  // using a very small subset of the FIT workout message structure
  const encoder = new FitEncoder();

  const fitSteps = steps.map((s) => ({
    duration: s.duration,
    targetPower: s.power,
  }));

  return encoder.encodeWorkout({ title, sport: 'cycling', steps: fitSteps });
}

function downloadFit(title, blocks, ftp) {
  const buffer = generateFitWorkout(title, blocks, ftp);
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.fit`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function SchemaView({ intake, onUpdateFtp }) {
  const schema = generateSchema(intake);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black text-white p-6">
      <div className="max-w-3xl mx-auto bg-black/70 shadow rounded-lg p-6 space-y-6 backdrop-blur">
        <h1 className="text-3xl font-bold">Trainingsschema</h1>
        <p className="text-purple-100">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>
        <p className="text-purple-100">
          Tijd per training: <strong>{intake.time} min</strong> · Gewicht: <strong>{intake.weight} kg</strong>
        </p>

        <div className="grid gap-4">
          {schema.map((item, index) => (
            <div key={index} className="bg-black/50 p-4 rounded shadow-sm border border-purple-700">
              <h2 className="text-xl font-semibold text-purple-300">{item.day}</h2>
              <p className="text-purple-100 mb-2">Trainingsvorm: <strong>{item.title}</strong></p>
              <ul className="list-disc ml-5 text-purple-100">
                {item.blocks.map((b, i) => (
                  <li key={i}>
                    {b.type === 'interval'
                      ? `${b.repeats}x ${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt + ${b.rest} min rust @ ${Math.round(intake.ftp * b.restFactor)} watt`
                      : `${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt (${b.type})`}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => downloadFit(item.title, item.blocks, intake.ftp)}
                className="mt-3 inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Download .FIT
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <label className="block text-purple-100 font-medium mb-1">Update je FTP:</label>
          <input
            type="number"
            className="w-full border border-purple-700 bg-black/50 p-2 rounded text-white"
            placeholder="Nieuwe FTP"
            onChange={(e) => onUpdateFtp(parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
