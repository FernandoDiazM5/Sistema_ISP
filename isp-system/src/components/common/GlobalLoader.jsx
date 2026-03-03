import React from 'react';
import useStore from '../store/useStore';
import { Loader2 } from 'lucide-react';

export default function GlobalLoader() {
    const { isLoadingGlobal, loadingMessageGlobal } = useStore();

    if (!isLoadingGlobal) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
                <Loader2 size={48} className="text-accent-blue animate-spin mb-4" />
                <h3 className="text-lg font-bold text-text-primary mb-2">Por favor, espera...</h3>
                <p className="text-sm text-text-secondary font-medium">
                    {loadingMessageGlobal || 'Procesando información en el sistema.'}
                </p>
            </div>
        </div>
    );
}
