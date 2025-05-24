let step = 1;

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const form = document.getElementById('schema-form');
const infoBtn = document.getElementById('info-btn');
const infoBox = document.getElementById('info-box');
const schemaSection = document.getElementById('schema');
const summary = document.getElementById('summary');

infoBtn.addEventListener('click', () => {
  infoBox.style.display = infoBox.style.display === 'block' ? 'none' : 'block';
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (step === 1) {
    step = 2;
    step1.style.display = 'none';
    step2.style.display = 'block';
    return;
  }

  const email = document.getElementById('email').value.trim();
  const level = document.getElementById('level').value;
  const days = parseInt(document.getElementById('days').value, 10);
  const hours = parseInt(document.getElementById('hours').value, 10);
  const ftp = parseInt(document.getElementById('ftp').value, 10);
  const weight = parseFloat(document.getElementById('weight').value);

  if (!email) {
    alert('Vul een e-mail adres in.');
    return;
  }
  if (!days || days < 1) {
    alert('Voer het aantal trainingsdagen in.');
    return;
  }
  if (!hours || hours < 1) {
    alert('Voer het aantal beschikbare uren in.');
    return;
  }
  if (!ftp || !weight) {
    alert('Voer zowel FTP als gewicht in.');
    return;
  }
  if (ftp / weight > 5) {
    alert('FTP per kilogram lijkt erg hoog.');
    return;
  }

  const intake = { email, level, days, hours, ftp, weight };
  generateSchema(intake);
});

function generateSchema(intake) {
  summary.textContent = `${intake.email} · ${intake.hours}u/week · ${intake.weight}kg`;

  const plans = {
    beginner: [
      { type: 'duur', minutes: 30, factor: 0.65 },
      { type: 'herst', minutes: 10, factor: 0.55 }
    ],
    intermediate: [
      { type: 'interval', minutes: 4, factor: 1.05, repeats: 4, rest: 3, restFactor: 0.6 },
      { type: 'duur', minutes: 20, factor: 0.7 }
    ],
    advanced: [
      { type: 'interval', minutes: 5, factor: 1.1, repeats: 5, rest: 3, restFactor: 0.6 },
      { type: 'duur', minutes: 30, factor: 0.75 }
    ]
  };

  schemaSection.innerHTML = '';

  for (let w = 1; w <= 6; w++) {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'week';
    weekDiv.innerHTML = `<h2>Week ${w}</h2>`;

    for (let d = 0; d < intake.days; d++) {
      const blocks = plans[intake.level];
      const title = `Week${w}-Dag${d + 1}`;
      const item = document.createElement('div');
      item.className = 'workout';
      const list = blocks.map(b => {
        if (b.repeats) {
          return `${b.repeats}x ${b.minutes}m @ ${Math.round(intake.ftp * b.factor)}W + ${b.rest}m rust @ ${Math.round(intake.ftp * b.restFactor)}W`;
        }
        return `${b.minutes}m @ ${Math.round(intake.ftp * b.factor)}W (${b.type})`;
      }).join('<br>');

      item.innerHTML = `<strong>${title}</strong><br>${list}<br>`;

      const btn = document.createElement('button');
      btn.textContent = 'Download .fit';
      btn.type = 'button';
      btn.addEventListener('click', () => downloadFit(title));
      item.appendChild(btn);

      weekDiv.appendChild(item);
    }

    schemaSection.appendChild(weekDiv);
  }

  document.getElementById('form-container').style.display = 'none';
  schemaSection.style.display = 'block';
}

function downloadFit(title) {
  const text = `FIT placeholder for ${title}`;
  const blob = new Blob([text], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${title}.fit`;
  a.click();
}

