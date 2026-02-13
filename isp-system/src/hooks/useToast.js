import useStore from '../store/useStore';

/**
 * Hook utilitario para mostrar toast notifications.
 * Wrapper sobre el store global de toasts.
 * 
 * @example
 * const toast = useToast();
 * toast.success('Guardado correctamente');
 * toast.error('Error al guardar');
 * toast.info('Procesando...');
 * toast.warning('Datos incompletos');
 */
export default function useToast() {
    const addToast = useStore(s => s.addToast);

    return {
        success: (message, duration = 3000) => addToast({ message, type: 'success', duration }),
        error: (message, duration = 5000) => addToast({ message, type: 'error', duration }),
        warning: (message, duration = 4000) => addToast({ message, type: 'warning', duration }),
        info: (message, duration = 3000) => addToast({ message, type: 'info', duration }),
    };
}
