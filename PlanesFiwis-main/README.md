# 🚀 Volante FIWIS - Promoción Escolar con IA

Página promocional con asesor virtual integrado usando Gemini AI.

## ⚡ CONFIGURACIÓN RÁPIDA

### ✅ Lo que YA tienes configurado:
- ✅ Secret en GitHub: `GEMINI_API_KEY`
- ✅ API Key de Gemini creada
- ✅ Repositorio en GitHub

### 🔧 Pasos para que funcione:

#### 1. Subir los archivos correctos

```bash
# IMPORTANTE: Asegúrate de estar en la carpeta del proyecto

# Si config.js existe en tu carpeta, BÓRRALO:
rm config.js  # (si existe)

# Luego sube los archivos:
git add .
git commit -m "Fix: Use GitHub Actions workflow"
git push
```

#### 2. Configurar GitHub Pages

1. Ve a: **Settings** → **Pages**
2. En **"Build and deployment"** → **"Source"**:
   - Selecciona: **"GitHub Actions"** (NO "Deploy from a branch")
3. Guarda

#### 3. Configurar restricciones de API (Recomendado)

1. Ve a: https://aistudio.google.com/app/apikey
2. Haz clic en los 3 puntos de tu API Key
3. Selecciona "View in Google Cloud Console"
4. Configura:
   - **Application restrictions**: HTTP referrers
   - **Referrer**: `https://fernandodiazm5.github.io/PlanesFiwis/*`
   - **API restrictions**: Generative Language API

#### 4. Espera el deploy

1. Ve a la pestaña **"Actions"**
2. Verás el workflow **"Deploy to GitHub Pages"** ejecutándose
3. Espera 2-3 minutos
4. ✅ Cuando termine, tu sitio estará listo

#### 5. Prueba el chatbot

- URL: https://fernandodiazm5.github.io/PlanesFiwis/
- Escribe: "¿Cómo funciona la promo del 50%?"

---

## 🔍 CÓMO FUNCIONA:

### El sistema de secrets:

1. **Tu Secret en GitHub**: Se llama `GEMINI_API_KEY` ✅
2. **El workflow** (`.github/workflows/deploy.yml`):
   - Lee el secret: `${{ secrets.GEMINI_API_KEY }}`
   - Crea el archivo: `config.js`
   - Con el contenido: `window.GEMINI_API_KEY = 'TU_API_KEY_REAL';`
3. **El index.html**:
   - Carga: `<script src="config.js"></script>`
   - Usa: `window.GEMINI_API_KEY`

### ⚠️ IMPORTANTE:

- ❌ **NO** subas `config.js` a GitHub (está en `.gitignore`)
- ✅ El archivo `config.js` se crea AUTOMÁTICAMENTE durante el deploy
- ✅ Tu API Key NUNCA aparece en el código fuente

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "config.js 404 Not Found"

**Causa**: El workflow no se ejecutó o GitHub Pages usa el método antiguo.

**Solución**:
1. Verifica que `.github/workflows/deploy.yml` existe
2. Ve a Settings → Pages → Source → Selecciona "GitHub Actions"
3. Fuerza un nuevo deploy:
   ```bash
   git commit --allow-empty -m "Trigger workflow"
   git push
   ```

### Error: "API Key not working"

**Causa**: Restricciones mal configuradas o secret vacío.

**Solución**:
1. Verifica el secret: Settings → Secrets → Actions → `GEMINI_API_KEY`
2. Verifica las restricciones en Google Cloud:
   - URL correcta: `https://fernandodiazm5.github.io/PlanesFiwis/*`
   - Espera 5-10 minutos para que apliquen

### Error: "Workflow no aparece en Actions"

**Causa**: El archivo no está en la ubicación correcta.

**Solución**:
```bash
mkdir -p .github/workflows
# Copia deploy.yml a esa carpeta
git add .github/workflows/deploy.yml
git commit -m "Add workflow"
git push
```

---

## 📂 ESTRUCTURA DEL PROYECTO

```
PlanesFiwis/
├── index.html              # Página principal
├── .github/
│   └── workflows/
│       └── deploy.yml      # Workflow de GitHub Actions
├── .gitignore             # Ignora config.js
└── README.md              # Este archivo
```

**Nota**: El archivo `config.js` NO está en el repositorio porque se crea automáticamente.

---

## 🔐 SEGURIDAD

✅ **Protecciones activas:**
- API Key almacenada en GitHub Secrets (encriptada)
- config.js no se sube al repositorio (.gitignore)
- config.js se genera solo durante el deploy
- Restricciones de dominio en Google Cloud

❌ **NO hagas esto:**
- No subas config.js con tu API Key
- No desactives las restricciones de dominio
- No compartas tu API Key

---

## 📞 Contacto

WhatsApp: 989 133 109 / 986 876 523

---

**Fiwis: Somos más conectados** 🚀

