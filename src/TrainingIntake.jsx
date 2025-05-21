
import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState(3);
  const [ftp, setFtp] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedFtp = parseInt(ftp);
    onComplete({ level, days, ftp: isNaN(parsedFtp) ? 200 : parsedFtp });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Niveau:
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Gevorderd</option>
          <option value="advanced">Expert</option>
        </select>
      </label>
      <label>Dagen:
        <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} />
      </label>
      <label>FTP:
        <input type="number" value={ftp} onChange={(e) => setFtp(e.target.value)} />
      </label>
      <button type="submit">Genereer Schema</button>
    </form>
  );
}
