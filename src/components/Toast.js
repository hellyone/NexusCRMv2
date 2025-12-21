'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const TOAST_TYPES = {
    success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', iconColor: 'text-green-600' },
    error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', iconColor: 'text-red-600' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', iconColor: 'text-yellow-600' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-600' },
};

export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
    const config = TOAST_TYPES[type] || TOAST_TYPES.info;
    const Icon = config.icon;

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    return (
        <div className={`
            ${config.bg} ${config.border} ${config.text}
            border rounded-lg shadow-lg p-4 mb-3 flex items-start gap-3 min-w-[300px] max-w-md
            animate-in slide-in-from-top-5 fade-in
        `}>
            <Icon size={20} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 text-sm font-medium">{message}</div>
            <button
                onClick={onClose}
                className={`${config.iconColor} hover:opacity-70 flex-shrink-0`}
            >
                <X size={16} />
            </button>
        </div>
    );
}

