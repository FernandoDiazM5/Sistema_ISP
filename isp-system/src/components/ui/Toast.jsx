import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import useStore from '../../store/useStore';

const ICON_MAP = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
};

const COLOR_MAP = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

function ToastItem({ toast }) {
    const removeToast = useStore(s => s.removeToast);
    const Icon = ICON_MAP[toast.type] || Info;

    useEffect(() => {
        if (toast.duration > 0) {
            const timer = setTimeout(() => removeToast(toast.id), toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.id, toast.duration, removeToast]);

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg animate-fade min-w-[280px] max-w-[420px] ${COLOR_MAP[toast.type] || COLOR_MAP.info}`}
        >
            <Icon size={18} className="flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-0.5 rounded-md hover:bg-white/10 border-none bg-transparent cursor-pointer text-current opacity-60 hover:opacity-100 transition-opacity"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const toasts = useStore(s => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}
