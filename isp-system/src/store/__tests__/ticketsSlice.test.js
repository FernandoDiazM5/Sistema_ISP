import { describe, it, expect, beforeEach, vi } from 'vitest';
import useStore from '../useStore';
import * as db from '../../utils/db';

// Hacer mock silencioso de IndexedDB para no romper el entorno de node/jsdom
vi.mock('../../utils/db', () => ({
    set: vi.fn(),
    get: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
    clear: vi.fn(),
}));

// Evitar dependencias de entorno como useSyncStore o Firebase
vi.mock('../../api/firebase', () => ({
    subscribeToCollection: vi.fn(),
    saveDocument: vi.fn(),
    deleteDocument: vi.fn(),
    migrateDataToCollections: vi.fn()
}));

describe('Tickets Slice', () => {
    // Reset Zustand state before each test
    beforeEach(() => {
        useStore.setState({
            tickets: [],
            visitas: [],
            sesionesRemoto: []
        });
        vi.clearAllMocks();
    });

    it('debería agregar un ticket con ID autogenerado TK-001', () => {
        const initialState = useStore.getState();
        expect(initialState.tickets).toHaveLength(0);

        initialState.addTicket({
            clienteId: 'CLI-001',
            descripcion: 'Falla de internet'
        });

        const newState = useStore.getState();
        expect(newState.tickets).toHaveLength(1);
        expect(newState.tickets[0].id).toBe('TK-001');
        expect(newState.tickets[0].clienteId).toBe('CLI-001');
        // Validar que se guarda en IndexedDB local
        expect(db.set).toHaveBeenCalled();
    });

    it('debería generar el siguiente ID consecutivo TK-002', () => {
        useStore.setState({
            tickets: [{ id: 'TK-001', clienteId: 'CLI-001' }]
        });

        useStore.getState().addTicket({
            clienteId: 'CLI-002',
            descripcion: 'Falla de TV'
        });

        const newState = useStore.getState();
        expect(newState.tickets).toHaveLength(2);
        // Debe ser el primer elemento en el array puesto que los añade al principio
        expect(newState.tickets[0].id).toBe('TK-002');
    });

    it('debería actualizar el estado de un ticket y añadirlo al historial', () => {
        useStore.setState({
            tickets: [{
                id: 'TK-001',
                clienteId: 'CLI-001',
                estado: 'Abierto',
                historial: []
            }]
        });

        useStore.getState().updateTicket('TK-001', {
            estado: 'En Proceso',
            _historyComment: 'Técnico asignado'
        });

        const newState = useStore.getState();
        const updatedTicket = newState.tickets[0];

        expect(updatedTicket.estado).toBe('En Proceso');
        expect(updatedTicket.historial).toHaveLength(1);
        expect(updatedTicket.historial[0].estadoAnterior).toBe('Abierto');
        expect(updatedTicket.historial[0].estadoNuevo).toBe('En Proceso');
        expect(updatedTicket.historial[0].motivo).toBe('Técnico asignado');
    });

    it('eliminar en cascada debería borrar el ticket y sus visitas', () => {
        useStore.setState({
            tickets: [{ id: 'TK-001' }, { id: 'TK-002' }],
            visitas: [{ id: 'VT-001', ticketId: 'TK-001' }, { id: 'VT-002', ticketId: 'TK-002' }],
            sesionesRemoto: [{ id: 'SR-001', ticketId: 'TK-001' }]
        });

        useStore.getState().deleteTicketCascade('TK-001');

        const state = useStore.getState();

        expect(state.tickets).toHaveLength(1);
        expect(state.tickets[0].id).toBe('TK-002');

        // La visita VT-001 debe haber desaparecido, dejando solo la de TK-002
        expect(state.visitas).toHaveLength(1);
        expect(state.visitas[0].id).toBe('VT-002');

        // La sesión remota igual
        expect(state.sesionesRemoto).toHaveLength(0);
    });
});
