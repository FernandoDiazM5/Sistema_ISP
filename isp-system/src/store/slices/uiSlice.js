import * as db from '../../utils/db';
import { pushSettings, pullSettings } from '../../api/firebase';

async function saveToDB(key, data) {
    try {
        await db.set(key, data);
    } catch (e) {
        console.error(`Error saving to DB (${key}):`, e);
    }
}

// Sync settings to Firebase (branding + customRolePermissions)
async function syncSettingsToCloud(get) {
    try {
        const { branding, customRolePermissions, whatsappCategories, theme } = get();
        await pushSettings({
            branding: branding || {},
            customRolePermissions: customRolePermissions || null,
            whatsappCategories: whatsappCategories || [],
            theme: theme || 'default',
        });
    } catch (e) {
        console.warn('Error syncing settings to cloud:', e);
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
        // BUGFIX: Sincronizar AMBOS estados (user y currentUser) para que canManageUsers() funcione
        set({ user, currentUser: user });
        if (user) localStorage.setItem('isp_user', JSON.stringify(user));
        else localStorage.removeItem('isp_user');
    },

    initAuth: () => {
        const saved = localStorage.getItem('isp_user');
        if (saved) {
            try {
                const userData = JSON.parse(saved);
                // BUGFIX: Sincronizar ambos estados al inicializar
                set({ user: userData, currentUser: userData, loading: false });
            }
            catch { localStorage.removeItem('isp_user'); set({ loading: false }); }
        } else {
            set({ loading: false });
        }
        // Load authorized emails on app start
        get().loadAuthorizedEmails?.();
    },

    logout: () => {
        // BUGFIX: Limpiar AMBOS estados al cerrar sesión
        set({ user: null, currentUser: null });
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
        // Auto-sync to Firebase
        setTimeout(() => syncSettingsToCloud(get), 100);
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

    // ===================== WHATSAPP CATEGORIES =====================
    whatsappCategories: [],

    addCategory: (name) => {
        set(s => {
            const base = s.whatsappCategories.length > 0 ? s.whatsappCategories : ['Cobranza', 'General', 'Soporte', 'Promoción'];
            if (base.includes(name)) return {};
            const newCats = [...base, name];
            saveToDB('isp_whatsappCategories', newCats);
            return { whatsappCategories: newCats };
        });
        setTimeout(() => syncSettingsToCloud(get), 100);
    },

    deleteCategory: (name) => {
        set(s => {
            const base = s.whatsappCategories.length > 0 ? s.whatsappCategories : ['Cobranza', 'General', 'Soporte', 'Promoción'];
            const newCats = base.filter(c => c !== name);
            saveToDB('isp_whatsappCategories', newCats);
            return { whatsappCategories: newCats };
        });
        setTimeout(() => syncSettingsToCloud(get), 100);
    },

    updateCategory: (oldName, newName) => {
        set(s => {
            const base = s.whatsappCategories.length > 0 ? s.whatsappCategories : ['Cobranza', 'General', 'Soporte', 'Promoción'];
            const newCats = base.map(c => c === oldName ? newName : c);
            saveToDB('isp_whatsappCategories', newCats);
            const newTemplates = s.templates.map(t => t.categoria === oldName ? { ...t, categoria: newName } : t);
            saveToDB('isp_templates', newTemplates);
            return { whatsappCategories: newCats, templates: newTemplates };
        });
        setTimeout(() => syncSettingsToCloud(get), 100);
    },

    // ===================== BRANDING =====================
    branding: {
        appName: 'ISP System',
        appVersion: 'v2.0 Mobile',
        appIcon: null,
        zoneName: 'CARABAYLLO',
        syncLabel: '',
    },
    setBranding: (updates) => {
        set(s => {
            const newBranding = { ...(s.branding || {}), ...updates };
            saveToDB('isp_branding', newBranding);
            return { branding: newBranding };
        });
        // Auto-sync to Firebase
        setTimeout(() => syncSettingsToCloud(get), 100);
    },

    // ===================== CUSTOM ROLE PERMISSIONS =====================
    customRolePermissions: null,
    setCustomRolePermissions: (permissions) => {
        set(() => {
            saveToDB('isp_customRolePermissions', permissions);
            return { customRolePermissions: permissions };
        });
        // Auto-sync to Firebase
        setTimeout(() => syncSettingsToCloud(get), 100);
    },

    // Load settings from Firebase on app start
    loadSettingsFromCloud: async () => {
        try {
            const cloudSettings = await pullSettings();
            if (cloudSettings) {
                const updates = {};
                if (cloudSettings.branding) updates.branding = cloudSettings.branding;
                if (cloudSettings.customRolePermissions !== undefined) updates.customRolePermissions = cloudSettings.customRolePermissions;
                if (cloudSettings.whatsappCategories) updates.whatsappCategories = cloudSettings.whatsappCategories;
                if (cloudSettings.theme) {
                    updates.theme = cloudSettings.theme;
                    if (cloudSettings.theme === 'default') {
                        document.documentElement.removeAttribute('data-theme');
                    } else {
                        document.documentElement.setAttribute('data-theme', cloudSettings.theme);
                    }
                }
                if (Object.keys(updates).length > 0) {
                    set(updates);
                    // Also persist locally
                    if (updates.branding) saveToDB('isp_branding', updates.branding);
                    if (updates.customRolePermissions !== undefined) saveToDB('isp_customRolePermissions', updates.customRolePermissions);
                    if (updates.whatsappCategories) saveToDB('isp_whatsappCategories', updates.whatsappCategories);
                    if (updates.theme) saveToDB('isp_theme', updates.theme);
                }
            }
        } catch (e) {
            console.warn('Error loading settings from cloud:', e);
        }
    },

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
