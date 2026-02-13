import { useState, useMemo } from 'react';
import { MessageSquare, Send, Plus, Edit3, Trash2, Copy, Star, Search, Users, Sparkles, Play, Square, ChevronRight, X, Phone } from 'lucide-react';
import useStore from '../../store/useStore';
import { rewriteWithAI, TONES } from '../../api/geminiAI';
import KPICard from '../common/KPICard';

// Smart Format: reemplaza variables de plantilla con datos del cliente
function smartFormat(text, client) {
  const d = new Date();
  const h = d.getHours();
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const saludo = h >= 19 || h < 5 ? 'Buenas noches' : h >= 12 ? 'Buenas tardes' : 'Buenos días';

  let result = text
    .replace(/{Saludo}/g, saludo)
    .replace(/{Mes}/g, months[d.getMonth()])
    .replace(/{Anio}/g, String(d.getFullYear()));

  if (!client) return result.replace(/{Nombre}/g, '').replace(/{([^{}]+)}/g, '');

  // Nombre en formato título
  const nombre = (client.nombre || '').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  result = result.replace(/{Nombre}/g, nombre);

  // Variables del cliente
  const fieldMap = {
    precio: client.precio ? `S/. ${client.precio.toFixed(2)}` : '',
    plan: client.plan || '',
    deuda_monto: client.deuda_monto ? `S/. ${client.deuda_monto.toFixed(2)}` : 'S/. 0.00',
    deuda_meses: client.deuda_meses || '0',
    direccion: client.direccion || '',
    proximo_pago: client.proximo_pago || '',
    zona: client.zona || '',
    movil_1: client.movil_1 || '',
    estado_cuenta: client.estado_cuenta || '',
    tecnologia: client.tecnologia || '',
    ip: client.ip || '',
  };

  return result.replace(/{([^{}]+)}/g, (match, key) => {
    const lower = key.toLowerCase().replace(/\s+/g, '_');
    return fieldMap[lower] !== undefined ? fieldMap[lower] : (client[key] || match);
  });
}

const CATEGORIES = ['Todas', 'Cobranza', 'General', 'Soporte', 'Promoción'];

const VARIABLES = [
  { key: '{Saludo}', desc: 'Buenos días/tardes/noches' },
  { key: '{Nombre}', desc: 'Nombre del cliente' },
  { key: '{precio}', desc: 'Precio del plan' },
  { key: '{plan}', desc: 'Plan contratado' },
  { key: '{deuda_monto}', desc: 'Monto de deuda' },
  { key: '{deuda_meses}', desc: 'Meses de deuda' },
  { key: '{direccion}', desc: 'Dirección del cliente' },
  { key: '{proximo_pago}', desc: 'Fecha próximo pago' },
  { key: '{zona}', desc: 'Zona del cliente' },
  { key: '{Mes}', desc: 'Mes actual' },
  { key: '{Anio}', desc: 'Año actual' },
];

export default function WhatsAppPage() {
  const clients = useStore(s => s.clients);
  const templates = useStore(s => s.templates);
  const addTemplate = useStore(s => s.addTemplate);
  const updateTemplate = useStore(s => s.updateTemplate);
  const deleteTemplate = useStore(s => s.deleteTemplate);
  const incrementTemplateUse = useStore(s => s.incrementTemplateUse);
  const addWhatsappLog = useStore(s => s.addWhatsappLog);
  const whatsappLogs = useStore(s => s.whatsappLogs);
  const campaignActive = useStore(s => s.campaignActive);
  const setCampaign = useStore(s => s.setCampaign);

  // UI State
  const [activeTab, setActiveTab] = useState('plantillas'); // plantillas | enviar | campana | historial
  const [searchTpl, setSearchTpl] = useState('');
  const [filterCat, setFilterCat] = useState('Todas');
  const [showTplModal, setShowTplModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);

  // Template form
  const [tplForm, setTplForm] = useState({ titulo: '', categoria: 'Cobranza', mensaje: '', favorito: false });

  // Send state
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Campaign state
  const [campaignClients, setCampaignClients] = useState([]);
  const [campaignTemplate, setCampaignTemplate] = useState(null);
  const [campaignIdx, setCampaignIdx] = useState(0);
  const [campaignFilter, setCampaignFilter] = useState('all');

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let list = [...templates];
    if (filterCat !== 'Todas') list = list.filter(t => t.categoria === filterCat);
    if (searchTpl) {
      const term = searchTpl.toLowerCase();
      list = list.filter(t => t.titulo.toLowerCase().includes(term) || t.mensaje.toLowerCase().includes(term));
    }
    list.sort((a, b) => {
      if (a.favorito !== b.favorito) return a.favorito ? -1 : 1;
      return (b.uso || 0) - (a.uso || 0);
    });
    return list;
  }, [templates, filterCat, searchTpl]);

  // Filtered clients for send
  const filteredClients = useMemo(() => {
    if (!searchClient) return [];
    const term = searchClient.toLowerCase();
    return clients.filter(c =>
      c.nombre.toLowerCase().includes(term) || c.movil_1?.includes(term) || c.id.includes(term)
    ).slice(0, 10);
  }, [clients, searchClient]);

  // KPIs
  const kpis = useMemo(() => ({
    totalTemplates: templates.length,
    totalSent: whatsappLogs.length,
    todaySent: whatsappLogs.filter(l => new Date(l.fecha).toDateString() === new Date().toDateString()).length,
    favorites: templates.filter(t => t.favorito).length,
  }), [templates, whatsappLogs]);

  // Template CRUD
  const openCreateTpl = () => {
    setEditingTpl(null);
    setTplForm({ titulo: '', categoria: 'Cobranza', mensaje: '', favorito: false });
    setShowTplModal(true);
  };

  const openEditTpl = (tpl) => {
    setEditingTpl(tpl);
    setTplForm({ titulo: tpl.titulo, categoria: tpl.categoria, mensaje: tpl.mensaje, favorito: tpl.favorito });
    setShowTplModal(true);
  };

  const saveTpl = () => {
    if (!tplForm.titulo || !tplForm.mensaje) return;
    if (editingTpl) {
      updateTemplate(editingTpl.id, tplForm);
    } else {
      addTemplate(tplForm);
    }
    setShowTplModal(false);
  };

  const handleDeleteTpl = (id) => {
    if (confirm('¿Eliminar esta plantilla?')) deleteTemplate(id);
  };

  // Send
  const selectTplForSend = (tpl) => {
    setSelectedTemplate(tpl);
    setMessageText(smartFormat(tpl.mensaje, selectedClient));
  };

  const selectClientForSend = (client) => {
    setSelectedClient(client);
    setSearchClient('');
    if (selectedTemplate) {
      setMessageText(smartFormat(selectedTemplate.mensaje, client));
    }
  };

  const sendWhatsApp = () => {
    const phone = selectedClient?.movil_1 || manualPhone;
    if (!phone) return;

    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');

    if (selectedTemplate) incrementTemplateUse(selectedTemplate.id);

    addWhatsappLog({
      clienteId: selectedClient?.id || 'manual',
      clienteNombre: selectedClient?.nombre || `Manual (${cleanPhone})`,
      plantilla: selectedTemplate?.titulo || 'Manual',
      mensaje: messageText,
      telefono: cleanPhone,
    });
  };

  // AI rewrite
  const handleAIRewrite = async (tone) => {
    if (!messageText) return;
    setAiLoading(true);
    try {
      const ctx = selectedClient
        ? `Cliente: ${selectedClient.nombre}, Deuda: S/. ${selectedClient.deuda_monto || 0}, Estado: ${selectedClient.estado_cuenta}`
        : '';
      const result = await rewriteWithAI(messageText, tone, ctx);
      setMessageText(result);
    } catch (err) {
      alert('Error IA: ' + err.message);
    }
    setAiLoading(false);
  };

  // Campaign
  const startCampaign = () => {
    let list = [...clients];
    if (campaignFilter === 'deudores') list = list.filter(c => c.deuda_monto > 0);
    else if (campaignFilter === 'cortados') list = list.filter(c => c.estado_servicio === 'Cortado' || c.estado_cuenta === 'SUSPENDIDO');
    else if (campaignFilter === 'activos') list = list.filter(c => c.status === 'ONLINE' || c.estado_cuenta === 'ACTIVO');

    list = list.filter(c => c.movil_1);
    if (list.length === 0) return alert('No hay clientes con número de teléfono para esta selección');

    setCampaignClients(list);
    setCampaignIdx(0);
    setCampaign({ campaignActive: true });
  };

  const sendCampaignCurrent = () => {
    const client = campaignClients[campaignIdx];
    if (!client || !campaignTemplate) return;

    const text = smartFormat(campaignTemplate.mensaje, client);
    const phone = client.movil_1.replace(/\D/g, '');
    const url = `https://wa.me/51${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    incrementTemplateUse(campaignTemplate.id);
    addWhatsappLog({
      clienteId: client.id,
      clienteNombre: client.nombre,
      plantilla: campaignTemplate.titulo,
      mensaje: text,
      telefono: phone,
    });

    if (campaignIdx + 1 < campaignClients.length) {
      setCampaignIdx(campaignIdx + 1);
    } else {
      setCampaign({ campaignActive: false });
      alert('Campaña finalizada');
    }
  };

  const stopCampaign = () => {
    setCampaign({ campaignActive: false });
    setCampaignClients([]);
    setCampaignIdx(0);
  };

  const insertVariable = (varKey) => {
    setTplForm(f => ({ ...f, mensaje: f.mensaje + varKey }));
  };

  const tabs = [
    { id: 'plantillas', label: 'Plantillas', icon: <MessageSquare size={16} /> },
    { id: 'enviar', label: 'Enviar Mensaje', icon: <Send size={16} /> },
    { id: 'campana', label: 'Campaña', icon: <Users size={16} /> },
    { id: 'historial', label: 'Historial', icon: <Copy size={16} /> },
  ];

  return (
    <div className="animate-fade p-6 px-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">WhatsApp & Plantillas</h1>
          <p className="text-text-secondary text-sm mt-1">Mensajería masiva, plantillas y campañas</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard title="Plantillas" value={kpis.totalTemplates} icon={<MessageSquare size={20} />} color="#3b82f6" />
        <KPICard title="Mensajes Enviados" value={kpis.totalSent} icon={<Send size={20} />} color="#10b981" />
        <KPICard title="Enviados Hoy" value={kpis.todaySent} icon={<Phone size={20} />} color="#8b5cf6" />
        <KPICard title="Favoritas" value={kpis.favorites} icon={<Star size={20} />} color="#f59e0b" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg-secondary p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all
              ${activeTab === tab.id ? 'bg-bg-card text-text-primary shadow-sm' : 'bg-transparent text-text-muted hover:text-text-secondary'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB: PLANTILLAS ==================== */}
      {activeTab === 'plantillas' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={searchTpl} onChange={e => setSearchTpl(e.target.value)}
                placeholder="Buscar plantillas..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm" />
            </div>
            <div className="flex gap-1">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-semibold cursor-pointer border-none transition-all
                    ${filterCat === cat ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-muted hover:text-text-secondary'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <button onClick={openCreateTpl}
              className="py-2 px-4 rounded-lg bg-accent-green border-none text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5">
              <Plus size={14} /> Nueva
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {filteredTemplates.map(tpl => (
              <div key={tpl.id} className="bg-bg-card rounded-2xl border border-border p-4 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{tpl.titulo}</h4>
                    <span className="text-[10px] text-text-muted bg-bg-secondary py-0.5 px-2 rounded mt-1 inline-block">{tpl.categoria}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {tpl.favorito && <Star size={14} className="text-accent-yellow fill-accent-yellow" />}
                    <span className="text-[10px] text-text-muted font-mono">{tpl.uso || 0}x</span>
                  </div>
                </div>
                <p className="text-[12px] text-text-secondary flex-1 mb-3 line-clamp-3">{tpl.mensaje}</p>
                <div className="flex gap-1 pt-2 border-t border-border">
                  <button onClick={() => { setActiveTab('enviar'); selectTplForSend(tpl); }}
                    className="flex-1 py-1.5 rounded-lg bg-accent-green/10 text-accent-green text-[11px] font-semibold cursor-pointer border-none">
                    <Send size={12} className="inline mr-1" /> Usar
                  </button>
                  <button onClick={() => openEditTpl(tpl)}
                    className="p-1.5 rounded-lg bg-bg-secondary text-text-muted cursor-pointer border-none hover:text-accent-blue">
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => updateTemplate(tpl.id, { favorito: !tpl.favorito })}
                    className="p-1.5 rounded-lg bg-bg-secondary text-text-muted cursor-pointer border-none hover:text-accent-yellow">
                    <Star size={12} className={tpl.favorito ? 'fill-accent-yellow text-accent-yellow' : ''} />
                  </button>
                  <button onClick={() => handleDeleteTpl(tpl.id)}
                    className="p-1.5 rounded-lg bg-bg-secondary text-text-muted cursor-pointer border-none hover:text-accent-red">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {filteredTemplates.length === 0 && (
              <div className="col-span-3 text-center py-10 text-text-muted">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay plantillas</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== TAB: ENVIAR ==================== */}
      {activeTab === 'enviar' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Client & Template */}
          <div>
            {/* Client search */}
            <div className="bg-bg-card rounded-2xl border border-border p-4 mb-4">
              <h3 className="text-sm font-semibold mb-3">Seleccionar Cliente</h3>
              {selectedClient ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-accent-blue/5 border border-accent-blue/20">
                  <div>
                    <p className="text-sm font-semibold">{selectedClient.nombre}</p>
                    <p className="text-[11px] text-text-muted font-mono">{selectedClient.movil_1} · {selectedClient.id}</p>
                  </div>
                  <button onClick={() => setSelectedClient(null)}
                    className="p-1 rounded-lg bg-bg-secondary border-none cursor-pointer text-text-muted hover:text-accent-red">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input value={searchClient} onChange={e => setSearchClient(e.target.value)}
                    placeholder="Buscar por nombre, móvil o ID..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm" />
                  {filteredClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg z-10 max-h-[200px] overflow-y-auto">
                      {filteredClients.map(c => (
                        <button key={c.id} onClick={() => selectClientForSend(c)}
                          className="w-full text-left p-3 text-sm cursor-pointer bg-transparent border-none hover:bg-bg-secondary transition-colors flex justify-between">
                          <span className="font-medium">{c.nombre}</span>
                          <span className="text-[11px] text-text-muted font-mono">{c.movil_1}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!selectedClient && (
                <div className="mt-3">
                  <p className="text-[11px] text-text-muted mb-1.5">O envío manual:</p>
                  <input value={manualPhone} onChange={e => setManualPhone(e.target.value)}
                    placeholder="Número de teléfono (9 dígitos)"
                    className="w-full px-4 py-2 rounded-xl bg-bg-secondary border border-border text-sm font-mono" />
                </div>
              )}
            </div>

            {/* Template list for quick select */}
            <div className="bg-bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Seleccionar Plantilla</h3>
              <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto">
                {templates.map(tpl => (
                  <button key={tpl.id} onClick={() => selectTplForSend(tpl)}
                    className={`text-left p-3 rounded-xl text-xs cursor-pointer border transition-all
                      ${selectedTemplate?.id === tpl.id
                        ? 'border-accent-blue bg-accent-blue/5'
                        : 'border-border bg-bg-secondary hover:border-border'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{tpl.titulo}</span>
                      <span className="text-[10px] text-text-muted">{tpl.categoria}</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 truncate">{tpl.mensaje}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Message preview */}
          <div>
            <div className="bg-bg-card rounded-2xl border border-border p-4 mb-4">
              <h3 className="text-sm font-semibold mb-3">Vista Previa del Mensaje</h3>
              <textarea value={messageText} onChange={e => setMessageText(e.target.value)}
                rows={8}
                className="w-full p-4 rounded-xl bg-bg-secondary border border-border text-sm resize-none font-mono"
                placeholder="Selecciona una plantilla o escribe un mensaje..." />

              {/* AI Rewrite */}
              <div className="mt-3">
                <p className="text-[11px] text-text-muted mb-2 flex items-center gap-1">
                  <Sparkles size={12} /> Reescribir con IA (Gemini)
                </p>
                <div className="flex gap-1.5">
                  {Object.entries(TONES).map(([key, tone]) => (
                    <button key={key} onClick={() => handleAIRewrite(key)}
                      disabled={aiLoading || !messageText}
                      className="py-1.5 px-3 rounded-lg bg-bg-secondary border border-border text-[11px] font-semibold cursor-pointer hover:border-accent-purple disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      {aiLoading ? '...' : `${tone.emoji} ${tone.label}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Send button */}
            <button onClick={sendWhatsApp}
              disabled={!messageText || (!selectedClient?.movil_1 && !manualPhone)}
              className="w-full py-3 rounded-xl bg-accent-green border-none text-white text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
              <Send size={18} />
              Enviar por WhatsApp
            </button>

            <button onClick={() => {
              if (messageText) {
                navigator.clipboard.writeText(messageText);
              }
            }}
              disabled={!messageText}
              className="w-full mt-2 py-2.5 rounded-xl bg-bg-secondary border border-border text-text-secondary text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 hover:border-accent-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Copy size={14} />
              Copiar texto al portapapeles
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB: CAMPAÑA ==================== */}
      {activeTab === 'campana' && (
        <div>
          {!campaignActive ? (
            <div className="bg-bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-4">Configurar Campaña Masiva</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Filtro de Clientes</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { value: 'all', label: 'Todos los clientes', count: clients.filter(c => c.movil_1).length },
                      { value: 'deudores', label: 'Clientes con deuda', count: clients.filter(c => c.deuda_monto > 0 && c.movil_1).length },
                      { value: 'cortados', label: 'Cortados / Suspendidos', count: clients.filter(c => (c.estado_servicio === 'Cortado' || c.estado_cuenta === 'SUSPENDIDO') && c.movil_1).length },
                      { value: 'activos', label: 'Clientes activos', count: clients.filter(c => (c.status === 'ONLINE' || c.estado_cuenta === 'ACTIVO') && c.movil_1).length },
                    ].map(f => (
                      <label key={f.value}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                          ${campaignFilter === f.value ? 'border-accent-blue bg-accent-blue/5' : 'border-border bg-bg-secondary'}`}>
                        <input type="radio" name="campFilter" value={f.value}
                          checked={campaignFilter === f.value}
                          onChange={() => setCampaignFilter(f.value)}
                          className="accent-accent-blue" />
                        <span className="text-sm font-medium flex-1">{f.label}</span>
                        <span className="text-xs text-text-muted font-mono">{f.count}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-2 block">Plantilla para la campaña</label>
                  <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                    {templates.map(tpl => (
                      <button key={tpl.id} onClick={() => setCampaignTemplate(tpl)}
                        className={`text-left p-3 rounded-xl text-xs cursor-pointer border transition-all
                          ${campaignTemplate?.id === tpl.id
                            ? 'border-accent-green bg-accent-green/5'
                            : 'border-border bg-bg-secondary'}`}>
                        <span className="font-semibold">{tpl.titulo}</span>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">{tpl.mensaje}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={startCampaign}
                disabled={!campaignTemplate}
                className="mt-6 w-full py-3 rounded-xl bg-accent-blue border-none text-white text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                <Play size={18} />
                Iniciar Campaña
              </button>
            </div>
          ) : (
            <div className="bg-bg-card rounded-2xl border border-accent-blue/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                  Campaña en Curso
                </h3>
                <span className="text-xs text-text-muted font-mono">
                  {campaignIdx + 1} / {campaignClients.length}
                </span>
              </div>

              {/* Progress */}
              <div className="w-full h-2 bg-bg-secondary rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-accent-blue rounded-full transition-all"
                  style={{ width: `${((campaignIdx + 1) / campaignClients.length) * 100}%` }} />
              </div>

              {/* Current client */}
              {campaignClients[campaignIdx] && (
                <div className="bg-bg-secondary rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold">{campaignClients[campaignIdx].nombre}</p>
                      <p className="text-[11px] text-text-muted font-mono">{campaignClients[campaignIdx].movil_1} · {campaignClients[campaignIdx].zona}</p>
                    </div>
                    <span className={`py-1 px-2.5 rounded-lg text-[10px] font-bold
                      ${campaignClients[campaignIdx].deuda_monto > 0 ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-green/15 text-accent-green'}`}>
                      {campaignClients[campaignIdx].deuda_monto > 0 ? `Deuda: S/. ${campaignClients[campaignIdx].deuda_monto}` : 'Al día'}
                    </span>
                  </div>
                  <div className="bg-bg-card rounded-lg p-3 text-xs text-text-secondary font-mono">
                    {smartFormat(campaignTemplate.mensaje, campaignClients[campaignIdx])}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={sendCampaignCurrent}
                  className="flex-1 py-2.5 rounded-xl bg-accent-green border-none text-white text-sm font-bold cursor-pointer flex items-center justify-center gap-2">
                  <Send size={16} /> Enviar y Siguiente
                  <ChevronRight size={16} />
                </button>
                <button onClick={stopCampaign}
                  className="py-2.5 px-6 rounded-xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm font-semibold cursor-pointer flex items-center gap-2">
                  <Square size={14} /> Detener
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: HISTORIAL ==================== */}
      {activeTab === 'historial' && (
        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
          <div className="py-4 px-6 border-b border-border">
            <h3 className="text-sm font-semibold">Historial de Envíos ({whatsappLogs.length})</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] text-text-muted uppercase bg-bg-secondary sticky top-0">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Plantilla</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {whatsappLogs.map(log => (
                  <tr key={log.id} className="border-b border-border">
                    <td className="py-3 px-4 text-text-muted text-xs">
                      {new Date(log.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 font-medium">{log.clienteNombre}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] bg-accent-blue/10 text-accent-blue py-0.5 px-2 rounded">{log.plantilla}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{log.telefono}</td>
                    <td className="py-3 px-4 text-text-secondary text-xs truncate max-w-[250px]">{log.mensaje}</td>
                  </tr>
                ))}
                {whatsappLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-text-muted">No hay envíos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODAL: TEMPLATE ==================== */}
      {showTplModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowTplModal(false)}>
          <div className="bg-bg-card rounded-2xl border border-border w-[550px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">{editingTpl ? 'Editar Plantilla' : 'Nueva Plantilla'}</h3>
              <button onClick={() => setShowTplModal(false)} className="p-1 rounded-lg bg-bg-secondary border-none cursor-pointer text-text-muted hover:text-text-primary">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Título</label>
                <input value={tplForm.titulo} onChange={e => setTplForm(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm" placeholder="Ej: Cobro Mensual" />
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Categoría</label>
                <select value={tplForm.categoria} onChange={e => setTplForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm">
                  {CATEGORIES.filter(c => c !== 'Todas').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Mensaje</label>
                <textarea value={tplForm.mensaje} onChange={e => setTplForm(f => ({ ...f, mensaje: e.target.value }))}
                  rows={5} className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm resize-none font-mono"
                  placeholder="Escribe el mensaje con variables..." />
              </div>

              {/* Variables */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Insertar Variable</label>
                <div className="flex flex-wrap gap-1">
                  {VARIABLES.map(v => (
                    <button key={v.key} onClick={() => insertVariable(v.key)}
                      title={v.desc}
                      className="py-1 px-2 rounded-lg bg-accent-blue/10 text-accent-blue text-[10px] font-mono font-semibold cursor-pointer border-none hover:bg-accent-blue/20 transition-colors">
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={tplForm.favorito}
                  onChange={e => setTplForm(f => ({ ...f, favorito: e.target.checked }))}
                  className="accent-accent-yellow" />
                <span className="text-xs font-medium">Marcar como favorita</span>
              </label>
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button onClick={() => setShowTplModal(false)}
                className="py-2 px-5 rounded-lg bg-bg-secondary border border-border text-text-secondary text-sm cursor-pointer">
                Cancelar
              </button>
              <button onClick={saveTpl}
                disabled={!tplForm.titulo || !tplForm.mensaje}
                className="py-2 px-5 rounded-lg bg-accent-blue border-none text-white text-sm font-semibold cursor-pointer disabled:opacity-40">
                {editingTpl ? 'Guardar Cambios' : 'Crear Plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
