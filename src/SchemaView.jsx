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

function computeTss(blocks, ftp) {
  let total = 0;
  blocks.forEach((b) => {
    if (b.type === 'interval') {
      for (let i = 0; i < b.repeats; i++) {
        total += ((b.minutes / 60) * Math.pow(b.factor, 2) * 100);
        total += ((b.rest / 60) * Math.pow(b.restFactor, 2) * 100);
      }
    } else {
      total += ((b.minutes / 60) * Math.pow(b.factor, 2) * 100);
    }
  });
  return Math.round(total);
}

function generateSchema({ level, days, ftp, hours }) {
  const plans = {
    beginner: {
      endurance: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'endurance', minutes: 40, factor: 0.65 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      interval: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 4, factor: 1.05, repeats: 5, rest: 3, restFactor: 0.55 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 10, factor: 0.9, repeats: 3, rest: 5, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 2, factor: 1.1, repeats: 6, rest: 2, restFactor: 0.6 },
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
      interval: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 5, factor: 1.05, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 12, factor: 0.9, repeats: 3, rest: 5, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 3, factor: 1.1, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 3, factor: 1.2, repeats: 5, rest: 3, restFactor: 0.55 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
    advanced: {
      endurance: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'endurance', minutes: 60, factor: 0.75 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      interval: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 6, factor: 1.1, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 15, factor: 0.9, repeats: 3, rest: 5, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 4, factor: 1.15, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 4, factor: 1.2, repeats: 6, rest: 4, restFactor: 0.55 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
  };

  const sessionMinutes = Math.round((hours * 60) / days);
  const hiTypes = ['interval', 'vo2max', 'steigerung', 'tempo'];
  const weeks = [];

  for (let week = 1; week <= 6; week++) {
    const sessions = [];
    const hiSessions = Math.max(1, Math.round(days * 0.2));
    for (let d = 1; d <= days; d++) {
      const highIntensity = d <= hiSessions;
      const type = highIntensity ? hiTypes[(week + d) % hiTypes.length] : 'endurance';
      const base = plans[level][type];
      const blocks = scaleBlocks(base, sessionMinutes);
      const tss = computeTss(blocks, ftp);
      sessions.push({
        day: d,
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        blocks,
        tss,
      });
    }
    const weekTss = sessions.reduce((sum, s) => sum + s.tss, 0);
    weeks.push({ week, sessions, tss: Math.round(weekTss) });
  }

  return weeks;
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
      <WorkoutStep>
        <StepId>${i + 1}</StepId>
        <Name>${s.name}</Name>
        <Duration>
          <DurationType>Time</DurationType>
          <Seconds>${s.duration}</Seconds>
        </Duration>
        <Target>
          <TargetType>Power</TargetType>
          <CustomTargetValueLow>${s.power}</CustomTargetValueLow>
          <CustomTargetValueHigh>${s.power}</CustomTargetValueHigh>
        </Target>
      </WorkoutStep>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Workouts>
    <Workout Sport="Biking">
      <Name>${title}</Name>
      <Steps>
        ${xmlSteps}
      </Steps>
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
  const weeks = generateSchema(intake);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 via-purple-900 to-black p-6 text-white">
      <div className="max-w-3xl mx-auto bg-white text-gray-800 shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>

        {weeks.map((week) => (
          <div key={week.week} className="space-y-4">
            <h2 className="text-2xl font-semibold text-purple-800">Week {week.week} – TSS {week.tss}</h2>
            <div className="grid gap-4">
              {week.sessions.map((item, index) => (
                <div key={index} className="bg-purple-50 p-4 rounded shadow-sm">
                  <h3 className="text-lg font-semibold text-purple-800">Dag {item.day}: {item.title}</h3>
                  <p className="text-gray-700 mb-2">Sessie TSS: {item.tss}</p>
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
                    onClick={() => downloadTcx(`${week.week}-${item.day}-${item.title}`, item.blocks, intake.ftp)}
                    className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Download .TCX
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

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
