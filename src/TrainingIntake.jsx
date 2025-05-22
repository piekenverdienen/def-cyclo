import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState(3);
  const [ftp, setFtp] = useState('');
  const [email, setEmail] = useState('');
  const [minutes, setMinutes] = useState('60');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedFtp = parseInt(ftp);
    const parsedMinutes = parseInt(minutes);
    onComplete({
      level,
      days,
      ftp: isNaN(parsedFtp) ? 200 : parsedFtp,
      minutes: isNaN(parsedMinutes) ? 60 : parsedMinutes,
      email,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 p-8 rounded shadow-md w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-gray-700">Trainingsintake</h2>

        <div>
          <label className="block text-gray-600 mb-1">Niveau:</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Gevorderd</option>
            <option value="advanced">Expert</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-600 mb-1">Dagen per week:</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full border border-gray-300 p-2 rounded"
            min="1"
            max="7"
          />
        </div>

        <div>
          <label className="block text-gray-600 mb-1">FTP:</label>
          <input
            type="number"
            value={ftp}
            onChange={(e) => setFtp(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-gray-600 mb-1">E-mail:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-600 mb-1">Minuten per training:</label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            min="30"
            max="240"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-black text-white py-2 px-4 rounded hover:from-purple-700 hover:to-gray-900"
        >
          Genereer Schema
        </button>
      </form>
    </div>
  );
}
