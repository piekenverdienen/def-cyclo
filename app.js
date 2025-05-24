const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const schemaEl = document.getElementById('schema');
const startBtn = document.getElementById('start');
const errorEl = document.getElementById('error');

startBtn.addEventListener('click', () => {
  if (!document.getElementById('email').checkValidity()) {
    document.getElementById('email').reportValidity();
    return;
  }
  step1.style.display = 'none';
  step2.style.display = 'block';
});

step2.addEventListener('submit', (e) => {
  e.preventDefault();
  const level = document.getElementById('level').value;
  const days = parseInt(document.getElementById('days').value, 10);
  const hours = parseInt(document.getElementById('hours').value, 10);
  const ftp = parseInt(document.getElementById('ftp').value, 10);
  const weight = parseFloat(document.getElementById('weight').value);
  if (!ftp || !weight) {
    errorEl.textContent = 'FTP en gewicht zijn verplicht';
    return;
  }
  if (ftp / weight > 5) {
    errorEl.textContent = 'FTP per kg lijkt erg hoog';
    return;
  }
  if (ftp > 300 && hours < 4) {
    errorEl.textContent = 'Overweeg meer trainingsuren bij hoge FTP';
    return;
  }
  errorEl.textContent = '';
  step2.style.display = 'none';
  const intake = {level, days, hours, ftp, weight, email: document.getElementById('email').value};
  renderSchema(intake);
});

function renderSchema(intake) {
  const schema = generateSchema(intake);
  schemaEl.innerHTML = `<h2>Schema voor ${intake.email}</h2>`;
  schema.forEach((week, w) => {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'schema-week';
    weekDiv.innerHTML = `<h3>Week ${w + 1}</h3>`;
    week.days.forEach((day) => {
      const div = document.createElement('div');
      div.textContent = `${day.title}`;
      const btn = document.createElement('button');
      btn.textContent = 'Download .fit';
      btn.onclick = () => downloadFit(`${day.title}`, day.blocks, intake.ftp);
      div.appendChild(btn);
      weekDiv.appendChild(div);
    });
    schemaEl.appendChild(weekDiv);
  });
  schemaEl.style.display = 'block';
}

function generateSchema({ level, days }) {
  const plan = {
    beginner: [
      { type: 'endurance', minutes: 30, factor: 0.65 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
    intermediate: [
      { type: 'interval', minutes: 5, factor: 1.05, repeats: 4, rest: 3, restFactor: 0.6 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
    advanced: [
      { type: 'interval', minutes: 6, factor: 1.1, repeats: 5, rest: 3, restFactor: 0.6 },
      { type: 'cooldown', minutes: 5, factor: 0.5 },
    ],
  };

  const schema = [];
  for (let w = 0; w < 6; w++) {
    const week = { days: [] };
    for (let d = 0; d < days; d++) {
      week.days.push({
        title: `Dag ${d + 1}`,
        blocks: plan[level],
      });
    }
    schema.push(week);
  }
  return schema;
}

function downloadFit(title, blocks, ftp) {
  const blob = new Blob(['FIT placeholder'], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = title.replace(/\s+/g, '_') + '.fit';
  a.click();
}
