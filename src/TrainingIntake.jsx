import React, { useState } from 'react';

export default function TrainingIntake({ onComplete }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('beginner');
  const [days, setDays] = useState(3);
  const [hours, setHours] = useState(4);
  const [ftp, setFtp] = useState('');
  const [weight, setWeight] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState('');

  const handleNext = (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Vul een geldig e-mailadres in');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedFtp = parseInt(ftp);
    const parsedWeight = parseFloat(weight);
    console.log({ level, days, hours, ftp: isNaN(parsedFtp) ? 200 : parsedFtp });

    if (
      !isNaN(parsedFtp) &&
      parsedWeight > 0 &&
      parsedFtp / parsedWeight > 5
    ) {
      setError('FTP per kg lijkt erg hoog');
      return;
    }

    setError('');
    onComplete({
      email,
      level,
      days,
      hours,
      ftp: isNaN(parsedFtp) ? 200 : parsedFtp,
      weight: isNaN(parsedWeight) ? 0 : parsedWeight,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={step === 1 ? handleNext : handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-gray-700">Trainingsintake</h2>

        {step === 1 && (
          <div>
            <label className="block text-gray-600 mb-1">E-mail:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-gray-600 mb-1">
                Niveau
                <button
                  type="button"
                  onClick={() => setShowInfo(!showInfo)}
                  className="ml-1 text-sm text-blue-600"
                >
                  i
                </button>
              </label>
              {showInfo && (
                <p className="text-xs text-gray-500 mb-1">
                  Beginner: weinig ervaring · Gevorderd: enkele jaren · Expert: veel ervaring
                </p>
              )}
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
              <label className="block text-gray-600 mb-1">Uren per week:</label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full border border-gray-300 p-2 rounded"
                min="1"
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
              <label className="block text-gray-600 mb-1">Gewicht (kg):</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                min="1"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          {step === 1 ? 'Volgende' : 'Genereer Schema'}
        </button>
      </form>
    </div>
  );
}
