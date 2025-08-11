import { Star } from "lucide-react"

export function StarDisplay({ rating, size = 18 }: Readonly<{ rating: number; size?: number }>) {
  // Render 5 stars with partial fill based on rating (supports 0.1 increments)
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const starIndex = idx + 1
        const fillPercent = Math.max(0, Math.min(100, (rating - (starIndex - 1)) * 100))
        return (
          <span key={starIndex} className="relative inline-block" style={{ width: size, height: size }}>
            {/* base */}
            <Star className="w-full h-full text-gray-300" />
            {/* fill overlay */}
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }} aria-hidden="true">
              <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
            </span>
          </span>
        )
      })}
      <span className="ml-1 text-sm text-gray-700">{rating.toFixed(1)}</span>
    </div>
  )
}
