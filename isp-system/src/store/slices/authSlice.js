// Slice para gestión de usuarios autorizados
export const createAuthSlice = (set, get) => ({
  // Lista de correos autorizados
  authorizedEmails: [],

  // Cargar correos autorizados desde localStorage
  loadAuthorizedEmails: () => {
    const stored = localStorage.getItem('isp_authorized_emails');
    if (stored) {
      try {
        set({ authorizedEmails: JSON.parse(stored) });
      } catch (e) {
        console.error('Error loading authorized emails:', e);
      }
    }
  },

  // Agregar correo autorizado
  addAuthorizedEmail: (email) => {
    const current = get().authorizedEmails;
    const emailLower = email.toLowerCase().trim();

    if (!current.includes(emailLower)) {
      const updated = [...current, emailLower];
      set({ authorizedEmails: updated });
      localStorage.setItem('isp_authorized_emails', JSON.stringify(updated));
      return true;
    }
    return false;
  },

  // Remover correo autorizado
  removeAuthorizedEmail: (email) => {
    const updated = get().authorizedEmails.filter(e => e !== email.toLowerCase().trim());
    set({ authorizedEmails: updated });
    localStorage.setItem('isp_authorized_emails', JSON.stringify(updated));
  },

  // Verificar si un correo está autorizado
  isEmailAuthorized: (email) => {
    const authorized = get().authorizedEmails;
    // Si no hay emails autorizados, permitir cualquiera (modo desarrollo)
    if (authorized.length === 0) return true;
    // Si hay lista, verificar
    return authorized.includes(email?.toLowerCase()?.trim());
  },
});
