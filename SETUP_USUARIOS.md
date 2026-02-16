# 🔐 Guía de Configuración del Sistema de Usuarios

## 📋 Tabla de Contenidos
1. [Resumen del Sistema](#resumen-del-sistema)
2. [Crear Primer Usuario SUPER_ADMIN](#crear-primer-usuario-super_admin)
3. [Primer Login](#primer-login)
4. [Gestionar Usuarios](#gestionar-usuarios)
5. [Roles y Permisos](#roles-y-permisos)

---

## 🎯 Resumen del Sistema

El sistema ahora cuenta con:
- ✅ Autenticación con Google OAuth
- ✅ Verificación contra whitelist en Firebase
- ✅ 4 roles con permisos granulares (SUPER_ADMIN, ADMIN, TECNICO, VIEWER)
- ✅ Control de acceso a nivel de módulo
- ✅ Gestión completa de usuarios (CRUD)
- ✅ Activación/Desactivación de usuarios

---

## 🚀 Crear Primer Usuario SUPER_ADMIN

Tienes **3 opciones** para crear tu primer usuario:

### **Opción 1: Desde la Consola del Navegador** (Recomendada - Más Fácil)

1. **Inicia la aplicación** en modo desarrollo:
   ```bash
   cd isp-system
   npm run dev
   ```

2. **Abre la consola del navegador** (F12 → Consola)

3. **Ejecuta el comando** (reemplaza con tus datos):
   ```javascript
   initSuperAdmin('tu-email@gmail.com', 'Tu Nombre Completo')
   ```

   Ejemplo:
   ```javascript
   initSuperAdmin('fernando.diaz@gmail.com', 'Fernando Díaz')
   ```

4. **Verás el mensaje de confirmación**:
   ```
   ✅ ¡Usuario SUPER_ADMIN creado exitosamente!
   📧 Email: fernando.diaz@gmail.com
   👤 Nombre: Fernando Díaz
   🔑 UID: user_1739635200_xyz123

   🎉 Ahora puedes iniciar sesión con tu cuenta de Google
   ```

5. **¡Listo!** Ahora puedes hacer login con ese email.

---

### **Opción 2: Desde Firebase Console**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Crea la colección `users`
5. Agrega un documento con estos datos:

```javascript
// ID del documento: Genera uno automático o usa: user_admin_inicial

{
  "email": "tu-email@gmail.com",
  "nombre": "Tu Nombre Completo",
  "foto": null,
  "rol": "SUPER_ADMIN",
  "permisos": {
    "dashboard": "admin",
    "clientes": "admin",
    "tickets": "admin",
    "averias": "admin",
    "instalaciones": "admin",
    "visitas": "admin",
    "tecnicos": "admin",
    "equipos": "admin",
    "planta_externa": "admin",
    "post_venta": "admin",
    "soporte_remoto": "admin",
    "requerimientos": "admin",
    "whatsapp": "admin",
    "reportes": "admin",
    "configuracion": "admin",
    "usuarios": "admin"
  },
  "activo": true,
  "createdAt": "2025-02-15T10:00:00.000Z",
  "updatedAt": "2025-02-15T10:00:00.000Z",
  "createdBy": "manual_init",
  "ultimoAcceso": null
}
```

**⚠️ Importante:**
- El campo `email` debe coincidir exactamente con tu cuenta de Google
- Usa minúsculas para el email

---

### **Opción 3: Script de Node.js** (Avanzada)

Si prefieres un script de Node.js, puedo crearlo. Avísame.

---

## 🔑 Primer Login

Una vez creado tu usuario SUPER_ADMIN:

1. **Ve a la aplicación** (http://localhost:5173 en desarrollo)
2. **Haz clic en "Iniciar sesión con Google"**
3. **Selecciona tu cuenta de Google** (la que registraste como SUPER_ADMIN)
4. **El sistema verificará:**
   - ✅ Que el email existe en Firebase
   - ✅ Que la cuenta está activa
   - ✅ Cargará tu rol y permisos
5. **¡Acceso concedido!** Serás redirigido al Dashboard

**Si ves el error:** *"No tienes autorización para acceder a este sistema"*
- Verifica que el email en Firebase coincida EXACTAMENTE con tu cuenta de Google
- Verifica que el campo `activo` sea `true`
- Revisa la consola del navegador para más detalles

---

## 👥 Gestionar Usuarios

Una vez logueado como SUPER_ADMIN:

### **Ver módulo de Usuarios**
1. En el menú lateral, ve a **Sistema → Usuarios**
2. Solo los SUPER_ADMIN ven esta opción

### **Crear un nuevo usuario**
1. Haz clic en **"Crear Usuario"**
2. Completa el formulario:
   - **Email:** Cuenta de Google del usuario (debe existir)
   - **Nombre Completo:** Nombre real del usuario
   - **Foto:** URL opcional (o dejarlo vacío)
   - **Rol:** Selecciona el rol apropiado
3. Haz clic en **"Crear Usuario"**
4. El usuario ahora puede hacer login con su cuenta de Google

### **Editar un usuario**
- Haz clic en el ícono ✏️ (Editar)
- Modifica nombre, foto o rol
- **No puedes cambiar el email** una vez creado

### **Activar/Desactivar usuario**
- Haz clic en el ícono 👁️ o 🚫
- Usuarios inactivos NO pueden hacer login
- **No puedes desactivarte a ti mismo**

### **Permisos personalizados**
1. Haz clic en el ícono ⚙️ (Permisos)
2. Verás todos los módulos del sistema
3. Para cada módulo, selecciona el nivel:
   - **Sin Acceso:** No puede ver el módulo
   - **Lectura:** Solo puede ver información
   - **Escritura:** Puede ver y modificar
   - **Admin:** Control total del módulo
4. Haz clic en **"Guardar Permisos"**

### **Eliminar usuario**
- Haz clic en el ícono 🗑️ (Eliminar)
- Confirma la acción
- **No puedes eliminarte a ti mismo**

---

## 🎭 Roles y Permisos

### **Matriz de Roles Predefinidos**

| Módulo | SUPER_ADMIN | ADMIN | TECNICO | VIEWER |
|--------|-------------|-------|---------|--------|
| Dashboard | Admin | Admin | Read | Read |
| Clientes | Admin | Admin | Write | Read |
| Tickets | Admin | Admin | Write | Read |
| Averías | Admin | Admin | Write | Read |
| Instalaciones | Admin | Admin | Write | Read |
| Visitas Técnicas | Admin | Admin | Write | Read |
| Técnicos | Admin | Admin | Read | Read |
| Equipos | Admin | Admin | Write | Read |
| Planta Externa | Admin | Admin | Write | Read |
| Post-Venta | Admin | Admin | Write | Read |
| Soporte Remoto | Admin | Admin | Write | Read |
| Requerimientos | Admin | Admin | Write | Read |
| WhatsApp | Admin | Admin | Write | Read |
| Reportes | Admin | Admin | Read | Read |
| Configuración | Admin | Write | None | None |
| **Usuarios** | **Admin** | **None** | **None** | **None** |

### **Descripción de Roles**

#### 🟣 SUPER_ADMIN (Super Administrador)
- **Acceso total** a todos los módulos
- **Único rol** que puede gestionar usuarios
- Puede crear, editar y eliminar otros usuarios
- Puede asignar cualquier rol
- **Úsalo con cuidado** - Máximo poder

#### 🔵 ADMIN (Administrador)
- Acceso total **operativo**
- Puede modificar configuración básica
- **No puede** gestionar usuarios
- Ideal para gerentes o jefes de operaciones

#### 🟢 TECNICO (Técnico)
- Acceso de **escritura** a módulos operativos
- Solo **lectura** en reportes y técnicos
- Sin acceso a configuración ni usuarios
- Ideal para técnicos de campo

#### ⚪ VIEWER (Visualizador)
- **Solo lectura** en todos los módulos
- Sin acceso a configuración ni usuarios
- Ideal para supervisores o auditores

---

## 🔒 Características de Seguridad

### **Whitelist basada en Firebase**
- Solo usuarios registrados en Firebase pueden acceder
- Login con Google verifica contra la colección `users`
- Usuarios no registrados reciben mensaje de error

### **Control de Estado**
- Usuarios pueden ser **activados** o **desactivados**
- Usuarios desactivados no pueden hacer login
- Útil para suspender acceso temporalmente

### **Auditoría**
Cada usuario tiene rastreo completo:
- `createdAt` - Fecha de creación
- `createdBy` - Quién lo creó
- `updatedAt` - Última modificación
- `ultimoAcceso` - Última vez que hizo login

### **Protecciones**
- ✅ No puedes desactivarte a ti mismo
- ✅ No puedes eliminarte a ti mismo
- ✅ Solo SUPER_ADMIN ve el módulo de usuarios
- ✅ Permisos se verifican en cada operación

---

## 🐛 Solución de Problemas

### **Error: "No tienes autorización para acceder"**
**Causa:** El email no existe en Firebase o está inactivo

**Solución:**
1. Verifica que el usuario existe en Firestore → colección `users`
2. Verifica que el campo `email` coincida EXACTAMENTE
3. Verifica que `activo` sea `true`
4. Prueba hacer logout y login de nuevo

### **Error: "Firebase no configurado"**
**Causa:** Variables de entorno de Firebase no están configuradas

**Solución:**
1. Verifica que los secrets de GitHub están configurados:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
2. Redeploya la aplicación

### **Error: "initSuperAdmin is not a function"**
**Causa:** Solo funciona en modo desarrollo

**Solución:**
- Asegúrate de estar corriendo `npm run dev`
- Recarga la página (F5)
- Si persiste, usa la Opción 2 (Firebase Console)

### **No veo el módulo "Usuarios"**
**Causa:** No eres SUPER_ADMIN

**Solución:**
- Solo usuarios con rol `SUPER_ADMIN` ven este módulo
- Verifica tu rol en Firebase
- Si necesitas cambiar tu rol, edítalo manualmente en Firebase Console

---

## 📞 Próximos Pasos

Una vez configurado el sistema de usuarios:

1. ✅ Crea tu cuenta SUPER_ADMIN
2. ✅ Haz login por primera vez
3. ✅ Ve a **Sistema → Usuarios**
4. ✅ Crea cuentas para tu equipo
5. ✅ Asigna roles apropiados
6. ✅ Prueba el acceso con diferentes usuarios
7. ✅ Personaliza permisos si es necesario

---

## 🎉 ¡Todo Listo!

Tu sistema ahora está completamente protegido con:
- 🔐 Autenticación con Google
- 👥 Gestión de usuarios
- 🎭 Roles y permisos granulares
- 🛡️ Control de acceso completo

**¿Preguntas?** Revisa esta guía o consulta la documentación de Firebase.
