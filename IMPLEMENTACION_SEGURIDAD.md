# 🔐 GUÍA COMPLETA DE IMPLEMENTACIÓN - SEGURIDAD Y CONFIGURACIÓN

## 📋 RESUMEN DE CAMBIOS IMPLEMENTADOS

### ✅ Ya Completado:
1. ✅ **geminiAI.js** - Ahora lee API key desde localStorage
2. ✅ **driveManager.js** - Ahora lee Client ID y API Key desde localStorage

### 🚀 Pendiente de Implementar:
3. ⏳ Actualizar **ConfiguracionPage** con campos de API keys
4. ⏳ Agregar **botón de cerrar sesión**
5. ⏳ Crear **módulo de gestión de usuarios autorizados**

---

## 🔧 PARTE 1: ACTUALIZAR CONFIGURACIONPAGE

### Agregar estos campos en la sección de APIs:

```jsx
// En ConfiguracionPage.jsx, agregar una nueva sección:

{/* Sección de APIs */}
<Card className="p-6">
  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
    <Key className="w-5 h-5" />
    Configuración de APIs
  </h2>

  {/* Gemini AI */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      Gemini AI API Key
    </label>
    <input
      type="password"
      value={localStorage.getItem('isp_gemini_api_key') || ''}
      onChange={(e) => {
        localStorage.setItem('isp_gemini_api_key', e.target.value);
        showToast('API Key de Gemini guardada', 'success');
      }}
      placeholder="AIza..."
      className="w-full p-2 border rounded"
    />
    <p className="text-xs text-gray-500 mt-1">
      Obtén tu API key en{' '}
      <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-500 underline">
        Google AI Studio
      </a>
    </p>
  </div>

  {/* Google Client ID */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      Google OAuth Client ID
    </label>
    <input
      type="text"
      value={localStorage.getItem('isp_google_client_id') || ''}
      onChange={(e) => {
        localStorage.setItem('isp_google_client_id', e.target.value);
        showToast('Client ID guardado', 'success');
      }}
      placeholder="123456789-abc....apps.googleusercontent.com"
      className="w-full p-2 border rounded"
    />
  </div>

  {/* Google API Key */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      Google API Key
    </label>
    <input
      type="password"
      value={localStorage.getItem('isp_google_api_key') || ''}
      onChange={(e) => {
        localStorage.setItem('isp_google_api_key', e.target.value);
        showToast('Google API Key guardada', 'success');
      }}
      placeholder="AIza..."
      className="w-full p-2 border rounded"
    />
  </div>
</Card>
```

---

## 🚪 PARTE 2: AGREGAR BOTÓN DE CERRAR SESIÓN

### En MainLayout.jsx, agregar el botón:

```jsx
import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/GoogleAuthProvider';

// Dentro del componente:
const { logout } = useAuth();

// Agregar en el header/sidebar:
<button
  onClick={() => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  }}
  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
>
  <LogOut className="w-5 h-5" />
  Cerrar Sesión
</button>
```

### Verificar que `GoogleAuthProvider` tenga la función `logout`:

```jsx
// En GoogleAuthProvider.jsx, agregar si no existe:

const logout = useCallback(() => {
  // Limpiar usuario del store
  useStore.getState().setUser(null);

  // Limpiar localStorage (opcional)
  localStorage.removeItem('isp_user');

  // Revocar token de Google (opcional)
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}, []);

// Y en el return del Provider:
return (
  <AuthContext.Provider value={{ user, loading, logout }}>
    {children}
  </AuthContext.Provider>
);
```

---

## 👥 PARTE 3: MÓDULO DE USUARIOS AUTORIZADOS

### Crear archivo: `src/store/slices/authSlice.js`

```javascript
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
    if (!current.includes(email.toLowerCase())) {
      const updated = [...current, email.toLowerCase()];
      set({ authorizedEmails: updated });
      localStorage.setItem('isp_authorized_emails', JSON.stringify(updated));
      return true;
    }
    return false;
  },

  // Remover correo autorizado
  removeAuthorizedEmail: (email) => {
    const updated = get().authorizedEmails.filter(e => e !== email.toLowerCase());
    set({ authorizedEmails: updated });
    localStorage.setItem('isp_authorized_emails', JSON.stringify(updated));
  },

  // Verificar si un correo está autorizado
  isEmailAuthorized: (email) => {
    const authorized = get().authorizedEmails;
    // Si no hay emails autorizados, permitir cualquiera (modo desarrollo)
    if (authorized.length === 0) return true;
    // Si hay lista, verificar
    return authorized.includes(email?.toLowerCase());
  },
});
```

### Integrar en `useStore.js`:

```javascript
import { createAuthSlice } from './slices/authSlice';

const useStore = create((set, get) => ({
  ...createAuthSlice(set, get),
  // ... resto del store
}));
```

### Crear componente de administración: `src/components/configuracion/AuthorizedUsersManager.jsx`

```jsx
import { useState } from 'react';
import { Mail, Plus, Trash2, Shield } from 'lucide-react';
import useStore from '../../store/useStore';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function AuthorizedUsersManager() {
  const { authorizedEmails, addAuthorizedEmail, removeAuthorizedEmail } = useStore();
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = () => {
    if (!newEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert('Por favor ingresa un correo válido');
      return;
    }

    if (addAuthorizedEmail(newEmail)) {
      setNewEmail('');
      alert('Correo agregado exitosamente');
    } else {
      alert('Este correo ya está en la lista');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-500" />
        Usuarios Autorizados
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Solo los correos en esta lista podrán acceder al sistema.
        Si la lista está vacía, cualquier correo puede acceder (modo desarrollo).
      </p>

      {/* Agregar nuevo correo */}
      <div className="flex gap-2 mb-4">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="correo@ejemplo.com"
          className="flex-1 p-2 border rounded"
        />
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Agregar
        </Button>
      </div>

      {/* Lista de correos autorizados */}
      <div className="space-y-2">
        {authorizedEmails.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay correos autorizados</p>
            <p className="text-xs">(Modo desarrollo: todos pueden acceder)</p>
          </div>
        ) : (
          authorizedEmails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-mono text-sm">{email}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar ${email}?`)) {
                    removeAuthorizedEmail(email);
                  }
                }}
                className="text-red-500 hover:bg-red-50 p-2 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
```

### Integrar en `ConfiguracionPage.jsx`:

```jsx
import AuthorizedUsersManager from './AuthorizedUsersManager';

// Agregar en el render:
<AuthorizedUsersManager />
```

### Proteger el login en `GoogleAuthProvider.jsx`:

```jsx
const handleGoogleSignIn = async (response) => {
  try {
    const decoded = jwt_decode(response.credential);
    const userEmail = decoded.email;

    // VERIFICAR SI EL CORREO ESTÁ AUTORIZADO
    const isAuthorized = useStore.getState().isEmailAuthorized(userEmail);

    if (!isAuthorized) {
      alert('No tienes autorización para acceder a este sistema. Contacta al administrador.');
      return;
    }

    // Si está autorizado, continuar con el login
    const user = {
      email: userEmail,
      name: decoded.name,
      picture: decoded.picture,
      accessToken: response.credential,
    };

    setUser(user);
    useStore.getState().setUser(user);
  } catch (error) {
    console.error('Error en login:', error);
  }
};
```

---

## 📚 PARTE 4: CONFIGURACIÓN DE GOOGLE OAUTH

### Paso 1: Ir a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombra el proyecto: "ISP Sistema"

### Paso 2: Habilitar APIs

1. En el menú lateral: **APIs y servicios** → **Biblioteca**
2. Busca y habilita:
   - ✅ **Google Drive API**
   - ✅ **Google Sheets API**
   - ✅ **Google Identity Services** (para OAuth)

### Paso 3: Crear Credenciales OAuth

1. Ve a: **APIs y servicios** → **Credenciales**
2. Click en **+ CREAR CREDENCIALES** → **ID de cliente de OAuth 2.0**
3. Tipo de aplicación: **Aplicación web**
4. Nombre: "ISP Sistema Web"
5. **Orígenes de JavaScript autorizados:**
   ```
   http://localhost:5173
   http://localhost:4173
   https://fernandodiazm5.github.io
   ```
6. **URIs de redireccionamiento autorizados:**
   ```
   http://localhost:5173
   https://fernandodiazm5.github.io/Sistema_ISP/
   ```
7. Click **CREAR**
8. **COPIA** el Client ID que te muestra

### Paso 4: Crear API Key

1. En la misma página de Credenciales
2. Click en **+ CREAR CREDENCIALES** → **Clave de API**
3. **COPIA** la API Key
4. (Opcional) Click en **RESTRINGIR CLAVE** y limita a:
   - Google Drive API
   - Google Sheets API

### Paso 5: Configurar Pantalla de Consentimiento

1. Ve a: **Pantalla de consentimiento de OAuth**
2. Tipo de usuario: **Externo** (si es para uso público) o **Interno** (si es solo para tu organización)
3. Completa:
   - **Nombre de la aplicación:** ISP Sistema
   - **Correo de asistencia:** tu-correo@gmail.com
   - **Logotipo:** (opcional)
   - **Dominios autorizados:** github.io
4. **Ámbitos:** No necesitas agregar ámbitos sensibles por ahora
5. **Usuarios de prueba:** Agrega tu correo si estás en modo desarrollo

### Paso 6: Ingresar Credenciales en la App

1. Inicia sesión en tu aplicación: https://fernandodiazm5.github.io/Sistema_ISP/
2. Ve a **Configuración**
3. En la sección "Configuración de APIs":
   - **Gemini AI API Key:** (obtén de https://makersuite.google.com/app/apikey)
   - **Google OAuth Client ID:** Pega el Client ID del Paso 3
   - **Google API Key:** Pega la API Key del Paso 4

---

## 🔐 PARTE 5: CONFIGURAR USUARIOS AUTORIZADOS

### Primera vez:

1. Inicia sesión en la app
2. Ve a **Configuración** → **Usuarios Autorizados**
3. Agrega tu correo principal
4. Agrega los correos de tus técnicos/administradores

### Agregar usuarios:

```
tu-correo@gmail.com
tecnico1@empresa.com
admin@empresa.com
```

### Modo Desarrollo vs Producción:

- **Sin correos autorizados:** Cualquiera puede acceder (útil para desarrollo)
- **Con correos autorizados:** Solo esos correos pueden acceder (producción)

---

## ✅ CHECKLIST FINAL

- [ ] Modificar `geminiAI.js` ✅ (Ya hecho)
- [ ] Modificar `driveManager.js` ✅ (Ya hecho)
- [ ] Actualizar `ConfiguracionPage.jsx` con campos de APIs
- [ ] Agregar botón de cerrar sesión en `MainLayout.jsx`
- [ ] Crear `authSlice.js`
- [ ] Crear `AuthorizedUsersManager.jsx`
- [ ] Integrar verificación de correos autorizados en `GoogleAuthProvider.jsx`
- [ ] Configurar Google Cloud Console
- [ ] Crear credenciales OAuth
- [ ] Ingresar credenciales en la app
- [ ] Agregar usuarios autorizados

---

## 🚨 NOTAS IMPORTANTES

1. **Las API keys en localStorage son visibles:** Esto es normal para apps cliente (frontend). No es menos seguro que variables de entorno en un sitio estático.

2. **Usuarios autorizados se guardan en localStorage:** Esto significa que si alguien borra localStorage, la lista se pierde. Para producción seria, considera usar Firebase para guardar la lista de usuarios autorizados.

3. **Google OAuth requiere dominios autorizados:** Asegúrate de agregar todos los dominios donde desplegarás la app.

4. **Gemini AI tiene límites de uso gratuito:** Revisa los límites en https://ai.google.dev/pricing

---

¿Necesitas ayuda con alguna de estas implementaciones específicas?
