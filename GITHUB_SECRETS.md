# 🔐 GitHub Secrets - Variables de Entorno

Debes agregar **10 secretos** en GitHub para que todas las APIs funcionen.

Ve a: **https://github.com/FernandoDiazM5/Sistema_ISP/settings/secrets/actions**

---

## 📋 Lista Completa de Secretos

### 1️⃣ Google Sheets API (3 secretos)

| Nombre del Secret | Valor | Dónde obtenerlo |
|-------------------|-------|-----------------|
| `VITE_GOOGLE_CLIENT_ID` | Tu Client ID de Google OAuth | Google Cloud Console → APIs → Credenciales |
| `VITE_GOOGLE_API_KEY` | Tu API Key de Google | Google Cloud Console → APIs → Credenciales |
| `VITE_GOOGLE_SHEET_ID` | ID de tu hoja de cálculo | URL de Google Sheets (parte entre `/d/` y `/edit`) |

**Ejemplo Google Sheet ID:**
```
https://docs.google.com/spreadsheets/d/1abc123XYZ456/edit
                                    ↑ Este es el ID
```

---

### 2️⃣ Gemini AI (1 secreto)

| Nombre del Secret | Valor | Dónde obtenerlo |
|-------------------|-------|-----------------|
| `VITE_GEMINI_API_KEY` | Tu API Key de Gemini | Google AI Studio → Get API Key |

**Link directo:** https://aistudio.google.com/app/apikey

---

### 3️⃣ Firebase (6 secretos)

Obtén estos valores de tu proyecto Firebase:
**Firebase Console → Project Settings → Your apps → SDK setup and configuration**

| Nombre del Secret | Valor de Firebase Config |
|-------------------|--------------------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

**Ejemplo de configuración Firebase:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // → VITE_FIREBASE_API_KEY
  authDomain: "isp-sistema.firebaseapp.com",  // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "isp-sistema",         // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "isp-sistema.firebasestorage.app",  // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "467259964804", // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:467259964804:web:..."   // → VITE_FIREBASE_APP_ID
};
```

---

## ✅ Cómo Agregar los Secretos

1. Ve a: https://github.com/FernandoDiazM5/Sistema_ISP/settings/secrets/actions
2. Click en **"New repository secret"**
3. Ingresa el **Name** exactamente como está en la tabla (incluyendo `VITE_`)
4. Pega el **Value** correspondiente
5. Click en **"Add secret"**
6. Repite para los 10 secretos

---

## 🚀 Después de Agregar los Secretos

1. **Forzar nuevo deploy:**
   - Ve a: https://github.com/FernandoDiazM5/Sistema_ISP/actions
   - Click en "Deploy to GitHub Pages"
   - Click en "Run workflow" → "Run workflow"
   - Espera 2-3 minutos

2. **Limpiar localStorage:**
   ```javascript
   localStorage.clear();
   console.log('✅ localStorage limpiado');
   ```

3. **Recargar con Ctrl+F5**

---

## 📝 Notas Importantes

- ⚠️ **NUNCA** subas estos valores al código
- ✅ Las variables de entorno tienen **PRIORIDAD** sobre localStorage
- 🔄 Debes hacer un nuevo deploy cada vez que cambies un secreto
- 🔐 Los secretos están encriptados y solo GitHub Actions puede leerlos

---

## 🆘 Problemas Comunes

### Error: "invalid_client"
→ Verifica que `VITE_GOOGLE_CLIENT_ID` sea correcto y que las URIs autorizadas en Google Cloud Console incluyan: `https://fernandodiazm5.github.io`

### Error: "Firebase no configurado"
→ Verifica que todos los 6 secretos de Firebase estén agregados correctamente

### Error: "API Key de Gemini no configurada"
→ Verifica que `VITE_GEMINI_API_KEY` esté agregado

---

**Última actualización:** 14 de febrero de 2026
