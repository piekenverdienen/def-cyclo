
import React, { useState } from 'react'
import SchemaView from './SchemaView.jsx'
import TrainingIntake from './TrainingIntake.jsx'
import './index.css'

export default function App() {
  const [intake, setIntake] = useState(null)

  const handleUpdateFtp = (newFtp) => {
    setIntake((prev) => ({ ...prev, ftp: newFtp }))
  }

  return intake ? (
    <SchemaView intake={intake} onUpdateFtp={handleUpdateFtp} />
  ) : (
    <TrainingIntake onComplete={setIntake} />
  )
}
