"use client"

"use client"

import type React from "react"
import { useState } from "react"
import { Star } from "lucide-react"

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

// Interactive star picker with half-star support (clean half-fill, no shrinking)
export function StarInput({
  value = 0,
  onChange,
  size = 18,
}: Readonly<{
  value: number
  onChange: (rating: number) => void
  size?: number
}>) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    setHover(i - (isHalf ? 0.5 : 0))
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    onChange(i - (isHalf ? 0.5 : 0))
  }

  return (
    <fieldset className="flex items-center gap-1">
      <legend className="sr-only">Rate this course</legend>
      {Array.from({ length: 5 }).map((_, idx) => {
        const starIndex = idx + 1
        const fillPercent = clamp((display - (starIndex - 1)) * 100)
        return (
          <button
            key={starIndex}
            type="button"
            className="cursor-pointer transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 rounded"
            style={{ width: size, height: size }}
            onMouseMove={(e) => handleMove(e, starIndex)}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => handleClick(e, starIndex)}
            aria-label={`Rate ${starIndex} star${starIndex > 1 ? "s" : ""}`}
          >
            <span className="relative inline-block w-full h-full">
              {/* base */}
              <Star className="w-full h-full text-gray-300" />
              {/* fill overlay */}
              <span
                className="absolute inset-0 overflow-hidden text-yellow-400"
                style={{ width: `${fillPercent}%` }}
                aria-hidden="true"
              >
                <Star className="w-full h-full fill-current" />
              </span>
            </span>
          </button>
        )
      })}
    </fieldset>
  )
}
