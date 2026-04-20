'use client';

import { type ChangeEvent } from 'react';

interface FormInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
  disabled?: boolean;
}

export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  name,
  disabled = false,
}: FormInputProps) {
  const inputId = name || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-[#1A1A2E]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border text-sm text-[#1A1A2E] placeholder-gray-400 transition-colors
          focus:outline-none focus:ring-2 focus:ring-[#F5C518]/50 focus:border-[#F5C518]
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
