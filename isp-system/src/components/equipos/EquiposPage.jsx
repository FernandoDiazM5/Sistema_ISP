import { useState, useMemo } from 'react';
import { Box, Plus, Search, Monitor, Wifi, Router, Server, Wrench, Package, ChevronDown, X, Edit2, Save } from 'lucide-react';
import useStore from '../../store/useStore';
import KPICard from '../common/KPICard';

const TIPOS_EQUIPO = ['ONU', 'Router', 'Antena CPE', 'Antena AP', 'Switch', 'OLT', 'Media Converter'];
const MARCAS = ['Huawei', 'VSOL', 'Mikrotik', 'Ubiquiti', 'TP-Link', 'Tenda', 'ZTE', 'Nokia'];
const ESTADOS_EQUIPO = ['Disponible', 'En uso', 'En reparación', 'Dado de baja'];

const tipoIconMap = {
  'ONU': Monitor,
  'Router': Router,
  'Antena CPE': Wifi,
  'Antena AP': Wifi,
  'Switch': Server,
  'OLT': Server,
  'Media Converter': Box,
};

const estadoColors = {
  'Disponible': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'En uso': { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  'En reparación': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  'Dado de baja': { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

export default function EquiposPage() {
  const equipos = useStore(s => s.equipos);
  const addEquipo = useStore(s => s.addEquipo);
  const updateEquipo = useStore(s => s.updateEquipo);
  const clients = useStore(s => s.clients);

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ tipo: '', marca: '', modelo: '', serial: '', estado: 'Disponible', clienteId: '', clienteNombre: '', ubicacion: '' });

  const stats = useMemo(() => {
    const total = equipos.length;
    const enUso = equipos.filter(e => e.estado === 'En uso').length;
    const disponibles = equipos.filter(e => e.estado === 'Disponible').length;
    const enReparacion = equipos.filter(e => e.estado === 'En reparación').length;
    return { total, enUso, disponibles, enReparacion };
  }, [equipos]);

  const filtered = useMemo(() => {
    return equipos.filter(e => {
      const matchSearch = !search ||
        e.serial.toLowerCase().includes(search.toLowerCase()) ||
        e.modelo.toLowerCase().includes(search.toLowerCase()) ||
        e.marca.toLowerCase().includes(search.toLowerCase()) ||
        (e.clienteNombre || '').toLowerCase().includes(search.toLowerCase());
      const matchTipo = !filterTipo || e.tipo === filterTipo;
      const matchEstado = !filterEstado || e.estado === filterEstado;
      return matchSearch && matchTipo && matchEstado;
    });
  }, [equipos, search, filterTipo, filterEstado]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ tipo: 'ONU', marca: 'Huawei', modelo: '', serial: '', estado: 'Disponible', clienteId: '', clienteNombre: '', ubicacion: 'Almacén' });
    setShowModal(true);
  };

  const openEdit = (eq) => {
    setEditingId(eq.id);
    setForm({ tipo: eq.tipo, marca: eq.marca, modelo: eq.modelo, serial: eq.serial, estado: eq.estado, clienteId: eq.clienteId || '', clienteNombre: eq.clienteNombre || '', ubicacion: eq.ubicacion || '' });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.tipo || !form.serial) return;
    if (editingId) {
      updateEquipo(editingId, { ...form, fechaAsignacion: form.estado === 'En uso' ? new Date().toISOString().split('T')[0] : null });
    } else {
      addEquipo({ ...form, fechaAsignacion: form.estado === 'En uso' ? new Date().toISOString().split('T')[0] : null });
    }
    setShowModal(false);
  };

  const handleClientSelect = (e) => {
    const id = e.target.value;
    if (id) {
      const client = clients.find(c => c.id === id);
      setForm(f => ({ ...f, clienteId: id, clienteNombre: client?.nombre || '' }));
    } else {
      setForm(f => ({ ...f, clienteId: '', clienteNombre: '' }));
    }
  };

  return (
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Inventario de Equipos</h1>
          <p className="text-text-secondary text-sm mt-1">Gestión de ONTs, CPEs, routers y equipos de red</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 py-2.5 px-4 bg-accent-blue text-white rounded-xl font-semibold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity">
          <Plus size={16} /> Registrar Equipo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="animate-fade stagger-1">
          <KPICard title="Total Equipos" value={stats.total} subtitle="Inventario completo" icon={<Box size={20} />} color="#3b82f6" />
        </div>
        <div className="animate-fade stagger-2">
          <KPICard title="En Uso" value={stats.enUso} subtitle="Asignados a clientes" icon={<Monitor size={20} />} color="#10b981" />
        </div>
        <div className="animate-fade stagger-3">
          <KPICard title="Disponibles" value={stats.disponibles} subtitle="En almacén" icon={<Package size={20} />} color="#8b5cf6" />
        </div>
        <div className="animate-fade stagger-4">
          <KPICard title="En Reparación" value={stats.enReparacion} subtitle="Taller técnico" icon={<Wrench size={20} />} color="#f59e0b" />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full py-2.5 pl-9 pr-4 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-blue/50"
            placeholder="Buscar por serial, modelo, marca o cliente..." />
        </div>
        <div className="relative">
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
            className="appearance-none py-2.5 pl-3 pr-8 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary cursor-pointer focus:outline-none">
            <option value="">Todos los tipos</option>
            {TIPOS_EQUIPO.map(t => <option key={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
            className="appearance-none py-2.5 pl-3 pr-8 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary cursor-pointer focus:outline-none">
            <option value="">Todos los estados</option>
            {ESTADOS_EQUIPO.map(e => <option key={e}>{e}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Tabla de equipos */}
      <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-text-muted uppercase border-b border-border">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Marca / Modelo</th>
              <th className="py-3 px-4">Serial</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Asignado a</th>
              <th className="py-3 px-4">Ubicación</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(eq => {
              const TipoIcon = tipoIconMap[eq.tipo] || Box;
              const eColor = estadoColors[eq.estado] || estadoColors['Disponible'];
              return (
                <tr key={eq.id} className="border-t border-border hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-mono text-text-muted text-[11px]">{eq.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <TipoIcon size={14} className="text-accent-blue" />
                      <span className="font-medium">{eq.tipo}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">{eq.marca}</span>
                    <span className="text-text-muted ml-1.5">{eq.modelo}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{eq.serial}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${eColor.bg} ${eColor.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${eColor.dot}`} />
                      {eq.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {eq.clienteNombre ? (
                      <span className="font-medium">{eq.clienteNombre}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-text-secondary">{eq.ubicacion}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => openEdit(eq)}
                      className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-all">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-muted text-sm">
                  No se encontraron equipos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen por tipo */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {['ONU', 'Router', 'Antena CPE'].map(tipo => {
          const count = equipos.filter(e => e.tipo === tipo).length;
          const inUse = equipos.filter(e => e.tipo === tipo && e.estado === 'En uso').length;
          const TIcon = tipoIconMap[tipo] || Box;
          return (
            <div key={tipo} className="bg-bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                  <TIcon size={18} className="text-accent-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{tipo}</p>
                  <p className="text-[11px] text-text-muted">{count} unidades</p>
                </div>
              </div>
              <div className="h-2 bg-bg-secondary rounded">
                <div className="h-full bg-accent-blue rounded transition-all"
                  style={{ width: `${count > 0 ? (inUse / count * 100) : 0}%` }} />
              </div>
              <p className="text-[11px] text-text-muted mt-1.5">{inUse} en uso / {count - inUse} disponibles</p>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold">{editingId ? 'Editar Equipo' : 'Registrar Equipo'}</h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary">
                    {TIPOS_EQUIPO.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Marca</label>
                  <select value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary">
                    {MARCAS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Modelo</label>
                  <input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted"
                    placeholder="ej. HG8310M" />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Serial *</label>
                  <input value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted"
                    placeholder="Número de serie" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary">
                    {ESTADOS_EQUIPO.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Ubicación</label>
                  <input value={form.ubicacion} onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder-text-muted"
                    placeholder="ej. Almacén, VILLA 5" />
                </div>
              </div>
              {form.estado === 'En uso' && (
                <div>
                  <label className="text-[11px] text-text-muted uppercase mb-1 block">Asignar a Cliente</label>
                  <select value={form.clienteId} onChange={handleClientSelect}
                    className="w-full py-2 px-3 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary">
                    <option value="">Sin asignar</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.id} - {c.nombre}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)}
                className="py-2 px-4 rounded-lg bg-bg-secondary text-text-secondary text-sm border border-border cursor-pointer hover:bg-white/[0.04]">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-accent-blue text-white text-sm font-semibold border-none cursor-pointer hover:opacity-90">
                <Save size={14} /> {editingId ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
