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
  let total = 0;
  let minutes = 0;
  blocks.forEach((b) => {
    if (b.type === 'interval') {
      for (let i = 0; i < b.repeats; i++) {
        total += b.minutes * b.factor * b.factor + b.rest * b.restFactor * b.restFactor;
        minutes += b.minutes + b.rest;
      }
    } else {
      total += b.minutes * b.factor * b.factor;
      minutes += b.minutes;
    }
  });
  return Math.round((total / 60) * 100);
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
        { type: 'interval', minutes: 8, factor: 0.85, repeats: 2, rest: 4, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 5, factor: 0.9, repeats: 3, rest: 2, restFactor: 0.6 },
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
      interval: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 5, factor: 1.1, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 10, factor: 0.9, repeats: 2, rest: 4, restFactor: 0.65 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 6, factor: 0.95, repeats: 3, rest: 2, restFactor: 0.65 },
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
      interval: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 6, factor: 1.15, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 12, factor: 0.95, repeats: 2, rest: 4, restFactor: 0.7 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 7, factor: 1.0, repeats: 3, rest: 2, restFactor: 0.65 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 3, factor: 1.3, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
  };

  const hiTypes = ['interval', 'vo2max', 'steigerung', 'tempo'];
  const sessionMinutes = Math.round((hours * 60) / days);
  const hiSessions = Math.max(1, Math.round(days * 0.2));
  const weeks = [];

  for (let week = 1; week <= 6; week++) {
    const weekSessions = [];
    let weekTss = 0;
    for (let d = 1; d <= days; d++) {
      const highIntensity = d <= hiSessions;
      const type = highIntensity ? hiTypes[(week + d) % hiTypes.length] : 'endurance';
      const base = plans[level][type];
      const blocks = scaleBlocks(base, sessionMinutes);
      const tss = computeTss(blocks);
      weekTss += tss;
      weekSessions.push({
        day: `Dag ${d}`,
        title: type,
        blocks,
        tss,
      });
    }
    weeks.push({
      week: `Week ${week}`,
      sessions: weekSessions,
      tss: weekTss,
    });
  }
  return weeks;
}

function generateTcxWorkout(title, blocks) {
  const steps = [];
  blocks.forEach((block) => {
    if (block.type === 'interval') {
      for (let i = 0; i < block.repeats; i++) {
        steps.push({
          name: 'Interval',
          duration: block.minutes * 60,
          low: Math.round(block.factor * 0.95 * 100),
          high: Math.round(block.factor * 1.05 * 100),
        });
        steps.push({
          name: 'Rust',
          duration: block.rest * 60,
          low: Math.round(block.restFactor * 0.95 * 100),
          high: Math.round(block.restFactor * 1.05 * 100),
        });
      }
    } else {
      steps.push({
        name: block.type,
        duration: block.minutes * 60,
        low: Math.round(block.factor * 0.95 * 100),
        high: Math.round(block.factor * 1.05 * 100),
      });
    }
  });

  const xmlSteps = steps
    .map(
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
          <CustomTargetValueLow>${s.low}</CustomTargetValueLow>
          <CustomTargetValueHigh>${s.high}</CustomTargetValueHigh>
        </Target>
      </WorkoutStep>`
    )
    .join('');

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

function downloadTcx(title, blocks) {
  const xml = generateTcxWorkout(title, blocks);
  const blob = new Blob([xml], { type: 'application/xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.tcx`;
  link.click();
}

function generateGpx(title) {
  return `<?xml version="1.1" encoding="UTF-8"?>\n<gpx version="1.1" creator="def-cyclo">\n  <metadata><name>${title}</name></metadata>\n</gpx>`;
}

function downloadGpx(title) {
  const gpx = generateGpx(title);
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.gpx`;
  link.click();
}

export default function SchemaView({ intake, onUpdateFtp }) {
  const weeks = generateSchema(intake);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white text-gray-800 shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold">Trainingsschema</h1>
        <p>
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>
        {weeks.map((week, w) => (
          <div key={w} className="border rounded p-4 space-y-3 bg-purple-50">
            <h2 className="text-xl font-semibold">{week.week} – TSS {week.tss}</h2>
            {week.sessions.map((s, i) => (
              <div key={i} className="bg-white rounded p-3 shadow">
                <h3 className="font-medium">{s.day} – {s.title} (TSS {s.tss})</h3>
                <ul className="list-disc ml-5 text-sm">
                  {s.blocks.map((b, j) => (
                    <li key={j}>
                      {b.type === 'interval'
                        ? `${b.repeats}x ${b.minutes} min @ ${(b.factor*100).toFixed(0)}% + ${b.rest} min rust`
                        : `${b.minutes} min @ ${(b.factor*100).toFixed(0)}% (${b.type})`}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 space-x-2">
                  <button onClick={() => downloadTcx(`${week.week} ${s.day}`, s.blocks)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">TCX</button>
                  <button onClick={() => downloadGpx(`${week.week} ${s.day}`)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">GPX</button>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="pt-4">
          <label className="block mb-1">Update je FTP:</label>
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
