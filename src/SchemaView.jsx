function generateSchema({ level, days, ftp }) {
  const planByLevel = {
    beginner: [
      {
        title: 'Endurance Ride',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.55 },
          { type: 'endurance', minutes: 30, factor: 0.65 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Tempo Ride',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.55 },
          { type: 'tempo', minutes: 20, factor: 0.75 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Sprint Session',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.55 },
          { type: 'sprint', minutes: 0.5, factor: 1.2, repeats: 6, rest: 1.5, restFactor: 0.5 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Threshold Intervals',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.55 },
          { type: 'threshold', minutes: 8, factor: 0.9, repeats: 3, rest: 4, restFactor: 0.6 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
    ],
    intermediate: [
      {
        title: 'Endurance Ride',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.6 },
          { type: 'endurance', minutes: 40, factor: 0.7 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Tempo Ride',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.6 },
          { type: 'tempo', minutes: 30, factor: 0.8 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Sprint Session',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.6 },
          { type: 'sprint', minutes: 0.5, factor: 1.3, repeats: 8, rest: 1.5, restFactor: 0.5 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Threshold Intervals',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.6 },
          { type: 'threshold', minutes: 10, factor: 0.95, repeats: 4, rest: 4, restFactor: 0.6 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
    ],
    advanced: [
      {
        title: 'Endurance Ride',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.65 },
          { type: 'endurance', minutes: 50, factor: 0.75 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Tempo Ride',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.65 },
          { type: 'tempo', minutes: 40, factor: 0.85 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Sprint Session',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.65 },
          { type: 'sprint', minutes: 0.5, factor: 1.4, repeats: 10, rest: 1, restFactor: 0.55 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
      {
        title: 'Threshold Intervals',
        blocks: [
          { type: 'warmup', minutes: 10, factor: 0.65 },
          { type: 'threshold', minutes: 12, factor: 1.0, repeats: 4, rest: 3, restFactor: 0.65 },
          { type: 'cooldown', minutes: 5, factor: 0.5 },
        ],
      },
    ],
  };

  const schema = [];
  const templates = planByLevel[level];
  for (let i = 0; i < days; i++) {
    const template = templates[i % templates.length];
    const week = Math.floor(i / templates.length);

    const blocks = template.blocks.map((b) => {
      if (typeof b.repeats === 'number') {
        return {
          ...b,
          repeats: b.repeats + week,
          rest: Math.max(1, b.rest - week * 0.5),
        };
      }
      return { ...b };
    });

    schema.push({
      day: `Dag ${i + 1}`,
      title: template.title,
      blocks,
    });
  }
  return schema;
}

function generateTcxWorkout(title, blocks, ftp) {
  const steps = [];

  blocks.forEach((block, index) => {
    if (typeof block.repeats === 'number') {
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

  const xmlSteps = steps.map(
    (s, i) => `
      <Step>
        <Name>${s.name}</Name>
        <Duration>
          <DurationType>Time</DurationType>
          <Seconds>${s.duration}</Seconds>
        </Duration>
        <Target>
          <TargetType>Power</TargetType>
          <PowerZone>${s.power}</PowerZone>
        </Target>
      </Step>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Workouts>
    <Workout Sport="Biking">
      <Name>${title}</Name>
      ${xmlSteps}
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;
}

function downloadTcx(title, blocks, ftp) {
  const xml = generateTcxWorkout(title, blocks, ftp);
  const blob = new Blob([xml], { type: 'application/xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.tcx`;
  link.click();
}

export default function SchemaView({ intake, onUpdateFtp }) {
  const schema = generateSchema(intake);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>

        <div className="grid gap-4">
          {schema.map((item, index) => (
            <div key={index} className="bg-blue-50 p-4 rounded shadow-sm border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-800">{item.day}</h2>
              <p className="text-gray-700 mb-2">Trainingsvorm: <strong>{item.title}</strong></p>
              <ul className="list-disc ml-5 text-gray-600">
                {item.blocks.map((b, i) => (
                  <li key={i}>
                    {typeof b.repeats === 'number'
                      ? `${b.repeats}x ${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt + ${b.rest} min rust @ ${Math.round(intake.ftp * b.restFactor)} watt`
                      : `${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt (${b.type})`}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => downloadTcx(item.title, item.blocks, intake.ftp)}
                className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Download .TCX
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
