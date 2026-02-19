import React from 'react';

export default function Loader({ size = 'md', text = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-transparent animate-spin`}
          style={{
            borderTopColor: '#3b82f6',
            borderRightColor: '#8b5cf6',
            borderBottomColor: '#ec4899',
            borderLeftColor: 'transparent',
          }}
        />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-4 border-transparent animate-spin`}
          style={{
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: '#3b82f6',
            animationDirection: 'reverse',
            animationDuration: '0.8s',
          }}
        />
      </div>
      {text && (
        <p className="mt-4 text-gray-400 text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
}

