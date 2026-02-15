# 📋 GUÍA PASO A PASO - Deploy Seguro con GitHub Actions

## ✅ CHECKLIST PREVIO

Antes de empezar, asegúrate de tener:
- [ ] Cuenta de GitHub
- [ ] Cuenta de Google
- [ ] Git instalado en tu computadora
- [ ] Editor de código (VS Code recomendado)

---

## 🔑 PASO 1: Obtener API Key de Gemini

### 1.1 Ir a Google AI Studio
- URL: https://aistudio.google.com/app/apikey
- Inicia sesión con tu cuenta de Google

### 1.2 Crear API Key
```
1. Haz clic en "Get API Key" o "Crear clave de API"
2. Selecciona "Create API key in new project"
3. Espera unos segundos mientras se crea
4. COPIA la API Key (formato: AIzaSy...)
5. Guárdala en un lugar seguro (la necesitarás después)
```

⚠️ **IMPORTANTE:** No compartas esta API Key con nadie

---

## 🔒 PASO 2: Configurar Restricciones de Seguridad

### 2.1 Ir a Google Cloud Console
- URL: https://console.cloud.google.com/apis/credentials

### 2.2 Editar la API Key
```
1. Encuentra tu API Key en la lista
2. Haz clic en el ícono de lápiz (Edit)
```

### 2.3 Configurar "Application restrictions"
```
1. Selecciona: "HTTP referrers (web sites)"
2. Haz clic en "Add an item"
3. Ingresa: https://TU-USUARIO.github.io/*
   
   Ejemplo:
   - Si tu usuario es "juanperez"
   - Ingresa: https://juanperez.github.io/*
   
4. Puedes agregar más dominios si lo necesitas
```

### 2.4 Configurar "API restrictions"
```
1. Selecciona: "Restrict key"
2. En el buscador, escribe: "Generative Language API"
3. Marca la casilla de "Generative Language API"
4. Haz clic en "Save"
```

⏱️ **NOTA:** Los cambios pueden tardar unos minutos en aplicarse

---

## 📁 PASO 3: Preparar tu Repositorio Local

### 3.1 Crear carpeta del proyecto
```bash
mkdir fiwis-promo
cd fiwis-promo
```

### 3.2 Copiar archivos
```
Copia todos estos archivos a la carpeta:
- index.html
- README.md
- .gitignore
- config.example.js
- .github/workflows/deploy.yml
```

### 3.3 Inicializar Git
```bash
git init
git add .
git commit -m "Initial commit: FIWIS promotional page"
```

---

## 🌐 PASO 4: Crear Repositorio en GitHub

### 4.1 Crear nuevo repositorio
```
1. Ve a: https://github.com/new
2. Repository name: fiwis-promo (o el nombre que prefieras)
3. Description: "Página promocional FIWIS con asesor IA"
4. Visibilidad: Public
5. NO marques: "Add a README file"
6. Haz clic en "Create repository"
```

### 4.2 Conectar repositorio local
```bash
# Reemplaza TU-USUARIO y TU-REPO con tus datos
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main
```

Ejemplo:
```bash
git remote add origin https://github.com/juanperez/fiwis-promo.git
git branch -M main
git push -u origin main
```

---

## 🔐 PASO 5: Configurar GitHub Secret

### 5.1 Acceder a Settings
```
1. En tu repositorio de GitHub
2. Haz clic en "Settings" (⚙️)
3. En el menú lateral izquierdo:
   - Busca "Secrets and variables"
   - Haz clic en "Actions"
```

### 5.2 Crear nuevo Secret
```
1. Haz clic en "New repository secret"
2. En "Name" escribe exactamente: GEMINI_API_KEY
3. En "Secret" pega tu API Key de Gemini
4. Haz clic en "Add secret"
```

✅ Deberías ver: "Secret GEMINI_API_KEY was successfully created"

---

## 🚀 PASO 6: Habilitar GitHub Pages

### 6.1 Configurar Pages
```
1. En tu repositorio, ve a "Settings"
2. En el menú lateral, busca "Pages"
3. En "Build and deployment":
   - Source: selecciona "GitHub Actions"
4. ¡No necesitas hacer nada más!
```

---

## ✨ PASO 7: Verificar el Deploy

### 7.1 Ver el proceso de deploy
```
1. Ve a la pestaña "Actions" en tu repositorio
2. Verás un workflow llamado "Deploy to GitHub Pages"
3. Haz clic en él para ver el progreso
4. Espera a que termine (verás un ✅ verde)
```

### 7.2 Acceder a tu sitio
```
Tu sitio estará disponible en:
https://TU-USUARIO.github.io/TU-REPO/

Ejemplo:
https://juanperez.github.io/fiwis-promo/
```

⏱️ **TIEMPO ESTIMADO:** 2-5 minutos para el primer deploy

---

## 🧪 PASO 8: Probar el Asesor IA

### 8.1 Abrir tu sitio
- Ve a tu URL de GitHub Pages

### 8.2 Probar el chatbot
```
1. Desplázate hasta "Asesor Inteligente FIWIS"
2. Escribe: "¿Cómo funciona la promo del 50%?"
3. Haz clic en "Consultar"
4. Deberías recibir una respuesta en 2-3 segundos
```

✅ **Si funciona:** ¡Todo está perfecto!
❌ **Si no funciona:** Ve a la sección de Troubleshooting

---

## 🔄 PASO 9: Actualizaciones Futuras

Cada vez que quieras actualizar el sitio:

```bash
# Realiza tus cambios en los archivos
git add .
git commit -m "Descripción de los cambios"
git push

# GitHub Actions automáticamente:
# 1. Detecta el push
# 2. Ejecuta el workflow
# 3. Inyecta la API Key
# 4. Publica en GitHub Pages
```

---

## 🛠️ TROUBLESHOOTING

### Problema: El chatbot no responde

**Solución 1:** Verifica la API Key
```
1. Ve a Settings → Secrets → Actions
2. Verifica que exista: GEMINI_API_KEY
3. Si no existe, créala (Paso 5)
```

**Solución 2:** Verifica las restricciones
```
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Edita tu API Key
3. Verifica que el dominio esté correcto
4. Espera 5-10 minutos para que apliquen los cambios
```

**Solución 3:** Verifica la consola del navegador
```
1. Presiona F12 en tu navegador
2. Ve a la pestaña "Console"
3. Busca mensajes de error en rojo
4. Copia el error y búscalo en Google
```

### Problema: GitHub Actions falla

**Solución:**
```
1. Ve a Actions → Deploy to GitHub Pages
2. Haz clic en el workflow fallido
3. Revisa el error específico
4. Verifica que deploy.yml esté correctamente ubicado en:
   .github/workflows/deploy.yml
```

### Problema: "404 - Page not found"

**Solución:**
```
1. Ve a Settings → Pages
2. Verifica que "Source" sea "GitHub Actions"
3. Espera 5 minutos más (el deploy puede tardar)
4. Limpia caché del navegador (Ctrl+Shift+R)
```

---

## 🎓 DESARROLLO LOCAL (Opcional)

Si quieres probar cambios antes de subirlos:

### 1. Crear config.js local
```bash
cp config.example.js config.js
```

### 2. Editar config.js
```javascript
window.GEMINI_API_KEY = 'TU_API_KEY_REAL_AQUI';
```

### 3. Abrir en navegador
```
- Abre index.html en Chrome/Firefox
- Prueba el chatbot
```

⚠️ **RECUERDA:** config.js NO se subirá a GitHub (protegido por .gitignore)

---

## 📊 RESUMEN DE SEGURIDAD

✅ **LO QUE ESTÁ PROTEGIDO:**
- API Key nunca aparece en el código fuente
- API Key se inyecta solo durante el deploy
- Restricciones de dominio en Google Cloud
- config.js local ignorado por Git

❌ **LO QUE NO DEBES HACER:**
- Nunca hagas commit de config.js
- Nunca compartas tu API Key
- Nunca deshabilites las restricciones de dominio

---

## 🎉 ¡FELICIDADES!

Tu sitio está funcionando de forma segura y profesional.

**Siguiente nivel:**
- Personaliza los colores en index.html
- Ajusta los planes y precios
- Modifica el prompt del asesor IA
- Agrega Google Analytics
- Conecta un dominio personalizado

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección Troubleshooting
2. Busca el error en Google
3. Consulta la documentación de GitHub Actions
4. Pregunta en la comunidad de GitHub

**Desarrollado para FIWIS** 🚀
*Somos más conectados*
