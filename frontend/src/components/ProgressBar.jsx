import React from 'react'

export default function ProgressBar() {
  return (
    <div className="mt-8">
      <div className="w-full bg-gray-800 rounded-full h-4 shadow-inner">
        <div
          className="bg-accent h-4 rounded-full animate-pulse transition-all duration-500 ease-in-out"
          style={{ width: '85%' }}
        ></div>
      </div>
      <p className="mt-2 text-center text-accent font-semibold">
        Matching in progress... please wait
      </p>
    </div>
  )
}
