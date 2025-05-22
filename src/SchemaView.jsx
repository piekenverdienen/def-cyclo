function generateSchema({ level, days, minutes }) {
  const schema = [];
  const weeks = 6;

  const enduranceFactor = level === 'beginner' ? 0.6 : level === 'intermediate' ? 0.65 : 0.7;
  const intervalFactor = level === 'beginner' ? 1.0 : level === 'intermediate' ? 1.05 : 1.1;

  for (let w = 0; w < weeks; w++) {
    const weekMinutes = minutes * (1 + w * 0.1);
    for (let d = 0; d < days; d++) {
      const isIntensityDay = d === days - 1; // roughly 80/20 split
      let blocks;
      if (isIntensityDay) {
        blocks = [
          { type: 'warmup', minutes: 10, factor: enduranceFactor - 0.05 },
          { type: 'interval', minutes: 5, factor: intervalFactor, repeats: 3 + w, rest: 3, restFactor: enduranceFactor - 0.1 },
          { type: 'cooldown', minutes: 5, factor: enduranceFactor - 0.05 },
        ];
      } else {
        const enduranceMinutes = Math.max(20, weekMinutes - 15);
        blocks = [
          { type: 'warmup', minutes: 10, factor: enduranceFactor - 0.05 },
          { type: 'endurance', minutes: enduranceMinutes, factor: enduranceFactor },
          { type: 'cooldown', minutes: 5, factor: enduranceFactor - 0.05 },
        ];
      }

      schema.push({
        day: `Week ${w + 1} - Dag ${d + 1}`,
        title: isIntensityDay ? 'Intervaltraining' : 'Duurtraining',
        blocks,
      });
    }
  }
  return schema;
}

function generateTcxWorkout(title, blocks, ftp) {
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
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white/90 shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>
        <p className="text-gray-600">Email: <strong>{intake.email}</strong></p>
        <p className="text-gray-600">Minuten per training: <strong>{intake.minutes}</strong></p>

        <div className="grid gap-4">
          {schema.map((item, index) => (
            <div key={index} className="bg-blue-50/60 p-4 rounded shadow-sm border border-blue-200">
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
                onClick={() => downloadTcx(item.title, item.blocks, intake.ftp)}
                className="mt-3 inline-block bg-gradient-to-r from-purple-600 to-black text-white px-4 py-2 rounded hover:from-purple-700 hover:to-gray-800"
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
            className="w-full border border-gray-300 p-2 rounded bg-white/70"
            placeholder="Nieuwe FTP"
            onChange={(e) => onUpdateFtp(parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
