# 📋 INSTRUCCIONES PASO A PASO

## 🎯 RESUMEN DE TU SITUACIÓN:

✅ **Lo que YA está bien:**
- Tu Secret se llama: `GEMINI_API_KEY` ✅ (CORRECTO)
- Tu API Key de Gemini está creada ✅
- Tu repositorio existe ✅

❌ **El problema:**
- El archivo `config.js` no se está generando
- Probablemente tienes configurado "Deploy from a branch" en lugar de "GitHub Actions"

---

## ✅ SOLUCIÓN EN 5 PASOS:

### PASO 1: Limpia tu repositorio local

Si tienes un archivo `config.js` en tu carpeta local, BÓRRALO:

```bash
cd PlanesFiwis  # o el nombre de tu carpeta
rm config.js    # Si existe, bórralo
```

### PASO 2: Verifica que tengas estos archivos:

```
PlanesFiwis/
├── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml    ← DEBE EXISTIR AQUÍ
├── .gitignore
└── README.md
```

Si NO tienes `.github/workflows/deploy.yml`, créalo con este contenido:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Create config.js with API Key
        run: |
          echo "window.GEMINI_API_KEY = '${{ secrets.GEMINI_API_KEY }}';" > config.js

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### PASO 3: Sube los archivos

```bash
git add .
git commit -m "Fix: Add correct workflow configuration"
git push
```

### PASO 4: Cambia la configuración de GitHub Pages

1. Ve a: https://github.com/fernandodiazm5/PlanesFiwis/settings/pages
2. En **"Build and deployment"**:
   - **Source**: Cambia a **"GitHub Actions"**
   - (NO uses "Deploy from a branch")
3. Guarda

### PASO 5: Espera el deploy

1. Ve a: https://github.com/fernandodiazm5/PlanesFiwis/actions
2. Verás un workflow llamado **"Deploy to GitHub Pages"**
3. Espera 2-3 minutos a que termine (✅ verde)
4. Prueba tu sitio: https://fernandodiazm5.github.io/PlanesFiwis/

---

## 🔍 VERIFICACIÓN:

### Cómo saber si funcionó:

1. **Abre la consola del navegador** (F12)
2. Ve a la pestaña **"Network"**
3. Recarga la página (Ctrl+R)
4. Busca el archivo `config.js`
5. Debe aparecer con **status 200** (no 404)

### Si config.js aparece (200):
✅ **¡Perfecto!** El chatbot debería funcionar.

### Si config.js no aparece (404):
❌ El workflow no se ejecutó. Verifica:
- Que el archivo esté en `.github/workflows/deploy.yml`
- Que GitHub Pages use "GitHub Actions" como Source
- Ve a Actions y revisa si hay errores

---

## 💡 EXPLICACIÓN TÉCNICA:

### Tu Secret: `GEMINI_API_KEY`

```
GitHub Secret:
┌─────────────────────────┐
│ GEMINI_API_KEY          │  ← Así se llama tu secret ✅
│ = AIzaSy...             │  ← Tu API Key real
└─────────────────────────┘
```

### El workflow lo usa así:

```yaml
echo "window.GEMINI_API_KEY = '${{ secrets.GEMINI_API_KEY }}';" > config.js
                                          └─────────────────┘
                                          Lee tu secret: GEMINI_API_KEY
```

### Genera este archivo:

```javascript
// config.js (generado automáticamente)
window.GEMINI_API_KEY = 'AIzaSy...';  // Tu API Key real
```

### El index.html lo carga:

```html
<script src="config.js"></script>  ← Carga el archivo
<script>
  // Usa la variable global
  fetch(`...?key=${window.GEMINI_API_KEY}`)
              └──────────────────────┘
              Definida en config.js
</script>
```

---

## ❓ PREGUNTAS FRECUENTES:

### ¿Por qué tenía 2 config.js?

Probablemente subiste manualmente un `config.js` Y el workflow intentó crear otro.

**Solución**: Borra el manual y deja que el workflow lo cree automáticamente.

### ¿El secret debe llamarse GEMINI_API_KEY o TU_API_KEY_AQUI?

**GEMINI_API_KEY** ✅

`TU_API_KEY_AQUI` era solo un placeholder (texto de ejemplo) que NO debiste usar.

### ¿Puedo cambiar el nombre del secret?

Sí, pero entonces debes cambiar TAMBIÉN el workflow:

```yaml
# Si tu secret se llama "MI_API_KEY":
echo "window.GEMINI_API_KEY = '${{ secrets.MI_API_KEY }}';" > config.js
                                          └──────────┘
                                          Cambia esto
```

**Recomendación**: Deja el nombre como `GEMINI_API_KEY` (más claro).

---

## 🆘 SI NADA FUNCIONA:

1. **Borra TODO el repositorio** de GitHub
2. **Crea uno nuevo**
3. **Sube los archivos limpios** que te di
4. **Configura el secret** de nuevo: `GEMINI_API_KEY`
5. **Configura Pages** con "GitHub Actions"

---

## 📞 Resumen de lo que debes hacer AHORA:

```bash
# 1. Borra config.js si existe
rm config.js

# 2. Verifica que .github/workflows/deploy.yml existe
ls -la .github/workflows/deploy.yml

# 3. Sube todo
git add .
git commit -m "Fix workflow configuration"
git push

# 4. Ve a Settings → Pages → Source → GitHub Actions

# 5. Espera 3 minutos y prueba:
# https://fernandodiazm5.github.io/PlanesFiwis/
```

**¡Eso es todo!** 🚀
