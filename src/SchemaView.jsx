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

function computeTss(blocks) {
  let tss = 0;
  blocks.forEach((b) => {
    if (b.type === 'interval') {
      for (let i = 0; i < b.repeats; i++) {
        tss += (b.minutes / 60) * b.factor * b.factor * 100;
        tss += (b.rest / 60) * b.restFactor * b.restFactor * 100;
      }
    } else {
      tss += (b.minutes / 60) * b.factor * b.factor * 100;
    }
  });
  return Math.round(tss);
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
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 3, factor: 1.2, repeats: 6, rest: 3, restFactor: 0.55 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'tempo', minutes: 20, factor: 0.9 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'steigerung', minutes: 20, factor: 1.0 },
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
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 4, factor: 1.2, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'tempo', minutes: 25, factor: 0.9 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'steigerung', minutes: 25, factor: 1.0 },
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
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.7 },
        { type: 'interval', minutes: 5, factor: 1.25, repeats: 6, rest: 4, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'tempo', minutes: 30, factor: 0.9 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'steigerung', minutes: 30, factor: 1.05 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
  };

  const order = ['interval', 'vo2max', 'steigerung', 'tempo'];
  const sessionMinutes = Math.round((hours * 60) / days);
  const hiSessions = Math.max(1, Math.round(days * 0.2));
  const weeks = [];

  for (let week = 1; week <= 6; week++) {
    const sessions = [];
    let weekTss = 0;
    for (let d = 1; d <= days; d++) {
      const highIntensity = d <= hiSessions;
      const type = highIntensity ? order[(week + d) % order.length] : 'endurance';
      const base = plans[level][type];
      const blocks = scaleBlocks(base, sessionMinutes);
      const tss = computeTss(blocks);
      weekTss += tss;
      sessions.push({
        day: `Dag ${d}`,
        title: type,
        blocks,
        tss,
      });
    }
    weeks.push({ week, sessions, tss: weekTss });
  }

  return weeks;
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
      steps.push({ name: block.type, duration: block.minutes * 60, power: Math.round(ftp * block.factor) });
    }
  });

  const xmlSteps = steps
    .map(
      (s, i) => `      <WorkoutStep>
        <StepId>${i + 1}</StepId>
        <Name>${s.name}</Name>
        <Duration>
          <DurationType>Time</DurationType>
          <Seconds>${s.duration}</Seconds>
        </Duration>
        <Target>
          <TargetType>Power</TargetType>
          <CustomTargetValueLow>${s.power - 5}</CustomTargetValueLow>
          <CustomTargetValueHigh>${s.power + 5}</CustomTargetValueHigh>
        </Target>
      </WorkoutStep>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">\n  <Workouts>\n    <Workout Sport="Biking">\n      <Name>${title}</Name>\n${xmlSteps}\n    </Workout>\n  </Workouts>\n</TrainingCenterDatabase>`;
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
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-black p-6 text-white">
      <div className="max-w-3xl mx-auto bg-white text-gray-800 shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center">Trainingsschema</h1>
        <p className="text-gray-700 text-center">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>
        {weeks.map((week) => (
          <div key={week.week} className="border-t pt-4">
            <h2 className="text-2xl font-semibold mb-2">Week {week.week} – TSS {week.tss}</h2>
            <div className="grid gap-4">
              {week.sessions.map((s, idx) => (
                <div key={idx} className="bg-purple-50 p-4 rounded">
                  <h3 className="font-semibold">{s.day}: {s.title}</h3>
                  <ul className="list-disc ml-5 text-sm">
                    {s.blocks.map((b, i) => (
                      <li key={i}>
                        {b.type === 'interval'
                          ? `${b.repeats}x ${b.minutes}m @ ${Math.round(intake.ftp * b.factor)}w + ${b.rest}m rust`
                          : `${b.minutes}m @ ${Math.round(intake.ftp * b.factor)}w (${b.type})`}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm mt-1">TSS: {s.tss}</p>
                  <button
                    onClick={() => downloadTcx(`${s.day}-${s.title}`, s.blocks, intake.ftp)}
                    className="mt-2 inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
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
