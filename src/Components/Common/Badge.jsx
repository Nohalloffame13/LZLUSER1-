import React from 'react';

const statusStyles = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  live: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse',
  ongoing: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse',
  finished: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  cancelled: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function Badge({ status, className = '' }) {
  const style = statusStyles[status?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
        border backdrop-blur-sm
        ${style}
        ${className}
      `}
    >
      {(status === 'live' || status === 'ongoing') && (
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
      )}
      {status}
    </span>
  );
}

