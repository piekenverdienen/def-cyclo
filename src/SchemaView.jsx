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
        tss += ((b.minutes / 60) * b.factor ** 2) * 100;
        tss += ((b.rest / 60) * b.restFactor ** 2) * 100;
      }
    } else {
      tss += ((b.minutes / 60) * b.factor ** 2) * 100;
    }
  });
  return Math.round(tss);
}

const templates = {
  endurance: [
    { type: 'warmup', minutes: 10, factor: 0.55 },
    { type: 'endurance', minutes: 60, factor: 0.65 },
    { type: 'cooldown', minutes: 5, factor: 0.5 },
  ],
  tempo: [
    { type: 'warmup', minutes: 10, factor: 0.6 },
    { type: 'tempo', minutes: 20, factor: 0.9 },
    { type: 'cooldown', minutes: 5, factor: 0.5 },
  ],
  interval: [
    { type: 'warmup', minutes: 10, factor: 0.6 },
    { type: 'interval', minutes: 5, factor: 1.05, repeats: 5, rest: 3, restFactor: 0.6 },
    { type: 'cooldown', minutes: 5, factor: 0.5 },
  ],
  steigerung: [
    { type: 'warmup', minutes: 10, factor: 0.6 },
    { type: 'interval', minutes: 5, factor: 0.9, repeats: 4, rest: 2, restFactor: 0.6 },
    { type: 'cooldown', minutes: 5, factor: 0.5 },
  ],
  vo2max: [
    { type: 'warmup', minutes: 10, factor: 0.6 },
    { type: 'interval', minutes: 3, factor: 1.2, repeats: 5, rest: 3, restFactor: 0.6 },
    { type: 'cooldown', minutes: 5, factor: 0.5 },
  ],
};

function generateSchema({ days, hours, allowZone3 }) {
  const sessionMinutes = Math.round((hours * 60) / days);
  const hiSessions = Math.max(1, Math.round(days * 0.2));
  const hiTypes = ['interval', 'vo2max', 'steigerung'];
  let hiIndex = 0;
  const weeks = [];

  for (let w = 1; w <= 6; w++) {
    const sessions = [];
    let weekTss = 0;

    for (let d = 1; d <= days; d++) {
      let type;
      if (d <= hiSessions) {
        type = hiTypes[hiIndex % hiTypes.length];
        hiIndex += 1;
      } else if (allowZone3 && w % 2 === 0 && d === days) {
        type = 'tempo';
      } else {
        type = 'endurance';
      }

      const base = templates[type];
      const blocks = scaleBlocks(base, sessionMinutes);
      const tss = computeTss(blocks);
      weekTss += tss;

      sessions.push({
        day: `Week ${w} - Dag ${d}`,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        blocks,
        tss,
      });
    }

    weeks.push({ week: w, sessions, totalTss: Math.round(weekTss) });
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

function generateGpxWorkout(title, blocks, ftp) {
  const steps = [];
  blocks.forEach((block) => {
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
        name: block.type,
        duration: block.minutes * 60,
        power: Math.round(ftp * block.factor),
      });
    }
  });

  const rtepts = steps
    .map(
      (s) => `\n    <rtept lat="0" lon="0"><name>${s.name}</name><desc>${s.duration}s @ ${s.power}w</desc></rtept>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Cyclo">\n  <rte>\n    <name>${title}</name>${rtepts}\n  </rte>\n</gpx>`;
}

function downloadGpx(title, blocks, ftp) {
  const xml = generateGpxWorkout(title, blocks, ftp);
  const blob = new Blob([xml], { type: 'application/gpx+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.gpx`;
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

        {weeks.map((week) => (
          <div key={week.week} className="space-y-4">
            <h2 className="text-2xl font-bold text-purple-700">Week {week.week} - Totale TSS: {week.totalTss}</h2>
            <div className="grid gap-4">
              {week.sessions.map((item, index) => (
                <div key={index} className="bg-blue-50 p-4 rounded shadow-sm border border-blue-200">
                  <h3 className="text-xl font-semibold text-blue-800">{item.day}</h3>
                  <p className="text-gray-700 mb-1">Trainingsvorm: <strong>{item.title}</strong> · TSS: <strong>{item.tss}</strong></p>
                  <ul className="list-disc ml-5 text-gray-600">
                    {item.blocks.map((b, i) => (
                      <li key={i}>
                        {b.type === 'interval'
                          ? `${b.repeats}x ${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt + ${b.rest} min rust @ ${Math.round(intake.ftp * b.restFactor)} watt`
                          : `${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt (${b.type})`}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => downloadTcx(item.title, item.blocks, intake.ftp)}
                      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                    >
                      TCX
                    </button>
                    <button
                      onClick={() => downloadGpx(item.title, item.blocks, intake.ftp)}
                      className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700"
                    >
                      GPX
                    </button>
                  </div>
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
