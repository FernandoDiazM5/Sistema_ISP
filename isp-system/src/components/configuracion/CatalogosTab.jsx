import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Check, X, Tag, ListTree, Clock, Activity, Zap, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import useStore from '../../store/useStore';
import useToast from '../../hooks/useToast';

// ===================== HELPERS =====================
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function InlineInput({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted ${className}`}
    />
  );
}

function SectionHeader({ icon: Icon, title, count, color, onAdd }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-[11px] text-text-muted">{count} {count === 1 ? 'elemento' : 'elementos'}</p>
        </div>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold hover:bg-accent-blue/20 transition-colors cursor-pointer border-none"
      >
        <Plus size={13} /> Agregar
      </button>
    </div>
  );
}

function ActionButtons({ onEdit, onDelete, isDeleting, onConfirmDelete, onCancelDelete }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {isDeleting ? (
        <>
          <span className="text-[10px] text-accent-red mr-1">¿Eliminar?</span>
          <button onClick={onConfirmDelete} className="p-1 rounded-md bg-accent-red/20 text-accent-red hover:bg-accent-red/30 cursor-pointer border-none transition-colors" title="Confirmar">
            <Check size={12} />
          </button>
          <button onClick={onCancelDelete} className="p-1 rounded-md bg-bg-card text-text-muted hover:bg-bg-card-hover cursor-pointer border-none transition-colors" title="Cancelar">
            <X size={12} />
          </button>
        </>
      ) : (
        <>
          <button onClick={onEdit} className="p-1.5 rounded-md text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 cursor-pointer border-none bg-transparent transition-colors" title="Editar">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md text-text-muted hover:text-accent-red hover:bg-accent-red/10 cursor-pointer border-none bg-transparent transition-colors" title="Eliminar">
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

// ===================== TIPOS DE AVERÍAS =====================
function AveriaTiposSection() {
  const averiasTipos = useStore(s => s.averiasTipos);
  const addAveriaTipo = useStore(s => s.addAveriaTipo);
  const updateAveriaTipo = useStore(s => s.updateAveriaTipo);
  const deleteAveriaTipo = useStore(s => s.deleteAveriaTipo);
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleAdd = () => {
    if (!newNombre.trim()) return;
    addAveriaTipo(newNombre.trim());
    setNewNombre('');
    setAdding(false);
    toast.success('Tipo de avería agregado');
  };

  const handleUpdate = () => {
    if (!editNombre.trim()) return;
    updateAveriaTipo(editingId, editNombre.trim());
    setEditingId(null);
    toast.success('Tipo de avería actualizado');
  };

  const handleDelete = (id) => {
    deleteAveriaTipo(id);
    setDeletingId(null);
    toast.success('Tipo de avería eliminado');
  };

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-border">
      <SectionHeader
        icon={Zap}
        title="Tipos de Averías"
        count={averiasTipos.length}
        color="bg-accent-red/10 text-accent-red"
        onAdd={() => { setAdding(true); setEditingId(null); }}
      />

      <div className="flex flex-col gap-1.5">
        {averiasTipos.map(tipo => (
          <div key={tipo.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-secondary border border-border hover:border-border/80 transition-colors">
            <span className="font-mono text-[10px] text-text-muted w-16 shrink-0">{tipo.id}</span>
            {editingId === tipo.id ? (
              <>
                <InlineInput value={editNombre} onChange={setEditNombre} placeholder="Nombre del tipo" className="flex-1" />
                <button onClick={handleUpdate} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
              </>
            ) : (
              <>
                <span className="text-sm font-medium flex-1">{tipo.nombre}</span>
                <ActionButtons
                  onEdit={() => { setEditingId(tipo.id); setEditNombre(tipo.nombre); setAdding(false); }}
                  onDelete={() => setDeletingId(tipo.id)}
                  isDeleting={deletingId === tipo.id}
                  onConfirmDelete={() => handleDelete(tipo.id)}
                  onCancelDelete={() => setDeletingId(null)}
                />
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent-blue/5 border border-accent-blue/30">
            <span className="font-mono text-[10px] text-text-muted w-16 shrink-0">AUTO</span>
            <InlineInput value={newNombre} onChange={setNewNombre} placeholder="Ej: Falla de planta..." className="flex-1" />
            <button onClick={handleAdd} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
            <button onClick={() => { setAdding(false); setNewNombre(''); }} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== CATEGORÍAS DE TICKETS =====================
function CategoriasSection() {
  const categorias = useStore(s => s.categorias);
  const subcategorias = useStore(s => s.subcategorias);
  const addCategoria = useStore(s => s.addCategoria);
  const updateCategoria = useStore(s => s.updateCategoria);
  const deleteCategoria = useStore(s => s.deleteCategoria);
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', descripcion: '' });
  const [deletingId, setDeletingId] = useState(null);

  const subCountByCat = useMemo(() => {
    const map = {};
    subcategorias.forEach(s => { map[s.categoriaId] = (map[s.categoriaId] || 0) + 1; });
    return map;
  }, [subcategorias]);

  const handleAdd = () => {
    if (!form.nombre.trim()) return;
    addCategoria({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() });
    setForm({ nombre: '', descripcion: '' });
    setAdding(false);
    toast.success('Categoría agregada');
  };

  const handleUpdate = () => {
    if (!editForm.nombre.trim()) return;
    updateCategoria(editingId, { nombre: editForm.nombre.trim(), descripcion: editForm.descripcion.trim() });
    setEditingId(null);
    toast.success('Categoría actualizada');
  };

  const handleDelete = (id) => {
    const subsCount = subCountByCat[id] || 0;
    deleteCategoria(id);
    setDeletingId(null);
    toast.success(`Categoría eliminada${subsCount > 0 ? ` (y ${subsCount} subcategoría${subsCount > 1 ? 's' : ''} en cascada)` : ''}`);
  };

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-border">
      <SectionHeader
        icon={Tag}
        title="Categorías de Tickets"
        count={categorias.length}
        color="bg-accent-blue/10 text-accent-blue"
        onAdd={() => { setAdding(true); setEditingId(null); }}
      />

      <div className="flex flex-col gap-1.5">
        {categorias.map(cat => (
          <div key={cat.id} className="rounded-lg bg-bg-secondary border border-border overflow-hidden">
            {editingId === cat.id ? (
              <div className="flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-text-muted w-16 shrink-0">{cat.id}</span>
                  <InlineInput value={editForm.nombre} onChange={v => setEditForm(p => ({ ...p, nombre: v }))} placeholder="Nombre de la categoría" className="flex-1" />
                  <button onClick={handleUpdate} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
                </div>
                <InlineInput value={editForm.descripcion} onChange={v => setEditForm(p => ({ ...p, descripcion: v }))} placeholder="Descripción (opcional)" className="ml-[72px]" />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <span className="font-mono text-[10px] text-text-muted w-16 shrink-0">{cat.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{cat.nombre}</p>
                  {cat.descripcion && <p className="text-[11px] text-text-muted truncate">{cat.descripcion}</p>}
                </div>
                {subCountByCat[cat.id] > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card border border-border text-text-muted shrink-0">
                    {subCountByCat[cat.id]} sub
                  </span>
                )}
                <ActionButtons
                  onEdit={() => { setEditingId(cat.id); setEditForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' }); setAdding(false); }}
                  onDelete={() => setDeletingId(cat.id)}
                  isDeleting={deletingId === cat.id}
                  onConfirmDelete={() => handleDelete(cat.id)}
                  onCancelDelete={() => setDeletingId(null)}
                />
              </div>
            )}
            {deletingId === cat.id && subCountByCat[cat.id] > 0 && (
              <div className="flex items-center gap-2 px-3 pb-2 text-[10px] text-accent-yellow">
                <AlertTriangle size={11} />
                Se eliminarán también {subCountByCat[cat.id]} subcategoría(s) y sus SLA asociados.
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex flex-col gap-2 px-3 py-3 rounded-lg bg-accent-blue/5 border border-accent-blue/30">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-text-muted w-16 shrink-0">AUTO</span>
              <InlineInput value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Nombre de la categoría *" className="flex-1" />
              <button onClick={handleAdd} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
              <button onClick={() => { setAdding(false); setForm({ nombre: '', descripcion: '' }); }} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
            </div>
            <InlineInput value={form.descripcion} onChange={v => setForm(p => ({ ...p, descripcion: v }))} placeholder="Descripción (opcional)" className="ml-[72px]" />
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== SUBCATEGORÍAS =====================
function SubcategoriasSection() {
  const categorias = useStore(s => s.categorias);
  const subcategorias = useStore(s => s.subcategorias);
  const addSubcategoria = useStore(s => s.addSubcategoria);
  const updateSubcategoria = useStore(s => s.updateSubcategoria);
  const deleteSubcategoria = useStore(s => s.deleteSubcategoria);
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ categoriaId: '', nombre: '', tipoAtencion: 'Soporte Remoto' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ categoriaId: '', nombre: '', tipoAtencion: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [expandedCat, setExpandedCat] = useState(null);

  const groupedByCat = useMemo(() => {
    const map = {};
    categorias.forEach(cat => { map[cat.id] = []; });
    subcategorias.forEach(sub => {
      if (!map[sub.categoriaId]) map[sub.categoriaId] = [];
      map[sub.categoriaId].push(sub);
    });
    return map;
  }, [categorias, subcategorias]);

  const TIPOS_ATENCION = ['Soporte Remoto', 'Visita Técnica'];

  const handleAdd = () => {
    if (!form.categoriaId || !form.nombre.trim()) return;
    addSubcategoria({ categoriaId: form.categoriaId, nombre: form.nombre.trim(), tipoAtencion: form.tipoAtencion });
    setForm({ categoriaId: '', nombre: '', tipoAtencion: 'Soporte Remoto' });
    setAdding(false);
    toast.success('Subcategoría agregada');
  };

  const handleUpdate = () => {
    if (!editForm.nombre.trim()) return;
    updateSubcategoria(editingId, { nombre: editForm.nombre.trim(), categoriaId: editForm.categoriaId, tipoAtencion: editForm.tipoAtencion });
    setEditingId(null);
    toast.success('Subcategoría actualizada');
  };

  const handleDelete = (id) => {
    deleteSubcategoria(id);
    setDeletingId(null);
    toast.success('Subcategoría eliminada (SLA asociado también eliminado)');
  };

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-border">
      <SectionHeader
        icon={ListTree}
        title="Subcategorías de Tickets"
        count={subcategorias.length}
        color="bg-accent-purple/10 text-accent-purple"
        onAdd={() => { setAdding(true); setEditingId(null); }}
      />

      {/* Grouped by category */}
      <div className="flex flex-col gap-2">
        {categorias.map(cat => {
          const subs = groupedByCat[cat.id] || [];
          const isOpen = expandedCat === cat.id;
          return (
            <div key={cat.id} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedCat(isOpen ? null : cat.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-bg-secondary hover:bg-bg-card-hover transition-colors cursor-pointer border-none text-left"
              >
                {isOpen ? <ChevronDown size={14} className="text-text-muted shrink-0" /> : <ChevronRight size={14} className="text-text-muted shrink-0" />}
                <span className="font-mono text-[10px] text-text-muted w-14 shrink-0">{cat.id}</span>
                <span className="text-sm font-semibold flex-1">{cat.nombre}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card border border-border text-text-muted shrink-0">
                  {subs.length} sub{subs.length !== 1 ? 's' : ''}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border">
                  {subs.map(sub => (
                    <div key={sub.id} className="border-b border-border/50 last:border-0">
                      {editingId === sub.id ? (
                        <div className="flex flex-col gap-2 p-3 bg-accent-blue/3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-text-muted w-16 shrink-0 ml-6">{sub.id}</span>
                            <InlineInput value={editForm.nombre} onChange={v => setEditForm(p => ({ ...p, nombre: v }))} placeholder="Nombre de subcategoría" className="flex-1" />
                          </div>
                          <div className="flex items-center gap-2 ml-[88px]">
                            <select
                              value={editForm.categoriaId}
                              onChange={e => setEditForm(p => ({ ...p, categoriaId: e.target.value }))}
                              className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                            >
                              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                            <select
                              value={editForm.tipoAtencion}
                              onChange={e => setEditForm(p => ({ ...p, tipoAtencion: e.target.value }))}
                              className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                            >
                              {TIPOS_ATENCION.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button onClick={handleUpdate} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-3 py-2 pl-9 hover:bg-bg-secondary/50 transition-colors">
                          <span className="font-mono text-[10px] text-text-muted w-16 shrink-0">{sub.id}</span>
                          <span className="text-sm flex-1">{sub.nombre}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${sub.tipoAtencion === 'Visita Técnica' ? 'bg-accent-purple/10 text-accent-purple' : 'bg-accent-blue/10 text-accent-blue'}`}>
                            {sub.tipoAtencion}
                          </span>
                          <ActionButtons
                            onEdit={() => { setEditingId(sub.id); setEditForm({ categoriaId: sub.categoriaId, nombre: sub.nombre, tipoAtencion: sub.tipoAtencion }); setAdding(false); }}
                            onDelete={() => setDeletingId(sub.id)}
                            isDeleting={deletingId === sub.id}
                            onConfirmDelete={() => handleDelete(sub.id)}
                            onCancelDelete={() => setDeletingId(null)}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add form when category is selected */}
                  {adding && form.categoriaId === cat.id && (
                    <div className="flex flex-col gap-2 p-3 border-t border-accent-blue/20 bg-accent-blue/5">
                      <div className="flex items-center gap-2 ml-6">
                        <span className="font-mono text-[10px] text-text-muted w-16 shrink-0">AUTO</span>
                        <InlineInput value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Nombre de subcategoría *" className="flex-1" />
                        <select
                          value={form.tipoAtencion}
                          onChange={e => setForm(p => ({ ...p, tipoAtencion: e.target.value }))}
                          className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                        >
                          {TIPOS_ATENCION.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={handleAdd} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
                        <button onClick={() => { setAdding(false); setForm({ categoriaId: '', nombre: '', tipoAtencion: 'Soporte Remoto' }); }} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
                      </div>
                    </div>
                  )}

                  {subs.length === 0 && (!adding || form.categoriaId !== cat.id) && (
                    <p className="text-[11px] text-text-muted text-center py-3 pl-9">Sin subcategorías. Usa "Agregar" y selecciona esta categoría.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global add form (shown when no category pre-selected) */}
      {adding && !form.categoriaId && (
        <div className="mt-3 flex flex-col gap-2 px-3 py-3 rounded-xl bg-accent-blue/5 border border-accent-blue/30">
          <p className="text-[11px] font-semibold text-accent-blue mb-1">Nueva Subcategoría</p>
          <div className="flex items-center gap-2">
            <select
              value={form.categoriaId}
              onChange={e => setForm(p => ({ ...p, categoriaId: e.target.value }))}
              className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue cursor-pointer flex-1"
            >
              <option value="">Seleccionar categoría *</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button onClick={() => { setAdding(false); setForm({ categoriaId: '', nombre: '', tipoAtencion: 'Soporte Remoto' }); }} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
          </div>
          {form.categoriaId && (
            <div className="flex items-center gap-2">
              <InlineInput value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Nombre de subcategoría *" className="flex-1" />
              <select
                value={form.tipoAtencion}
                onChange={e => setForm(p => ({ ...p, tipoAtencion: e.target.value }))}
                className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue cursor-pointer"
              >
                {TIPOS_ATENCION.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={handleAdd} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== PRIORIDADES SLA =====================
function PrioridadesSLASection() {
  const subcategorias = useStore(s => s.subcategorias);
  const categorias = useStore(s => s.categorias);
  const prioridadesSLA = useStore(s => s.prioridadesSLA);
  const addPrioridadSLA = useStore(s => s.addPrioridadSLA);
  const updatePrioridadSLA = useStore(s => s.updatePrioridadSLA);
  const deletePrioridadSLA = useStore(s => s.deletePrioridadSLA);
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ subcategoriaId: '', prioridad: 'Media', tiempoLimite: '24 horas', impacto: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const PRIORIDADES = ['Crítica', 'Alta', 'Media', 'Baja'];
  const PRIORIDAD_COLORS = {
    'Crítica': 'text-accent-red bg-accent-red/10',
    'Alta': 'text-orange-400 bg-orange-400/10',
    'Media': 'text-accent-yellow bg-accent-yellow/10',
    'Baja': 'text-accent-blue bg-accent-blue/10',
  };

  // Subcategorias sin SLA asignado
  const subcatSinSLA = useMemo(() => {
    const conSLA = new Set(prioridadesSLA.map(p => p.subcategoriaId));
    return subcategorias.filter(s => !conSLA.has(s.id));
  }, [subcategorias, prioridadesSLA]);

  const subNombre = (id) => subcategorias.find(s => s.id === id)?.nombre || id;
  const catNombreForSub = (subId) => {
    const sub = subcategorias.find(s => s.id === subId);
    return sub ? (categorias.find(c => c.id === sub.categoriaId)?.nombre || '') : '';
  };

  const handleAdd = () => {
    if (!form.subcategoriaId || !form.prioridad || !form.tiempoLimite.trim() || !form.impacto.trim()) return;
    addPrioridadSLA({ subcategoriaId: form.subcategoriaId, prioridad: form.prioridad, tiempoLimite: form.tiempoLimite.trim(), impacto: form.impacto.trim() });
    setForm({ subcategoriaId: '', prioridad: 'Media', tiempoLimite: '24 horas', impacto: '' });
    setAdding(false);
    toast.success('Prioridad SLA agregada');
  };

  const handleUpdate = () => {
    updatePrioridadSLA(editingId, editForm);
    setEditingId(null);
    toast.success('Prioridad SLA actualizada');
  };

  const handleDelete = (id) => {
    deletePrioridadSLA(id);
    setDeletingId(null);
    toast.success('Prioridad SLA eliminada');
  };

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-border">
      <SectionHeader
        icon={Clock}
        title="Prioridades SLA"
        count={prioridadesSLA.length}
        color="bg-accent-yellow/10 text-accent-yellow"
        onAdd={() => { setAdding(true); setEditingId(null); }}
      />

      {subcatSinSLA.length > 0 && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-accent-yellow/5 border border-accent-yellow/20 text-[11px] text-accent-yellow">
          <AlertTriangle size={13} />
          {subcatSinSLA.length} subcategoría(s) sin SLA: {subcatSinSLA.map(s => s.nombre).join(', ')}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {prioridadesSLA.map(pri => (
          <div key={pri.id} className="rounded-lg bg-bg-secondary border border-border overflow-hidden">
            {editingId === pri.id ? (
              <div className="flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-text-muted w-14 shrink-0">{pri.id}</span>
                  <select
                    value={editForm.subcategoriaId}
                    onChange={e => setEditForm(p => ({ ...p, subcategoriaId: e.target.value }))}
                    className="flex-1 py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                  >
                    {subcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                  <select
                    value={editForm.prioridad}
                    onChange={e => setEditForm(p => ({ ...p, prioridad: e.target.value }))}
                    className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                  >
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 ml-[60px]">
                  <InlineInput value={editForm.tiempoLimite} onChange={v => setEditForm(p => ({ ...p, tiempoLimite: v }))} placeholder="Ej: 4 horas" className="w-28" />
                  <InlineInput value={editForm.impacto} onChange={v => setEditForm(p => ({ ...p, impacto: v }))} placeholder="Descripción del impacto..." className="flex-1" />
                  <button onClick={handleUpdate} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <span className="font-mono text-[10px] text-text-muted w-14 shrink-0">{pri.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{subNombre(pri.subcategoriaId)}</p>
                  <p className="text-[10px] text-text-muted">{catNombreForSub(pri.subcategoriaId)} · {pri.impacto}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${PRIORIDAD_COLORS[pri.prioridad] || 'text-text-muted bg-bg-card'}`}>
                  {pri.prioridad}
                </span>
                <span className="text-[10px] text-text-muted shrink-0 font-mono">{pri.tiempoLimite}</span>
                <ActionButtons
                  onEdit={() => { setEditingId(pri.id); setEditForm({ subcategoriaId: pri.subcategoriaId, prioridad: pri.prioridad, tiempoLimite: pri.tiempoLimite, impacto: pri.impacto }); setAdding(false); }}
                  onDelete={() => setDeletingId(pri.id)}
                  isDeleting={deletingId === pri.id}
                  onConfirmDelete={() => handleDelete(pri.id)}
                  onCancelDelete={() => setDeletingId(null)}
                />
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex flex-col gap-2 px-3 py-3 rounded-xl bg-accent-yellow/5 border border-accent-yellow/30 mt-1">
            <p className="text-[11px] font-semibold text-accent-yellow mb-1">Nueva Prioridad SLA</p>
            <div className="flex items-center gap-2">
              <select
                value={form.subcategoriaId}
                onChange={e => setForm(p => ({ ...p, subcategoriaId: e.target.value }))}
                className="flex-1 py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue cursor-pointer"
              >
                <option value="">Subcategoría *</option>
                {subcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <select
                value={form.prioridad}
                onChange={e => setForm(p => ({ ...p, prioridad: e.target.value }))}
                className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue cursor-pointer"
              >
                {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <InlineInput value={form.tiempoLimite} onChange={v => setForm(p => ({ ...p, tiempoLimite: v }))} placeholder="Tiempo límite (ej: 4 horas) *" className="w-48" />
              <InlineInput value={form.impacto} onChange={v => setForm(p => ({ ...p, impacto: v }))} placeholder="Descripción del impacto *" className="flex-1" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-bold cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={12} /> Guardar</button>
              <button onClick={() => { setAdding(false); setForm({ subcategoriaId: '', prioridad: 'Media', tiempoLimite: '24 horas', impacto: '' }); }} className="px-3 py-1.5 rounded-lg bg-bg-card border border-border text-text-muted text-xs cursor-pointer hover:bg-bg-card-hover transition-colors">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== ESTADOS DEL CATÁLOGO =====================
function EstadosCatalogoSection() {
  const estadosCatalogo = useStore(s => s.estadosCatalogo);
  const addEstadoCatalogo = useStore(s => s.addEstadoCatalogo);
  const updateEstadoCatalogo = useStore(s => s.updateEstadoCatalogo);
  const deleteEstadoCatalogo = useStore(s => s.deleteEstadoCatalogo);
  const toast = useToast();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ entidad: 'Ticket', nombre: '', color: '#3b82f6', orden: 1, esFinal: false });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const ENTIDADES = ['Ticket', 'Cliente', 'Visita', 'Solicitud', 'Avería', 'Instalación'];

  const groupedByEntidad = useMemo(() => {
    const map = {};
    estadosCatalogo.forEach(e => {
      if (!map[e.entidad]) map[e.entidad] = [];
      map[e.entidad].push(e);
    });
    // Sort each group by orden
    Object.values(map).forEach(arr => arr.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
    return map;
  }, [estadosCatalogo]);

  const handleAdd = () => {
    if (!form.nombre.trim()) return;
    addEstadoCatalogo({ entidad: form.entidad, nombre: form.nombre.trim(), color: form.color, orden: Number(form.orden), esFinal: form.esFinal });
    setForm({ entidad: 'Ticket', nombre: '', color: '#3b82f6', orden: 1, esFinal: false });
    setAdding(false);
    toast.success('Estado del catálogo agregado');
  };

  const handleUpdate = () => {
    if (!editForm.nombre?.trim()) return;
    updateEstadoCatalogo(editingId, { ...editForm, orden: Number(editForm.orden) });
    setEditingId(null);
    toast.success('Estado actualizado');
  };

  const handleDelete = (id) => {
    deleteEstadoCatalogo(id);
    setDeletingId(null);
    toast.success('Estado eliminado');
  };

  return (
    <div className="bg-bg-card rounded-2xl p-6 border border-border">
      <SectionHeader
        icon={Activity}
        title="Estados del Catálogo"
        count={estadosCatalogo.length}
        color="bg-accent-green/10 text-accent-green"
        onAdd={() => { setAdding(true); setEditingId(null); }}
      />

      <div className="flex flex-col gap-3">
        {Object.entries(groupedByEntidad).map(([entidad, estados]) => (
          <div key={entidad}>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{entidad}</p>
            <div className="flex flex-col gap-1">
              {estados.map(est => (
                <div key={est.id} className="rounded-lg bg-bg-secondary border border-border overflow-hidden">
                  {editingId === est.id ? (
                    <div className="flex flex-wrap items-center gap-2 p-3">
                      <span className="font-mono text-[10px] text-text-muted w-14 shrink-0">{est.id}</span>
                      <InlineInput value={editForm.nombre} onChange={v => setEditForm(p => ({ ...p, nombre: v }))} placeholder="Nombre del estado" className="flex-1 min-w-[120px]" />
                      <select
                        value={editForm.entidad}
                        onChange={e => setEditForm(p => ({ ...p, entidad: e.target.value }))}
                        className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue cursor-pointer"
                      >
                        {ENTIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={editForm.color} onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" title="Color" />
                        <input type="number" value={editForm.orden} onChange={e => setEditForm(p => ({ ...p, orden: e.target.value }))} className="w-14 py-1.5 px-2 bg-bg-card border border-border rounded-lg text-xs text-text-primary outline-none focus:border-accent-blue" placeholder="Orden" min="1" />
                        <label className="flex items-center gap-1 text-[11px] text-text-secondary cursor-pointer">
                          <input type="checkbox" checked={!!editForm.esFinal} onChange={e => setEditForm(p => ({ ...p, esFinal: e.target.checked }))} className="w-3.5 h-3.5 cursor-pointer" />
                          Final
                        </label>
                      </div>
                      <button onClick={handleUpdate} className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={13} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md bg-bg-card text-text-muted cursor-pointer border-none hover:bg-bg-card-hover transition-colors"><X size={13} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2">
                      <span className="font-mono text-[10px] text-text-muted w-14 shrink-0">{est.id}</span>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: est.color }} />
                      <span className="text-sm font-medium flex-1">{est.nombre}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-text-muted font-mono">#{est.orden}</span>
                        {est.esFinal && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-card border border-border text-text-muted">Final</span>}
                      </div>
                      <ActionButtons
                        onEdit={() => { setEditingId(est.id); setEditForm({ entidad: est.entidad, nombre: est.nombre, color: est.color, orden: est.orden, esFinal: est.esFinal }); setAdding(false); }}
                        onDelete={() => setDeletingId(est.id)}
                        isDeleting={deletingId === est.id}
                        onConfirmDelete={() => handleDelete(est.id)}
                        onCancelDelete={() => setDeletingId(null)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {adding && (
          <div className="flex flex-col gap-2 px-3 py-3 rounded-xl bg-accent-green/5 border border-accent-green/30 mt-1">
            <p className="text-[11px] font-semibold text-accent-green mb-1">Nuevo Estado</p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={form.entidad}
                onChange={e => setForm(p => ({ ...p, entidad: e.target.value }))}
                className="py-1.5 px-2.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue cursor-pointer"
              >
                {ENTIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <InlineInput value={form.nombre} onChange={v => setForm(p => ({ ...p, nombre: v }))} placeholder="Nombre del estado *" className="flex-1 min-w-[150px]" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" title="Color" />
                <span className="text-[11px] text-text-muted">Color</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input type="number" value={form.orden} onChange={e => setForm(p => ({ ...p, orden: e.target.value }))} className="w-16 py-1.5 px-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue" placeholder="Orden" min="1" />
                <span className="text-[11px] text-text-muted">Orden</span>
              </div>
              <label className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" checked={form.esFinal} onChange={e => setForm(p => ({ ...p, esFinal: e.target.checked }))} className="w-4 h-4 cursor-pointer" />
                Es estado final
              </label>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue/20 text-accent-blue text-xs font-bold cursor-pointer border-none hover:bg-accent-blue/30 transition-colors"><Check size={12} /> Guardar</button>
              <button onClick={() => { setAdding(false); setForm({ entidad: 'Ticket', nombre: '', color: '#3b82f6', orden: 1, esFinal: false }); }} className="px-3 py-1.5 rounded-lg bg-bg-card border border-border text-text-muted text-xs cursor-pointer hover:bg-bg-card-hover transition-colors">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== MAIN TAB =====================
export default function CatalogosTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/20 text-[12px] text-text-secondary">
        Gestiona los catálogos del sistema. Los cambios se guardan automáticamente en IndexedDB y se sincronizan a Firebase cuando hay conexión activa.
        Las eliminaciones en <strong>Categorías</strong> y <strong>Subcategorías</strong> son en cascada (elimina subcategorías y SLA asociados).
      </div>
      <AveriaTiposSection />
      <CategoriasSection />
      <SubcategoriasSection />
      <PrioridadesSLASection />
      <EstadosCatalogoSection />
    </div>
  );
}
