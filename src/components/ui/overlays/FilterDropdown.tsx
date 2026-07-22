import React, { useState, useEffect } from 'react';
import Button from '../forms/Button';
import Input from '../forms/Input';
import { FaFilter, FaTimes } from 'react-icons/fa';
import BaseDropdown from './BaseDropdown';

export interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface FilterDropdownProps {
  fields: FilterField[];
  onApply: (filters: Record<string, string>) => void;
  onReset: () => void;
  initialValues?: Record<string, string>;
  className?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  fields,
  onApply,
  onReset,
  initialValues = {},
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>(initialValues);

  useEffect(() => {
    setFilters(initialValues);
  }, [initialValues]);

  const handleChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApply(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters = fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {} as Record<string, string>);
    setFilters(resetFilters);
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');
  const activeFilterCount = Object.values(filters).filter(value => value !== '').length;

  const filterTrigger = (
    <Button
      variant="outline"
      leftIcon={<FaFilter size={14} />}
      className={`relative ${hasActiveFilters ? 'border-theme-icon text-theme-icon' : ''}`}
    >
      Filter
      {hasActiveFilters && (
        <span className="absolute -top-2 -right-2 bg-theme-icon text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );

  return (
    <BaseDropdown
      trigger={filterTrigger}
      isOpen={isOpen}
      onToggle={setIsOpen}
      className={className}
      width="w-80"
      dropdownClassName="p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-theme-text">Filter Options</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-theme-text/50 hover:text-theme-text transition-colors p-1 rounded-lg hover:bg-theme-border/50"
        >
          <FaTimes size={14} />
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {fields.map((field) => (
          <div key={field.name}>
            {field.type === 'select' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-theme-text">
                  {field.label}
                </label>
                <select
                  value={filters[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full bg-theme-background border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-text outline-none focus:border-theme-icon focus:ring-1 focus:ring-theme-icon"
                >
                  <option value="">All</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <Input
                label={field.label}
                type={field.type}
                placeholder={field.placeholder}
                value={filters[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-2 mt-4 pt-3 border-t border-theme-border">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
        <Button size="sm" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </BaseDropdown>
  );
};

export default FilterDropdown;