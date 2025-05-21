export default function SchemaView({ intake, onUpdateFtp }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-700">Jouw Trainingsschema</h1>
        <p className="text-gray-600">Niveau: <strong>{intake.level}</strong></p>
        <p className="text-gray-600">Dagen per week: <strong>{intake.days}</strong></p>
        <p className="text-gray-600">FTP: <strong>{intake.ftp} watt</strong></p>

        <div className="mt-4">
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
