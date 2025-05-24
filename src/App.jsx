
import React, { useState } from 'react'
import TrainingIntake from './TrainingIntake'
import SchemaView from './SchemaView'
import './index.css'

export default function App() {
  const [intake, setIntake] = useState(null)

  return intake ? (
    <SchemaView
      intake={intake}
      onUpdateFtp={(newFtp) => setIntake({ ...intake, ftp: newFtp })}
    />
  ) : (
    <TrainingIntake onComplete={setIntake} />
  )
}
