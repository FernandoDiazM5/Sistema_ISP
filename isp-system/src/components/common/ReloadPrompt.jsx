import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-5 right-5 z-[9999] animate-fade">
            <div className="bg-bg-card border border-accent-blue rounded-xl p-4 shadow-2xl flex flex-col gap-3 max-w-[300px]">
                <div className="flex justify-between items-start gap-3">
                    <div>
                        <h4 className="text-sm font-bold text-text-primary mb-1">
                            {offlineReady ? 'Listo para usar Offline' : 'Nueva versión disponible'}
                        </h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            {offlineReady
                                ? 'La aplicación ha sido guardada en caché y funcionará sin internet.'
                                : 'Hay una actualización pendiente. Recarga para ver los cambios.'}
                        </p>
                    </div>
                    <button onClick={close} className="text-text-muted hover:text-text-primary p-1">
                        <X size={16} />
                    </button>
                </div>

                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="w-full py-2 px-4 bg-accent-blue text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90"
                    >
                        <RefreshCw size={14} /> Recargar y Actualizar
                    </button>
                )}
            </div>
        </div>
    );
}
