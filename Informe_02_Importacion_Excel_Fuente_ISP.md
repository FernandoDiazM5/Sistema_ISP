# INFORME TÉCNICO #2 — Análisis del Excel Fuente y Diseño del Sistema de Importación/Sincronización
## Sistema de Gestión ISP — Excel de Producción "Lista de Usuarios"

**Fecha:** 07 de Febrero, 2026  
**Contexto:** Este Excel es la fuente real de datos exportada desde el sistema ISP externo al que no tienes acceso API. Contiene 2,064 clientes activos con su información de servicio.

---

## 1. ANÁLISIS COMPLETO DEL EXCEL FUENTE

### 1.1 Estructura General

- **Hoja única:** Sheet1
- **Registros:** 2,064 clientes
- **Columnas:** 35 campos (A-AJ)
- **Headers en fila 2** (fila 1 es título "Lista de Usuarios")
- **Datos desde fila 3 hasta fila 2066**

### 1.2 Mapeo Completo de Campos

| Col | Campo Original | Tipo | Completitud | Destino en Sistema Nuevo |
|-----|---------------|------|------------|--------------------------|
| B | Id | Texto (000001) | 100% | tb_Clientes.ID_Cliente_Externo |
| C | Nombre | Texto + "ACTIVO/SUSPENDIDO" | 100% | tb_Clientes.Nombre_Completo + Estado_Cuenta |
| D | Mac | MAC Address | 65.4% | tb_Servicios_Cliente.MAC_Address_Cliente |
| E | Ip | IP Address | ~98% | tb_Servicios_Cliente.IP_Asignada |
| F | IP Receptor | IP Address | ~98% | tb_Servicios_Cliente.IP_Receptor |
| G | Ultimo vencimiento | Fecha dd/mm/yyyy | ~20% | tb_Servicios_Cliente.Ultimo_Vencimiento |
| H | Ultimo pago | Fecha dd/mm/yyyy | ~95% | tb_Pagos.Fecha_Ultimo_Pago |
| I | Tipo estrato | Número (1 o 4) | 100% | tb_Clientes.Tipo_Estrato |
| J | Caja nap | Texto | 0% (vacío) | tb_Servicios_Cliente.Caja_NAP |
| K | Dirección Principal | Texto libre | ~98% | tb_Clientes.Direccion_Principal |
| L | Fecha suspendido | Timestamp | ~95% | tb_Clientes.Fecha_Suspension |
| M | Plan voip | — | 0% (vacío) | Descartable |
| N | Dirección Servicio | Texto libre | 96.2% | tb_Clientes.Direccion_Servicio |
| O | Dia pago | Número (1-31) | ~98% | tb_Servicios_Cliente.Dia_Pago |
| P | Deuda actual | Texto "N S/. XX.XX" | 20.5% | tb_Servicios_Cliente.Deuda_Meses + Deuda_Monto |
| Q | Correo | **NOTAS, no email** | 82.1% | tb_Clientes.Notas_Equipo (campo nuevo) |
| R | Telefono | — | ~0% | tb_Clientes.Telefono_Fijo |
| S | Plan | Texto descriptivo | ~99% | tb_Servicios_Cliente.Plan_Contratado |
| T | Proximo pago | Fecha dd/mm/yyyy | ~98% | tb_Servicios_Cliente.Proximo_Pago |
| U | Movil | Números (con problemas) | 99.95% | tb_Clientes.Movil_1 + Movil_2 |
| V | Saldo | Texto "S/. X.XX" | ~99% | tb_Servicios_Cliente.Saldo |
| W | Emisor | — | 0% (vacío) | Descartable |
| X | Router | Texto (identificador técnico) | ~99% | tb_Servicios_Cliente.Nodo_AP_Router |
| Y | Instalado | Fecha dd/mm/yyyy | ~98% | tb_Servicios_Cliente.Fecha_Instalacion |
| Z | Cedula | Número (DNI) | 81.4% | tb_Clientes.DNI_Cedula |
| AA | User PPP/Hotspot | Texto | 98.7% | tb_Servicios_Cliente.User_PPP |
| AB | Pasarela | — | 0% (vacío) | Descartable |
| AC | Codigo | Texto 6 chars | ~99% | tb_Clientes.Codigo_Cliente |
| AD | User ubnt | — | 0% (vacío) | Descartable |
| AE | Coordenadas | — | 0% (vacío) | tb_Clientes.Coordenadas_GPS |
| AF | Total cobrar | Texto "S/. XX.XX" | ~99% | tb_Servicios_Cliente.Precio_Plan |
| AG | Zona | Texto | 100% | tb_Clientes.Zona |
| AH | Status | ONLINE/OFFLINE | 100% | tb_Servicios_Cliente.Estado_Conexion |
| AI | Servicios personalizados | Texto compuesto | 27.2% | tb_Servicios_Adicionales (tabla nueva) |
| AJ | Fecha retirado | Fecha | 0% | tb_Clientes.Fecha_Retiro |

### 1.3 Estadísticas Clave de los 2,064 Clientes

**Estado de conexión:**
- OFFLINE: 1,431 (69.3%)
- ONLINE: 633 (30.7%)

**Estado de cuenta (embebido en campo Nombre):**
- ACTIVO: 1,895 (91.8%)
- SUSPENDIDO: 169 (8.2%)

**Tecnología (inferida del campo Router/X):**
- Radio Enlace: 1,213 (58.8%) — Nodos ND1/ND2/ND3, torres con nombres
- Fibra Óptica: 709 (34.4%) — OLT Huawei, Dixon, GPON
- No determinado: 142 (6.9%)

**Deuda:**
- Sin deuda: 1,640 (79.5%)
- Con deuda (1 mes): 424 (20.5%)
- Total deuda acumulada: ~S/. 22,500 estimado

**Servicios adicionales (IPTV/CTV):**
- Con servicio de TV: 561 (27.2%)
- TV Cable S/10: 234 más comunes
- TV Básico S/20: 105
- IPTV 1TV-15: 46
- CTV Gratis: 34

**Infraestructura Radio Enlace — Torres/APs identificados:**
- 36 nodos/torres únicos detectados
- Top 5: OLT Huawei Ficus (397), Dixon OLT (312), ADMIN/PLAN3 (140), Veronica/ND1 (93), Elvia/ND1 (81)

**Planes más contratados (Top 10):**
1. Antena 25MB S/40 → 207 clientes
2. Fibra Antigua 65MB S/60 → 166
3. CORTE POR DEUDA → 114 (¡plan usado como estado!)
4. Fibra Huawei 100MB S/40 → 110
5. Antena 45MB S/50 → 107
6. Fibra Antigua 25MB S/40 → 101
7. Opcional 35MB S/40 → 92
8. Fibra Huawei 200MB S/50 → 91
9. Fibra 200MB S/40 → 89
10. Fibra Antigua 45MB S/50 → 82

---

## 2. PROBLEMAS DE DATOS DETECTADOS (CRÍTICOS)

### 🔴 Problema 1: Campo "Nombre" contiene el estado
```
Original:  "MONICA ROCIO DELGADO LOPEZ  ACTIVO"
           "JUANA ESTHER VALDEZ   SUSPENDIDO"

Debe ser:  Nombre = "MONICA ROCIO DELGADO LOPEZ"
           Estado = "ACTIVO"
```
**Regla de limpieza:** Separar por los últimos 2+ espacios, extraer "ACTIVO" o "SUSPENDIDO" como campo independiente.

### 🔴 Problema 2: Campo "Correo" NO es correo
Solo 8 de 2,064 registros (0.4%) tienen un email real. El 82% contiene notas técnicas como:
```
"25MBX40"
"PRESTAMO CAJA LINUX-TEC.LUIS MENDOZA"
"R.ONU DBANDA/CTV/VSOL/NPGAD/200 megas 50"
"ANTENA M5-100MB-40/PREST.R.ONU TENDA-JOSE MENDOZA"
```
**Regla de limpieza:** Si contiene "@" → campo Email. Si no → campo Notas_Tecnicas.

### 🔴 Problema 3: Móvil concatenado sin separador
416 registros (20%) tienen 2 números pegados:
```
"981730608965231254"  → "981730608" + "965231254"
"912248097949023650"  → "912248097" + "949023650"
"912305225,952 968 084" → "912305225" + "952968084"
```
**Regla de limpieza:** Si longitud > 12, separar en 2 números de 9 dígitos. Si tiene coma, split por coma.

### 🔴 Problema 4: "CORTE POR DEUDA" como plan
114 clientes tienen "CORTE POR DEUDA" en el campo Plan. Esto es un estado, no un plan.
**Regla de limpieza:** Estado_Servicio = "Cortado por deuda", Plan = buscar plan anterior o marcar como "Pendiente asignación".

### 🟡 Problema 5: Deuda como texto compuesto
```
"1 S/. 50.00" → Meses_Deuda = 1, Monto_Deuda = 50.00
"1 S/. 100.00" → Meses_Deuda = 1, Monto_Deuda = 100.00
```
**Regla de limpieza:** Regex para extraer número de meses y monto.

### 🟡 Problema 6: Precios como texto
```
"S/. 40.00" → 40.00 (numérico)
"S/. -0.01" → 0.00 (CORTE POR DEUDA tiene precio negativo)
```

### 🟡 Problema 7: Servicios personalizados concatenados sin separador
```
"TV CABLE (S/. 10.00)TV CABLE (S/. 10.00)" → Son 2 servicios de TV Cable
"1CTV GRATIS (S/. 0.00)TV CABLE (S/. 10.00)" → Son 2 servicios distintos
```
**Regla de limpieza:** Split por patrón `)` seguido de letra mayúscula, extraer cada servicio individual.

### 🟡 Problema 8: Tecnología no explícita
El campo Router/X identifica la torre/nodo, pero no dice explícitamente "Radio" o "Fibra".
**Regla de limpieza:** Mapeo por keywords:
- Contiene "OLT", "FIBRA", "GPON", "DIXON", "HUWEI" → Fibra Óptica
- Contiene "ND1", "ND2", "ND3", "/1100", "/4011" → Radio Enlace
- Sin campo X o no match → Revisar manualmente

### 🟢 Problema 9: DNI con ceros al inicio
```
"08171895" → El cero se pierde si se trata como número
```
**Regla:** Almacenar siempre como texto, pad con ceros a 8 dígitos.

---

## 3. DISEÑO DEL SISTEMA DE IMPORTACIÓN Y SINCRONIZACIÓN

### 3.1 Flujo General

```
┌─────────────────┐    ┌─────────────┐    ┌──────────────────┐    ┌───────────────┐
│ Sistema ISP      │    │ Google      │    │ Tu Sistema Web   │    │ Google        │
│ Externo          │───►│ Drive       │───►│ (React App)      │───►│ Drive         │
│ (exportar .xlsx) │    │ (almacén)   │    │ IMPORTAR + LIMPIAR│    │ (guardar .xlsx)│
└─────────────────┘    └─────────────┘    └──────────────────┘    └───────────────┘
       │                                          │
       │    Proceso manual                        │    Proceso manual
       │    cada X días                           │    cada X días
       └──────────────────────────────────────────┘
                    CICLO DE SINCRONIZACIÓN
```

### 3.2 Módulo de Importación — Pantalla "Importar Datos"

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 IMPORTAR DATOS DESDE EXCEL                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Fuente: [📁 Seleccionar Excel desde Drive] [🔗 URL de Drive]  │
│                                                                  │
│  Última importación: 05/02/2026 14:30:00 (hace 2 días)         │
│  Registros actuales en sistema: 2,064                           │
│                                                                  │
│  ┌─ Opciones de Importación ──────────────────────────────────┐ │
│  │ ○ Importación completa (reemplaza todo)                     │ │
│  │ ● Importación inteligente (solo cambios)                    │ │
│  │ ○ Solo nuevos registros                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Limpieza automática ──────────────────────────────────────┐ │
│  │ ☑ Separar nombre y estado (ACTIVO/SUSPENDIDO)               │ │
│  │ ☑ Clasificar campo Correo (email vs notas técnicas)         │ │
│  │ ☑ Separar móviles concatenados                              │ │
│  │ ☑ Parsear deuda (meses + monto numérico)                   │ │
│  │ ☑ Parsear precios a numérico                                │ │
│  │ ☑ Inferir tecnología (Radio/Fibra) desde Router             │ │
│  │ ☑ Separar servicios personalizados                          │ │
│  │ ☑ Normalizar "CORTE POR DEUDA" a estado                    │ │
│  │ ☑ Formatear DNI a 8 dígitos con ceros                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [ 🔍 PREVISUALIZAR ]  [ ▶ IMPORTAR ]  [ ❌ CANCELAR ]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Pantalla de Previsualización (antes de confirmar)

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 PREVISUALIZACIÓN DE IMPORTACIÓN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Archivo: Lista_de_Usuarios_(3).xlsx                            │
│  Registros leídos: 2,064                                        │
│                                                                  │
│  ┌─ Resumen de Cambios ──────────────────────────────────────┐  │
│  │  🆕 Nuevos clientes:           45                          │  │
│  │  ✏️ Clientes modificados:      128                         │  │
│  │  ✅ Sin cambios:               1,891                       │  │
│  │  ⚠️ Requieren revisión manual: 12                          │  │
│  │  🗑️ No encontrados en import:  3 (posibles bajas)         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Limpieza Aplicada ───────────────────────────────────────┐  │
│  │  Nombres corregidos:           2,064 ✓                     │  │
│  │  Emails separados de notas:    1,694 ✓                     │  │
│  │  Móviles separados:            416 ✓                       │  │
│  │  Deudas parseadas:             424 ✓                       │  │
│  │  Tecnología inferida:          1,922 ✓ (142 pendientes)   │  │
│  │  "CORTE POR DEUDA" corregido:  114 ✓                      │  │
│  │  Servicios TV separados:       561 ✓                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─── DETALLE DE CAMBIOS ──────────────────────────────────────  │
│                                                                  │
│  🆕 NUEVOS (sample):                                            │
│  ┌──────┬────────────────────────────┬───────────┬────────────┐ │
│  │ ID   │ Nombre                     │ Plan      │ Tecnología │ │
│  ├──────┼────────────────────────────┼───────────┼────────────┤ │
│  │ 2893 │ JINA NELL TUESTA DAVILA    │ Fibra 300 │ Fibra      │ │
│  │ 2894 │ ROSARIO IPARRAGUIRRE M.    │ Antena 75 │ Radio      │ │
│  └──────┴────────────────────────────┴───────────┴────────────┘ │
│                                                                  │
│  ✏️ MODIFICADOS (sample):                                       │
│  ┌──────┬──────────────┬──────────────────┬────────────────────┐│
│  │ ID   │ Campo        │ Valor Anterior   │ Valor Nuevo        ││
│  ├──────┼──────────────┼──────────────────┼────────────────────┤│
│  │ 0016 │ Status       │ ONLINE           │ OFFLINE            ││
│  │ 0016 │ Deuda        │ S/. 0.00         │ 1 mes - S/. 100   ││
│  │ 0019 │ Ultimo_Pago  │ 07/12/2025       │ 07/01/2026         ││
│  └──────┴──────────────┴──────────────────┴────────────────────┘│
│                                                                  │
│  ⚠️ REQUIEREN REVISIÓN:                                        │
│  ┌──────┬────────────────────────────┬─────────────────────────┐│
│  │ ID   │ Problema                   │ Acción Sugerida         ││
│  ├──────┼────────────────────────────┼─────────────────────────┤│
│  │ 0142 │ Tecnología no determinada  │ Asignar manualmente     ││
│  │ 0538 │ Móvil inválido (5 dígitos) │ Verificar con cliente   ││
│  └──────┴────────────────────────────┴─────────────────────────┘│
│                                                                  │
│         [ ✅ CONFIRMAR IMPORTACIÓN ]   [ ← VOLVER ]            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Motor de Limpieza y Transformación (ETL)

```javascript
// utils/excelTransformer.js — Motor de transformación de datos

export function transformExcelRow(row) {
  return {
    // === DATOS DEL CLIENTE ===
    id_externo: row.B,                           // "000001"
    nombre: cleanNombre(row.C).nombre,           // "MONICA ROCIO DELGADO LOPEZ"
    estado_cuenta: cleanNombre(row.C).estado,    // "ACTIVO"
    dni: padDNI(row.Z),                          // "08171895"
    movil_1: splitMovil(row.U).movil1,           // "991747872"
    movil_2: splitMovil(row.U).movil2,           // null o "949023650"
    telefono_fijo: row.R || null,
    email: isEmail(row.Q) ? row.Q : null,        // null (porque no es email)
    notas_tecnicas: !isEmail(row.Q) ? row.Q : null, // "25MBX40"
    direccion_principal: row.K,
    direccion_servicio: row.N || row.K,           // Fallback a principal
    zona: row.AG,                                 // "CARABAYLLO"
    coordenadas: row.AE || null,                  // null (vacío)
    tipo_estrato: row.I,
    codigo_cliente: row.AC,                       // "qnyrgf"
    fecha_instalacion: parseDate(row.Y),
    fecha_suspension: parseTimestamp(row.L),
    fecha_retirado: row.AJ || null,

    // === DATOS DEL SERVICIO ===
    plan_contratado: cleanPlan(row.S),            // "PLAN ANTENA 25MB S/40 v1"
    precio_plan: parseMoney(row.AF),              // 40.00
    tecnologia: inferTecnologia(row.X, row.S),    // "Radio Enlace"
    nodo_router: row.X,                            // "PLA1/ND2"
    ip_asignada: row.E,
    ip_receptor: row.F,
    mac_address: row.D || null,
    user_ppp: row.AA || null,
    dia_pago: row.O,
    proximo_pago: parseDate(row.T),
    ultimo_pago: parseDate(row.H),
    ultimo_vencimiento: parseDate(row.G),
    deuda_meses: parseDeuda(row.P).meses,         // 1
    deuda_monto: parseDeuda(row.P).monto,          // 50.00
    saldo: parseMoney(row.V),                      // 0.00
    estado_conexion: row.AH,                       // "OFFLINE"
    estado_servicio: getEstadoServicio(row.S, row.C), // "Activo"/"Cortado"

    // === SERVICIOS ADICIONALES (TV) ===
    servicios_adicionales: parseServiciosTV(row.AI),
    // [{ tipo: "TV CABLE", precio: 10.00 }, { tipo: "TV CABLE", precio: 10.00 }]
  };
}

// === FUNCIONES DE LIMPIEZA ===

function cleanNombre(raw) {
  if (!raw) return { nombre: '', estado: 'DESCONOCIDO' };
  const str = raw.trim();
  // Buscar "ACTIVO" o "SUSPENDIDO" al final con 2+ espacios
  const match = str.match(/^(.+?)\s{2,}(ACTIVO|SUSPENDIDO)\s*$/);
  if (match) return { nombre: match[1].trim(), estado: match[2] };
  return { nombre: str, estado: 'DESCONOCIDO' };
}

function splitMovil(raw) {
  if (!raw) return { movil1: null, movil2: null };
  let str = String(raw).replace(/\s/g, '');

  // Si tiene coma, split por coma
  if (str.includes(',')) {
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    return { movil1: parts[0] || null, movil2: parts[1] || null };
  }

  // Si tiene más de 12 dígitos, son 2 números concatenados
  if (str.length > 12) {
    // Números peruanos son de 9 dígitos
    return { movil1: str.substring(0, 9), movil2: str.substring(9) };
  }

  return { movil1: str, movil2: null };
}

function isEmail(val) {
  return val && String(val).includes('@');
}

function padDNI(val) {
  if (!val) return null;
  return String(val).padStart(8, '0');
}

function parseMoney(val) {
  if (!val) return 0;
  const match = String(val).match(/[\d.-]+/);
  const num = match ? parseFloat(match[0]) : 0;
  return num < 0 ? 0 : num;
}

function parseDeuda(val) {
  if (!val) return { meses: 0, monto: 0 };
  const match = String(val).match(/(\d+)\s*S\/\.\s*([\d.]+)/);
  if (match) return { meses: parseInt(match[1]), monto: parseFloat(match[2]) };
  return { meses: 0, monto: 0 };
}

function inferTecnologia(router, plan) {
  const r = String(router || '').toUpperCase();
  const p = String(plan || '').toUpperCase();

  // Fibra keywords
  if (['OLT', 'FIBRA', 'GPON', 'DIXON', 'HUWEI'].some(kw => r.includes(kw)))
    return 'Fibra Optica';
  if (p.includes('FIBRA') || p.includes('GPON'))
    return 'Fibra Optica';

  // Radio keywords
  if (['ND1', 'ND2', 'ND3', '/1100', '/4011', 'ORCHALL'].some(kw => r.includes(kw)))
    return 'Radio Enlace';
  if (p.includes('ANTENA'))
    return 'Radio Enlace';

  return 'No Determinado';
}

function cleanPlan(plan) {
  if (!plan) return null;
  if (plan.toUpperCase() === 'CORTE POR DEUDA') return null; // Estado, no plan
  return plan;
}

function getEstadoServicio(plan, nombre) {
  if (String(plan).toUpperCase() === 'CORTE POR DEUDA') return 'Cortado por Deuda';
  if (String(nombre).includes('SUSPENDIDO')) return 'Suspendido';
  return 'Activo';
}

function parseServiciosTV(raw) {
  if (!raw) return [];
  // Pattern: "TV CABLE (S/. 10.00)TV BASICO (S/. 20.00)"
  const regex = /([^(]+)\(S\/\.\s*([\d.]+)\)/g;
  const servicios = [];
  let match;
  while ((match = regex.exec(raw)) !== null) {
    servicios.push({
      tipo: match[1].trim(),
      precio: parseFloat(match[2])
    });
  }
  return servicios;
}

function parseDate(val) {
  if (!val) return null;
  // Handle dd/mm/yyyy
  if (typeof val === 'string' && val.includes('/')) {
    const [d, m, y] = val.split('/');
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
  return val; // Already a Date object from Excel
}
```

### 3.5 Distribución de Datos a Tablas del Sistema

Al importar el Excel, cada registro se distribuye así:

```
1 fila del Excel  ──►  Se crea/actualiza en 3+ tablas:

┌────────────────────────┐
│  tb_Clientes           │ ← nombre, dni, movil_1, movil_2, email,
│                        │   direccion, zona, codigo, fechas, estado
└────────┬───────────────┘
         │ 1:N
┌────────▼───────────────┐
│  tb_Servicios_Cliente  │ ← plan, precio, tecnologia, ip, mac, nodo,
│                        │   user_ppp, dia_pago, deuda, saldo, estado_conexion
└────────┬───────────────┘
         │ 1:N
┌────────▼───────────────┐
│  tb_Servicios_         │ ← TV CABLE, TV BASICO, IPTV, CTV GRATIS
│  Adicionales (NUEVA)   │   (parseados del campo AI)
└────────────────────────┘

Además se alimentan catálogos:
┌────────────────────────┐
│  tb_Planes (NUEVA)     │ ← Catálogo único de planes extraído
│                        │   de los 40+ planes distintos
└────────────────────────┘
┌────────────────────────┐
│  tb_Nodos_Torres       │ ← 36 nodos/torres extraídos del campo Router
│  (NUEVA)               │   con clasificación Radio/Fibra
└────────────────────────┘
```

### 3.6 Lógica de Sincronización Incremental

```
IMPORTACIÓN INTELIGENTE (solo cambios):

Para cada fila del Excel nuevo:
  1. Buscar por ID_Externo (col B) en sistema
  
  SI existe:
    2. Comparar cada campo limpio contra valor almacenado
    3. Si hay diferencias → marcar como "Modificado"
       - Guardar snapshot anterior (historial)
       - Aplicar valores nuevos
       - Registrar en log: campo, valor_anterior, valor_nuevo, fecha
    4. Si no hay diferencias → "Sin cambios" (skip)
  
  SI no existe:
    2. Marcar como "Nuevo"
    3. Crear registro en tb_Clientes
    4. Crear registro en tb_Servicios_Cliente
    5. Crear registros en tb_Servicios_Adicionales (si aplica)
  
Para cada registro existente en sistema NO encontrado en Excel:
  - Marcar como "Posible baja" (NO borrar automáticamente)
  - Requiere confirmación manual

RESULTADO: Tabla de log de importación
┌─────────┬────────────┬─────────┬──────────┬────────────────┐
│ ID_Reg  │ Accion     │ Campo   │ Anterior │ Nuevo          │
├─────────┼────────────┼─────────┼──────────┼────────────────┤
│ 000016  │ Modificado │ Status  │ ONLINE   │ OFFLINE        │
│ 000016  │ Modificado │ Deuda   │ 0        │ S/. 100.00     │
│ 002895  │ Nuevo      │ *       │ -        │ JINA TUESTA... │
│ 000050  │ No en xlsx │ *       │ -        │ Posible baja   │
└─────────┴────────────┴─────────┴──────────┴────────────────┘
```

### 3.7 Exportación de Vuelta al Excel

```
PROCESO: Sistema → Excel → Drive

El sistema genera un Excel con EL MISMO FORMATO del original
para que puedas re-subirlo al sistema externo si fuera necesario.

Pasos:
1. Usuario hace clic en "Exportar a Excel"
2. Sistema toma datos de todas las tablas
3. Revierte las transformaciones:
   - Nombre + "  " + Estado → col C
   - Movil_1 concatenado con Movil_2 → col U
   - Notas técnicas → col Q (campo "Correo")
   - Deuda: "1 S/. 50.00" → col P
   - Precio: "S/. 40.00" → col AF
4. Genera .xlsx con Sheet1 y mismo layout de headers
5. Descarga o sube directo a Drive

IMPORTANTE: Los datos que tu sistema AGREGA (tickets, visitas, etc.)
NO van al Excel exportado. Solo la data que originalmente venía del
sistema externo se exporta de vuelta.
```

---

## 4. TABLAS NUEVAS NECESARIAS (que no estaban en el Excel v4)

### tb_Planes (Catálogo Normalizado)
```
| Campo              | Tipo    | Ejemplo                          |
|--------------------|---------|----------------------------------|
| ID_Plan            | PK      | PLN-001                          |
| Nombre_Plan        | Text    | PLAN ANTENA 25MB S/40 v1         |
| Velocidad_MB       | Number  | 25                               |
| Precio             | Decimal | 40.00                            |
| Tecnologia         | Text    | Radio Enlace                     |
| Tipo               | Text    | Residencial                      |
| Estado             | Text    | Activo/Descontinuado             |
| Version            | Text    | v1                               |
| Es_Plan_2026       | Bool    | false                            |
```
**Se extraen 40+ planes únicos del Excel fuente.**

### tb_Nodos_Torres (Infraestructura de Red)
```
| Campo              | Tipo    | Ejemplo                          |
|--------------------|---------|----------------------------------|
| ID_Nodo            | PK      | NODO-001                         |
| Nombre             | Text    | PLA1/ND2                         |
| Nombre_Descriptivo | Text    | Planicie 1 - Nodo 2             |
| Tecnologia         | Text    | Radio Enlace                     |
| Tipo               | Text    | Torre/AP/OLT                     |
| Clientes_Conectados| Number  | 53                               |
| Capacidad_Maxima   | Number  | 80                               |
| Saturacion_Pct     | Number  | 66.3                             |
| Zona               | Text    | CARABAYLLO                       |
| Coordenadas        | Text    |                                  |
| Estado             | Text    | Activo                           |
```
**Se extraen 36 nodos únicos. Datos de saturación se calculan automáticamente.**

### tb_Servicios_Adicionales (TV/IPTV)
```
| Campo              | Tipo    | Ejemplo                          |
|--------------------|---------|----------------------------------|
| ID_Servicio_Ad     | PK      | SA-001                           |
| ID_Cliente         | FK      | 000019                           |
| Tipo_Servicio      | Text    | TV CABLE / IPTV / CTV GRATIS    |
| Precio             | Decimal | 10.00                            |
| Cantidad           | Number  | 1                                |
| Estado             | Text    | Activo                           |
```

### tb_Importaciones_Log
```
| Campo              | Tipo    | Ejemplo                          |
|--------------------|---------|----------------------------------|
| ID_Import          | PK      | IMP-001                          |
| Fecha_Importacion  | Date    | 2026-02-07 14:30:00             |
| Archivo_Origen     | Text    | Lista_de_Usuarios_(3).xlsx       |
| Total_Registros    | Number  | 2064                             |
| Nuevos             | Number  | 45                               |
| Modificados        | Number  | 128                              |
| Sin_Cambios        | Number  | 1891                             |
| Revision_Manual    | Number  | 12                               |
| Usuario_Ejecuto    | FK      | USR-0001                         |
| Estado             | Text    | Completada                       |
```

### tb_Importaciones_Detalle
```
| Campo              | Tipo    | Ejemplo                          |
|--------------------|---------|----------------------------------|
| ID_Detalle         | PK      | auto                             |
| ID_Import          | FK      | IMP-001                          |
| ID_Cliente_Externo | Text    | 000016                           |
| Accion             | Text    | Modificado/Nuevo/Sin cambio      |
| Campo_Afectado     | Text    | Estado_Conexion                  |
| Valor_Anterior     | Text    | ONLINE                           |
| Valor_Nuevo        | Text    | OFFLINE                          |
```

---

## 5. MÓDULO COMPLETO DE IMPORT/EXPORT EN REACT

### 5.1 Componentes del Módulo

```
src/components/importacion/
├── ImportacionPage.jsx          // Página principal
├── ExcelUploader.jsx            // Upload/selección de archivo
├── ImportPreview.jsx            // Previsualización de cambios
├── ImportProgress.jsx           // Barra de progreso
├── ImportLog.jsx                // Historial de importaciones
├── ImportDetail.jsx             // Detalle de una importación
├── DataCleaningOptions.jsx      // Checkboxes de limpieza
├── ManualReviewTable.jsx        // Registros que necesitan revisión
├── ExportExcel.jsx              // Botón de exportación
└── SyncStatus.jsx               // Estado de sincronización actual
```

### 5.2 Flujo de Usuario

```
1. Usuario entra a "Importar Datos"
2. Ve última importación y estado actual
3. Sube Excel (desde PC o selecciona de Drive)
4. Sistema lee el Excel en el navegador (SheetJS/xlsx)
5. Aplica reglas de limpieza automáticas
6. Muestra previsualización:
   - Nuevos, Modificados, Sin cambios, Requieren revisión
   - Detalle de cada cambio
7. Usuario revisa y puede:
   - Aprobar todo
   - Excluir registros específicos
   - Resolver revisiones manuales
8. Confirma importación
9. Sistema escribe a Google Sheets via tu API
10. Muestra resumen final con log

PARA EXPORTAR:
1. Usuario va a "Exportar Datos"
2. Selecciona qué exportar (todo o filtro)
3. Sistema genera Excel con formato original
4. Descarga o sube a Drive
```

### 5.3 Librería Recomendada para Excel en el Navegador

```javascript
// Leer Excel en React (sin backend)
import * as XLSX from 'xlsx';

function readExcelFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // Leer desde fila 2 (headers) y fila 3+ (datos)
      const data = XLSX.utils.sheet_to_json(ws, { range: 1 }); // skip row 1
      resolve(data);
    };
    reader.readAsArrayBuffer(file);
  });
}

// Escribir Excel desde React
function exportToExcel(data) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'Lista_de_Usuarios_Actualizada.xlsx');
}
```

---

## 6. RESUMEN EJECUTIVO

### Lo que tienes:
- 2,064 clientes reales en un Excel exportado de otro sistema
- 35 campos por cliente con datos de servicio técnico
- 58.8% Radio Enlace, 34.4% Fibra Óptica
- 36 nodos/torres de infraestructura
- 40+ planes distintos
- 561 servicios de TV adicionales

### Lo que necesitas:
- Motor de importación con limpieza automática (8 reglas de transformación)
- Sincronización incremental inteligente (detectar solo cambios)
- Distribución automática a 3+ tablas del sistema
- Exportación en formato original para devolver al sistema externo
- Log completo de cada importación para auditoría

### Flujo de trabajo final:
```
Cada X días:
1. Exportar Excel del sistema externo
2. Subir a Google Drive
3. En tu sistema web → "Importar Datos"
4. Revisar previsualización → Confirmar
5. Trabajar en tu sistema (tickets, visitas, soporte)
6. Cuando necesites → "Exportar" de vuelta al Excel
7. Subir al Drive → Listo para el siguiente ciclo
```
