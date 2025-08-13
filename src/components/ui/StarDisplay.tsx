import { Star } from "lucide-react"

// Helper function to round rating to nearest 0.5
function roundToHalf(num: number): number {
  return Math.round(num * 2) / 2
}

export function StarDisplay({ rating, size = 18 }: Readonly<{ rating: number; size?: number }>) {
  // Round rating to nearest 0.5 for display
  const roundedRating = roundToHalf(rating)
  
  // Render 5 stars with partial fill based on rating (supports 0.5 increments)
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${roundedRating} out of 5`}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const starIndex = idx + 1
        const fillPercent = Math.max(0, Math.min(100, (roundedRating - (starIndex - 1)) * 100))
        return (
          <span key={starIndex} className="relative inline-block" style={{ width: size, height: size }}>
            {/* base */}
            <Star className="w-full h-full text-gray-300" />
            {/* fill overlay using clipPath like StarInput */}
            <span 
              className="absolute inset-0" 
              style={{ clipPath: `polygon(0 0, ${fillPercent}% 0, ${fillPercent}% 100%, 0 100%)` }}
              aria-hidden="true"
            >
              <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
            </span>
          </span>
        )
      })}
      <span className="ml-1 text-sm text-gray-700">{roundedRating.toFixed(1)}</span>
    </div>
  )
}
