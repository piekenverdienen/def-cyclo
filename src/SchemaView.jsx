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
        tss += ((b.minutes / 60) * (b.factor ** 2)) * 100;
        tss += ((b.rest / 60) * (b.restFactor ** 2)) * 100;
      }
    } else {
      tss += ((b.minutes / 60) * (b.factor ** 2)) * 100;
    }
  });
  return Math.round(tss);
}

function generateSchema({ level, days, ftp, hours }) {
  const templates = {
    endurance: [
      { type: 'warmup', minutes: 10, factor: 0.6 },
      { type: 'endurance', minutes: 50, factor: 0.7 },
      { type: 'cooldown', minutes: 5, factor: 0.55 },
    ],
    interval: [
      { type: 'warmup', minutes: 10, factor: 0.6 },
      { type: 'interval', minutes: 5, factor: 1.1, repeats: 5, rest: 3, restFactor: 0.6 },
      { type: 'cooldown', minutes: 5, factor: 0.55 },
    ],
    vo2max: [
      { type: 'warmup', minutes: 10, factor: 0.6 },
      { type: 'interval', minutes: 3, factor: 1.2, repeats: 6, rest: 3, restFactor: 0.6 },
      { type: 'cooldown', minutes: 5, factor: 0.55 },
    ],
    steigerung: [
      { type: 'warmup', minutes: 10, factor: 0.6 },
      { type: 'interval', minutes: 8, factor: 1.0, repeats: 3, rest: 4, restFactor: 0.6 },
      { type: 'cooldown', minutes: 5, factor: 0.55 },
    ],
    tempo: [
      { type: 'warmup', minutes: 10, factor: 0.6 },
      { type: 'tempo', minutes: 30, factor: 0.9 },
      { type: 'cooldown', minutes: 5, factor: 0.55 },
    ],
  };

  const sessionMinutes = Math.round((hours * 60) / days);
  const weeklyMinutes = hours * 60;
  const hiSessions = Math.max(1, Math.round((weeklyMinutes * 0.2) / sessionMinutes));
  const schema = [];
  const hiTypes = ['interval', 'vo2max', 'steigerung', 'tempo'];
  let hiIndex = 0;

  for (let week = 1; week <= 6; week++) {
    for (let d = 1; d <= days; d++) {
      const high = d <= hiSessions;
      const type = high ? hiTypes[(hiIndex++) % hiTypes.length] : 'endurance';
      const base = templates[type];
      const blocks = scaleBlocks(base, sessionMinutes);
      const tss = computeTss(blocks);
      schema.push({
        week,
        day: `Dag ${d}`,
        title: type.charAt(0).toUpperCase() + type.slice(1),
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
  const weeks = {};
  schema.forEach((s) => {
    if (!weeks[s.week]) weeks[s.week] = [];
    weeks[s.week].push(s);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-black p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>

        <div className="space-y-8">
          {Object.entries(weeks).map(([week, sessions]) => {
            const weekTss = sessions.reduce((s, w) => s + w.tss, 0);
            return (
              <div key={week} className="border border-purple-200 rounded p-4 bg-purple-50">
                <h2 className="text-2xl font-semibold text-purple-800 mb-2">Week {week}</h2>
                <div className="grid gap-4">
                  {sessions.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded p-4 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{item.day}: {item.title}</h3>
                      <ul className="list-disc ml-5 text-gray-600 mb-2">
                        {item.blocks.map((b, i) => (
                          <li key={i}>
                            {b.type === 'interval'
                              ? `${b.repeats}x ${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt + ${b.rest} min rust @ ${Math.round(intake.ftp * b.restFactor)} watt`
                              : `${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt (${b.type})`}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-gray-700 font-medium">TSS: {item.tss}</p>
                      <button
                        onClick={() => downloadTcx(item.title, item.blocks, intake.ftp)}
                        className="mt-2 inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Download .TCX
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-right font-semibold text-purple-800">Week TSS: {weekTss}</p>
              </div>
            );
          })}
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
