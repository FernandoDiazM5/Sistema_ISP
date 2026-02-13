# GUÍA PASO A PASO — Configurar Google Cloud Console para OAuth
## + Arquitectura completa del proyecto React ISP

**Fecha:** 07 de Febrero, 2026

---

## PARTE 1: CREAR PROYECTO EN GOOGLE CLOUD CONSOLE

### Paso 1 — Entrar a Google Cloud Console
1. Abre tu navegador y ve a: **https://console.cloud.google.com**
2. Inicia sesión con tu cuenta de Gmail (la misma del Drive donde tienes los Excel)
3. Si es tu primera vez, acepta los términos de servicio

### Paso 2 — Crear un Proyecto Nuevo
1. Arriba a la izquierda, haz clic en el selector de proyecto (dice "Seleccionar un proyecto")
2. Clic en **"NUEVO PROYECTO"**
3. Nombre del proyecto: **`ISP-Sistema-Gestion`**
4. Organización: déjalo en "Sin organización"
5. Clic en **"CREAR"**
6. Espera 10-15 segundos a que se cree
7. Asegúrate de que esté seleccionado el proyecto nuevo arriba a la izquierda

### Paso 3 — Habilitar Google Sheets API
1. En el menú lateral izquierdo → **"APIs y servicios"** → **"Biblioteca"**
2. En el buscador escribe: **Google Sheets API**
3. Clic en el resultado "Google Sheets API"
4. Clic en el botón azul **"HABILITAR"**
5. Espera a que se active

### Paso 4 — Habilitar Google Drive API
1. Regresa a la Biblioteca de APIs
2. Busca: **Google Drive API**
3. Clic en "Google Drive API"
4. Clic en **"HABILITAR"**

### Paso 5 — Configurar la Pantalla de Consentimiento OAuth
1. Menú lateral → **"APIs y servicios"** → **"Pantalla de consentimiento OAuth"**
2. Tipo de usuario: Selecciona **"Externo"** → Clic en **"CREAR"**
3. Llena el formulario:
   - Nombre de la aplicación: **`Sistema ISP Gestión`**
   - Correo de asistencia: **tu correo de Gmail**
   - Logo: (opcional, puedes subirlo después)
   - Dominio de la aplicación: déjalo vacío por ahora
   - Correo del desarrollador: **tu correo de Gmail**
4. Clic en **"GUARDAR Y CONTINUAR"**
5. **Permisos (Scopes):** Clic en "AGREGAR O QUITAR PERMISOS"
   - Busca y marca:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `../auth/spreadsheets` (para leer/escribir Google Sheets)
     - `../auth/drive.file` (para acceder a archivos de Drive)
   - Clic en **"ACTUALIZAR"**
6. Clic en **"GUARDAR Y CONTINUAR"**
7. **Usuarios de prueba:** Clic en **"ADD USERS"**
   - Agrega los correos de las 4-6 personas que usarán el sistema:
     - tu-correo@gmail.com
     - asesor1@gmail.com
     - tecnico1@gmail.com
     - (etc.)
   - Clic en **"AGREGAR"**
8. Clic en **"GUARDAR Y CONTINUAR"**

### Paso 6 — Crear Credenciales OAuth 2.0
1. Menú lateral → **"APIs y servicios"** → **"Credenciales"**
2. Clic en **"+ CREAR CREDENCIALES"** → **"ID de cliente de OAuth"**
3. Tipo de aplicación: **"Aplicación web"**
4. Nombre: **`ISP Web App`**
5. **Orígenes de JavaScript autorizados** (agrega TODOS estos):
   - `http://localhost:5173` (para desarrollo local con Vite)
   - `http://localhost:3000` (alternativo)
   - `https://TU-USUARIO.github.io` (para GitHub Pages - cambia TU-USUARIO)
6. **URIs de redireccionamiento autorizados** (agrega TODOS estos):
   - `http://localhost:5173`
   - `http://localhost:3000`
   - `https://TU-USUARIO.github.io/nombre-del-repo`
7. Clic en **"CREAR"**
8. **¡IMPORTANTE!** Te mostrará:
   - **ID de cliente:** `123456789-abc.apps.googleusercontent.com`
   - **Secreto de cliente:** (no lo necesitas para OAuth en frontend)
9. **COPIA EL ID DE CLIENTE** — lo necesitarás en el código React

### Paso 7 — Obtener el ID de tu Google Sheet
1. Abre tu Google Sheet (el Excel que subiste a Drive)
2. Mira la URL: `https://docs.google.com/spreadsheets/d/AQUI_ESTA_EL_ID/edit`
3. Copia ese ID largo (ejemplo: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`)

### RESUMEN — Lo que necesitas guardar:
```
GOOGLE_CLIENT_ID = "tu-client-id.apps.googleusercontent.com"
GOOGLE_SHEET_ID  = "el-id-de-tu-google-sheet"
```

Estos 2 valores irán en el archivo `.env` de tu proyecto React.

---

## PARTE 2: ESTRUCTURA DEL PROYECTO

### Árbol de archivos del MVP:
```
isp-system/
├── public/
│   └── index.html
├── src/
│   ├── auth/
│   │   ├── GoogleAuthProvider.jsx    ← Proveedor de autenticación
│   │   ├── LoginPage.jsx            ← Pantalla de login
│   │   ├── ProtectedRoute.jsx       ← Protege rutas
│   │   └── roles.js                 ← Definición de roles y permisos
│   ├── api/
│   │   ├── googleSheets.js          ← Conexión con Google Sheets API
│   │   └── dataTransformer.js       ← Motor de limpieza de datos
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx          ← Menú lateral
│   │   │   ├── Header.jsx           ← Header con usuario y logout
│   │   │   └── MainLayout.jsx       ← Layout principal
│   │   ├── common/
│   │   │   ├── KPICard.jsx          ← Tarjeta de indicador
│   │   │   ├── StatusBadge.jsx      ← Badge de estado con color
│   │   │   ├── DataTable.jsx        ← Tabla reutilizable
│   │   │   └── LoadingSpinner.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.jsx    ← Vista principal
│   │   │   ├── ClientesPorTecnologia.jsx
│   │   │   ├── EstadoConexiones.jsx
│   │   │   ├── DeudaResumen.jsx
│   │   │   └── NodosStatus.jsx
│   │   └── clientes/
│   │       ├── ClientesPage.jsx     ← Lista de clientes
│   │       ├── ClienteDetalle.jsx   ← Ficha completa
│   │       ├── ClienteForm.jsx      ← Crear/Editar
│   │       └── ClienteFiltros.jsx   ← Filtros avanzados
│   ├── hooks/
│   │   ├── useGoogleAuth.js
│   │   ├── useSheetData.js
│   │   └── useClienteData.js
│   ├── store/
│   │   └── useStore.js              ← Zustand store
│   ├── utils/
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── App.jsx
│   └── main.jsx
├── .env                              ← Variables de entorno
├── .env.example                      ← Ejemplo sin datos reales
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## PARTE 3: SISTEMA DE ROLES

### Roles definidos para 4-6 personas:

| Rol | Acceso | Ejemplo de usuario |
|-----|--------|--------------------|
| **Administrador** | Todo el sistema + configuración + importar/exportar | Tú (dueño) |
| **Supervisor** | Dashboard + Clientes + Tickets + Reportes (sin config) | Encargado de turno |
| **Asesor Soporte** | Clientes (lectura) + Tickets + Soporte Remoto | Personal de call center |
| **Técnico** | Visitas asignadas + Registro de trabajo + Equipos | Técnicos de campo |

### Cómo se asignan los roles:
Los correos autorizados y sus roles se guardan en una hoja del Google Sheet llamada "tb_Usuarios_Auth":

| Email | Rol | Nombre | Estado |
|-------|-----|--------|--------|
| tu-correo@gmail.com | Administrador | Fernando Diaz | Activo |
| asesor1@gmail.com | Asesor Soporte | Maria Lopez | Activo |
| tecnico1@gmail.com | Técnico | Jose Mendoza | Activo |

Cuando alguien hace login con Google:
1. El sistema verifica que su email esté en la lista
2. Si está → entra con su rol asignado
3. Si NO está → muestra "No autorizado, contacte al administrador"

---

## PARTE 4: CONFIGURAR GITHUB PAGES

### Paso 1 — Crear repositorio
1. Ve a **https://github.com/new**
2. Nombre: **`isp-system`** (o el que prefieras)
3. Visibilidad: **Private** (IMPORTANTE por los datos de clientes)
4. Clic en "Create repository"

### Paso 2 — Configurar GitHub Pages
1. En tu repositorio → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Esto se configurará automáticamente con el workflow que incluiré en el proyecto

### Paso 3 — Variables de entorno en GitHub
1. En tu repositorio → **Settings** → **Secrets and variables** → **Actions**
2. Clic en "New repository secret"
3. Agrega:
   - Name: `VITE_GOOGLE_CLIENT_ID` → Value: tu Client ID de Google
   - Name: `VITE_GOOGLE_SHEET_ID` → Value: tu Sheet ID

### Nota sobre repositorio privado + GitHub Pages:
GitHub Pages funciona con repos privados si tienes **GitHub Pro** (gratis para estudiantes) o **GitHub Free** (Pages es gratis pero público). Alternativas gratuitas con repo privado:
- **Netlify** (gratis, deploy automático desde GitHub)
- **Vercel** (gratis, deploy automático desde GitHub)
- **Cloudflare Pages** (gratis, deploy automático)

Las 3 opciones son igual de fáciles que GitHub Pages pero permiten repo privado gratis.
