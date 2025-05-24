import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState(3);
  const [ftp, setFtp] = useState('');
  const [time, setTime] = useState('');
  const [weight, setWeight] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedFtp = parseInt(ftp);
    const parsedTime = parseInt(time);
    const parsedWeight = parseInt(weight);
    onComplete({
      level,
      days,
      ftp: isNaN(parsedFtp) ? 200 : parsedFtp,
      time: isNaN(parsedTime) ? 60 : parsedTime,
      weight: isNaN(parsedWeight) ? 75 : parsedWeight,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-black/70 p-8 rounded shadow-md w-full max-w-md space-y-6 backdrop-blur"
      >
        <h2 className="text-2xl font-bold text-center">Trainingsintake</h2>

        <div>
          <label className="block mb-1">Niveau:</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full border border-gray-700 bg-transparent p-2 rounded"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Gevorderd</option>
            <option value="advanced">Expert</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Dagen per week:</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full border border-gray-700 bg-transparent p-2 rounded"
            min="1"
            max="7"
          />
        </div>

        <div>
          <label className="block mb-1">FTP:</label>
          <input
            type="number"
            value={ftp}
            onChange={(e) => setFtp(e.target.value)}
            className="w-full border border-gray-700 bg-transparent p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Beschikbare tijd (min per training):</label>
          <input
            type="number"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-gray-700 bg-transparent p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Gewicht (kg):</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full border border-gray-700 bg-transparent p-2 rounded"
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
