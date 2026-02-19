import React from 'react';

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${activeTab === tab.value
              ? 'bg-primary-600 text-white'
              : 'bg-dark-300 text-gray-400 hover:text-white'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

