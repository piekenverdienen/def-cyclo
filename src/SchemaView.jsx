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
  let load = 0;
  let minutes = 0;
  blocks.forEach((b) => {
    if (b.type === 'interval') {
      minutes += b.repeats * (b.minutes + b.rest);
      load +=
        b.repeats * b.minutes * b.factor +
        b.repeats * b.rest * (b.restFactor || 0.5);
    } else {
      minutes += b.minutes;
      load += b.minutes * b.factor;
    }
  });
  const intensity = load / minutes;
  return Math.round((minutes / 60) * intensity * intensity * 100);
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
        { type: 'tempo', minutes: 20, factor: 0.9 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.55 },
        { type: 'steigerung', minutes: 15, factor: 0.75, endFactor: 1.05 },
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
        { type: 'tempo', minutes: 25, factor: 0.9 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'steigerung', minutes: 20, factor: 0.8, endFactor: 1.1 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.6 },
        { type: 'interval', minutes: 4, factor: 1.15, repeats: 6, rest: 3, restFactor: 0.6 },
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
        { type: 'tempo', minutes: 30, factor: 0.95 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      steigerung: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'steigerung', minutes: 25, factor: 0.85, endFactor: 1.2 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
      vo2max: [
        { type: 'warmup', minutes: 10, factor: 0.65 },
        { type: 'interval', minutes: 5, factor: 1.2, repeats: 6, rest: 3, restFactor: 0.6 },
        { type: 'cooldown', minutes: 5, factor: 0.5 },
      ],
    },
  };

  const sessionMinutes = Math.round((hours * 60) / days);
  const hiSessions = Math.max(1, Math.round(days * 0.2));
  const schema = [];
  const hiOrder = ['interval', 'vo2max', 'steigerung', 'tempo'];

  for (let week = 1; week <= 6; week++) {
    const weekSessions = [];
    let weekTss = 0;
    for (let d = 1; d <= days; d++) {
      const hiIndex = (week * days + d) % hiOrder.length;
      const highIntensity = d <= hiSessions;
      const type = highIntensity ? hiOrder[hiIndex] : 'endurance';
      const base = plans[level][type];
      const blocks = scaleBlocks(base, sessionMinutes);
      const tss = computeTss(blocks);
      weekTss += tss;
      const titleMap = {
        endurance: 'Duurtraining',
        interval: 'Interval',
        tempo: 'Tempo',
        steigerung: 'Steigerung',
        vo2max: 'VO2max',
      };
      weekSessions.push({
        dayLabel: `Dag ${d}`,
        title: titleMap[type] || type,
        blocks,
        tss,
      });
    }
    schema.push({
      week,
      sessions: weekSessions,
      tss: weekTss,
    });
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
    } else if (block.type === 'steigerung') {
      steps.push({
        name: 'Steigerung',
        duration: block.minutes * 60,
        power: Math.round(ftp * block.endFactor),
      });
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6 space-y-8">
        <h1 className="text-3xl font-bold text-purple-700">Trainingsschema</h1>
        <p className="text-gray-600">
          Niveau: <strong>{intake.level}</strong> · Dagen/week: <strong>{intake.days}</strong> · Uren/week: <strong>{intake.hours}</strong> · FTP: <strong>{intake.ftp} watt</strong>
        </p>

        {schema.map((week) => (
          <div key={week.week} className="border rounded-lg p-4 bg-purple-50 space-y-4">
            <h2 className="text-xl font-semibold text-purple-800">Week {week.week} – totale TSS {week.tss}</h2>
            {week.sessions.map((session, idx) => (
              <div key={idx} className="bg-white p-4 rounded shadow space-y-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium">{session.dayLabel} – {session.title}</h3>
                  <span className="text-sm text-gray-600">TSS {session.tss}</span>
                </div>
                <ul className="list-disc ml-5 text-gray-600">
                  {session.blocks.map((b, i) => (
                    <li key={i}>
                      {b.type === 'interval'
                        ? `${b.repeats}x ${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt + ${b.rest} min rust @ ${Math.round(intake.ftp * b.restFactor)} watt`
                        : b.type === 'steigerung'
                          ? `${b.minutes} min oplopend van ${Math.round(intake.ftp * b.factor)} naar ${Math.round(intake.ftp * b.endFactor)} watt`
                          : `${b.minutes} min @ ${Math.round(intake.ftp * b.factor)} watt (${b.type})`}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => downloadTcx(`${session.dayLabel}_${session.title}`, session.blocks, intake.ftp)}
                  className="mt-2 inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Download .TCX
                </button>
              </div>
            ))}
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
