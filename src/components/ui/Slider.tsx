import { useRef, useCallback } from 'react'

interface SliderProps {
  value: number[]
  max: number
  step: number
  onValueChange: (value: number[]) => void
  className?: string
}

export function Slider({ value, max, step, onValueChange, className }: SliderProps) {
  const sliderRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onValueChange([newValue])
  }, [onValueChange])

  return (
    <div className={`relative ${className || ''}`}>
      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={max}
        step={step}
        value={value[0] || 0}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}
