import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState(3);
  const [ftp, setFtp] = useState('');
  const [hours, setHours] = useState('');
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      alert('E-mailadres is verplicht');
      return;
    }
    setStep(2);
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-black p-4 text-white">
      <form
        onSubmit={step === 1 ? handleEmailSubmit : handleSubmit}
        className="bg-white text-gray-800 p-6 rounded shadow-md w-full max-w-md space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-purple-700">Gratis 6 Weken Trainingsschema</h1>
        <p className="text-center text-gray-600">Vul je gegevens in en ontvang direct jouw persoonlijke plan.</p>

        {step === 1 && (
          <>
            <div>
              <label className="block text-gray-700 mb-1">E-mailadres:</label>
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
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
            >
              Volgende
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-gray-700 mb-1">
                Niveau
                <span
                  className="ml-1 cursor-pointer text-purple-600"
                  title="Beginner: weinig ervaring · Gevorderd: regelmatige fietser · Expert: zeer ervaren"
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
              <label className="block text-gray-700 mb-1">Dagen per week:</label>
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
              <label className="block text-gray-700 mb-1">FTP:</label>
              <input
                type="number"
                value={ftp}
                onChange={(e) => setFtp(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Uren beschikbaar per week:</label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                min="1"
                step="0.5"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
            >
              Genereer Schema
            </button>
          </>
        )}
      </form>
    </div>
  );
}
