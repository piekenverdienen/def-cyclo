function generateSchema({ level, days, ftp }) {
  const baseEffort = {
    beginner: 0.6,
    intermediate: 0.75,
    advanced: 0.9,
  }[level];

  const schema = [];
  for (let i = 0; i < days; i++) {
    const intensity = Math.round(ftp * (baseEffort + (i * 0.05)));
    schema.push({
      day: `Dag ${i + 1}`,
      description: `Rit op ${intensity} watt (${Math.round(intensity / ftp * 100)}% FTP)`,
    });
  }
  return schema;
}

export default function SchemaView({ intake, onUpdateFtp }) {
  const schema = generateSchema(intake);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Jouw Trainingsschema</h1>

        <div className="grid gap-4">
          {schema.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-md p-4 bg-blue-50"
            >
              <h2 className="font-semibold text-lg">{item.day}</h2>
              <p className="text-gray-700">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <label className="block text-gray-600 mb-1">Update je FTP:</label>
          <input
            type="number"
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="Nieuwe FTP"
            onChange={(e) => onUpdateFtp(parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
