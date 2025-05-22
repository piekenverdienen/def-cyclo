import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState(3);
  const [ftp, setFtp] = useState('');
  const [hours, setHours] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedFtp = parseInt(ftp);
    const parsedHours = parseFloat(hours);
    if (!email) {
      alert('E-mailadres is verplicht');
      return;
    }
    onComplete({
      level,
      days,
      hours: isNaN(parsedHours) ? 5 : parsedHours,
      ftp: isNaN(parsedFtp) ? 200 : parsedFtp,
      email,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form
        onSubmit={handleSubmit}
        className="bg-purple-900 text-white p-8 rounded shadow-md w-full max-w-md space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-purple-100">Gratis 6 Weken Trainingsschema</h1>
        <p className="text-center text-purple-200">
          Ontvang direct een persoonlijk schema op basis van je FTP en beschikbare tijd.
        </p>

        <div>
          <label className="block text-purple-200 mb-1">Niveau:</label>
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
          <label className="block text-purple-200 mb-1">Dagen per week:</label>
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
          <label className="block text-purple-200 mb-1">FTP:</label>
          <input
            type="number"
            value={ftp}
            onChange={(e) => setFtp(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-purple-200 mb-1">Uren beschikbaar per week:</label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            min="1"
            step="0.5"
          />
        </div>

        <div>
          <label className="block text-purple-200 mb-1">E-mailadres:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
        >
          Genereer Schema
        </button>
      </form>
    </div>
  );
}
