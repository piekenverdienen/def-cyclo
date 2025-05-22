function totalMinutes(blocks) {
  return blocks.reduce((sum, b) => {
    if (b.type === 'interval') {
      return sum + b.repeats * (b.minutes + b.rest);
    }
    return sum + b.minutes;
  }, 0);
}

function calculateTss(blocks, ftp) {
  let tss = 0;
  blocks.forEach((b) => {
    const add = (min, factor) => {
      tss += (min / 60) * factor * factor * 100;
    };
    if (b.type === 'interval') {
      for (let i = 0; i < b.repeats; i++) {
        add(b.minutes, b.factor);
        add(b.rest, b.restFactor);
      }
    } else if (b.type === 'ramp') {
      const avg = (b.startFactor + b.endFactor) / 2;
      add(b.minutes, avg);
    } else {
      add(b.minutes, b.factor);
    }
  });
  return Math.round(tss);
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
      steigering: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'ramp', minutes: 15, startFactor: 0.7, endFactor: 1.0 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 3, factor: 1.2, repeats: 5, rest: 3, restFactor: 0.55 },
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
        { type: 'tempo', minutes: 30, factor: 0.88 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigering: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'ramp', minutes: 20, startFactor: 0.75, endFactor: 1.05 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 3, factor: 1.25, repeats: 6, rest: 3, restFactor: 0.6 },
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
      steigering: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'ramp', minutes: 25, startFactor: 0.8, endFactor: 1.1 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 4, factor: 1.3, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
  };

  const sessionMinutes = Math.round((hours * 60) / days);
  const hiSessions = Math.max(1, Math.round(days * 0.2));
  const hiTypes = ['vo2max', 'tempo', 'steigerung'];
  let hiIndex = 0;
  const titles = {
    endurance: 'Duurtraining',
    tempo: 'Tempo-training',
    steigering: 'Steigerung',
    vo2max: 'VO2max',
  };
  const schema = [];

  for (let week = 1; week <= 6; week++) {
    for (let d = 1; d <= days; d++) {
      const highIntensity = d <= hiSessions;
      const type = highIntensity ? hiTypes[hiIndex++ % hiTypes.length] : 'endurance';
      const base = plans[level][type];
      const blocks = scaleBlocks(base, sessionMinutes);
      schema.push({
        day: `Week ${week} - Dag ${d}`,
        title: titles[type],
        blocks,
        tss: calculateTss(blocks, ftp),
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
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-3xl mx-auto bg-purple-900 text-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold">Trainingsschema</h1>
        <p className="text-purple-200">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>

        <div className="grid gap-4">
          {schema.map((item, index) => (
            <div key={index} className="bg-purple-800 p-4 rounded shadow-sm border border-purple-700">
              <h2 className="text-xl font-semibold text-purple-100">{item.day}</h2>
              <p className="text-purple-200 mb-2">Trainingsvorm: <strong>{item.title}</strong> · TSS: <strong>{item.tss}</strong></p>
              <ul className="list-disc ml-5 text-gray-200">
                {item.blocks.map((b, i) => (
                  <li key={i}>
                    {b.type === 'interval'
                      ? `${b.repeats}x ${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt + ${b.rest} min rust @ ${Math.round(intake.ftp * b.restFactor)} watt`
                      : b.type === 'ramp'
                      ? `${b.minutes} min oplopend van ${Math.round(intake.ftp * b.startFactor)} tot ${Math.round(intake.ftp * b.endFactor)} watt`
                      : `${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt (${b.type})`}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => downloadTcx(item.title, item.blocks, intake.ftp)}
                className="mt-3 inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Download .TCX
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <label className="block text-purple-200 font-medium mb-1">Update je FTP:</label>
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
