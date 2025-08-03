import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface Option {
  id: string
  title: string
  subtitle?: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  allowClear?: boolean
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Chọn hoặc tìm kiếm...",
  emptyText = "-- Không có --",
  className = "",
  disabled = false,
  allowClear = true
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Get selected option display text
  const selectedOption = options.find(opt => opt.id === value)
  let displayText = ''
  if (selectedOption) {
    displayText = `${selectedOption.title} (${selectedOption.id})`
  } else if (value && value !== '') {
    displayText = value
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        break
    }
  }

  const selectOption = (option: Option) => {
    onChange(option.id)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const clearSelection = () => {
    onChange('')
    setSearchTerm('')
  }

  const renderEmptyState = () => {
    if (searchTerm) {
      return (
        <div className="px-3 py-2 text-gray-500 italic">
          Không tìm thấy kết quả cho "{searchTerm}"
        </div>
      )
    }
    return (
      <div className="px-3 py-2 text-gray-500 italic">
        Không có dữ liệu
      </div>
    )
  }

  const toggleDropdown = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
      setHighlightedIndex(-1)
    }
  }

  return (
    <div ref={dropdownRef} className={`relative z-10 ${className}`}>
      {/* Main Input */}
      <div className={`
        w-full border rounded-md bg-white flex items-center
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}
        ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'}
        transition-colors
      `}>
        {isOpen ? (
          <div className="flex items-center flex-1 p-3">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm theo ID hoặc tên..."
              className="flex-1 outline-none text-base"
              disabled={disabled}
            />
          </div>
        ) : (
          <button
            type="button"
            className="flex items-center flex-1 p-3 text-left"
            onClick={toggleDropdown}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          >
            <span className={`flex-1 text-base ${
              displayText ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {displayText || placeholder}
            </span>
          </button>
        )}
        
        <div className="flex items-center pr-3">
          {allowClear && value && !isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearSelection()
              }}
              className="p-1 hover:bg-gray-100 rounded mr-1"
              tabIndex={-1}
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleDropdown}
            className="p-1 hover:bg-gray-100 rounded"
            tabIndex={-1}
            disabled={disabled}
          >
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-auto">
          {/* Empty option */}
          <button
            type="button"
            className={`w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 ${
              highlightedIndex === -1 ? 'bg-blue-50' : ''
            }`}
            onClick={() => selectOption({ id: '', title: emptyText })}
            onMouseEnter={() => setHighlightedIndex(-1)}
          >
            <div className="text-gray-500 italic">{emptyText}</div>
          </button>

          {/* Options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={option.id}
                type="button"
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                  highlightedIndex === index ? 'bg-blue-50' : ''
                } ${value === option.id ? 'bg-blue-100 font-medium' : ''}`}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-900">{option.title}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {option.id}
                  </span>
                </div>
                {option.subtitle && (
                  <div className="text-xs text-gray-500 mt-1">
                    {option.subtitle}
                  </div>
                )}
              </button>
            ))
          ) : (
            renderEmptyState()
          )}
        </div>
      )}
    </div>
  )
}
