'use client';

import { type ChangeEvent } from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterConfig[];
  searchPlaceholder?: string;
}

export default function SearchFilter({
  searchValue,
  onSearchChange,
  filters = [],
  searchPlaceholder = 'Search...',
}: SearchFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm text-[#1A1A2E] placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-[#F5C518]/50 focus:border-[#F5C518] transition-colors"
        />
      </div>

      {/* Filter dropdowns */}
      {filters.map((filter, idx) => (
        <select
          key={idx}
          value={filter.value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => filter.onChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-[#1A1A2E] bg-white
            focus:outline-none focus:ring-2 focus:ring-[#F5C518]/50 focus:border-[#F5C518] transition-colors"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
