
import React from 'react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function PrimaryButton({ 
  children, 
  onClick, 
  className = '', 
  type = 'button', 
  disabled = false 
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-6 text-white rounded-xl 
                 transition-all duration-300 transform
                 focus:outline-none active:scale-95
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
      style={{ 
        fontFamily: 'Poppins, sans-serif', 
        fontWeight: '600',
        backgroundColor: disabled ? '#6b7280' : '#9B5DE5'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = '#00F5D4';
          target.style.transform = 'scale(1.02)';
          target.style.boxShadow = '0 10px 25px rgba(0, 245, 212, 0.25)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          const target = e.target as HTMLButtonElement;
          target.style.backgroundColor = '#9B5DE5';
          target.style.transform = 'scale(1)';
          target.style.boxShadow = 'none';
        }
      }}
    >
      {children}
    </button>
  );
}
