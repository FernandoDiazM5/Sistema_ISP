import { useState, useMemo } from 'react';
import { MessageSquare, Send, Plus, Edit3, Trash2, Copy, Star, Search, Users, Sparkles, Play, Square, ChevronRight, X, Phone, Upload, Mic, Image, Download, Settings, Check, Filter, Eye } from 'lucide-react';
import useStore from '../../store/useStore';
import { rewriteWithAI, generateWithAI, TONES } from '../../api/geminiAI';
import KPICard from '../common/KPICard';
import CopyButton from '../common/CopyButton';

// Smart Format: reemplaza variables de plantilla con datos del cliente
function smartFormat(text, client) {
  const d = new Date();
  const h = d.getHours();
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
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

const DEFAULT_CATEGORIES = ['Cobranza', 'General', 'Soporte', 'Promoción'];

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
  const whatsappCategories = useStore(s => s.whatsappCategories);
  const addCategory = useStore(s => s.addCategory);
  const deleteCategory = useStore(s => s.deleteCategory);
  const updateCategory = useStore(s => s.updateCategory);

  // Dynamic categories (from store, with defaults fallback)
  const categories = useMemo(() => {
    const cats = whatsappCategories?.length > 0 ? whatsappCategories : DEFAULT_CATEGORIES;
    return ['Todas', ...cats];
  }, [whatsappCategories]);

  // UI State
  const [activeTab, setActiveTab] = useState('plantillas');
  const [searchTpl, setSearchTpl] = useState('');
  const [filterCat, setFilterCat] = useState('Todas');
  const [showTplModal, setShowTplModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [viewingTpl, setViewingTpl] = useState(null); // Detail view modal

  // Template form
  const [tplForm, setTplForm] = useState({ titulo: '', categoria: 'Cobranza', mensaje: '', favorito: false, imagenes: [], audios: [] });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratingGuion, setAiGeneratingGuion] = useState(false);

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
  const [campaignFilters, setCampaignFilters] = useState({});
  const [campaignSearch, setCampaignSearch] = useState('');

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
    setTplForm({ titulo: '', categoria: 'Cobranza', mensaje: '', favorito: false, imagenes: [], audios: [] });
    setShowTplModal(true);
  };

  const openEditTpl = (tpl) => {
    setEditingTpl(tpl);
    setTplForm({ titulo: tpl.titulo, categoria: tpl.categoria, mensaje: tpl.mensaje, favorito: tpl.favorito, imagenes: tpl.imagenes || [], audios: tpl.audios || [] });
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
    // Evitar doble código de país: si ya empieza con 51 y tiene 11+ dígitos, no agregar
    const fullPhone = cleanPhone.startsWith('51') && cleanPhone.length >= 11 ? cleanPhone : `51${cleanPhone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(messageText)}`;
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

  // Campaign filter columns (all filterable client fields)
  const CAMPAIGN_FILTER_COLS = [
    { key: 'zona', label: 'Zona' },
    { key: 'nodo', label: 'Nodo', getter: c => c.nodo || c.nodo_router },
    { key: 'tecnologia', label: 'Tecnología' },
    { key: 'plan', label: 'Plan' },
    { key: 'estado_cuenta', label: 'Estado Cuenta' },
    { key: 'estado_servicio', label: 'Estado Servicio' },
    { key: 'status', label: 'Conexión' },
  ];

  // Unique values for each filterable column
  const campaignOptions = useMemo(() => {
    const opts = {};
    CAMPAIGN_FILTER_COLS.forEach(col => {
      const getter = col.getter || (c => c[col.key]);
      opts[col.key] = [...new Set(clients.map(getter).filter(Boolean))].sort();
    });
    return opts;
  }, [clients]);

  // Campaign - apply base + advanced filters + free text search
  const applyCampaignFilters = (baseFilter, advFilters, search) => {
    let list = [...clients];
    if (baseFilter === 'deudores') list = list.filter(c => c.deuda_monto > 0);
    else if (baseFilter === 'cortados') list = list.filter(c => c.estado_servicio === 'Cortado' || c.estado_cuenta === 'SUSPENDIDO');
    else if (baseFilter === 'activos') list = list.filter(c => c.status === 'ONLINE' || c.estado_cuenta === 'ACTIVO');
    // Apply each advanced dropdown filter
    CAMPAIGN_FILTER_COLS.forEach(col => {
      const val = advFilters[col.key];
      if (val) {
        const getter = col.getter || (c => c[col.key]);
        list = list.filter(c => getter(c) === val);
      }
    });
    // Free text search across all fields
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(c =>
        (c.nombre || '').toLowerCase().includes(term) ||
        (c.id || '').toLowerCase().includes(term) ||
        (c.dni || '').toLowerCase().includes(term) ||
        (c.direccion || '').toLowerCase().includes(term) ||
        (c.movil_1 || '').includes(term) ||
        (c.zona || '').toLowerCase().includes(term) ||
        (c.nodo || c.nodo_router || '').toLowerCase().includes(term) ||
        (c.plan || '').toLowerCase().includes(term) ||
        (c.tecnologia || '').toLowerCase().includes(term)
      );
    }
    return list.filter(c => c.movil_1);
  };

  const filteredCampaignCount = useMemo(() => applyCampaignFilters(campaignFilter, campaignFilters, campaignSearch).length, [clients, campaignFilter, campaignFilters, campaignSearch]);

  const startCampaign = () => {
    const list = applyCampaignFilters(campaignFilter, campaignFilters, campaignSearch);
    if (list.length === 0) return alert('No hay clientes con número de teléfono para esta selección');

    setCampaignClients(list);
    setCampaignIdx(0);
    setCampaign({ campaignActive: true });
  };

  const sendCampaignCurrent = () => {
    const client = campaignClients[campaignIdx];
    if (!client || !campaignTemplate) return;

    const text = smartFormat(campaignTemplate.mensaje, client);
    const phone = (client.movil_1 || '').replace(/\D/g, '');
    const fullPhone = phone.startsWith('51') && phone.length >= 11 ? phone : `51${phone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
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

  // === Media handlers ===
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - (tplForm.imagenes?.length || 0);
    if (remaining <= 0) return;
    files.slice(0, remaining).forEach(file => {
      if (file.size > 2 * 1024 * 1024) { alert(`${file.name} excede 2MB`); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTplForm(f => ({ ...f, imagenes: [...(f.imagenes || []), { id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, nombre: file.name, base64: ev.target.result, size: file.size }] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAudioUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 2 - (tplForm.audios?.length || 0);
    if (remaining <= 0) return;
    files.slice(0, remaining).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} excede 5MB`); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTplForm(f => ({ ...f, audios: [...(f.audios || []), { id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, nombre: file.name, base64: ev.target.result, size: file.size, guion: '' }] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (imgId) => setTplForm(f => ({ ...f, imagenes: f.imagenes.filter(i => i.id !== imgId) }));
  const removeAudio = (audId) => setTplForm(f => ({ ...f, audios: f.audios.filter(a => a.id !== audId) }));
  const updateAudioGuion = (audId, guion) => setTplForm(f => ({ ...f, audios: f.audios.map(a => a.id === audId ? { ...a, guion } : a) }));

  // === AI generation ===
  const handleAIGenerateMessage = async () => {
    if (!tplForm.titulo || !tplForm.categoria) return;
    setAiGenerating(true);
    try {
      const result = await generateWithAI(
        `Genera un mensaje de WhatsApp profesional para un ISP (proveedor de internet).
Título de la plantilla: "${tplForm.titulo}"
Categoría: "${tplForm.categoria}"

Variables disponibles que puedes usar: {Saludo}, {Nombre}, {precio}, {plan}, {deuda_monto}, {deuda_meses}, {direccion}, {proximo_pago}, {zona}, {Mes}, {Anio}

Reglas:
1. Usa las variables relevantes según la categoría (ej: para Cobranza usa {deuda_monto}, {deuda_meses}).
2. Empieza con {Saludo} {Nombre}.
3. Sé conciso, máximo 3-4 líneas.
4. Solo devuelve el texto del mensaje, sin comillas ni explicaciones.`
      );
      setTplForm(f => ({ ...f, mensaje: result }));
    } catch (err) { alert('Error IA: ' + err.message); }
    setAiGenerating(false);
  };

  const handleAIGenerateGuion = async (audId) => {
    if (!tplForm.mensaje) return;
    setAiGeneratingGuion(true);
    try {
      const result = await generateWithAI(
        `Convierte el siguiente mensaje de WhatsApp en un guion de voz para que un operador de call center lo lea por teléfono. El guion debe sonar natural al hablarlo, sin emojis, sin formato de texto.

Mensaje original: "${tplForm.mensaje}"

Reglas:
1. Reemplaza variables como {Nombre} con "el nombre del cliente", {deuda_monto} con "el monto adeudado", etc.
2. Hazlo conversacional y amable.
3. Incluye una apertura y cierre apropiados para llamada telefónica.
4. Solo devuelve el guion, sin comillas ni explicaciones.`
      );
      updateAudioGuion(audId, result);
    } catch (err) { alert('Error IA: ' + err.message); }
    setAiGeneratingGuion(false);
  };

  const getSuggestedVariables = (categoria) => {
    const map = {
      'Cobranza': ['{Saludo}', '{Nombre}', '{deuda_monto}', '{deuda_meses}', '{proximo_pago}'],
      'General': ['{Saludo}', '{Nombre}', '{plan}', '{Mes}'],
      'Soporte': ['{Saludo}', '{Nombre}', '{plan}', '{direccion}', '{zona}'],
      'Promoción': ['{Saludo}', '{Nombre}', '{precio}', '{plan}', '{Mes}', '{Anio}'],
    };
    return map[categoria] || map['General'];
  };

  const tabs = [
    { id: 'plantillas', label: 'Plantillas', icon: <MessageSquare size={16} /> },
    { id: 'enviar', label: 'Enviar Mensaje', icon: <Send size={16} /> },
    { id: 'campana', label: 'Campaña', icon: <Users size={16} /> },
    { id: 'historial', label: 'Historial', icon: <Copy size={16} /> },
  ];

  return (
    <div className="animate-fade p-4 sm:p-6 sm:px-8 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-[26px] font-bold tracking-tight">WhatsApp & Plantillas</h1>
          <p className="text-text-secondary text-sm mt-1">Mensajería masiva, plantillas y campañas</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-semibold cursor-pointer border-none transition-all
                    ${filterCat === cat ? 'bg-accent-blue text-white' : 'bg-bg-secondary text-text-muted hover:text-text-secondary'}`}>
                  {cat}
                </button>
              ))}
              <button onClick={() => setShowCatModal(true)}
                className="p-1.5 rounded-lg bg-bg-secondary text-text-muted cursor-pointer border-none hover:text-accent-blue" title="Gestionar categorías">
                <Settings size={12} />
              </button>
            </div>
            <button onClick={openCreateTpl}
              className="py-2 px-4 rounded-lg bg-accent-green border-none text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5">
              <Plus size={14} /> Nueva
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                {(tpl.imagenes?.length > 0 || tpl.audios?.length > 0) && (
                  <div className="flex items-center gap-2 mb-2">
                    {tpl.imagenes?.length > 0 && (
                      <div className="flex items-center gap-1">
                        {tpl.imagenes.slice(0, 3).map(img => (
                          <a key={img.id} href={img.base64} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                            <img src={img.base64} alt={img.nombre} className="w-8 h-8 rounded object-cover border border-border hover:ring-2 hover:ring-accent-blue" />
                          </a>
                        ))}
                        {tpl.imagenes.length > 3 && (
                          <span className="text-[9px] text-text-muted bg-bg-secondary rounded px-1 py-0.5">+{tpl.imagenes.length - 3}</span>
                        )}
                      </div>
                    )}
                    {tpl.audios?.length > 0 && (
                      <span className="text-[10px] text-text-muted flex items-center gap-0.5 bg-bg-secondary py-0.5 px-1.5 rounded">
                        <Mic size={10} /> {tpl.audios.length} audio
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-1 pt-2 border-t border-border">
                  <button onClick={() => { setActiveTab('enviar'); selectTplForSend(tpl); }}
                    className="flex-1 py-1.5 rounded-lg bg-accent-green/10 text-accent-green text-[11px] font-semibold cursor-pointer border-none">
                    <Send size={12} className="inline mr-1" /> Usar
                  </button>
                  <button onClick={() => setViewingTpl(tpl)} title="Ver detalle"
                    className="p-1.5 rounded-lg bg-bg-secondary text-text-muted cursor-pointer border-none hover:text-accent-blue">
                    <Eye size={12} />
                  </button>
                  <CopyButton getTextFn={() => tpl.mensaje} title="Copiar mensaje" />
                  {tpl.audios?.some(a => a.guion) && (
                    <CopyButton getTextFn={() => tpl.audios.find(a => a.guion)?.guion || ''} title="Copiar guion de voz" />
                  )}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Template media attachments */}
            {selectedTemplate && (selectedTemplate.imagenes?.length > 0 || selectedTemplate.audios?.length > 0) && (
              <div className="bg-bg-card rounded-2xl border border-border p-4 mb-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Image size={14} /> Adjuntos de la Plantilla
                </h3>
                {selectedTemplate.imagenes?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] text-text-muted mb-2">Imágenes ({selectedTemplate.imagenes.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedTemplate.imagenes.map(img => (
                        <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border">
                          <a href={img.base64} target="_blank" rel="noopener noreferrer">
                            <img src={img.base64} alt={img.nombre} className="w-full h-24 object-cover" />
                          </a>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] text-white truncate flex-1">{img.nombre}</span>
                            <a href={img.base64} download={img.nombre} onClick={e => e.stopPropagation()}
                              className="p-1 rounded bg-white/20 text-white hover:bg-white/40 shrink-0">
                              <Download size={10} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedTemplate.audios?.length > 0 && (
                  <div>
                    <p className="text-[11px] text-text-muted mb-2">Audios ({selectedTemplate.audios.length})</p>
                    {selectedTemplate.audios.map(aud => (
                      <div key={aud.id} className="bg-bg-secondary rounded-xl p-3 mb-2 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic size={12} className="text-accent-purple" />
                          <span className="text-xs font-medium truncate">{aud.nombre}</span>
                        </div>
                        <audio controls src={aud.base64} className="w-full h-8 mb-2" />
                        {aud.guion && (
                          <div className="bg-bg-card rounded-lg p-2.5 border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-text-muted font-semibold">Guion de voz</span>
                              <CopyButton getTextFn={() => aud.guion} title="Copiar guion" />
                            </div>
                            <p className="text-xs text-text-secondary whitespace-pre-wrap">{aud.guion}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">Estado de Clientes</label>
                  <div className="flex flex-col gap-2 mb-4">
                    {[
                      { value: 'all', label: 'Todos los clientes' },
                      { value: 'deudores', label: 'Clientes con deuda' },
                      { value: 'cortados', label: 'Cortados / Suspendidos' },
                      { value: 'activos', label: 'Clientes activos' },
                    ].map(f => (
                      <label key={f.value}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all
                          ${campaignFilter === f.value ? 'border-accent-blue bg-accent-blue/5' : 'border-border bg-bg-secondary'}`}>
                        <input type="radio" name="campFilter" value={f.value}
                          checked={campaignFilter === f.value}
                          onChange={() => setCampaignFilter(f.value)}
                          className="accent-accent-blue" />
                        <span className="text-xs font-medium flex-1">{f.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Free text search */}
                  <div className="mb-3">
                    <label className="text-xs text-text-muted mb-1.5 block flex items-center gap-1"><Search size={12} /> Buscar cliente</label>
                    <input value={campaignSearch} onChange={e => setCampaignSearch(e.target.value)}
                      placeholder="Nombre, DNI, dirección, nodo, zona..."
                      className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-xs" />
                  </div>

                  {/* Advanced filters - dynamic from all columns */}
                  <label className="text-xs text-text-muted mb-2 block flex items-center gap-1"><Filter size={12} /> Filtros por Columna</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CAMPAIGN_FILTER_COLS.map(col => (
                      <div key={col.key}>
                        <label className="text-[10px] text-text-muted mb-1 block">{col.label}</label>
                        <select value={campaignFilters[col.key] || ''} onChange={e => setCampaignFilters(f => ({ ...f, [col.key]: e.target.value }))}
                          className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary border border-border text-xs">
                          <option value="">Todos</option>
                          {(campaignOptions[col.key] || []).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  {Object.values(campaignFilters).some(v => v) && (
                    <button onClick={() => setCampaignFilters({})}
                      className="mt-2 text-[10px] text-accent-red cursor-pointer bg-transparent border-none hover:underline">
                      Limpiar filtros
                    </button>
                  )}
                  <div className="mt-3 p-2.5 rounded-xl bg-accent-blue/5 border border-accent-blue/20 text-center">
                    <span className="text-sm font-bold text-accent-blue">{filteredCampaignCount}</span>
                    <span className="text-xs text-text-muted ml-1.5">clientes coinciden</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-2 block">Plantilla para la campaña</label>
                  <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
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
                disabled={!campaignTemplate || filteredCampaignCount === 0}
                className="mt-6 w-full py-3 rounded-xl bg-accent-blue border-none text-white text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                <Play size={18} />
                Iniciar Campaña ({filteredCampaignCount} clientes)
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
                {[...whatsappLogs].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(log => (
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTplModal(false)}>
          <div className="bg-bg-card rounded-2xl border border-border w-full max-w-[650px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                  {categories.filter(c => c !== 'Todas').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Mensaje</label>
                <textarea value={tplForm.mensaje} onChange={e => setTplForm(f => ({ ...f, mensaje: e.target.value }))}
                  rows={5} className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm resize-none font-mono"
                  placeholder="Escribe el mensaje con variables..." />
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={handleAIGenerateMessage}
                    disabled={aiGenerating || !tplForm.titulo}
                    className="py-1.5 px-3 rounded-lg bg-accent-purple/10 text-accent-purple text-[11px] font-semibold border-none cursor-pointer flex items-center gap-1 hover:bg-accent-purple/20 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Sparkles size={12} /> {aiGenerating ? 'Generando...' : 'Generar con IA'}
                  </button>
                  <span className="text-[10px] text-text-muted">Usa título y categoría para generar</span>
                </div>
              </div>

              {/* Variables inteligentes */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">
                  Insertar Variable
                  <span className="text-[10px] text-accent-purple ml-2">* Sugeridas para {tplForm.categoria}</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {VARIABLES.map(v => {
                    const isSuggested = getSuggestedVariables(tplForm.categoria).includes(v.key);
                    return (
                      <button key={v.key} onClick={() => insertVariable(v.key)}
                        title={v.desc}
                        className={`py-1 px-2 rounded-lg text-[10px] font-mono font-semibold cursor-pointer border-none transition-colors
                          ${isSuggested
                            ? 'bg-accent-purple/15 text-accent-purple hover:bg-accent-purple/25 ring-1 ring-accent-purple/30'
                            : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'}`}>
                        {v.key} {isSuggested ? '*' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Imágenes */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Imágenes ({tplForm.imagenes?.length || 0}/5)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(tplForm.imagenes || []).map(img => (
                    <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                      <img src={img.base64} alt={img.nombre} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(img.id)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate">{img.nombre}</span>
                    </div>
                  ))}
                  {(tplForm.imagenes?.length || 0) < 5 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent-blue hover:bg-accent-blue/5 transition-colors">
                      <Upload size={16} className="text-text-muted mb-1" />
                      <span className="text-[9px] text-text-muted">Agregar</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              {/* Audios / Guiones */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block">Audios / Guiones ({tplForm.audios?.length || 0}/2)</label>
                {(tplForm.audios || []).map(aud => (
                  <div key={aud.id} className="bg-bg-secondary rounded-xl p-3 mb-2 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mic size={14} className="text-accent-purple shrink-0" />
                        <span className="text-xs font-medium truncate">{aud.nombre}</span>
                        <span className="text-[10px] text-text-muted shrink-0">({(aud.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleAIGenerateGuion(aud.id)}
                          disabled={aiGeneratingGuion || !tplForm.mensaje}
                          title="Generar guion con IA"
                          className="p-1.5 rounded-lg bg-accent-purple/10 text-accent-purple border-none cursor-pointer hover:bg-accent-purple/20 disabled:opacity-40 disabled:cursor-not-allowed">
                          <Sparkles size={12} />
                        </button>
                        <button onClick={() => removeAudio(aud.id)}
                          className="p-1.5 rounded-lg bg-accent-red/10 text-accent-red border-none cursor-pointer hover:bg-accent-red/20">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    <audio controls src={aud.base64} className="w-full h-8 mb-2" />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] text-text-muted">Guion de voz</label>
                        {aud.guion && <CopyButton getTextFn={() => aud.guion} title="Copiar guion" />}
                      </div>
                      <textarea value={aud.guion || ''} onChange={e => updateAudioGuion(aud.id, e.target.value)}
                        rows={3} placeholder="Escribe o genera con IA el guion que el operador leerá..."
                        className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border text-xs resize-none" />
                    </div>
                  </div>
                ))}
                {(tplForm.audios?.length || 0) < 2 && (
                  <label className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-accent-purple hover:bg-accent-purple/5 transition-colors">
                    <Upload size={14} className="text-text-muted" />
                    <span className="text-xs text-text-muted">Agregar audio</span>
                    <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                  </label>
                )}
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

      {/* ==================== MODAL: TEMPLATE DETAIL ==================== */}
      {viewingTpl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingTpl(null)}>
          <div className="bg-bg-card rounded-2xl border border-border w-full max-w-[650px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold">{viewingTpl.titulo}</h3>
                <span className="text-[10px] bg-accent-blue/10 text-accent-blue py-0.5 px-2 rounded font-semibold">{viewingTpl.categoria}</span>
                {viewingTpl.favorito && <Star size={14} className="text-accent-yellow fill-accent-yellow" />}
              </div>
              <div className="flex items-center gap-2">
                <CopyButton getTextFn={() => viewingTpl.mensaje} title="Copiar mensaje" size="md" />
                <span className="text-[10px] text-text-muted font-mono">{viewingTpl.uso || 0} usos</span>
                <button onClick={() => setViewingTpl(null)} className="p-1 rounded-lg bg-bg-secondary border-none cursor-pointer text-text-muted hover:text-text-primary">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* Message */}
              <div>
                <label className="text-xs text-text-muted mb-1.5 block font-semibold">Mensaje</label>
                <div className="p-4 rounded-xl bg-bg-secondary border border-border text-sm font-mono whitespace-pre-wrap">{viewingTpl.mensaje}</div>
              </div>

              {/* Images */}
              {viewingTpl.imagenes?.length > 0 && (
                <div>
                  <label className="text-xs text-text-muted mb-2 block font-semibold">Imágenes ({viewingTpl.imagenes.length})</label>
                  <div className="grid grid-cols-3 gap-3">
                    {viewingTpl.imagenes.map(img => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border">
                        <a href={img.base64} target="_blank" rel="noopener noreferrer">
                          <img src={img.base64} alt={img.nombre} className="w-full h-32 object-cover hover:opacity-90 transition-opacity" />
                        </a>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 flex items-center justify-between">
                          <span className="text-[10px] text-white truncate flex-1">{img.nombre}</span>
                          <a href={img.base64} download={img.nombre} onClick={e => e.stopPropagation()}
                            className="p-1 rounded bg-white/20 text-white hover:bg-white/40 shrink-0 ml-1">
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audios */}
              {viewingTpl.audios?.length > 0 && (
                <div>
                  <label className="text-xs text-text-muted mb-2 block font-semibold">Audios / Guiones ({viewingTpl.audios.length})</label>
                  {viewingTpl.audios.map(aud => (
                    <div key={aud.id} className="bg-bg-secondary rounded-xl p-4 mb-3 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic size={14} className="text-accent-purple" />
                        <span className="text-xs font-semibold">{aud.nombre}</span>
                        <span className="text-[10px] text-text-muted">({(aud.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <audio controls src={aud.base64} className="w-full h-9 mb-3" />
                      {aud.guion && (
                        <div className="bg-bg-card rounded-lg p-3 border border-border">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-text-muted font-semibold">Guion de Voz</span>
                            <CopyButton getTextFn={() => aud.guion} title="Copiar guion" />
                          </div>
                          <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{aud.guion}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <span>ID: {viewingTpl.id}</span>
                <span>·</span>
                <span>{viewingTpl.uso || 0} usos</span>
                {viewingTpl.imagenes?.length > 0 && <><span>·</span><span>{viewingTpl.imagenes.length} imágenes</span></>}
                {viewingTpl.audios?.length > 0 && <><span>·</span><span>{viewingTpl.audios.length} audios</span></>}
              </div>
            </div>

            <div className="p-5 border-t border-border flex gap-2">
              <button onClick={() => { setActiveTab('enviar'); selectTplForSend(viewingTpl); setViewingTpl(null); }}
                className="flex-1 py-2.5 rounded-xl bg-accent-green border-none text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
                <Send size={14} /> Usar Plantilla
              </button>
              <button onClick={() => { openEditTpl(viewingTpl); setViewingTpl(null); }}
                className="py-2.5 px-5 rounded-xl bg-bg-secondary border border-border text-text-secondary text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                <Edit3 size={14} /> Editar
              </button>
              <button onClick={() => setViewingTpl(null)}
                className="py-2.5 px-5 rounded-xl bg-bg-secondary border border-border text-text-secondary text-xs cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CATEGORIES ==================== */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
          <div className="bg-bg-card rounded-2xl border border-border w-full max-w-[400px] max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">Gestionar Categorías</h3>
              <button onClick={() => setShowCatModal(false)} className="p-1 rounded-lg bg-bg-secondary border-none cursor-pointer text-text-muted hover:text-text-primary">
                <X size={16} />
              </button>
            </div>

            <div className="p-5">
              {/* Add new category */}
              <div className="flex gap-2 mb-4">
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  placeholder="Nueva categoría..."
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-secondary border border-border text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newCatName.trim()) {
                      addCategory(newCatName.trim());
                      setNewCatName('');
                    }
                  }} />
                <button onClick={() => {
                    if (newCatName.trim()) {
                      addCategory(newCatName.trim());
                      setNewCatName('');
                    }
                  }}
                  disabled={!newCatName.trim()}
                  className="py-2 px-4 rounded-lg bg-accent-blue border-none text-white text-xs font-semibold cursor-pointer disabled:opacity-40">
                  <Plus size={14} />
                </button>
              </div>

              {/* List categories */}
              <div className="flex flex-col gap-1.5">
                {(whatsappCategories?.length > 0 ? whatsappCategories : DEFAULT_CATEGORIES).map(cat => (
                  <div key={cat} className="flex items-center gap-2 p-2.5 rounded-xl bg-bg-secondary border border-border">
                    {editingCat === cat ? (
                      <>
                        <input value={editingCatName} onChange={e => setEditingCatName(e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-bg-card border border-border text-sm"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && editingCatName.trim()) {
                              updateCategory(cat, editingCatName.trim());
                              setEditingCat(null);
                            }
                            if (e.key === 'Escape') setEditingCat(null);
                          }} />
                        <button onClick={() => {
                            if (editingCatName.trim()) {
                              updateCategory(cat, editingCatName.trim());
                              setEditingCat(null);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-accent-green/10 text-accent-green border-none cursor-pointer">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setEditingCat(null)}
                          className="p-1.5 rounded-lg bg-bg-card text-text-muted border-none cursor-pointer">
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{cat}</span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {templates.filter(t => t.categoria === cat).length} tpl
                        </span>
                        <button onClick={() => { setEditingCat(cat); setEditingCatName(cat); }}
                          className="p-1.5 rounded-lg bg-bg-card text-text-muted border-none cursor-pointer hover:text-accent-blue">
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => {
                            const count = templates.filter(t => t.categoria === cat).length;
                            if (count > 0) {
                              alert(`No se puede eliminar "${cat}" porque tiene ${count} plantilla(s) asociadas.`);
                              return;
                            }
                            if (confirm(`¿Eliminar la categoría "${cat}"?`)) deleteCategory(cat);
                          }}
                          className="p-1.5 rounded-lg bg-bg-card text-text-muted border-none cursor-pointer hover:text-accent-red">
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
