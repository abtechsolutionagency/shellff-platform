
import React from 'react';

interface InputFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export function InputField({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  className = '', 
  disabled = false, 
  required = false,
  id
}: InputFieldProps) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl 
                 text-white placeholder-zinc-400 
                 focus:outline-none transition-all duration-300 hover:border-zinc-600 
                 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ 
        fontFamily: 'Inter, sans-serif',
        borderColor: '#52525b'
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.target.style.borderColor = '#9B5DE5';
          e.target.style.boxShadow = '0 0 0 2px rgba(155, 93, 229, 0.2)';
        }
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#52525b';
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}
