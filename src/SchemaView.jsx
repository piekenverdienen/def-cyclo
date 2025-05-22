function totalMinutes(blocks) {
  return blocks.reduce((sum, b) => {
    if (b.type === 'interval') {
      return sum + b.repeats * (b.minutes + b.rest);
    }
    return sum + b.minutes;
  }, 0);
}

function scaleBlocks(blocks, target) {
  const base = totalMinutes(blocks);
  const ratio = target / base;
  return blocks.map((b) => {
    const scaled = { ...b };
    scaled.minutes = Math.round(b.minutes * ratio);
    if (b.rest) scaled.rest = Math.round(b.rest * ratio);
    return scaled;
  });
}

function calculateTss(blocks) {
  let score = 0;
  blocks.forEach((b) => {
    if (b.type === 'interval') {
      for (let i = 0; i < b.repeats; i++) {
        score += b.minutes * Math.pow(b.factor, 2);
        score += b.rest * Math.pow(b.restFactor, 2);
      }
    } else {
      score += b.minutes * Math.pow(b.factor, 2);
    }
  });
  return Math.round((score / 60) * 100);
}

function generateSchema({ level, days, ftp, hours }) {
  const plans = {
    beginner: {
      endurance: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'endurance', minutes: 40, factor: 0.65 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'tempo', minutes: 20, factor: 0.85 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 5, factor: 0.8, repeats: 4, rest: 2, restFactor: 0.55 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 3, factor: 1.15, repeats: 5, rest: 3, restFactor: 0.55 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
    intermediate: {
      endurance: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'endurance', minutes: 50, factor: 0.7 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'tempo', minutes: 30, factor: 0.9 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 6, factor: 0.85, repeats: 4, rest: 2, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 4, factor: 1.2, repeats: 5, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
    advanced: {
      endurance: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'endurance', minutes: 60, factor: 0.75 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'tempo', minutes: 40, factor: 0.9 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 8, factor: 0.9, repeats: 5, rest: 2, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 5, factor: 1.25, repeats: 5, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
  };

  const sessionMinutes = Math.round((hours * 60) / days);
  const hiSessions = Math.max(1, Math.round(days * 0.2));
  const schema = [];
  const hiTypes = ['vo2max', 'interval', 'steigerung', 'tempo'];

  for (let week = 1; week <= 6; week++) {
    for (let d = 1; d <= days; d++) {
      const highIntensity = d <= hiSessions;
      let type = 'endurance';
      if (highIntensity) {
        const index = (week * days + d) % hiTypes.length;
        type = hiTypes[index];
      }
      const base = plans[level][type];
      const blocks = scaleBlocks(base, sessionMinutes);
      const tss = calculateTss(blocks);
      const titles = {
        endurance: 'Duurtraining',
        tempo: 'Tempotraining',
        steigerung: 'Steigerung',
        vo2max: 'VO2max',
        interval: 'Intensieve training',
      };
      schema.push({
        day: `Week ${week} - Dag ${d}`,
        title: titles[type] || type,
        blocks,
        tss,
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
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-purple-900 to-black p-6">
      <div className="max-w-3xl mx-auto bg-white bg-opacity-90 shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
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
              <p className="mt-2 text-sm text-gray-700">TSS: <strong>{item.tss}</strong></p>
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
            className="w-full border border-purple-300 bg-gray-50 p-2 rounded text-gray-800"
            placeholder="Nieuwe FTP"
            onChange={(e) => onUpdateFtp(parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
