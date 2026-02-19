import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, FileText, Clock, CheckCircle2, AlertCircle, X, Pencil, Trash2, ArrowRight, Settings } from 'lucide-react';
import useStore from '../../store/useStore';

const ESTADO_STYLE = {
    'Pendiente': { bg: 'bg-accent-yellow/20', text: 'text-accent-yellow', dot: 'bg-accent-yellow' },
    'En Revisión': { bg: 'bg-accent-blue/20', text: 'text-accent-blue', dot: 'bg-accent-blue' },
    'Aprobado': { bg: 'bg-accent-green/20', text: 'text-accent-green', dot: 'bg-accent-green' },
    'Rechazado': { bg: 'bg-accent-red/20', text: 'text-accent-red', dot: 'bg-accent-red' },
    'Completado': { bg: 'bg-accent-purple/20', text: 'text-accent-purple', dot: 'bg-accent-purple' },
};

const PRIORIDAD_STYLE = {
    'Urgente': 'text-accent-red font-bold',
    'Alta': 'text-accent-red',
    'Media': 'text-accent-yellow',
    'Baja': 'text-accent-green',
};

const CATEGORIAS_TIPO = ['Operativo', 'Administrativo', 'Financiero', 'Legal', 'General'];

export default function RequerimientosPage() {
    const requerimientos = useStore(s => s.requerimientos);
    const addRequerimiento = useStore(s => s.addRequerimiento);
    const updateRequerimiento = useStore(s => s.updateRequerimiento);
    const deleteRequerimiento = useStore(s => s.deleteRequerimiento);
    const tiposRequerimiento = useStore(s => s.tiposRequerimiento);
    const addTipoRequerimiento = useStore(s => s.addTipoRequerimiento);
    const updateTipoRequerimiento = useStore(s => s.updateTipoRequerimiento);
    const deleteTipoRequerimiento = useStore(s => s.deleteTipoRequerimiento);

    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('all');
    const [filterTipo, setFilterTipo] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [selectedReq, setSelectedReq] = useState(null);

    useEffect(() => {
        if (selectedReq) {
            const updated = requerimientos.find(a => a.id === selectedReq.id);
            if (updated && updated !== selectedReq) {
                setSelectedReq(updated);
            }
        }
    }, [requerimientos, selectedReq]);

    const [showTiposModal, setShowTiposModal] = useState(false);
    const [tipoForm, setTipoForm] = useState({ nombre: '', categoria: 'General' });
    const [editingTipoId, setEditingTipoId] = useState(null);

    // ===================== COMPUTED =====================

    const stats = useMemo(() => ({
        total: requerimientos.length,
        pendientes: requerimientos.filter(r => r.estado === 'Pendiente').length,
        enRevision: requerimientos.filter(r => r.estado === 'En Revisión').length,
        aprobados: requerimientos.filter(r => r.estado === 'Aprobado').length,
        completados: requerimientos.filter(r => r.estado === 'Completado').length,
    }), [requerimientos]);

    const filtered = useMemo(() => {
        return requerimientos.filter(r => {
            const q = search.toLowerCase();
            const matchSearch = !search ||
                r.id.toLowerCase().includes(q) ||
                r.titulo.toLowerCase().includes(q) ||
                r.tipo.toLowerCase().includes(q) ||
                (r.solicitante && r.solicitante.toLowerCase().includes(q));
            const matchEstado = filterEstado === 'all' || r.estado === filterEstado;
            const matchTipo = filterTipo === 'all' || r.tipo === filterTipo;
            return matchSearch && matchEstado && matchTipo;
        });
    }, [requerimientos, search, filterEstado, filterTipo]);

    // ===================== HANDLERS =====================

    const handleCreate = (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        addRequerimiento({
            titulo: form.get('titulo'),
            tipo: form.get('tipo'),
            prioridad: form.get('prioridad'),
            solicitante: form.get('solicitante'),
            descripcion: form.get('descripcion'),
            montoEstimado: parseFloat(form.get('montoEstimado')) || 0,
            estado: 'Pendiente',
            fechaLimite: form.get('fechaLimite') || null,
        });
        setShowForm(false);
    };

    const handleStatusChange = (id, nuevoEstado) => {
        updateRequerimiento(id, {
            estado: nuevoEstado,
            _historyComment: `Cambio de estado a ${nuevoEstado}`
        });
        if (selectedReq && selectedReq.id === id) {
            setSelectedReq({ ...selectedReq, estado: nuevoEstado });
        }
    };

    const getStatusFlow = (estado) => {
        const flows = {
            'Pendiente': ['En Revisión', 'Rechazado'],
            'En Revisión': ['Aprobado', 'Rechazado'],
            'Aprobado': ['Completado'],
        };
        return flows[estado] || [];
    };

    const handleSaveTipo = () => {
        if (!tipoForm.nombre.trim()) return;
        if (editingTipoId) {
            updateTipoRequerimiento(editingTipoId, tipoForm);
        } else {
            addTipoRequerimiento(tipoForm);
        }
        setTipoForm({ nombre: '', categoria: 'General' });
        setEditingTipoId(null);
    };

    const handleEditTipo = (tipo) => {
        setTipoForm({ nombre: tipo.nombre, categoria: tipo.categoria || 'General' });
        setEditingTipoId(tipo.id);
    };

    // ===================== RENDER =====================

    return (
        <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Requerimientos Administrativos</h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Gestión de compras, trámites y solicitudes internas
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowTiposModal(true)}
                        className="w-full sm:w-auto justify-center py-2.5 px-4 rounded-xl bg-bg-secondary border border-border text-text-secondary text-sm font-semibold cursor-pointer flex items-center gap-2 hover:border-accent-blue/50 transition-colors"
                    >
                        <Settings size={16} /> Tipos
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full sm:w-auto justify-center py-2.5 px-4 rounded-xl bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} /> Nuevo Requerimiento
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                {[
                    { label: 'Total', value: stats.total, icon: FileText, color: 'accent-blue' },
                    { label: 'Pendientes', value: stats.pendientes, icon: Clock, color: 'accent-yellow' },
                    { label: 'En Revisión', value: stats.enRevision, icon: AlertCircle, color: 'accent-blue' },
                    { label: 'Aprobados', value: stats.aprobados, icon: CheckCircle2, color: 'accent-green' },
                    { label: 'Completados', value: stats.completados, icon: CheckCircle2, color: 'accent-purple' },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-bg-card rounded-xl p-4 border border-border flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${stat.color}/15 text-${stat.color}`}>
                                <Icon size={16} />
                            </div>
                            <div>
                                <p className="text-lg font-bold font-mono">{stat.value}</p>
                                <p className="text-[10px] text-text-muted uppercase tracking-wide">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-5">
                <div className="flex gap-2 flex-1">
                    {['all', 'Pendiente', 'En Revisión', 'Aprobado', 'Rechazado', 'Completado'].map(e => (
                        <button key={e} onClick={() => setFilterEstado(e)}
                            className={`py-1.5 px-4 rounded-lg text-xs font-semibold border cursor-pointer transition-colors
                ${filterEstado === e ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-bg-secondary border-border text-text-secondary hover:border-accent-blue/50'}`}>
                            {e === 'all' ? 'Todos' : e}
                        </button>
                    ))}
                </div>
                <select
                    value={filterTipo}
                    onChange={e => setFilterTipo(e.target.value)}
                    className="py-1.5 px-3 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary outline-none cursor-pointer"
                >
                    <option value="all">Todos los tipos</option>
                    {tiposRequerimiento.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
                <div className="relative w-[220px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        placeholder="Buscar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 py-2 bg-bg-secondary border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                    />
                </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
                {filtered.length === 0 && (
                    <div className="bg-bg-card rounded-xl p-8 border border-border text-center">
                        <p className="text-text-muted text-sm">No se encontraron requerimientos</p>
                    </div>
                )}
                {filtered.map(req => {
                    const ec = ESTADO_STYLE[req.estado] || ESTADO_STYLE['Pendiente'];
                    return (
                        <div
                            key={req.id}
                            onClick={() => setSelectedReq(req)}
                            className="bg-bg-card rounded-xl p-4 border border-border cursor-pointer transition-all hover:border-accent-blue/40 hover:bg-bg-card-hover"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-blue/15 text-accent-blue">
                                        <FileText size={14} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs text-text-muted">{req.id}</span>
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ec.bg} ${ec.text}`}>
                                                {req.estado}
                                            </span>
                                            <span className={`text-[11px] ${PRIORIDAD_STYLE[req.prioridad] || ''}`}>
                                                {req.prioridad}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold mt-0.5">{req.titulo}</p>
                                    </div>
                                </div>
                                <span className="text-[11px] text-text-muted">{req.fecha}</span>
                            </div>
                            <div className="flex items-center gap-5 text-[11px] text-text-muted">
                                <span>Tipo: <span className="text-text-secondary font-medium">{req.tipo}</span></span>
                                {req.solicitante && (
                                    <span>Solicitante: <span className="text-text-secondary">{req.solicitante}</span></span>
                                )}
                                {req.montoEstimado > 0 && (
                                    <span>Monto: <span className="text-accent-green font-bold">S/ {req.montoEstimado.toFixed(2)}</span></span>
                                )}
                                {req.fechaLimite && (
                                    <span>Límite: <span className="text-text-secondary">{req.fechaLimite}</span></span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ===================== MODAL: Nuevo Requerimiento ===================== */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div
                        className="bg-bg-card rounded-2xl p-6 w-full max-w-[520px] border border-border max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold">Nuevo Requerimiento</h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-text-muted mb-1.5 block font-medium">Título</label>
                                <input
                                    name="titulo"
                                    required
                                    placeholder="Descripción breve del requerimiento"
                                    className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-text-muted mb-1.5 block font-medium">Tipo</label>
                                    <select
                                        name="tipo"
                                        required
                                        className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                                    >
                                        {tiposRequerimiento.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted mb-1.5 block font-medium">Prioridad</label>
                                    <select
                                        name="prioridad"
                                        required
                                        className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                                    >
                                        <option value="Baja">Baja</option>
                                        <option value="Media">Media</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Urgente">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-text-muted mb-1.5 block font-medium">Solicitante</label>
                                    <input
                                        name="solicitante"
                                        placeholder="Nombre del solicitante"
                                        className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted mb-1.5 block font-medium">Monto Estimado (S/)</label>
                                    <input
                                        name="montoEstimado"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-text-muted mb-1.5 block font-medium">Fecha Límite</label>
                                <input
                                    name="fechaLimite"
                                    type="date"
                                    className="w-full py-2.5 px-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-text-muted mb-1.5 block font-medium">Descripción</label>
                                <textarea
                                    name="descripcion"
                                    placeholder="Detalle del requerimiento..."
                                    required
                                    className="w-full bg-bg-secondary border border-border text-text-primary p-3 rounded-lg text-sm min-h-[80px] resize-y outline-none focus:border-accent-blue placeholder:text-text-muted"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-lg bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                                >
                                    Crear Requerimiento
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="py-2.5 px-4 rounded-lg bg-bg-secondary border border-border text-text-secondary text-sm cursor-pointer hover:bg-bg-secondary/80"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===================== MODAL: Detalle Requerimiento ===================== */}
            {selectedReq && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedReq(null)}>
                    <div
                        className="bg-bg-card rounded-2xl p-6 w-full max-w-[580px] border border-border max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <span className="font-mono text-sm text-text-muted">{selectedReq.id}</span>
                                <h3 className="text-lg font-bold mt-1">{selectedReq.titulo}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${ESTADO_STYLE[selectedReq.estado]?.bg} ${ESTADO_STYLE[selectedReq.estado]?.text}`}>
                                    {selectedReq.estado}
                                </span>
                                <button
                                    onClick={() => setSelectedReq(null)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div className="bg-bg-secondary rounded-lg p-3">
                                <p className="text-[11px] text-text-muted mb-0.5">Tipo</p>
                                <p className="text-sm font-medium">{selectedReq.tipo}</p>
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-3">
                                <p className="text-[11px] text-text-muted mb-0.5">Prioridad</p>
                                <p className={`text-sm font-medium ${PRIORIDAD_STYLE[selectedReq.prioridad] || ''}`}>{selectedReq.prioridad}</p>
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-3">
                                <p className="text-[11px] text-text-muted mb-0.5">Solicitante</p>
                                <p className="text-sm font-medium">{selectedReq.solicitante || 'No especificado'}</p>
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-3">
                                <p className="text-[11px] text-text-muted mb-0.5">Fecha</p>
                                <p className="text-sm font-medium">{selectedReq.fecha}</p>
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-3">
                                <p className="text-[11px] text-text-muted mb-0.5">Monto Estimado</p>
                                <p className="text-sm font-bold text-accent-green">
                                    {selectedReq.montoEstimado > 0 ? `S/ ${selectedReq.montoEstimado.toFixed(2)}` : '---'}
                                </p>
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-3">
                                <p className="text-[11px] text-text-muted mb-0.5">Fecha Límite</p>
                                <p className="text-sm font-medium">{selectedReq.fechaLimite || '---'}</p>
                            </div>
                        </div>

                        {/* Descripcion */}
                        <div className="bg-bg-secondary rounded-lg p-3 mb-4">
                            <p className="text-[11px] text-text-muted mb-1">Descripción</p>
                            <p className="text-sm text-text-primary">{selectedReq.descripcion || 'Sin descripción'}</p>
                        </div>

                        {/* Historial */}
                        {selectedReq.historial && selectedReq.historial.length > 0 && (
                            <div className="bg-bg-secondary rounded-lg p-3 mb-4">
                                <p className="text-[11px] text-text-muted mb-2 font-medium uppercase tracking-wide">Historial</p>
                                <div className="flex flex-col gap-2">
                                    {selectedReq.historial.map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[11px]">
                                            <span className="text-text-muted">{new Date(h.fecha).toLocaleDateString()}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ESTADO_STYLE[h.estadoAnterior]?.bg || 'bg-bg-card'} ${ESTADO_STYLE[h.estadoAnterior]?.text || 'text-text-muted'}`}>
                                                {h.estadoAnterior}
                                            </span>
                                            <ArrowRight size={10} className="text-text-muted" />
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ESTADO_STYLE[h.estadoNuevo]?.bg || 'bg-bg-card'} ${ESTADO_STYLE[h.estadoNuevo]?.text || 'text-text-muted'}`}>
                                                {h.estadoNuevo}
                                            </span>
                                            {h.motivo && <span className="text-text-muted">— {h.motivo}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            {getStatusFlow(selectedReq.estado).map(nextEstado => {
                                const style = ESTADO_STYLE[nextEstado] || {};
                                return (
                                    <button
                                        key={nextEstado}
                                        onClick={() => handleStatusChange(selectedReq.id, nextEstado)}
                                        className={`flex-1 py-2.5 rounded-lg border-none text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80 ${style.bg || 'bg-bg-secondary'} ${style.text || 'text-text-secondary'}`}
                                    >
                                        {nextEstado === 'Rechazado' ? 'Rechazar' : `Pasar a ${nextEstado}`}
                                    </button>
                                );
                            })}
                            {(selectedReq.estado === 'Completado' || selectedReq.estado === 'Rechazado') && (
                                <button
                                    onClick={() => { deleteRequerimiento(selectedReq.id); setSelectedReq(null); }}
                                    className="py-2.5 px-4 rounded-lg bg-accent-red/15 text-accent-red border-none text-xs font-semibold cursor-pointer hover:bg-accent-red/25 transition-colors"
                                >
                                    Eliminar
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedReq(null)}
                                className="flex-1 py-2.5 rounded-lg bg-bg-secondary border border-border text-text-secondary text-xs cursor-pointer hover:bg-bg-secondary/80 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== MODAL: Gestión de Tipos ===================== */}
            {showTiposModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTiposModal(false)}>
                    <div
                        className="bg-bg-card rounded-2xl p-6 w-full max-w-[550px] border border-border max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-lg font-bold">Tipos de Requerimiento</h3>
                                <p className="text-xs text-text-muted mt-0.5">Gestiona los tipos disponibles para clasificar requerimientos</p>
                            </div>
                            <button
                                onClick={() => setShowTiposModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-secondary border border-border text-text-muted cursor-pointer hover:text-text-primary transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Lista de tipos existentes */}
                        <div className="flex flex-col gap-2 mb-5">
                            {tiposRequerimiento.map(tipo => (
                                <div key={tipo.id} className="bg-bg-secondary rounded-lg p-3 border border-border flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[11px] text-text-muted">{tipo.id}</span>
                                            <span className="text-sm font-semibold">{tipo.nombre}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-accent-blue/15 text-accent-blue">
                                                {tipo.categoria || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEditTipo(tipo)}
                                            className="w-7 h-7 rounded flex items-center justify-center bg-accent-blue/15 text-accent-blue border-none cursor-pointer hover:bg-accent-blue/25 transition-colors"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={() => deleteTipoRequerimiento(tipo.id)}
                                            className="w-7 h-7 rounded flex items-center justify-center bg-accent-red/15 text-accent-red border-none cursor-pointer hover:bg-accent-red/25 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formulario agregar/editar */}
                        <div className="bg-bg-secondary rounded-lg p-4 border border-border">
                            <p className="text-xs font-semibold text-text-secondary mb-3">
                                {editingTipoId ? 'Editar Tipo' : 'Agregar Tipo'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-[10px] text-text-muted block mb-1">Nombre</label>
                                    <input
                                        value={tipoForm.nombre}
                                        onChange={e => setTipoForm(p => ({ ...p, nombre: e.target.value }))}
                                        placeholder="Nombre del tipo"
                                        className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-muted block mb-1">Categoría</label>
                                    <select
                                        value={tipoForm.categoria}
                                        onChange={e => setTipoForm(p => ({ ...p, categoria: e.target.value }))}
                                        className="w-full py-2 px-3 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                                    >
                                        {CATEGORIAS_TIPO.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveTipo}
                                    disabled={!tipoForm.nombre.trim()}
                                    className="flex-1 py-2 rounded-lg bg-accent-blue/20 text-accent-blue border-none text-xs font-semibold cursor-pointer hover:bg-accent-blue/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {editingTipoId ? 'Guardar Cambios' : 'Agregar Tipo'}
                                </button>
                                {editingTipoId && (
                                    <button
                                        onClick={() => {
                                            setTipoForm({ nombre: '', categoria: 'General' });
                                            setEditingTipoId(null);
                                        }}
                                        className="py-2 px-4 rounded-lg bg-bg-card border border-border text-text-muted text-xs cursor-pointer hover:text-text-primary"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
