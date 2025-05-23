import React, { useState } from 'react'

export default function InfoTooltip({ title }) {
  const [open, setOpen] = useState(false)
  const hide = () => setOpen(false)
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        className="text-blue-600 focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={hide}
        aria-label={title}
        title={title}
      >
        ℹ️
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute z-10 mt-2 p-2 text-sm text-white bg-gray-800 rounded"
        >
          {title}
        </div>
      )}
    </span>
  )
}
