import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [step, setStep] = useState(1);
  const [ftp, setFtp] = useState('');
  const [hours, setHours] = useState('');
  const [email, setEmail] = useState('');

  const handleEmail = (e) => {
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
    if (isNaN(parsedFtp) || isNaN(parsedHours)) {
      alert('Vul alstublieft alle velden in');
      return;
    }
    onComplete({
      email,
      ftp: parsedFtp,
      hours: parsedHours,
      level: 'beginner',
      days: 3,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-800 to-black p-4">
      {step === 1 && (
        <form onSubmit={handleEmail} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">Gratis 6 Weken Trainingsschema</h1>
          <p className="text-center text-gray-600">Ontvang direct toegang tot het schema.</p>

          <div>
            <label className="block text-gray-600 mb-1">E-mailadres:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
          </div>

          <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Volgende</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-800">Jouw Gegevens</h2>

          <div>
            <label className="block text-gray-600 mb-1">FTP:</label>
            <input
              type="number"
              value={ftp}
              onChange={(e) => setFtp(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Uren beschikbaar per week:</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              min="1"
              step="0.5"
              required
            />
          </div>

          <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Genereer Schema</button>
        </form>
      )}
    </div>
  );
}
