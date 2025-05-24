
import React, { useState, useEffect } from 'react'
import SchemaView from './SchemaView.jsx'
import TrainingIntake from './TrainingIntake.jsx'
import './index.css'

export default function App() {
  const [intake, setIntake] = useState(null)

  const handleUpdateFtp = (newFtp) => {
    setIntake((prev) => ({ ...prev, ftp: newFtp }))
  }

  useEffect(() => {
    if (intake) {
      console.log('Ontvangen intake:', intake)
    }
  }, [intake])

  return intake ? (
    <SchemaView intake={intake} onUpdateFtp={handleUpdateFtp} />
  ) : (
    <TrainingIntake onComplete={setIntake} />
  )
}
