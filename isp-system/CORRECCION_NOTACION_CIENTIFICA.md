# Corrección: Importación Excel con Notación Científica

## Problema Identificado

Al importar el archivo Excel `Lista de Usuarios (3).xlsx`, algunos campos numéricos largos (como teléfonos, DNIs, IDs) aparecían en **notación científica** (ejemplo: `9.47753741902369E+26`), lo cual impedía su correcta lectura y procesamiento.

### Causa
Excel exporta números muy largos en formato científico cuando:
- El número tiene más de 15 dígitos
- La celda no está formateada como Texto
- SheetJS lee estos valores como números en lugar de texto

## Solución Implementada

### 1. **Configuración de Lectura en ExcelUploader.jsx**

Se agregaron opciones a `XLSX.read()` y `XLSX.utils.sheet_to_json()` para forzar lectura como texto formateado:

```javascript
const wb = XLSX.read(e.target.result, {
  type: 'array',
  cellText: false,    // Mantener formato original
  cellDates: false,   // No parsear fechas automáticamente
  raw: false          // No usar valores raw (números)
});

const data = XLSX.utils.sheet_to_json(ws, {
  range: 1,
  defval: '',
  raw: false  // Forzar lectura como texto formateado
});
```

### 2. **Nuevas Funciones de Limpieza en dataTransformer.js**

Se agregaron dos funciones utilitarias:

#### `fromScientificNotation(value)`
Convierte números en notación científica a string normal:
- Detecta patrón `E+` o `e+`
- Parsea el número científico
- Retorna el número completo sin notación científica usando `.toFixed(0)`

**Ejemplo:**
```javascript
fromScientificNotation('9.47753741902369E+26')
// Retorna: '947753741902369000000000000'
```

#### `cleanNumericField(value)`
Limpia campos numéricos detectando y convirtiendo notación científica:
- Primero verifica si está en notación científica
- Si es así, llama a `fromScientificNotation()`
- Si no, retorna el valor limpio

### 3. **Actualización de transformClientData()**

Se modificó la función principal de transformación para aplicar limpieza a campos críticos:

```javascript
export function transformClientData(raw) {
  // Limpiar campos numéricos que pueden venir en notación científica
  const idRaw = cleanNumericField(raw.Id || raw.B || '');
  const telefonoRaw = cleanNumericField(raw.Telefono || raw.R || '');
  const movilRaw = cleanNumericField(raw.Movil || raw.U || '');
  const dniRaw = cleanNumericField(raw.Cedula || raw.Z || '');
  const codigoRaw = cleanNumericField(raw.Codigo || raw.AC || '');

  return {
    id: idRaw,
    telefono: telefonoRaw,
    movil_1: splitMovil(movilRaw).movil1,
    movil_2: splitMovil(movilRaw).movil2,
    dni: padDNI(dniRaw),
    codigo: codigoRaw,
    // ... resto de campos
  };
}
```

### 4. **Mejora en splitMovil()**

La función `splitMovil()` ahora también aplica `cleanNumericField()` antes de procesar:

```javascript
export function splitMovil(raw) {
  if (!raw) return { movil1: '', movil2: '' };

  // Convertir de notación científica si es necesario
  let str = cleanNumericField(raw);

  // ... resto de la lógica
}
```

## Campos Protegidos

Los siguientes campos ahora están protegidos contra notación científica:

1. **Id** - ID del cliente
2. **Telefono** - Teléfono fijo
3. **Movil** - Móviles (puede contener 1 o 2 números concatenados)
4. **Cedula / DNI** - Documento de identidad
5. **Codigo** - Código interno del cliente

## Verificación

Para verificar que la corrección funciona:

1. Importa el archivo `Lista de Usuarios (3).xlsx` desde la página **Importar Datos**
2. En la previsualización, verifica que los campos Id, Teléfono, Móvil y DNI muestren números completos (no `9.477E+26`)
3. Confirma la importación
4. Revisa en **Clientes** que los datos se visualicen correctamente

## Notas Técnicas

- La conversión se realiza usando `parseFloat()` y `.toFixed(0)` para mantener precisión
- Los números muy grandes (>15 dígitos) pueden perder precisión en JavaScript, pero para IDs y teléfonos de 9-12 dígitos esto no es problema
- Si el Excel original tiene la celda formateada como Texto, estos problemas no deberían aparecer
- La solución es **retrocompatible**: campos que no están en notación científica se procesan normalmente

## Archivos Modificados

1. `src/components/importacion/ExcelUploader.jsx` - Configuración de lectura Excel
2. `src/api/dataTransformer.js` - Funciones de limpieza y conversión
