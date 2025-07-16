import React, { useState } from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface FilterProps {
  onSearch: (title: string) => void
  onLevelFilter: (level: string | null) => void
  onSort: (sortBy: string, direction: string) => void
  currentLevel: string | null
  currentSort: { sortBy: string; direction: string }
}

export const CourseFilters: React.FC<FilterProps> = ({ 
  onSearch, 
  onLevelFilter, 
  onSort, 
  currentLevel, 
  currentSort 
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const levels = [
    { value: "N5", label: "N5 - Cơ bản", color: "text-green-600" },
    { value: "N4", label: "N4 - Sơ cấp", color: "text-blue-600" },
    { value: "N3", label: "N3 - Trung cấp", color: "text-yellow-600" },
    { value: "N2", label: "N2 - Trung cao", color: "text-orange-600" },
    { value: "N1", label: "N1 - Cao cấp", color: "text-red-600" },
  ]

  const sortOptions = [
    { value: "title", label: "Tên khóa học" },
    { value: "duration", label: "Thời lượng" },
    { value: "level", label: "Cấp độ" },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchTerm.trim())
  }

  const handleSortChange = (sortBy: string) => {
    const newDirection = currentSort.sortBy === sortBy && currentSort.direction === "asc" ? "desc" : "asc"
    onSort(sortBy, newDirection)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>
        </form>

        {/* Level Filter */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 h-11 border rounded-lg transition-colors ${
              currentLevel ? "border-red-500 bg-red-50 text-red-600" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">
              {currentLevel ? levels.find((l) => l.value === currentLevel)?.label : "Cấp độ"}
            </span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              <button
                onClick={() => {
                  onLevelFilter(null)
                  setIsFilterOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  !currentLevel ? "bg-red-50 text-red-600" : "text-gray-700"
                }`}
              >
                Tất cả cấp độ
              </button>
              {levels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => {
                    onLevelFilter(level.value)
                    setIsFilterOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    currentLevel === level.value ? "bg-red-50 text-red-600" : level.color
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={`flex items-center gap-1 px-3 h-11 border rounded-lg transition-colors text-sm ${
                currentSort.sortBy === option.value
                  ? "border-red-500 bg-red-50 text-red-600"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span className="hidden sm:inline">{option.label}</span>
              {currentSort.sortBy === option.value ? (
                <>
                  {currentSort.direction === "asc" ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </>
              ) : (
                <SortAsc className="w-4 h-4 opacity-50" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters */}
      {(currentLevel || searchTerm) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
          {currentLevel && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
              {levels.find((l) => l.value === currentLevel)?.label}
              <button onClick={() => onLevelFilter(null)} className="ml-1 hover:text-red-900">
                ×
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              "{searchTerm}"
              <button
                onClick={() => {
                  setSearchTerm("")
                  onSearch("")
                }}
                className="ml-1 hover:text-blue-900"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
};
