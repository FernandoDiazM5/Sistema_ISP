import { useState, useCallback } from 'react';

/**
 * Hook para controlar modales de forma declarativa.
 * 
 * @example
 * const createModal = useModal();
 * createModal.open({ clienteId: '123' });
 * // en JSX: {createModal.isOpen && <Modal data={createModal.data} onClose={createModal.close} />}
 */
export default function useModal(initialOpen = false) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [data, setData] = useState(null);

    const open = useCallback((modalData = null) => {
        setData(modalData);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setData(null);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen(prev => {
            if (prev) setData(null);
            return !prev;
        });
    }, []);

    return { isOpen, data, open, close, toggle };
}
