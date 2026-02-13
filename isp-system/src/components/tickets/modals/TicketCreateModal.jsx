import { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, MapPin, X } from 'lucide-react';
import Adjuntos from '../../common/Adjuntos';
import useStore from '../../../store/useStore';

export default function TicketCreateModal({ onClose, onSuccess, initialData = null }) {
    const clients = useStore(s => s.clients);
    const categorias = useStore(s => s.categorias);
    const subcategorias = useStore(s => s.subcategorias);
    const tecnicos = useStore(s => s.tecnicos);
    const addTicket = useStore(s => s.addTicket);
    const updateTicket = useStore(s => s.updateTicket);
    const getSLABySubcategoria = useStore(s => s.getSLABySubcategoria);

    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [selectedCategoria, setSelectedCategoria] = useState('');
    const [selectedSubcategoria, setSelectedSubcategoria] = useState('');
    const [selectedTecnico, setSelectedTecnico] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newAdjuntos, setNewAdjuntos] = useState([]);

    // Initialize form if editing
    useEffect(() => {
        if (initialData) {
            const client = clients.find(c => c.id === initialData.clienteId);
            setSelectedClient(client || { id: initialData.clienteId, nombre: initialData.clienteNombre });
            setClientSearch(initialData.clienteNombre);
            setSelectedCategoria(initialData.categoriaId || '');
            setSelectedSubcategoria(initialData.subcategoriaId || '');
            setSelectedTecnico(initialData.tecnicoId || '');
            setNewDescription(initialData.descripcion || '');
            setNewAdjuntos(initialData.adjuntos || []);
        }
    }, [initialData, clients]);

    // Derived state
    const clientResults = useMemo(() => {
        if (clientSearch.length < 2) return [];
        const q = clientSearch.toLowerCase();
        return clients.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            (c.movil_1 && c.movil_1.includes(q))
        ).slice(0, 10);
    }, [clients, clientSearch]);

    const filteredSubcategorias = useMemo(() => {
        if (!selectedCategoria) return [];
        return subcategorias.filter(s => s.categoriaId === selectedCategoria);
    }, [subcategorias, selectedCategoria]);

    const slaInfo = useMemo(() => {
        if (!selectedSubcategoria) return null;
        return getSLABySubcategoria(selectedSubcategoria);
    }, [selectedSubcategoria, getSLABySubcategoria]);

    const autoTipoAtencion = useMemo(() => {
        if (!selectedSubcategoria) return '';
        const sub = subcategorias.find(s => s.id === selectedSubcategoria);
        return sub ? sub.tipoAtencion : '';
    }, [selectedSubcategoria, subcategorias]);

    const activeTecnicos = useMemo(() => {
        return tecnicos.filter(t => t.estado === 'Activo');
    }, [tecnicos]);

    const handleSubmit = () => {
        if (!selectedClient || !selectedCategoria || !selectedSubcategoria || !newDescription.trim()) return;

        const sub = subcategorias.find(s => s.id === selectedSubcategoria);
        const cat = categorias.find(c => c.id === selectedCategoria);
        const tec = tecnicos.find(t => t.id === selectedTecnico);

        const ticketData = {
            clienteId: selectedClient.id,
            clienteNombre: selectedClient.nombre,
            tipo: autoTipoAtencion || 'Soporte',
            prioridad: slaInfo ? slaInfo.prioridad : 'Media',
            estado: initialData ? initialData.estado : 'Abierto',
            asignado: tec ? tec.nombre : 'Sin asignar',
            tecnicoId: tec ? tec.id : null,
            descripcion: newDescription,
            categoriaId: selectedCategoria,
            categoriaNombre: cat ? cat.nombre : '',
            subcategoriaId: selectedSubcategoria,
            subcategoriaNombre: sub ? sub.nombre : '',
            tipoAtencion: autoTipoAtencion,
            slaTiempoLimite: slaInfo ? slaInfo.tiempoLimite : null,
            slaImpacto: slaInfo ? slaInfo.impacto : null,
            adjuntos: newAdjuntos,
        };

        if (initialData) {
            updateTicket(initialData.id, ticketData);
        } else {
            addTicket(ticketData);
        }
        onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-bg-card rounded-2xl p-6 w-[560px] border border-border max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold">{initialData ? 'Editar Ticket' : 'Nuevo Ticket'}</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={20} /></button>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Client Search */}
                    <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Cliente *</label>
                        {selectedClient ? (
                            <div className="flex items-center justify-between bg-bg-secondary rounded-lg p-3 border border-border">
                                <div>
                                    <p className="text-sm font-medium">{selectedClient.nombre}</p>
                                    <p className="text-[11px] text-text-muted font-mono">
                                        ID: {selectedClient.id}
                                        {selectedClient.movil_1 && <span className="ml-2 text-text-secondary">📱 {selectedClient.movil_1}</span>}
                                    </p>
                                    {selectedClient.direccion && (
                                        <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1"><MapPin size={10} /> {selectedClient.direccion}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button onClick={() => { setSelectedClient(null); setClientSearch(''); }} className="text-xs text-accent-red hover:underline border-none bg-transparent cursor-pointer">Cambiar</button>
                                    <button type="button" onClick={() => window.open(`/?page=clientes&search=${selectedClient.id}`, '_blank')} className="text-xs text-accent-blue hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer">
                                        <ExternalLink size={12} /> Ver Perfil
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    placeholder="Buscar cliente por nombre, ID o celular..."
                                    value={clientSearch}
                                    onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                                    onFocus={() => setShowClientDropdown(true)}
                                    className="w-full pl-9"
                                    autoFocus
                                />
                                {showClientDropdown && clientResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-lg shadow-xl z-10 max-h-[200px] overflow-y-auto">
                                        {clientResults.map(c => (
                                            <div key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientDropdown(false); }} className="px-3 py-2.5 cursor-pointer hover:bg-bg-card-hover border-b border-border/50 last:border-0">
                                                <p className="text-sm font-medium">{c.nombre}</p>
                                                <p className="text-[11px] text-text-muted font-mono">ID: {c.id}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Categoria */}
                    <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Categoría *</label>
                        <select value={selectedCategoria} onChange={e => { setSelectedCategoria(e.target.value); setSelectedSubcategoria(''); }} className="w-full">
                            <option value="">Seleccionar categoría...</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>

                    {/* Subcategoria */}
                    <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Subcategoría *</label>
                        <select value={selectedSubcategoria} onChange={e => setSelectedSubcategoria(e.target.value)} className="w-full" disabled={!selectedCategoria}>
                            <option value="">{selectedCategoria ? 'Seleccionar subcategoría...' : 'Primero seleccione una categoría'}</option>
                            {filteredSubcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>

                    {/* SLA Info */}
                    {selectedSubcategoria && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Prioridad (SLA)</p>
                                {slaInfo ? (
                                    <div>
                                        <span className="font-bold text-xs">{slaInfo.prioridad}</span>
                                        <p className="text-[10px] text-text-muted mt-1">Tiempo: {slaInfo.tiempoLimite}</p>
                                    </div>
                                ) : <span className="text-xs text-text-muted">Media</span>}
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-3 border border-border/50">
                                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Tipo Atención</p>
                                <span className="text-sm font-medium">{autoTipoAtencion || 'No definido'}</span>
                            </div>
                        </div>
                    )}

                    {/* Tecnico */}
                    <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Técnico Asignado</label>
                        <select value={selectedTecnico} onChange={e => setSelectedTecnico(e.target.value)} className="w-full">
                            <option value="">Sin asignar</option>
                            {activeTecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs text-text-secondary font-medium mb-1.5 block">Descripción *</label>
                        <textarea
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                            placeholder="Describa el problema..."
                            className="bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[100px] resize-y outline-none focus:border-accent-blue w-full"
                        />
                    </div>

                    <Adjuntos value={newAdjuntos} onChange={setNewAdjuntos} max={5} />

                    <div className="flex gap-3 mt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary cursor-pointer text-sm hover:bg-bg-card-hover transition-colors">Cancelar</button>
                        <button type="button" onClick={handleSubmit} disabled={!selectedClient || !selectedCategoria || !selectedSubcategoria || !newDescription.trim()} className="flex-1 py-2.5 rounded-lg bg-accent-blue border-none text-white cursor-pointer text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                            {initialData ? 'Guardar Cambios' : 'Crear Ticket'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
