import React, { useEffect, useState } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    notification: Bell
};

const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    notification: 'bg-gradient-to-r from-primary-500 to-purple-600'
};

export default function Toast({ message, type = 'info', title, onClose, duration = 5000 }) {
    const [isVisible, setIsVisible] = useState(false);
    const Icon = icons[type] || icons.info;

    useEffect(() => {
        // Small delay to allow enter animation
        requestAnimationFrame(() => setIsVisible(true));

        if (duration) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={`
        fixed top-4 left-4 right-4 z-50 md:left-auto md:w-96
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
      `}
        >
            <div className="bg-dark-400 border border-dark-300 rounded-xl shadow-xl p-4 flex gap-3 relative overflow-hidden backdrop-blur-sm">
                {/* Progress bar for auto close */}
                {duration && (
                    <div
                        className={`absolute bottom-0 left-0 h-1 ${colors[type] || 'bg-primary-500'}`}
                        style={{

                            transition: `width ${duration}ms linear`,
                            width: isVisible ? '0%' : '100%'
                        }}
                    />
                )}

                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colors[type] || 'bg-dark-300'} text-white shadow-lg`}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    {title && <h4 className="font-semibold text-white mb-0.5 truncate">{title}</h4>}
                    <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
                </div>

                <button
                    onClick={handleClose}
                    className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors h-fit"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

