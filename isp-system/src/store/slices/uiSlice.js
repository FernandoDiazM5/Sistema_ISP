import * as db from '../../utils/db';

async function saveToDB(key, data) {
    try {
        await db.set(key, data);
    } catch (e) {
        console.error(`Error saving to DB (${key}):`, e);
    }
}

function getNextId(collection, prefix, idField = 'id') {
    if (!collection || collection.length === 0) return `${prefix}-001`;
    const maxId = collection.reduce((max, item) => {
        if (!item[idField]) return max;
        const parts = item[idField].split('-');
        const num = parseInt(parts[parts.length - 1] || 0);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `${prefix}-${String(maxId + 1).padStart(3, '0')}`;
}

export const createUISlice = (set, get) => ({
    // ===================== AUTH STATE =====================
    user: null,
    loading: true,

    setUser: (user) => {
        set({ user });
        if (user) localStorage.setItem('isp_user', JSON.stringify(user));
        else localStorage.removeItem('isp_user');
    },

    initAuth: () => {
        const saved = localStorage.getItem('isp_user');
        if (saved) {
            try { set({ user: JSON.parse(saved), loading: false }); }
            catch { localStorage.removeItem('isp_user'); set({ loading: false }); }
        } else {
            set({ loading: false });
        }
    },

    logout: () => {
        set({ user: null });
        localStorage.removeItem('isp_user');
    },

    // ===================== THEME =====================
    theme: 'default',
    setTheme: (theme) => {
        set({ theme });
        saveToDB('isp_theme', theme);
        if (theme === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    },

    // ===================== NAVIGATION =====================
    activePage: 'dashboard',
    setActivePage: (page) => set({ activePage: page }),

    // ===================== CROSS-MODULE PREFILL =====================
    prefillVisita: null,
    setPrefillVisita: (data) => set({ prefillVisita: data }),
    clearPrefillVisita: () => set({ prefillVisita: null }),

    prefillSoporte: null,
    setPrefillSoporte: (data) => set({ prefillSoporte: data }),
    clearPrefillSoporte: () => set({ prefillSoporte: null }),

    // ===================== TEMPLATES / WHATSAPP =====================
    templates: [],

    addTemplate: (tpl) => set(s => {
        const newId = getNextId(s.templates, 'TPL');
        const newTemplates = [{ ...tpl, id: newId, uso: 0 }, ...s.templates];
        saveToDB('isp_templates', newTemplates);
        return { templates: newTemplates };
    }),

    updateTemplate: (id, updates) => set(s => {
        const newTemplates = s.templates.map(t => t.id === id ? { ...t, ...updates } : t);
        saveToDB('isp_templates', newTemplates);
        return { templates: newTemplates };
    }),

    deleteTemplate: (id) => set(s => {
        const newTemplates = s.templates.filter(t => t.id !== id);
        saveToDB('isp_templates', newTemplates);
        return { templates: newTemplates };
    }),

    incrementTemplateUse: (id) => set(s => {
        const newTemplates = s.templates.map(t => t.id === id ? { ...t, uso: (t.uso || 0) + 1 } : t);
        saveToDB('isp_templates', newTemplates);
        return { templates: newTemplates };
    }),

    whatsappLogs: [],
    addWhatsappLog: (log) => set(s => {
        const newId = getNextId(s.whatsappLogs, 'WA');
        const newLogs = [{ ...log, id: newId, fecha: new Date().toISOString() }, ...s.whatsappLogs];
        saveToDB('isp_whatsappLogs', newLogs);
        return { whatsappLogs: newLogs };
    }),

    campaignActive: false, campaignQueue: [], campaignIndex: 0,
    setCampaign: (data) => set(data),

    // ===================== FILES / IMAGES (MOCK) =====================
    uploadImage: async (file, path) => {
        console.log(`[STORE] Mock uploading ${file.name} to ${path}`);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(URL.createObjectURL(file));
            }, 800);
        });
    },

    // ===================== TOAST NOTIFICATIONS =====================
    toasts: [],
    addToast: (toast) => set(s => {
        const id = Date.now() + Math.random();
        const newToast = { id, duration: 3000, type: 'success', ...toast };
        return { toasts: [...s.toasts, newToast] };
    }),
    removeToast: (id) => set(s => ({
        toasts: s.toasts.filter(t => t.id !== id)
    })),
});
