import { useState } from 'react';
import useStore from '../../store/useStore';
import {
  Ticket, AlertTriangle, MonitorSmartphone, Calendar,
  Cable, Box, HardHat, FileText, Plus, Pencil, Trash2,
  Check, X, ChevronDown, ChevronRight, Tag, Layers, Clock,
  Cpu, Wifi, Settings2, Briefcase,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Componente genérico de sección para catálogos simples (solo nombre)
// ──────────────────────────────────────────────────────────────────────────────
function SimpleListSection({ title, icon: Icon, items, onAdd, onUpdate, onDelete, color = 'blue' }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const colorMap = {
    blue: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
    red: 'text-accent-red bg-accent-red/10 border-accent-red/20',
    green: 'text-accent-green bg-accent-green/10 border-accent-green/20',
    purple: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20',
    orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    teal: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    indigo: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName('');
    setAdding(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.nombre);
  };

  const handleUpdate = (id) => {
    if (!editName.trim()) return;
    onUpdate(id, editName.trim());
    setEditingId(null);
  };

  const handleDelete = (id) => {
    onDelete(id);
    setDeletingId(null);
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-3 border-b border-border`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
            <Icon size={14} />
          </div>
          <span className="text-sm font-semibold text-text-primary">{title}</span>
          <span className="text-xs text-text-muted bg-bg-secondary border border-border px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-1 text-xs font-semibold text-accent-blue hover:bg-accent-blue/10 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus size={13} /> Agregar
        </button>
      </div>

      <div className="divide-y divide-border">
        {adding && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-blue/5">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
              placeholder="Nombre del tipo..."
              className="flex-1 bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent-blue"
            />
            <button onClick={handleAdd} className="p-1.5 rounded-lg bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 transition-colors">
              <Check size={14} />
            </button>
            <button onClick={() => { setAdding(false); setNewName(''); }} className="p-1.5 rounded-lg bg-bg-secondary text-text-muted hover:text-text-primary transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {items.length === 0 && !adding && (
          <p className="text-xs text-text-muted text-center py-6">Sin registros. Agrega el primero.</p>
        )}

        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-secondary/50 transition-colors">
            {editingId === item.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdate(item.id); if (e.key === 'Escape') setEditingId(null); }}
                  className="flex-1 bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1 text-sm text-text-primary outline-none focus:border-accent-blue"
                />
                <button onClick={() => handleUpdate(item.id)} className="p-1.5 rounded-lg bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-colors">
                  <Check size={13} />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-bg-secondary text-text-muted hover:text-text-primary transition-colors">
                  <X size={13} />
                </button>
              </>
            ) : deletingId === item.id ? (
              <>
                <span className="flex-1 text-sm text-accent-red">¿Eliminar "{item.nombre}"?</span>
                <button onClick={() => handleDelete(item.id)} className="text-xs font-semibold px-2 py-1 rounded-lg bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors">
                  Sí, eliminar
                </button>
                <button onClick={() => setDeletingId(null)} className="text-xs font-semibold px-2 py-1 rounded-lg bg-bg-secondary text-text-muted hover:text-text-primary transition-colors">
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span className="text-xs text-text-muted font-mono">{item.id}</span>
                <span className="flex-1 text-sm text-text-primary">{item.nombre}</span>
                <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setDeletingId(item.id)} className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sección de Planes de Instalación (campos múltiples)
// ──────────────────────────────────────────────────────────────────────────────
function PlanesInstalacionSection() {
  const planesInstalacion = useStore(s => s.planesInstalacion);
  const tecnologiasInstalacion = useStore(s => s.tecnologiasInstalacion);
  const addPlanInstalacion = useStore(s => s.addPlanInstalacion);
  const updatePlanInstalacion = useStore(s => s.updatePlanInstalacion);
  const deletePlanInstalacion = useStore(s => s.deletePlanInstalacion);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nombre: '', velocidad: '', tecnologia: tecnologiasInstalacion[0]?.nombre || '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const handleAdd = () => {
    if (!form.nombre.trim() || !form.velocidad.trim()) return;
    addPlanInstalacion(form);
    setForm({ nombre: '', velocidad: '', tecnologia: tecnologiasInstalacion[0]?.nombre || '' });
    setAdding(false);
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setEditForm({ nombre: plan.nombre, velocidad: plan.velocidad, tecnologia: plan.tecnologia });
  };

  const handleUpdate = (id) => {
    if (!editForm.nombre?.trim()) return;
    updatePlanInstalacion(id, editForm);
    setEditingId(null);
  };

  const tecnologias = tecnologiasInstalacion.map(t => t.nombre);

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg border text-teal-400 bg-teal-400/10 border-teal-400/20">
            <HardHat size={14} />
          </div>
          <span className="text-sm font-semibold text-text-primary">Planes de Instalación</span>
          <span className="text-xs text-text-muted bg-bg-secondary border border-border px-2 py-0.5 rounded-full">
            {planesInstalacion.length}
          </span>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-1 text-xs font-semibold text-accent-blue hover:bg-accent-blue/10 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus size={13} /> Agregar
        </button>
      </div>

      {adding && (
        <div className="px-4 py-3 bg-accent-blue/5 border-b border-border grid grid-cols-3 gap-2">
          <input
            autoFocus
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre del plan"
            className="col-span-3 bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent-blue"
          />
          <input
            value={form.velocidad}
            onChange={e => setForm(f => ({ ...f, velocidad: e.target.value }))}
            placeholder="Velocidad (ej: 100MB)"
            className="bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent-blue"
          />
          <select
            value={form.tecnologia}
            onChange={e => setForm(f => ({ ...f, tecnologia: e.target.value }))}
            className="bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none"
          >
            {tecnologias.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-1.5 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-semibold hover:bg-accent-blue/30 transition-colors">
              Guardar
            </button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-muted text-xs hover:text-text-primary transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {planesInstalacion.length === 0 && !adding && (
          <p className="text-xs text-text-muted text-center py-6">Sin planes configurados.</p>
        )}
        {planesInstalacion.map(plan => (
          <div key={plan.id} className="px-4 py-2.5 hover:bg-bg-secondary/50 transition-colors">
            {editingId === plan.id ? (
              <div className="grid grid-cols-3 gap-2">
                <input
                  autoFocus
                  value={editForm.nombre}
                  onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  className="col-span-3 bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none"
                />
                <input
                  value={editForm.velocidad}
                  onChange={e => setEditForm(f => ({ ...f, velocidad: e.target.value }))}
                  className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none"
                />
                <select
                  value={editForm.tecnologia}
                  onChange={e => setEditForm(f => ({ ...f, tecnologia: e.target.value }))}
                  className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none"
                >
                  {tecnologias.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(plan.id)} className="flex-1 py-1.5 rounded-lg bg-accent-green/20 text-accent-green text-xs font-semibold">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-muted text-xs">Cancelar</button>
                </div>
              </div>
            ) : deletingId === plan.id ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-accent-red">¿Eliminar "{plan.nombre}"?</span>
                <button onClick={() => { deletePlanInstalacion(plan.id); setDeletingId(null); }} className="text-xs font-semibold px-2 py-1 rounded-lg bg-accent-red/20 text-accent-red">Sí, eliminar</button>
                <button onClick={() => setDeletingId(null)} className="text-xs px-2 py-1 rounded-lg bg-bg-secondary text-text-muted">Cancelar</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted font-mono">{plan.id}</span>
                <span className="flex-1 text-sm text-text-primary">{plan.nombre}</span>
                <span className="text-xs text-text-muted bg-bg-secondary border border-border px-2 py-0.5 rounded-full">{plan.velocidad}</span>
                <span className="text-xs text-teal-400 bg-teal-400/10 border border-teal-400/20 px-2 py-0.5 rounded-full">{plan.tecnologia}</span>
                <button onClick={() => handleEdit(plan)} className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"><Pencil size={13} /></button>
                <button onClick={() => setDeletingId(plan.id)} className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"><Trash2 size={13} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Secciones por tab
// ──────────────────────────────────────────────────────────────────────────────
function TabTickets() {
  const categorias = useStore(s => s.categorias);
  const subcategorias = useStore(s => s.subcategorias);
  const prioridadesSLA = useStore(s => s.prioridadesSLA);
  const estadosCatalogo = useStore(s => s.estadosCatalogo);

  const addCategoria = useStore(s => s.addCategoria);
  const updateCategoria = useStore(s => s.updateCategoria);
  const deleteCategoria = useStore(s => s.deleteCategoria);
  const addSubcategoria = useStore(s => s.addSubcategoria);
  const updateSubcategoria = useStore(s => s.updateSubcategoria);
  const deleteSubcategoria = useStore(s => s.deleteSubcategoria);
  const addPrioridadSLA = useStore(s => s.addPrioridadSLA);
  const updatePrioridadSLA = useStore(s => s.updatePrioridadSLA);
  const deletePrioridadSLA = useStore(s => s.deletePrioridadSLA);
  const addEstadoCatalogo = useStore(s => s.addEstadoCatalogo);
  const updateEstadoCatalogo = useStore(s => s.updateEstadoCatalogo);
  const deleteEstadoCatalogo = useStore(s => s.deleteEstadoCatalogo);

  const [expandedCat, setExpandedCat] = useState(null);
  const [addingSubCat, setAddingSubCat] = useState(null);
  const [newSubForm, setNewSubForm] = useState({ nombre: '', tipoAtencion: 'Soporte Remoto' });
  const [addingCat, setAddingCat] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ nombre: '', descripcion: '' });
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatForm, setEditCatForm] = useState({});
  const [deletingCatId, setDeletingCatId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [editSubName, setEditSubName] = useState('');
  const [deletingSubId, setDeletingSubId] = useState(null);
  const [addingSLA, setAddingSLA] = useState(null);
  const [newSLAForm, setNewSLAForm] = useState({ prioridad: 'Media', tiempoLimite: '24 horas', impacto: '' });
  const [addingEstado, setAddingEstado] = useState(false);
  const [newEstadoForm, setNewEstadoForm] = useState({ entidad: 'Ticket', nombre: '', color: '#10b981', orden: 1, esFinal: false });

  const PRIORIDADES = ['Crítica', 'Alta', 'Media', 'Baja'];
  const TIPOS_ATENCION = ['Soporte Remoto', 'Visita Técnica', 'Ambos'];
  const ENTIDADES = [...new Set(estadosCatalogo.map(e => e.entidad)), 'Ticket', 'Cliente', 'Visita', 'Solicitud'].filter((v, i, a) => a.indexOf(v) === i);

  const handleAddCategoria = () => {
    if (!newCatForm.nombre.trim()) return;
    addCategoria(newCatForm);
    setNewCatForm({ nombre: '', descripcion: '' });
    setAddingCat(false);
  };

  const handleAddSubcategoria = (catId) => {
    if (!newSubForm.nombre.trim()) return;
    addSubcategoria({ categoriaId: catId, ...newSubForm });
    setNewSubForm({ nombre: '', tipoAtencion: 'Soporte Remoto' });
    setAddingSubCat(null);
  };

  const handleAddSLA = (subId) => {
    if (!newSLAForm.impacto.trim()) return;
    addPrioridadSLA({ subcategoriaId: subId, ...newSLAForm });
    setNewSLAForm({ prioridad: 'Media', tiempoLimite: '24 horas', impacto: '' });
    setAddingSLA(null);
  };

  const handleAddEstado = () => {
    if (!newEstadoForm.nombre.trim()) return;
    addEstadoCatalogo(newEstadoForm);
    setNewEstadoForm({ entidad: 'Ticket', nombre: '', color: '#10b981', orden: 1, esFinal: false });
    setAddingEstado(false);
  };

  const byEntidad = estadosCatalogo.reduce((acc, e) => {
    if (!acc[e.entidad]) acc[e.entidad] = [];
    acc[e.entidad].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Categorías y Subcategorías */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border text-accent-blue bg-accent-blue/10 border-accent-blue/20"><Tag size={14} /></div>
            <span className="text-sm font-semibold text-text-primary">Categorías y Subcategorías</span>
          </div>
          <button onClick={() => setAddingCat(true)} className="flex items-center gap-1 text-xs font-semibold text-accent-blue hover:bg-accent-blue/10 px-2 py-1 rounded-lg transition-colors">
            <Plus size={13} /> Categoría
          </button>
        </div>

        {addingCat && (
          <div className="px-4 py-3 bg-accent-blue/5 border-b border-border space-y-2">
            <input autoFocus value={newCatForm.nombre} onChange={e => setNewCatForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre de la categoría" className="w-full bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none" />
            <input value={newCatForm.descripcion} onChange={e => setNewCatForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción (opcional)" className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none" />
            <div className="flex gap-2">
              <button onClick={handleAddCategoria} className="px-3 py-1.5 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-semibold hover:bg-accent-blue/30">Guardar</button>
              <button onClick={() => setAddingCat(false)} className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-muted text-xs">Cancelar</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {categorias.map(cat => {
            const subs = subcategorias.filter(s => s.categoriaId === cat.id);
            const isExpanded = expandedCat === cat.id;
            return (
              <div key={cat.id}>
                {/* Fila de categoría */}
                {editingCatId === cat.id ? (
                  <div className="px-4 py-3 space-y-2 bg-accent-blue/5">
                    <input autoFocus value={editCatForm.nombre} onChange={e => setEditCatForm(f => ({ ...f, nombre: e.target.value }))}
                      className="w-full bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none" />
                    <input value={editCatForm.descripcion} onChange={e => setEditCatForm(f => ({ ...f, descripcion: e.target.value }))}
                      className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => { updateCategoria(cat.id, editCatForm); setEditingCatId(null); }} className="px-3 py-1.5 rounded-lg bg-accent-green/20 text-accent-green text-xs font-semibold">Guardar</button>
                      <button onClick={() => setEditingCatId(null)} className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-muted text-xs">Cancelar</button>
                    </div>
                  </div>
                ) : deletingCatId === cat.id ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-red/5">
                    <span className="flex-1 text-sm text-accent-red">¿Eliminar "{cat.nombre}" y sus {subs.length} subcategorías?</span>
                    <button onClick={() => { deleteCategoria(cat.id); setDeletingCatId(null); }} className="text-xs font-semibold px-2 py-1 rounded-lg bg-accent-red/20 text-accent-red">Eliminar</button>
                    <button onClick={() => setDeletingCatId(null)} className="text-xs px-2 py-1 rounded-lg bg-bg-secondary text-text-muted">Cancelar</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-bg-secondary/50 transition-colors group">
                    <button onClick={() => setExpandedCat(isExpanded ? null : cat.id)} className="text-text-muted hover:text-text-primary transition-colors">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <span className="text-xs text-text-muted font-mono">{cat.id}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{cat.nombre}</p>
                      {cat.descripcion && <p className="text-xs text-text-muted truncate">{cat.descripcion}</p>}
                    </div>
                    <span className="text-xs text-text-muted">{subs.length} subs</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingCatId(cat.id); setEditCatForm({ nombre: cat.nombre, descripcion: cat.descripcion }); }} className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => setDeletingCatId(cat.id)} className="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                )}

                {/* Subcategorías (expandible) */}
                {isExpanded && (
                  <div className="bg-bg-secondary/30 border-t border-border">
                    {subs.map(sub => {
                      const sla = prioridadesSLA.find(p => p.subcategoriaId === sub.id);
                      return (
                        <div key={sub.id}>
                          {editingSubId === sub.id ? (
                            <div className="flex items-center gap-2 pl-10 pr-4 py-2 bg-accent-blue/5">
                              <input autoFocus value={editSubName} onChange={e => setEditSubName(e.target.value)}
                                className="flex-1 bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1 text-sm text-text-primary outline-none" />
                              <button onClick={() => { updateSubcategoria(sub.id, { nombre: editSubName }); setEditingSubId(null); }} className="p-1.5 rounded-lg bg-accent-green/20 text-accent-green"><Check size={13} /></button>
                              <button onClick={() => setEditingSubId(null)} className="p-1.5 rounded-lg bg-bg-secondary text-text-muted"><X size={13} /></button>
                            </div>
                          ) : deletingSubId === sub.id ? (
                            <div className="flex items-center gap-2 pl-10 pr-4 py-2 bg-accent-red/5">
                              <span className="flex-1 text-sm text-accent-red">¿Eliminar "{sub.nombre}"?</span>
                              <button onClick={() => { deleteSubcategoria(sub.id); setDeletingSubId(null); }} className="text-xs px-2 py-1 rounded-lg bg-accent-red/20 text-accent-red">Eliminar</button>
                              <button onClick={() => setDeletingSubId(null)} className="text-xs px-2 py-1 rounded-lg bg-bg-secondary text-text-muted">Cancelar</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 pl-10 pr-4 py-2 hover:bg-bg-secondary/50 transition-colors group/sub">
                              <span className="text-xs text-text-muted font-mono">{sub.id}</span>
                              <span className="flex-1 text-sm text-text-primary">{sub.nombre}</span>
                              <span className="text-xs text-text-muted">{sub.tipoAtencion}</span>
                              {sla ? (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${sla.prioridad === 'Crítica' ? 'text-red-400 bg-red-400/10 border-red-400/20' : sla.prioridad === 'Alta' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' : sla.prioridad === 'Media' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : 'text-gray-400 bg-gray-400/10 border-gray-400/20'}`}>
                                  {sla.prioridad} · {sla.tiempoLimite}
                                </span>
                              ) : (
                                <button onClick={() => setAddingSLA(sub.id)} className="text-xs text-accent-blue hover:underline">+ SLA</button>
                              )}
                              <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingSubId(sub.id); setEditSubName(sub.nombre); }} className="p-1 rounded text-text-muted hover:text-accent-blue"><Pencil size={12} /></button>
                                <button onClick={() => setDeletingSubId(sub.id)} className="p-1 rounded text-text-muted hover:text-accent-red"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          )}

                          {addingSLA === sub.id && (
                            <div className="pl-10 pr-4 py-2 bg-accent-blue/5 border-t border-dashed border-border grid grid-cols-3 gap-2">
                              <select value={newSLAForm.prioridad} onChange={e => setNewSLAForm(f => ({ ...f, prioridad: e.target.value }))} className="bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none">
                                {PRIORIDADES.map(p => <option key={p}>{p}</option>)}
                              </select>
                              <input value={newSLAForm.tiempoLimite} onChange={e => setNewSLAForm(f => ({ ...f, tiempoLimite: e.target.value }))} placeholder="Tiempo (ej: 4 horas)" className="bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none" />
                              <input autoFocus value={newSLAForm.impacto} onChange={e => setNewSLAForm(f => ({ ...f, impacto: e.target.value }))} placeholder="Impacto" className="bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none" />
                              <div className="col-span-3 flex gap-2">
                                <button onClick={() => handleAddSLA(sub.id)} className="px-3 py-1 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-semibold">Guardar SLA</button>
                                <button onClick={() => setAddingSLA(null)} className="px-3 py-1 rounded-lg bg-bg-secondary text-text-muted text-xs">Cancelar</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {addingSubCat === cat.id ? (
                      <div className="flex items-center gap-2 pl-10 pr-4 py-2 bg-accent-blue/5 border-t border-dashed border-border">
                        <input autoFocus value={newSubForm.nombre} onChange={e => setNewSubForm(f => ({ ...f, nombre: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddSubcategoria(cat.id)}
                          placeholder="Nombre subcategoría" className="flex-1 bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none" />
                        <select value={newSubForm.tipoAtencion} onChange={e => setNewSubForm(f => ({ ...f, tipoAtencion: e.target.value }))} className="bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary outline-none">
                          {TIPOS_ATENCION.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <button onClick={() => handleAddSubcategoria(cat.id)} className="p-1.5 rounded-lg bg-accent-green/20 text-accent-green"><Check size={13} /></button>
                        <button onClick={() => setAddingSubCat(null)} className="p-1.5 rounded-lg bg-bg-secondary text-text-muted"><X size={13} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingSubCat(cat.id); setNewSubForm({ nombre: '', tipoAtencion: 'Soporte Remoto' }); }}
                        className="w-full flex items-center gap-2 pl-10 pr-4 py-2 text-xs text-accent-blue hover:bg-accent-blue/5 transition-colors border-t border-dashed border-border">
                        <Plus size={12} /> Agregar subcategoría
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Estados por Entidad */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg border text-accent-purple bg-accent-purple/10 border-accent-purple/20"><Layers size={14} /></div>
            <span className="text-sm font-semibold text-text-primary">Estados por Entidad</span>
          </div>
          <button onClick={() => setAddingEstado(true)} className="flex items-center gap-1 text-xs font-semibold text-accent-blue hover:bg-accent-blue/10 px-2 py-1 rounded-lg transition-colors">
            <Plus size={13} /> Estado
          </button>
        </div>

        {addingEstado && (
          <div className="px-4 py-3 bg-accent-blue/5 border-b border-border grid grid-cols-2 gap-2">
            <select value={newEstadoForm.entidad} onChange={e => setNewEstadoForm(f => ({ ...f, entidad: e.target.value }))} className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none">
              {ENTIDADES.map(e => <option key={e}>{e}</option>)}
            </select>
            <input autoFocus value={newEstadoForm.nombre} onChange={e => setNewEstadoForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del estado" className="bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">Color:</label>
              <input type="color" value={newEstadoForm.color} onChange={e => setNewEstadoForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-text-muted">Orden:</label>
              <input type="number" min="1" value={newEstadoForm.orden} onChange={e => setNewEstadoForm(f => ({ ...f, orden: parseInt(e.target.value) }))} className="w-16 bg-bg-secondary border border-border rounded px-2 py-1 text-sm text-text-primary outline-none" />
              <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                <input type="checkbox" checked={newEstadoForm.esFinal} onChange={e => setNewEstadoForm(f => ({ ...f, esFinal: e.target.checked }))} className="rounded" />
                Es final
              </label>
            </div>
            <div className="col-span-2 flex gap-2">
              <button onClick={handleAddEstado} className="px-3 py-1.5 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-semibold">Guardar</button>
              <button onClick={() => setAddingEstado(false)} className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-muted text-xs">Cancelar</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {Object.entries(byEntidad).map(([entidad, estados]) => (
            <div key={entidad}>
              <div className="px-4 py-2 bg-bg-secondary/30">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{entidad}</span>
              </div>
              {estados.sort((a, b) => a.orden - b.orden).map(est => (
                <div key={est.id} className="flex items-center gap-3 pl-8 pr-4 py-2 hover:bg-bg-secondary/50 transition-colors group">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: est.color }} />
                  <span className="flex-1 text-sm text-text-primary">{est.nombre}</span>
                  <span className="text-xs text-text-muted">#{est.orden}</span>
                  {est.esFinal && <span className="text-xs text-text-muted bg-bg-secondary border border-border px-2 py-0.5 rounded-full">Final</span>}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteEstadoCatalogo(est.id)} className="p-1 rounded text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabAverias() {
  const averiasTipos = useStore(s => s.averiasTipos);
  const addAveriaTipo = useStore(s => s.addAveriaTipo);
  const updateAveriaTipo = useStore(s => s.updateAveriaTipo);
  const deleteAveriaTipo = useStore(s => s.deleteAveriaTipo);
  return (
    <SimpleListSection title="Tipos de Avería" icon={AlertTriangle} items={averiasTipos}
      onAdd={addAveriaTipo} onUpdate={updateAveriaTipo} onDelete={deleteAveriaTipo} color="red" />
  );
}

function TabSoporte() {
  const tiposSesionSoporte = useStore(s => s.tiposSesionSoporte);
  const addTipoSesionSoporte = useStore(s => s.addTipoSesionSoporte);
  const updateTipoSesionSoporte = useStore(s => s.updateTipoSesionSoporte);
  const deleteTipoSesionSoporte = useStore(s => s.deleteTipoSesionSoporte);
  return (
    <SimpleListSection title="Tipos de Sesión Soporte Remoto" icon={MonitorSmartphone} items={tiposSesionSoporte}
      onAdd={addTipoSesionSoporte} onUpdate={updateTipoSesionSoporte} onDelete={deleteTipoSesionSoporte} color="purple" />
  );
}

function TabVisitas() {
  const tiposVisita = useStore(s => s.tiposVisita);
  const addTipoVisita = useStore(s => s.addTipoVisita);
  const updateTipoVisita = useStore(s => s.updateTipoVisita);
  const deleteTipoVisita = useStore(s => s.deleteTipoVisita);
  return (
    <SimpleListSection title="Tipos de Visita Técnica" icon={Calendar} items={tiposVisita}
      onAdd={addTipoVisita} onUpdate={updateTipoVisita} onDelete={deleteTipoVisita} color="green" />
  );
}

function TabPlantaExterna() {
  const tiposDerivacion = useStore(s => s.tiposDerivacion);
  const addTipoDerivacion = useStore(s => s.addTipoDerivacion);
  const updateTipoDerivacion = useStore(s => s.updateTipoDerivacion);
  const deleteTipoDerivacion = useStore(s => s.deleteTipoDerivacion);
  return (
    <SimpleListSection title="Tipos de Derivación Planta Externa" icon={Cable} items={tiposDerivacion}
      onAdd={addTipoDerivacion} onUpdate={updateTipoDerivacion} onDelete={deleteTipoDerivacion} color="orange" />
  );
}

function TabEquipos() {
  const tiposEquipo = useStore(s => s.tiposEquipo);
  const addTipoEquipo = useStore(s => s.addTipoEquipo);
  const updateTipoEquipo = useStore(s => s.updateTipoEquipo);
  const deleteTipoEquipo = useStore(s => s.deleteTipoEquipo);
  const marcasEquipo = useStore(s => s.marcasEquipo);
  const addMarcaEquipo = useStore(s => s.addMarcaEquipo);
  const updateMarcaEquipo = useStore(s => s.updateMarcaEquipo);
  const deleteMarcaEquipo = useStore(s => s.deleteMarcaEquipo);
  return (
    <div className="space-y-4">
      <SimpleListSection title="Tipos de Equipo" icon={Cpu} items={tiposEquipo}
        onAdd={addTipoEquipo} onUpdate={updateTipoEquipo} onDelete={deleteTipoEquipo} color="blue" />
      <SimpleListSection title="Marcas de Equipo" icon={Tag} items={marcasEquipo}
        onAdd={addMarcaEquipo} onUpdate={updateMarcaEquipo} onDelete={deleteMarcaEquipo} color="indigo" />
    </div>
  );
}

function TabInstalaciones() {
  const tecnologiasInstalacion = useStore(s => s.tecnologiasInstalacion);
  const addTecnologiaInstalacion = useStore(s => s.addTecnologiaInstalacion);
  const updateTecnologiaInstalacion = useStore(s => s.updateTecnologiaInstalacion);
  const deleteTecnologiaInstalacion = useStore(s => s.deleteTecnologiaInstalacion);
  return (
    <div className="space-y-4">
      <SimpleListSection title="Tecnologías de Instalación" icon={Wifi} items={tecnologiasInstalacion}
        onAdd={addTecnologiaInstalacion} onUpdate={updateTecnologiaInstalacion} onDelete={deleteTecnologiaInstalacion} color="teal" />
      <PlanesInstalacionSection />
    </div>
  );
}

function TabRequerimientos() {
  const tiposRequerimiento = useStore(s => s.tiposRequerimiento);
  const addTipoRequerimiento = useStore(s => s.addTipoRequerimiento);
  const updateTipoRequerimiento = useStore(s => s.updateTipoRequerimiento);
  const deleteTipoRequerimiento = useStore(s => s.deleteTipoRequerimiento);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nombre: '', categoria: 'Operativo' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const CATEGORIAS_REQ = ['Operativo', 'Administrativo', 'Legal', 'Financiero', 'General'];

  const handleAdd = () => {
    if (!form.nombre.trim()) return;
    addTipoRequerimiento(form);
    setForm({ nombre: '', categoria: 'Operativo' });
    setAdding(false);
  };

  const handleUpdate = (id) => {
    if (!editForm.nombre?.trim()) return;
    updateTipoRequerimiento(id, editForm);
    setEditingId(null);
  };

  const byCategoria = tiposRequerimiento.reduce((acc, t) => {
    const cat = t.categoria || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg border text-orange-400 bg-orange-400/10 border-orange-400/20"><FileText size={14} /></div>
          <span className="text-sm font-semibold text-text-primary">Tipos de Requerimiento</span>
          <span className="text-xs text-text-muted bg-bg-secondary border border-border px-2 py-0.5 rounded-full">{tiposRequerimiento.length}</span>
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs font-semibold text-accent-blue hover:bg-accent-blue/10 px-2 py-1 rounded-lg transition-colors">
          <Plus size={13} /> Agregar
        </button>
      </div>

      {adding && (
        <div className="px-4 py-3 bg-accent-blue/5 border-b border-border flex gap-2">
          <input autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Nombre del tipo" className="flex-1 bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none" />
          <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none">
            {CATEGORIAS_REQ.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={handleAdd} className="px-3 py-1.5 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-semibold">Guardar</button>
          <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-muted text-xs">Cancelar</button>
        </div>
      )}

      <div className="divide-y divide-border">
        {Object.entries(byCategoria).map(([cat, items]) => (
          <div key={cat}>
            <div className="px-4 py-2 bg-bg-secondary/30">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{cat}</span>
            </div>
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 pl-8 pr-4 py-2 hover:bg-bg-secondary/50 transition-colors group">
                {editingId === item.id ? (
                  <>
                    <input autoFocus value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                      className="flex-1 bg-bg-secondary border border-accent-blue/30 rounded-lg px-3 py-1 text-sm text-text-primary outline-none" />
                    <select value={editForm.categoria} onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))} className="bg-bg-secondary border border-border rounded-lg px-2 py-1 text-sm text-text-primary outline-none">
                      {CATEGORIAS_REQ.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button onClick={() => handleUpdate(item.id)} className="p-1.5 rounded bg-accent-green/20 text-accent-green"><Check size={13} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded bg-bg-secondary text-text-muted"><X size={13} /></button>
                  </>
                ) : deletingId === item.id ? (
                  <>
                    <span className="flex-1 text-sm text-accent-red">¿Eliminar "{item.nombre}"?</span>
                    <button onClick={() => { deleteTipoRequerimiento(item.id); setDeletingId(null); }} className="text-xs px-2 py-1 rounded bg-accent-red/20 text-accent-red">Eliminar</button>
                    <button onClick={() => setDeletingId(null)} className="text-xs px-2 py-1 rounded bg-bg-secondary text-text-muted">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-text-muted font-mono">{item.id}</span>
                    <span className="flex-1 text-sm text-text-primary">{item.nombre}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(item.id); setEditForm({ nombre: item.nombre, categoria: item.categoria }); }} className="p-1 rounded text-text-muted hover:text-accent-blue hover:bg-accent-blue/10"><Pencil size={12} /></button>
                      <button onClick={() => setDeletingId(item.id)} className="p-1 rounded text-text-muted hover:text-accent-red hover:bg-accent-red/10"><Trash2 size={12} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabTecnicos() {
  const cargosTecnico = useStore(s => s.cargosTecnico);
  const addCargoTecnico = useStore(s => s.addCargoTecnico);
  const updateCargoTecnico = useStore(s => s.updateCargoTecnico);
  const deleteCargoTecnico = useStore(s => s.deleteCargoTecnico);

  const especialidadesTecnico = useStore(s => s.especialidadesTecnico);
  const addEspecialidadTecnico = useStore(s => s.addEspecialidadTecnico);
  const updateEspecialidadTecnico = useStore(s => s.updateEspecialidadTecnico);
  const deleteEspecialidadTecnico = useStore(s => s.deleteEspecialidadTecnico);

  const vehiculosTecnico = useStore(s => s.vehiculosTecnico);
  const addVehiculoTecnico = useStore(s => s.addVehiculoTecnico);
  const updateVehiculoTecnico = useStore(s => s.updateVehiculoTecnico);
  const deleteVehiculoTecnico = useStore(s => s.deleteVehiculoTecnico);

  return (
    <div className="space-y-4">
      <SimpleListSection title="Cargos Operativos" icon={Briefcase} items={cargosTecnico}
        onAdd={addCargoTecnico} onUpdate={updateCargoTecnico} onDelete={deleteCargoTecnico} color="purple" />
      <SimpleListSection title="Especialidades" icon={Tag} items={especialidadesTecnico}
        onAdd={addEspecialidadTecnico} onUpdate={updateEspecialidadTecnico} onDelete={deleteEspecialidadTecnico} color="teal" />
      <SimpleListSection title="Tipos de Vehículo" icon={Box} items={vehiculosTecnico}
        onAdd={addVehiculoTecnico} onUpdate={updateVehiculoTecnico} onDelete={deleteVehiculoTecnico} color="orange" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'tickets', label: 'Tickets', icon: Ticket, desc: 'Categorías, subcategorías, SLA y estados' },
  { id: 'averias', label: 'Averías', icon: AlertTriangle, desc: 'Tipos de avería' },
  { id: 'soporte', label: 'Soporte Remoto', icon: MonitorSmartphone, desc: 'Tipos de sesión' },
  { id: 'visitas', label: 'Visitas Técnicas', icon: Calendar, desc: 'Tipos de visita' },
  { id: 'planta', label: 'Planta Externa', icon: Cable, desc: 'Tipos de derivación' },
  { id: 'equipos', label: 'Equipos', icon: Box, desc: 'Tipos y marcas de equipo' },
  { id: 'tecnicos', label: 'Técnicos', icon: Briefcase, desc: 'Cargos, especialidades y vehículos' },
  { id: 'instalaciones', label: 'Instalaciones', icon: HardHat, desc: 'Planes y tecnologías' },
  { id: 'requerimientos', label: 'Requerimientos', icon: FileText, desc: 'Tipos de requerimiento' },
];

const TAB_COMPONENTS = {
  tickets: TabTickets,
  averias: TabAverias,
  soporte: TabSoporte,
  visitas: TabVisitas,
  planta: TabPlantaExterna,
  equipos: TabEquipos,
  tecnicos: TabTecnicos,
  instalaciones: TabInstalaciones,
  requerimientos: TabRequerimientos,
};

export default function MantenimientoPage() {
  const [activeTab, setActiveTab] = useState('tickets');
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="h-full overflow-y-auto w-full animate-fade p-4 lg:p-6">
      <div className="flex flex-col gap-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
            <Settings2 size={20} className="text-accent-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Mantenimiento de Catálogos</h1>
            <p className="text-sm text-text-muted">Administra los valores configurables de todos los módulos del sistema.</p>
          </div>
        </div>

        {/* Tab nav (horizontal scroll en mobile) */}
        <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border
                ${isActive
                    ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 shadow-sm'
                    : 'bg-bg-card text-text-secondary border-border hover:bg-bg-secondary hover:text-text-primary'
                  }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Descripción del tab activo */}
        {(() => {
          const tab = TABS.find(t => t.id === activeTab);
          return tab ? (
            <p className="text-xs text-text-muted -mt-3 pl-1">{tab.desc}</p>
          ) : null;
        })()}

        {/* Contenido del tab */}
        <ActiveComponent />
      </div>
    </div>
  );
}
