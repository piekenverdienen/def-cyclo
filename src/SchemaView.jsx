function expandBlocks(blocks) {
  const steps = [];
  blocks.forEach((b) => {
    if (b.type === 'interval') {
      for (let i = 0; i < b.repeats; i++) {
        steps.push({ minutes: b.minutes, factor: b.factor });
        steps.push({ minutes: b.rest, factor: b.restFactor });
      }
    } else {
      steps.push({ minutes: b.minutes, factor: b.factor });
    }
  });
  return steps;
}

function totalMinutes(blocks) {
  return expandBlocks(blocks).reduce((sum, s) => sum + s.minutes, 0);
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
  const steps = expandBlocks(blocks);
  const tss = steps.reduce((sum, s) => {
    const hours = s.minutes / 60;
    return sum + hours * s.factor * s.factor * 100;
  }, 0);
  return Math.round(tss);
}

function generateSchema({ level, days, ftp, hours }) {
  const templates = {
    endurance: [
      { type: 'warmup', minutes: 10, factor: 0.55 },
      { type: 'endurance', minutes: 40, factor: 0.65 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
    interval: [
      { type: 'warmup', minutes: 10, factor: 0.55 },
      { type: 'interval', minutes: 4, factor: 1.1, repeats: 5, rest: 3, restFactor: 0.55 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
    vo2max: [
      { type: 'warmup', minutes: 10, factor: 0.55 },
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
      { type: 'interval', minutes: 1, factor: 0.8, repeats: 8, rest: 0, restFactor: 0.0 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
  };

  const hiTypes = ['interval', 'vo2max', 'tempo', 'interval', 'vo2max', 'steigerung'];
  const weekMultipliers = [1, 1.1, 0.9, 1.2, 0.8, 1.3];
  const weeks = [];
  const hiSessions = Math.max(1, Math.round(days * 0.3));
  const liSessions = days - hiSessions;

  for (let w = 0; w < 6; w++) {
    const weekHours = hours * weekMultipliers[w];
    const weekMinutes = Math.round(weekHours * 60);
    const hiMinutesTotal = Math.round(weekMinutes * 0.2);
    const liMinutesTotal = weekMinutes - hiMinutesTotal;
    const hiPerSession = Math.round(hiMinutesTotal / hiSessions);
    const liPerSession = Math.round(liMinutesTotal / liSessions);

    const sessions = [];
    let weekTss = 0;
    for (let d = 1; d <= days; d++) {
      const high = d <= hiSessions;
      const type = high ? hiTypes[w] : 'endurance';
      const base = templates[type];
      const targetMinutes = high ? hiPerSession : liPerSession;
      const blocks = scaleBlocks(base, targetMinutes);
      const tss = computeTss(blocks);
      weekTss += tss;
      sessions.push({
        day: d,
        title: type,
        blocks,
        tss,
      });
    }
    weeks.push({
      week: w + 1,
      hours: weekHours.toFixed(1),
      tss: Math.round(weekTss),
      sessions,
    });
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
          <CustomTargetValueLow>${Math.round(s.power * 0.95)}</CustomTargetValueLow>
          <CustomTargetValueHigh>${Math.round(s.power * 1.05)}</CustomTargetValueHigh>
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>

        <div className="space-y-8">
          {weeks.map((week) => (
            <div key={week.week} className="bg-purple-50 p-4 rounded shadow">
              <h2 className="text-xl font-semibold text-purple-800">
                Week {week.week} – {week.hours}u · TSS {week.tss}
              </h2>
              <div className="grid gap-4 mt-2">
                {week.sessions.map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded border border-purple-200">
                    <h3 className="font-semibold text-gray-800">Dag {item.day}: {item.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">TSS: {item.tss}</p>
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
                      onClick={() => downloadTcx(`Week${week.week}_Dag${item.day}`, item.blocks, intake.ftp)}
                      className="mt-2 inline-block bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
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
