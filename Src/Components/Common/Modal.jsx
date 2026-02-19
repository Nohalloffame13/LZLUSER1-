import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-dark-400 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[75vh] mb-20 sm:mb-0 overflow-hidden animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-dark-200 bg-dark-400">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-4 pb-6 overflow-y-auto max-h-[calc(75vh-70px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

