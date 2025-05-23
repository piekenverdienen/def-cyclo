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
  let tss = 0;
  blocks.forEach((b) => {
    if (b.type === 'interval') {
      const high = (b.minutes * b.repeats) / 60;
      const rest = (b.rest * b.repeats) / 60;
      tss += high * b.factor * b.factor * 100;
      tss += rest * b.restFactor * b.restFactor * 100;
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
        { type: 'endurance', minutes: 45, factor: 0.65 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      tempo: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'tempo', minutes: 20, factor: 0.85 },
        { type: 'endurance', minutes: 15, factor: 0.7 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      interval: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 4, factor: 1.05, repeats: 5, rest: 3, restFactor: 0.55 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 3, factor: 1.15, repeats: 5, rest: 3, restFactor: 0.55 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'interval', minutes: 5, factor: 0.9, repeats: 3, rest: 3, restFactor: 0.6 },
        { type: 'interval', minutes: 5, factor: 1.0, repeats: 2, rest: 3, restFactor: 0.6 },
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
        { type: 'tempo', minutes: 25, factor: 0.88 },
        { type: 'endurance', minutes: 15, factor: 0.7 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      interval: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 5, factor: 1.05, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 3, factor: 1.2, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 5, factor: 0.95, repeats: 3, rest: 3, restFactor: 0.6 },
        { type: 'interval', minutes: 5, factor: 1.05, repeats: 2, rest: 3, restFactor: 0.6 },
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
        { type: 'tempo', minutes: 30, factor: 0.9 },
        { type: 'endurance', minutes: 15, factor: 0.75 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      interval: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 6, factor: 1.1, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 3, factor: 1.25, repeats: 7, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 5, factor: 1.0, repeats: 3, rest: 3, restFactor: 0.6 },
        { type: 'interval', minutes: 5, factor: 1.1, repeats: 2, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
  };

  const sessionMinutes = Math.round((hours * 60) / days);
  const hiSessions = Math.max(1, Math.round(days * 0.2));
  const hiTypes = ['interval', 'vo2max', 'steigerung', 'tempo'];
  const schema = [];

  for (let week = 1; week <= 6; week++) {
    for (let d = 1; d <= days; d++) {
      const highIntensity = d <= hiSessions;
      const type = highIntensity
        ? hiTypes[(week + d) % hiTypes.length]
        : 'endurance';
      const base = plans[level][type];
      const blocks = scaleBlocks(base, sessionMinutes);
      const tss = computeTss(blocks, ftp);
      schema.push({
        week,
        day: d,
        title: highIntensity ? type : 'endurance',
        blocks,
        tss,
      });
    }
  }

  return schema;
}

function generateTcxWorkout(title, blocks, ftp) {
  let stepId = 1;
  const parts = [];

  blocks.forEach((block) => {
    if (block.type === 'interval') {
      for (let i = 0; i < block.repeats; i++) {
        parts.push(`
        <WorkoutStep>
          <StepId>${stepId++}</StepId>
          <Name>Interval ${i + 1}</Name>
          <Duration>
            <DurationType>Time</DurationType>
            <Seconds>${block.minutes * 60}</Seconds>
          </Duration>
          <Target>
            <TargetType>Power</TargetType>
            <CustomTargetValueLow>${Math.round(ftp * block.factor * 0.97)}</CustomTargetValueLow>
            <CustomTargetValueHigh>${Math.round(ftp * block.factor * 1.03)}</CustomTargetValueHigh>
          </Target>
        </WorkoutStep>`);
        parts.push(`
        <WorkoutStep>
          <StepId>${stepId++}</StepId>
          <Name>Rust ${i + 1}</Name>
          <Duration>
            <DurationType>Time</DurationType>
            <Seconds>${block.rest * 60}</Seconds>
          </Duration>
          <Target>
            <TargetType>Power</TargetType>
            <CustomTargetValueLow>${Math.round(ftp * block.restFactor * 0.97)}</CustomTargetValueLow>
            <CustomTargetValueHigh>${Math.round(ftp * block.restFactor * 1.03)}</CustomTargetValueHigh>
          </Target>
        </WorkoutStep>`);
      }
    } else {
      parts.push(`
        <WorkoutStep>
          <StepId>${stepId++}</StepId>
          <Name>${block.type}</Name>
          <Duration>
            <DurationType>Time</DurationType>
            <Seconds>${block.minutes * 60}</Seconds>
          </Duration>
          <Target>
            <TargetType>Power</TargetType>
            <CustomTargetValueLow>${Math.round(ftp * block.factor * 0.97)}</CustomTargetValueLow>
            <CustomTargetValueHigh>${Math.round(ftp * block.factor * 1.03)}</CustomTargetValueHigh>
          </Target>
        </WorkoutStep>`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Workouts>
    <Workout Sport="Biking">
      <Name>${title}</Name>
      ${parts.join('')}
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
  const raw = generateSchema(intake);
  const weeks = [];
  raw.forEach((s) => {
    if (!weeks[s.week - 1]) {
      weeks[s.week - 1] = { week: s.week, sessions: [], totalTss: 0 };
    }
    weeks[s.week - 1].sessions.push(s);
    weeks[s.week - 1].totalTss += s.tss;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>

        <div className="space-y-6">
          {weeks.map((week) => (
            <div key={week.week} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <h2 className="text-2xl font-semibold text-purple-800 mb-2">Week {week.week} - totaal TSS {Math.round(week.totalTss)}</h2>
              <div className="grid gap-4">
                {week.sessions.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-1">Dag {item.day}: {item.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">TSS: {item.tss}</p>
                    <ul className="list-disc ml-5 text-gray-700">
                      {item.blocks.map((b, i) => (
                        <li key={i}>
                          {b.type === 'interval'
                            ? `${b.repeats}x ${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt + ${b.rest} min rust`
                            : `${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt (${b.type})`}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => downloadTcx(`week${week.week}_day${item.day}`, item.blocks, intake.ftp)}
                      className="mt-2 inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Download .TCX
                    </button>
                  </div>
                ))}
              </div>
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
