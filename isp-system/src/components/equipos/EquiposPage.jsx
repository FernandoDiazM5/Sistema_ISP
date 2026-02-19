import { useState, useMemo } from 'react';
import { Box, Plus, Monitor, Wifi, Router, Server, Wrench, Package, X, Edit2, Save, Search } from 'lucide-react';
import useStore from '../../store/useStore';
import { useFilters } from '../../hooks/useFilters';
import KPICard from '../common/KPICard';
import CopyButton from '../common/CopyButton';
import { formatEquipo } from '../../utils/whatsappFormats';

// UI Components
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

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

const estadoVariantMap = {
  'Disponible': 'success',
  'En uso': 'info',
  'En reparación': 'warning',
  'Dado de baja': 'danger',
};

export default function EquiposPage() {
  const equipos = useStore(s => s.equipos);
  const addEquipo = useStore(s => s.addEquipo);
  const updateEquipo = useStore(s => s.updateEquipo);
  const clients = useStore(s => s.clients);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ tipo: '', marca: '', modelo: '', serial: '', estado: 'Disponible', clienteId: '', clienteNombre: '', ubicacion: '' });

  // Custom Hook for Filters
  const {
    filteredData,
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    resetFilters
  } = useFilters(equipos, {
    searchFields: ['serial', 'modelo', 'marca', 'clienteNombre'],
    initialFilters: { tipo: 'all', estado: 'all' }
  });

  const stats = useMemo(() => {
    const total = equipos.length;
    const enUso = equipos.filter(e => e.estado === 'En uso').length;
    const disponibles = equipos.filter(e => e.estado === 'Disponible').length;
    const enReparacion = equipos.filter(e => e.estado === 'En reparación').length;
    return { total, enUso, disponibles, enReparacion };
  }, [equipos]);

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
      const existing = equipos.find(e => e.id === editingId);
      const updates = { ...form };
      // Solo actualizar fechaAsignacion si cambió a 'En uso' desde otro estado
      if (form.estado === 'En uso' && existing?.estado !== 'En uso') {
        updates.fechaAsignacion = new Date().toISOString().split('T')[0];
      } else if (form.estado !== 'En uso') {
        updates.fechaAsignacion = null;
        updates.clienteId = '';
        updates.clienteNombre = '';
      }
      updateEquipo(editingId, updates);
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
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">Inventario de Equipos</h1>
          <p className="text-text-secondary text-sm mt-1">Gestión de ONTs, CPEs, routers y equipos de red</p>
        </div>
        <Button onClick={openCreate} icon={Plus} className="w-full sm:w-auto justify-center">
          Registrar Equipo
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPICard title="Total Equipos" value={stats.total} subtitle="Inventario completo" icon={<Box size={20} />} color="#3b82f6" />
        <KPICard title="En Uso" value={stats.enUso} subtitle="Asignados a clientes" icon={<Monitor size={20} />} color="#10b981" />
        <KPICard title="Disponibles" value={stats.disponibles} subtitle="En almacén" icon={<Package size={20} />} color="#8b5cf6" />
        <KPICard title="En Reparación" value={stats.enReparacion} subtitle="Taller técnico" icon={<Wrench size={20} />} color="#f59e0b" />
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-0 sm:min-w-[300px]">
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por serial, modelo, marca o cliente..."
            icon={Search}
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <select
            value={filters.tipo}
            onChange={e => updateFilter('tipo', e.target.value)}
            className="w-full h-[42px] px-3 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary focus:border-accent-blue outline-none cursor-pointer"
          >
            <option value="all">Todos los tipos</option>
            {TIPOS_EQUIPO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-[180px]">
          <select
            value={filters.estado}
            onChange={e => updateFilter('estado', e.target.value)}
            className="w-full h-[42px] px-3 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary focus:border-accent-blue outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            {ESTADOS_EQUIPO.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        {(searchInput || filters.tipo !== 'all' || filters.estado !== 'all') && (
          <Button variant="ghost" icon={X} onClick={resetFilters}>Limpiar</Button>
        )}
      </div>

      {/* Tabla de equipos */}
      <Card padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] text-text-muted uppercase border-b border-border">
                <th className="py-4 px-4 font-semibold tracking-wider">ID</th>
                <th className="py-4 px-4 font-semibold tracking-wider">Tipo</th>
                <th className="py-4 px-4 font-semibold tracking-wider">Marca / Modelo</th>
                <th className="py-4 px-4 font-semibold tracking-wider">Serial</th>
                <th className="py-4 px-4 font-semibold tracking-wider">Estado</th>
                <th className="py-4 px-4 font-semibold tracking-wider">Asignado a</th>
                <th className="py-4 px-4 font-semibold tracking-wider">Ubicación</th>
                <th className="py-4 px-4 text-center font-semibold tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredData.map(eq => {
                const TipoIcon = tipoIconMap[eq.tipo] || Box;
                return (
                  <tr key={eq.id} className="hover:bg-bg-card-hover transition-colors">
                    <td className="py-4 px-4 font-mono text-text-muted text-[11px]">{eq.id}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-accent-blue/5">
                          <TipoIcon size={14} className="text-accent-blue" />
                        </div>
                        <span className="font-medium text-text-primary">{eq.tipo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{eq.marca}</span>
                        <span className="text-[11px] text-text-muted">{eq.modelo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">{eq.serial}</td>
                    <td className="py-4 px-4">
                      <Badge variant={estadoVariantMap[eq.estado]} dot>
                        {eq.estado}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      {eq.clienteNombre ? (
                        <span className="font-medium text-text-primary">{eq.clienteNombre}</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-text-secondary">{eq.ubicacion}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CopyButton getTextFn={() => formatEquipo(eq)} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(eq)}
                        >
                          <Edit2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted text-sm">
                    No se encontraron equipos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Resumen por tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {['ONU', 'Router', 'Antena CPE'].map(tipo => {
          const count = equipos.filter(e => e.tipo === tipo).length;
          const inUse = equipos.filter(e => e.tipo === tipo && e.estado === 'En uso').length;
          const TIcon = tipoIconMap[tipo] || Box;
          return (
            <Card key={tipo} padding="p-5" className="hover:border-accent-blue/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                  <TIcon size={18} className="text-accent-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{tipo}</p>
                  <p className="text-[11px] text-text-muted uppercase tracking-wider">{count} unidades</p>
                </div>
              </div>
              <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent-blue rounded-full transition-all duration-500"
                  style={{ width: `${count > 0 ? (inUse / count * 100) : 0}%` }} />
              </div>
              <div className="flex justify-between mt-2.5">
                <p className="text-[11px] font-medium text-text-primary">{inUse} en uso</p>
                <p className="text-[11px] text-text-muted">{count - inUse} disponibles</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal Re-styled */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <Card
            className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200"
            padding="p-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold">{editingId ? 'Editar Equipo' : 'Registrar Equipo'}</h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Tipo *</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full py-2.5 px-3 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary outline-none focus:border-accent-blue transition-colors">
                    {TIPOS_EQUIPO.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Marca</label>
                  <select value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                    className="w-full py-2.5 px-3 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary outline-none focus:border-accent-blue transition-colors">
                    {MARCAS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Modelo</label>
                  <Input
                    value={form.modelo}
                    onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                    placeholder="ej. HG8310M"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Serial *</label>
                  <Input
                    value={form.serial}
                    onChange={e => setForm(f => ({ ...f, serial: e.target.value }))}
                    placeholder="Número de serie"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                    className="w-full py-2.5 px-3 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary outline-none focus:border-accent-blue transition-colors">
                    {ESTADOS_EQUIPO.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Ubicación</label>
                  <Input
                    value={form.ubicacion}
                    onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                    placeholder="ej. Almacén, VILLA 5"
                  />
                </div>
              </div>
              {form.estado === 'En uso' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-text-secondary uppercase font-bold tracking-wider">Asignar a Cliente</label>
                  <select value={form.clienteId} onChange={handleClientSelect}
                    className="w-full py-2.5 px-3 rounded-xl bg-bg-secondary border border-border text-sm text-text-primary outline-none focus:border-accent-blue transition-colors">
                    <option value="">Sin asignar</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.id} - {c.nombre}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-bg-secondary/20">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} icon={Save}>
                {editingId ? 'Guardar Cambios' : 'Registrar Equipo'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
