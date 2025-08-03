import type React from "react"
import { useState } from "react"
import { Search, Filter, X, ChevronDown } from "lucide-react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Label } from "../ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select"
import { Badge } from "../ui/Badge"

interface AdvancedFiltersProps {
  onSearch: (title: string) => void
  onLevelFilter: (level: string | null) => void
  onSort: (sortBy: string, direction: string) => void
  currentFilters: {
    searchTitle: string
    level: string | null
    sortBy: string
    sortDirection: string
  }
  totalResults: number
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onSearch,
  onLevelFilter,
  onSort,
  currentFilters,
  totalResults,
}) => {
  const [searchInput, setSearchInput] = useState(currentFilters.searchTitle)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const levels = ["N5", "N4", "N3", "N2", "N1"]
  const sortOptions = [
    { value: "title-asc", label: "Tên A-Z" },
    { value: "title-desc", label: "Tên Z-A" },
    { value: "enrolledCount-desc", label: "Phổ biến nhất" },
    { value: "createdAt-desc", label: "Mới nhất" },
  ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchInput)
  }

  const clearAllFilters = () => {
    setSearchInput("")
    onSearch("")
    onLevelFilter(null)
  }

  const activeFiltersCount = [
    currentFilters.searchTitle,
    currentFilters.level,
  ].filter(Boolean).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Main Search Bar */}
      <div className="p-6 border-b border-gray-100">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm khóa học tiếng Nhật..."
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button type="submit" size="lg" className="bg-red-600 hover:bg-red-700">
            Tìm kiếm
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-600">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </Button>
        </form>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Tìm thấy <span className="font-semibold text-gray-900">{totalResults.toLocaleString()}</span> khóa học
          </p>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-600 hover:text-red-700">
              <X className="h-4 w-4 mr-1" />
              Xóa tất cả bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Level Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Trình độ</Label>
              <Select
                value={currentFilters.level || "all"}
                onValueChange={(value: string) => onLevelFilter(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trình độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trình độ</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sắp xếp theo</Label>
              <Select
                value={`${currentFilters.sortBy}-${currentFilters.sortDirection}`}
                onValueChange={(value: string) => {
                  const [sortBy, direction] = value.split("-")
                  onSort(sortBy, direction)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
