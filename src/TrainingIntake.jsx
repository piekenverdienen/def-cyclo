import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState(3);
  const [hours, setHours] = useState(5);
  const [ftp, setFtp] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');

  const handleNext = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Vul je e-mailadres in');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedFtp = parseInt(ftp);
    const parsedWeight = parseFloat(weight);
    const parsedHours = parseInt(hours);

    if (!isNaN(parsedFtp) && parsedWeight > 0 && parsedFtp / parsedWeight > 5) {
      setError('FTP per kg lijkt erg hoog');
      return;
    }

    if (parsedFtp > 250 && parsedHours < 5) {
      alert('Overweeg meer trainingsuren voor zo\u2019n hoge FTP.');
      return;
    }

    setError('');
    onComplete({
      email,
      level,
      days,
      hours: isNaN(parsedHours) ? 0 : parsedHours,
      ftp: isNaN(parsedFtp) ? 200 : parsedFtp,
      weight: isNaN(parsedWeight) ? 0 : parsedWeight,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-700 to-black text-white">
      <form
        onSubmit={step === 1 ? handleNext : handleSubmit}
        className="bg-black/40 p-8 rounded shadow-md w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">Trainingsintake</h2>

        {step === 1 && (
          <div>
            <label className="block mb-1">E-mail:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-black"
              required
            />
            {error && <p className="text-red-300 text-sm mt-1">{error}</p>}
          </div>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block mb-1">
                Niveau
                <span
                  className="ml-1 cursor-help"
                  title="Beginner: weinig ervaring, Gevorderd: aardig wat jaren, Expert: zeer ervaren"
                >&#9432;</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-black"
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
                className="w-full border border-gray-300 p-2 rounded text-black"
                min="1"
                max="7"
              />
            </div>

            <div>
              <label className="block mb-1">Beschikbare uren per week:</label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-black"
                min="1"
              />
            </div>

            <div>
              <label className="block mb-1">FTP:</label>
              <input
                type="number"
                value={ftp}
                onChange={(e) => setFtp(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-black"
              />
            </div>

            <div>
              <label className="block mb-1">Gewicht (kg):</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-black"
                min="1"
              />
            </div>

            {error && <p className="text-red-300 text-sm">{error}</p>}
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {step === 1 ? 'Volgende' : 'Genereer Schema'}
        </button>
      </form>
    </div>
  );
}
