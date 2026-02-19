import React from 'react';

export default function Card({ children, className = '', onClick, glow = false, glass = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl p-4 card-shadow
        ${glass ? 'glass' : 'gradient-card'}
        ${glow ? 'card-glow' : ''}
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

