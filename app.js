const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const scheduleEl = document.getElementById('schedule');
const info = document.getElementById('info');
const tooltip = document.getElementById('tooltip');

info.addEventListener('mouseover', () => tooltip.style.display = 'block');
info.addEventListener('mouseout', () => tooltip.style.display = 'none');

let intake = {};

step1.addEventListener('submit', (e) => {
  e.preventDefault();
  intake.email = document.getElementById('email').value;
  step1.style.display = 'none';
  step2.style.display = 'block';
});

step2.addEventListener('submit', (e) => {
  e.preventDefault();
  intake.level = document.getElementById('level').value;
  intake.days = parseInt(document.getElementById('days').value) || 3;
  intake.hours = parseFloat(document.getElementById('hours').value) || 0;
  intake.ftp = parseInt(document.getElementById('ftp').value) || 0;
  intake.weight = parseFloat(document.getElementById('weight').value) || 0;

  if (intake.weight && intake.ftp && intake.ftp / intake.weight > 5) {
    document.getElementById('error').textContent = 'FTP per kg lijkt erg hoog';
    return;
  }
  document.getElementById('error').textContent = '';
  generateSchedule();
});

function generateSchedule() {
  step2.style.display = 'none';
  scheduleEl.style.display = 'block';
  scheduleEl.innerHTML = `<h2>Schema voor ${intake.email}</h2>`;

  for (let week = 1; week <= 6; week++) {
    const weekDiv = document.createElement('div');
    weekDiv.className = 'week';
    weekDiv.innerHTML = `<h3>Week ${week}</h3>`;
    for (let day = 1; day <= intake.days; day++) {
      const workout = document.createElement('div');
      workout.className = 'workout';
      workout.textContent = `Workout dag ${day}`;
      const btn = document.createElement('button');
      btn.textContent = 'Download FIT';
      btn.addEventListener('click', () => downloadFit(week, day));
      workout.appendChild(btn);
      weekDiv.appendChild(workout);
    }
    scheduleEl.appendChild(weekDiv);
  }
}

function downloadFit(week, day) {
  const data = new Uint8Array([0x0E, 0x10, 0x00, 0x00]);
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `week${week}_day${day}.fit`;
  link.click();
}
