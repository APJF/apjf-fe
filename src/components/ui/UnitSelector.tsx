import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import type { Unit } from '../../services/unitService';

interface UnitSelectorProps {
  units: Unit[];
  selectedUnitIds: string[];
  onChange: (unitIds: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  required?: boolean;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  units,
  selectedUnitIds,
  onChange,
  placeholder = "Tìm kiếm và chọn unit...",
  multiple = true,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUnits = units.filter(unit =>
    unit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUnits = units.filter(unit => selectedUnitIds.includes(unit.id));

  const handleToggleUnit = (unitId: string) => {
    if (multiple) {
      if (selectedUnitIds.includes(unitId)) {
        onChange(selectedUnitIds.filter(id => id !== unitId));
      } else {
        onChange([...selectedUnitIds, unitId]);
      }
    } else {
      onChange(selectedUnitIds.includes(unitId) ? [] : [unitId]);
    }
  };

  const handleRemoveUnit = (unitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedUnitIds.filter(id => id !== unitId));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className={`block text-sm font-medium text-gray-700 mb-1 ${!required ? 'hidden' : ''}`}>
        Chọn Unit {required && <span className="text-red-500">*</span>}
      </label>
      
      <button
        type="button"
        className="relative w-full border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-left"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={selectedUnits.length > 0 ? `${selectedUnits.length} units đã chọn` : placeholder}
      >
        <div className="flex items-center px-3 py-2 min-h-[42px] flex-wrap gap-1">
          <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          
          {selectedUnits.length === 0 ? (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedUnits.slice(0, 2).map(unit => (
                <span
                  key={unit.id}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                >
                  {unit.title}
                  <button
                    onClick={(e) => handleRemoveUnit(unit.id, e)}
                    className="ml-1 hover:text-blue-900"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedUnits.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                  +{selectedUnits.length - 2} khác
                </span>
              )}
            </div>
          )}
          
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tìm kiếm unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredUnits.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Không tìm thấy unit nào
              </div>
            ) : (
              filteredUnits.map(unit => (
                <div
                  key={unit.id}
                  className="flex items-center p-3 hover:bg-blue-50 cursor-pointer"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleUnit(unit.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleUnit(unit.id);
                    }
                  }}
                  tabIndex={0}
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name="unit-selector"
                    checked={selectedUnitIds.includes(unit.id)}
                    onChange={() => handleToggleUnit(unit.id)}
                    className="w-4 h-4 text-blue-600 mr-3"
                    tabIndex={-1}
                    aria-label={`Chọn ${unit.title}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {unit.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {unit.id}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
