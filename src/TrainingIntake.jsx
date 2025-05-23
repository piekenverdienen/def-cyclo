import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('beginner');
  const [hours, setHours] = useState(3);
  const [ftp, setFtp] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.trim() === '') return;
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedFtp = parseInt(ftp);
    const ftpValue = isNaN(parsedFtp) ? 200 : parsedFtp;

    const FTP_THRESHOLD = 250;
    const MIN_HOURS = 5;

    if (ftpValue > FTP_THRESHOLD && hours < MIN_HOURS) {
      alert('Je FTP is hoog voor zo weinig trainingsuren. Overweeg meer uren per week.');
      return;
    }

    onComplete({ email, level, days: hours, ftp: ftpValue });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-black text-white">
      {step === 1 ? (
        <form
          onSubmit={handleEmailSubmit}
          className="bg-white bg-opacity-20 p-8 rounded shadow-md w-full max-w-md space-y-6"
        >
          <h2 className="text-2xl font-bold text-center">Trainingsintake</h2>

          <div>
            <label className="block mb-1">E-mail:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 p-2 rounded text-black"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Volgende
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6 text-gray-700"
        >
          <h2 className="text-2xl font-bold text-center text-gray-700">Trainingsintake</h2>

          <div>
            <label className="block text-gray-600 mb-1">
              Niveau
              <span
                className="ml-1 cursor-pointer"
                title="Beginner: weinig ervaring · Gevorderd: regelmatig trainen · Expert: zeer ervaren"
              >
                ℹ️
              </span>
            </label>
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
            <label className="block text-gray-600 mb-1">Uren per week:</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full border border-gray-300 p-2 rounded"
              min="1"
              max="40"
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

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Genereer Schema
          </button>
        </form>
      )}
    </div>
  );
}
