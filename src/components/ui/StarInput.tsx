"use client"

import React, { useState } from 'react'
import { Star } from 'lucide-react'

// Helper function to clamp value between 0 and 100
const clamp = (value: number): number => Math.max(0, Math.min(100, value))

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
    <fieldset className="flex items-center gap-1" aria-label="Select rating">
      {Array.from({ length: 5 }).map((_, idx) => {
        const i = idx + 1
        const fillPercent = clamp((display - (i - 1)) * 100)
        return (
          <button
            key={i}
            type="button"
            onMouseMove={(e) => handleMove(e, i)}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => handleClick(e, i)}
            className="relative transition-transform hover:scale-[1.06]"
            style={{ width: size, height: size, lineHeight: 0 }}
            aria-label={`Set rating to ${i} star${i > 1 ? "s" : ""}`}
          >
            {/* Base grey star (outline) */}
            <Star className="w-full h-full text-gray-300" />
            {/* Full-size yellow star clipped by percentage (proper half-star) */}
            <span
              className="absolute inset-0"
              style={{ clipPath: `polygon(0 0, ${fillPercent}% 0, ${fillPercent}% 100%, 0 100%)` }}
              aria-hidden="true"
            >
              <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
            </span>
          </button>
        )
      })}
    </fieldset>
  )
}
