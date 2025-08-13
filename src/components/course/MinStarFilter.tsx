function MinStarFilter({
  value,
  onChange,
}: Readonly<{
  value: number
  onChange: (v: number) => void
}>) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          className={`h-8 px-2 rounded-md text-xs font-medium border ${
            value === n
              ? "bg-rose-700 text-white border-rose-700"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          }`}
        >
          {n}+
        </button>
      ))}
    </div>
  )
}

export default MinStarFilter
