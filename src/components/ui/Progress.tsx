import React from "react"

interface ProgressProps {
  value: number
  className?: string
  max?: number
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  className = "", 
  max = 100 
}) => {
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div className={`w-full bg-gray-200 rounded-full ${className}`}>
      <div 
        className="bg-blue-600 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
