import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState(3);
  const [ftp, setFtp] = useState('');
  const [hours, setHours] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert('E-mailadres is verplicht');
      return;
    }
    setStep(2);
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    const parsedFtp = parseInt(ftp);
    const parsedHours = parseFloat(hours);
    onComplete({
      email,
      level,
      days,
      ftp: isNaN(parsedFtp) ? 200 : parsedFtp,
      hours: isNaN(parsedHours) ? 5 : parsedHours,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-800 to-black text-white p-4">
      {step === 1 ? (
        <form onSubmit={handleEmailSubmit} className="bg-white bg-opacity-10 backdrop-blur p-8 rounded-lg w-full max-w-md space-y-4 shadow">
          <h1 className="text-3xl font-bold text-center">Gratis 6 Weken Trainingsschema</h1>
          <p className="text-center text-sm text-gray-200">Laat je e-mailadres achter voor directe toegang.</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded text-black"
            placeholder="E-mailadres"
            required
          />
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded">Volgende</button>
        </form>
      ) : (
        <form onSubmit={handleDetailsSubmit} className="bg-white bg-opacity-10 backdrop-blur p-8 rounded-lg w-full max-w-md space-y-4 shadow">
          <div>
            <label className="block mb-1">Niveau</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full p-2 rounded text-black">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Gevorderd</option>
              <option value="advanced">Expert</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Dagen per week</label>
            <input type="number" min="1" max="7" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full p-2 rounded text-black" />
          </div>
          <div>
            <label className="block mb-1">FTP</label>
            <input type="number" value={ftp} onChange={(e) => setFtp(e.target.value)} className="w-full p-2 rounded text-black" />
          </div>
          <div>
            <label className="block mb-1">Uren beschikbaar per week</label>
            <input type="number" min="1" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} className="w-full p-2 rounded text-black" />
          </div>
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded">Schema genereren</button>
        </form>
      )}
    </div>
  );
}

