# INFORME TÉCNICO DE INGENIERÍA DE SISTEMAS
## Sistema de Gestión ISP — Análisis Profundo y Propuesta de Arquitectura Completa

**Versión:** 1.0  
**Fecha:** 07 de Febrero, 2026  
**Autor:** Análisis de Ingeniería de Sistemas  
**Cliente:** ISP Carabayllo — Proveedor de Internet por Radio Enlace y Fibra Óptica  

---

## 1. ANÁLISIS EXHAUSTIVO DEL EXCEL ACTUAL

### 1.1 Estructura General

El libro Excel `Soporte_ISP_v4_Final` contiene **20 hojas (pestañas)** organizadas como un sistema pseudo-relacional. Se identifican **889 campos totales** distribuidos entre tablas operativas, catálogos y documentación. Es un diseño v4.0 que representa una evolución significativa respecto a versiones anteriores, con separación clara de flujos de instalación vs. post-venta.

---

### 1.2 Análisis Pestaña por Pestaña

#### 📄 DOCUMENTACION (76 filas, 8 columnas)
**Propósito:** Guía de referencia interna que documenta los flujos de trabajo y cambios respecto a v3.

**Contenido clave:**
- Changelog de v3 → v4 (separación de instalaciones, flujo prospecto→cliente, derivaciones a planta externa).
- 3 flujos de trabajo principales: Instalación Cliente Nuevo, Avería Cliente Existente, Post-Venta.
- Criterios técnicos de derivación a planta externa para Radio Enlace y Fibra Óptica.

**Evaluación:** Excelente documentación interna. Los flujos son coherentes y cubren los escenarios reales de un ISP. La separación de instalaciones y post-venta es una decisión de diseño correcta.

---

#### 👤 tb_Usuarios (2 registros, 7 columnas)
**Campos:** ID_Usuario, Nombre_Completo, Rol, Email, Telefono, Estado, Fecha_Ingreso

**Roles identificados:** Asesor Soporte, Administrador

**Observaciones críticas:**
- Solo 2 usuarios registrados. El sistema real necesita mínimo 5 roles: Administrador, Asesor Soporte, Técnico de Campo, Supervisor Técnico, Facturación.
- **Falta:** campo de contraseña/hash, último login, permisos granulares, foto de perfil.
- **Mejora propuesta:** Agregar tabla de roles y permisos (RBAC) separada.

---

#### 🔧 tb_Tecnicos (3 registros, 12 columnas)
**Campos:** ID_Tecnico, Nombre_Completo, Especialidad, DNI_Cedula, Telefono_Contacto, Email, Vehiculo_Asignado, Estado_Laboral, Nivel_Habilidad, Zona_Asignada, Fecha_Ingreso, Certificaciones

**Datos reales:** 3 técnicos activos en zona Carabayllo. Especialidades: Radio Enlace y General.

**Observaciones:**
- Campos bien pensados (vehículo, zona, nivel de habilidad, certificaciones).
- **Falta:** Historial de capacitaciones, calificación promedio, cantidad de trabajos completados, disponibilidad en tiempo real, horario laboral.
- Algunos registros incompletos (TEC-0002 y TEC-0003 sin DNI ni teléfono).

---

#### 📂 tb_Categorias (6 registros, 3 columnas)
**Categorías definidas:**
| ID | Categoría | Descripción |
|---|---|---|
| CAT-01 | Falla de Internet | Problemas de navegación, velocidad y latencia |
| CAT-02 | Falla de Cable | Problemas con señal de TV o decodificadores |
| CAT-03 | Configuración | Cambios lógicos (WiFi, puertos, reseteo) |
| CAT-04 | Infraestructura | Daños en red externa (postes, cajas, cables) |
| CAT-05 | Hardware | Fallas físicas en equipos del cliente |
| CAT-06 | Administrativo | Facturación, cortes por pago, planes |

**Evaluación:** Categorización sólida y completa para un ISP. Cubre tanto aspectos técnicos como administrativos.

**Mejora propuesta:** Agregar CAT-07 "IPTV" como categoría independiente dado que es un servicio diferenciado en Radio Enlace.

---

#### 📋 tb_Subcategorias (20 registros, 4 columnas)
**Campos:** ID_Sub, ID_Categoria, Subcategoría, Tipo de Atención

**Distribución:**
- CAT-01 (Internet): 5 subcategorías — Corte Total, Baja velocidad, Intermitencia, Páginas específicas, Internet Lento
- CAT-02 (Cable): 3 subcategorías — Sin Señal, Imagen congelada, Decodificador
- CAT-03 (Config): 3 subcategorías — WiFi, Puertos, Reseteo
- CAT-04 (Infra): 3 subcategorías — Acometida, NAP, Traslado
- CAT-05 (Hardware): 3 subcategorías — Router/ONT, Transformador, Puerto LAN
- CAT-06 (Admin): 3 subcategorías — Reconexión, Cambio plan, Facturación

**Tipo de Atención asignado:** "Soporte Remoto" o "Visita Técnica" — excelente clasificación que permite enrutar automáticamente.

**Problema detectado:** SUB-0020 tiene formato de ID inconsistente (debería ser 105 según el patrón numérico). Hay duplicidad con subcategoría 102 ("Baja velocidad" vs "Internet Lento").

---

#### ⏱️ tb_Prioridades_SLA (7 registros, 5 columnas)
**Campos:** ID_Prioridades, ID_Sub, Prioridad, Tiempo_Límite, Impacto

**SLAs definidos:**
| Prioridad | Tiempo Límite | Ejemplo |
|---|---|---|
| Crítica | 4 horas | Cliente incomunicado |
| Alta | 8-12 horas | Sin TV o hardware dañado |
| Media | 4-24 horas | Baja velocidad o admin |
| Baja | 48 horas | Cambio estético WiFi |

**Evaluación:** SLAs razonables para un ISP local. El mapeo subcategoría→prioridad es correcto.

**Mejora propuesta:** No todas las subcategorías tienen SLA definido (solo 7 de 20). Faltan SLA para subcategorías 103, 104, 202, 203, 302, 303, 402, 403, 502, 503, 602, 603 y SUB-0020.

---

#### 🎨 tb_Estados (19 registros, 7 columnas)
**Campos:** ID_Estado, Tipo_Entidad, Nombre_Estado, Color_Hex, Orden_Visualizacion, Descripcion, Es_Final

**Entidades cubiertas:**
- **Ticket (6 estados):** Abierto → En Proceso → Escalado → Resuelto → Cerrado / Cancelado
- **Cliente (3 estados):** Activo → Suspendido → Retirado
- **Visita (5 estados):** Programada → En Ruta → En Sitio → Completada / Cancelada
- **Solicitud (5 estados):** Pendiente → Aprobada → En Ejecución → Ejecutada / Rechazada

**Evaluación:** Excelente diseño con colores hex para UI, orden de visualización y flag `Es_Final`. Es un catálogo bien normalizado.

**Mejora propuesta:** Agregar estados para equipos (En Stock, Asignado, En Reparación, De Baja) y para derivaciones de planta externa.

---

#### 🏠 tb_Solicitudes_Instalacion (3 registros, 80 columnas)
**Esta es la tabla más compleja del sistema.** 80 campos que cubren todo el ciclo de vida de una instalación nueva.

**Secciones del registro:**
1. **Datos del Prospecto** (cols A-I): Nombre, DNI, teléfono, email, alternativo
2. **Ubicación** (cols J-O): Dirección, referencia, distrito, zona, GPS, tipo vivienda
3. **Registro y canal** (cols P-R): Usuario, canal solicitud, fuente de marketing
4. **Plan y tecnología** (cols S-W): Plan solicitado, precio, tecnología solicitada vs. viable
5. **Factibilidad Radio** (cols X-AC): Torre, visibilidad, distancia, obstrucciones, señal estimada, factibilidad
6. **Factibilidad Fibra** (cols AD-AI): Poste cercano, distancia, drop estimado, extensión, cobertura OLT
7. **Equipos asignados** (cols AJ-AO): CPE radio, ONT, router, otros, reservados
8. **Materiales estimados** (cols AP-AT): Cable UTP, drop fibra, jumper, conectores
9. **Costos** (cols AU-AW): Material, instalación, total
10. **Pago previo** (cols AX-BC): Requiere pago, monto, confirmación, método, comprobante
11. **Programación** (cols BD-BK): Estado, técnico, fecha, hora, turno, confirmación prospecto
12. **Resultado instalación** (cols BL-BR): Visita, exitosa, planta externa, derivación
13. **Creación de cliente** (cols BS-BU): Cliente creado, ID generado, fecha
14. **Cierre** (cols BV-CB): Fecha cierre, estado final, razón cancelación/rechazo, auditoría

**Datos muestra:**
- SOL-INST-0001: Radio Enlace, Plan 30MB, Torre Central, señal -68dBm → Aprobada
- SOL-INST-0002: Fibra Óptica, Plan 50MB, OLT con cobertura → Instalada → Cliente #1937 creado
- SOL-INST-0003: Radio Enlace, sin visibilidad, señal -85dBm → Derivada a planta externa

**Evaluación:** Diseño extraordinariamente detallado. Captura el flujo completo prospecto→instalación→cliente. La separación de factibilidad técnica Radio vs. Fibra es muy profesional.

**Mejoras propuestas:**
- Agregar campo de latitud/longitud separados (actualmente es string concatenado en Coordenadas_GPS)
- Agregar campo de segunda visita programada si la primera falla
- Agregar campo de consentimiento IPTV (solo aplica a Radio Enlace)

---

#### 🚐 tb_Visitas_Instalacion (1 registro, 111 columnas)
**La tabla más ancha del sistema con 111 columnas.** Registro ultra-detallado de cada instalación presencial.

**Secciones:**
1. **Datos generales** (A-N): IDs, técnico, fechas, prospecto
2. **Radio Enlace completo** (O-AQ): AP, CPE modelo/serial/MAC, alineación azimut/elevación, RSSI, noise floor, CCQ, chains, modulación, frecuencia, POE, cable UTP, router
3. **Fibra Óptica completo** (AR-BO): Poste, drop tendido, grapas, entrada casa, roseta, fusión/pérdida, jumper, ONT (modelo/serial/MAC/potencia Rx/Tx/distancia OLT/LOS/VLAN/registro)
4. **Pruebas de conectividad** (BP-CA): Ping gateway, ping internet, speedtest bajada/subida, WiFi configurado
5. **Material y costos** (CB-CF): Equipos instalados, material utilizado, costo real vs estimado
6. **Derivación planta externa** (CG-CI)
7. **Resultado** (CJ-CS): Completada, exitosa, problema, solución, satisfacción, calificación, firma
8. **Geolocalización y fotos** (CT-DD): GPS, 7 tipos de fotos (panorámica, instalación x3, speedtest, cliente, firma)
9. **Auditoría** (DE-DG): Estado visita, fechas creación/modificación

**Evaluación:** Nivel de detalle de grado profesional. Cada parámetro técnico relevante para Radio Enlace y Fibra Óptica está capturado. La sección de fotos con 7 campos es excelente para evidencia.

---

#### 🔀 tb_Derivaciones_Planta_Externa (2 registros, 106 columnas)
**Tabla nueva en v4.0.** Gestiona problemas que escapan al técnico de campo individual.

**Escenarios cubiertos:**
- **Radio:** AP saturado (95%), nodo caído, sin cobertura, interferencia masiva
- **Fibra:** Potencia Rx alta en múltiples ONT, atenuación excesiva, OLT caída, corte de fibra principal

**Datos muestra:**
- DER-PE-0001: AP Saturado al 95% en Torre Central Sector Norte → Se instaló nuevo AP sectorial → 23 clientes migrados → Saturación reducida a 55%
- DER-PE-0002: Atenuación excesiva en Fibra (8.5 dB) → Limpieza de conectores y re-fusión → Atenuación reducida a 2.1 dB

**Evaluación:** Tabla crítica que llena un vacío importante de v3. El flujo derivación→intervención→resolución está bien documentado.

---

#### 👥 tb_Clientes (50 registros, 14 columnas)
**Campos:** ID_Cliente, Nombre_Completo, DNI_Cedula, Email, Telefono, Movil, Direccion_Principal, Direccion_Servicio, Zona, Coordenadas, Codigo_Cliente, Estado_Cliente, Fecha_Registro, Fecha_Modificacion

**Estadísticas de datos reales:**
- 50 clientes registrados, todos en zona CARABAYLLO
- Estados: mezcla de ONLINE y OFFLINE
- Registros desde 2020 hasta 2026
- Código de cliente aleatorio de 6 caracteres

**Problemas detectados en datos:**
1. **Campo Email mal usado:** Contiene información de plan/equipo en lugar de email real (ej: "25MBX40", "PRESTAMO CAJA LINUX-TEC.LUIS MENDOZA"). Esto es un problema grave de integridad de datos.
2. **Teléfono Movil tiene comas trailing:** "991747872," — necesita limpieza.
3. **DNI faltante** en varios registros.
4. **Coordenadas vacías** en todos los registros.
5. **No hay campo de tipo de documento** (DNI, CE, Pasaporte).
6. **No hay campo de fecha de nacimiento.**

---

#### 📡 tb_Servicios_Cliente (50 registros, 41 columnas)
**Tabla relacional que vincula clientes con sus servicios técnicos.** Extremadamente detallada.

**Secciones:**
- **Comercial:** Plan, precio, día de pago, próximo pago, último pago, deuda, saldo
- **Técnico General:** Tecnología, IP asignada, MAC Address, estado servicio
- **Radio Enlace específico:** AP/Torre, modelo AP, frecuencia, SSID, CPE modelo/MAC/IP/serial, alineación, router
- **Fibra Óptica específico:** Poste referencia, drop metros, roseta, jumper, ONT marca/modelo/serial/MAC/potencia/distancia OLT

**Distribución tecnológica (de 50 servicios):**
- Radio Enlace: ~30 servicios (60%)
- Fibra Óptica: ~10 servicios (20%)
- No Definido: ~10 servicios (20%) — problema de datos

**Planes identificados:** 25MB/S/40, 45MB/S/50, 65MB/S/70, 100MB/S/100, 200MB/S/50, 300MB/S/60

**Problemas detectados:**
1. "No Definido" en Tecnología para ~20% de servicios
2. Precios inconsistentes (mismo plan con diferentes precios)
3. Deuda almacenada como string con formato ("1 S/. 40.00") en vez de valor numérico
4. Datos de fibra óptica genéricos/repetidos (mismo poste P-0123, misma potencia -21.5 para todos)

---

#### 📞 tb_Solicitudes_PostVenta (4 registros, 77 columnas)
**Gestiona servicios adicionales SOLO para clientes existentes (no instalaciones nuevas).**

**Tipos de servicio soportados:**
1. Punto Adicional CATV (cable coaxial)
2. Configuración IPTV (solo Radio Enlace)
3. Repetidor WiFi
4. Cambio de Plan (upgrade/downgrade)
5. Reubicación de servicio

**Cada tipo tiene campos específicos condicionales**, lo que muestra un diseño sofisticado aunque difícil de mantener en Excel.

---

#### 🎫 tb_Tickets (6 registros, 42 columnas)
**Sistema de tickets de soporte técnico.**

**Campos destacados:** Canal_Registro, Categoría/Subcategoría, Prioridad, Tipo_Atención, Síntoma, Problema_Recurrente, Ticket_Relacionado, Nivel_Soporte, Escalamiento, Evidencias (3 fotos/videos), Calificación NPS.

**Datos actuales:** 6 tickets, todos en estado "Abierto", todos registrados vía WhatsApp, todos por USR-0001. Categorías: Falla de Internet (4), Falla de Cable (1), Hardware (1).

**Problema:** Todos los tickets están en "Abierto" — sugiere que el flujo de cierre no se está ejecutando en el Excel.

---

#### 💻 tb_Soporte_Remoto (2 registros, 70 columnas)
**Registro detallado de sesiones de diagnóstico remoto.**

**Métricas capturadas para Radio Enlace:** RSSI, Noise Floor, CCQ, AirMax Quality, Tx/Rx Rate, Chain 0/1, Modulación, Canal, Frecuencia, Distancia, Alineación.

**Métricas capturadas para Fibra Óptica:** Potencia Rx/Tx ONT, Estado LOS, Temperatura, Distancia OLT, VLAN, Registro OLT.

**Métricas capturadas para WiFi:** Bandas activas, canales, interferencia, clientes conectados.

**Evaluación:** Nivel de detalle técnico excepcional. Cada sesión queda documentada con métricas de red reales.

---

#### 🚗 tb_Visitas_Tecnicas (3 registros, 100 columnas)
**Similar a tb_Visitas_Instalacion pero para reparaciones y mantenimiento.**

**Incluye adicionalmente:** Equipo instalado vs. retirado (con estado y razón del retiro), material facturado, visita adicional requerida, 7 tipos de fotos con geolocalización y firma digital.

---

#### 📊 tb_Protocolo_Tecnico (2 registros, 118 columnas)
**La tabla con más columnas del sistema (118).** Protocolo de diagnóstico completo.

**Secciones únicas:**
- Suministro eléctrico (voltaje, tierra física)
- Cableado estructurado y conectores
- Diagnóstico automático con causa probable y solución recomendada
- MTU detectado vs. óptimo
- Análisis WiFi: interferencia por canal, canales ocupados, recomendación

---

#### 📦 tb_Equipos (5 registros, 13 columnas)
**Inventario de equipos del ISP.**

**Tipos:** ONT (Huawei, ZTE), Radio (Ubiquiti NanoStation, LiteBeam), Router WiFi (TP-Link).  
**Estados:** En Stock, Asignado.

**Mejora necesaria:** Agregar campos de costo de adquisición, garantía, proveedor, lote, depreciación.

---

#### 🔄 tb_Movimientos_Equipos (2 registros, 10 columnas)
**Trazabilidad de equipos:** Cada movimiento (Instalación, Cambio, Retiro) queda registrado con ticket asociado, técnico responsable, estado anterior/nuevo y observaciones.

---

#### 📖 tb_Catalogo_Servicios (7 registros, 9 columnas)
**Catálogo de servicios con precios base.** Punto CATV S/15, Punto Red S/80, Traslado S/120, etc.

---

## 2. DIAGNÓSTICO GENERAL DEL SISTEMA ACTUAL

### 2.1 Fortalezas
1. **Diseño relacional bien pensado:** Las 20 tablas tienen relaciones claras mediante IDs.
2. **Nivel de detalle técnico excepcional:** 889 campos cubren cada aspecto técnico de Radio Enlace y Fibra Óptica.
3. **Flujos de trabajo documentados:** 3 flujos principales bien definidos.
4. **Separación instalación vs. post-venta:** Decisión arquitectónica correcta en v4.
5. **Catálogos normalizados:** Categorías, subcategorías, estados, prioridades.
6. **Trazabilidad completa:** Cada equipo, visita y ticket tiene auditoría.

### 2.2 Debilidades Críticas
1. **Excel no escala:** Con 50 clientes funciona, pero a 500+ se vuelve inmanejable.
2. **Sin concurrencia:** Múltiples usuarios no pueden editar simultáneamente.
3. **Datos inconsistentes:** Campo Email usado para notas, teléfonos con comas, tecnología "No Definido".
4. **Sin validación en tiempo real:** Los datos se pueden corromper fácilmente.
5. **80-118 columnas por fila:** Imposible de manejar manualmente sin errores.
6. **Sin automatización:** No hay cálculo automático de SLA, alertas, o estados.
7. **Sin dashboards:** No hay visibilidad en tiempo real del estado de la operación.

---

## 3. PROPUESTA DE ARQUITECTURA COMPLETA

### 3.1 Stack Tecnológico Recomendado

#### FRONTEND — React + Vite
```
Framework:     React 18+ con Vite
Lenguaje:      JavaScript/JSX (ya lo manejas)
Estilos:       Tailwind CSS + shadcn/ui
Estado:        Zustand (ligero) o React Context
Tablas:        TanStack Table (filtros, paginación, exportación)
Gráficos:      Recharts o Chart.js
Mapas:         Leaflet.js (ubicación de clientes/torres)
Formularios:   React Hook Form + Zod (validación)
Notificaciones: React-Toastify
Iconos:        Lucide React
Rutas:         React Router v6
```

**¿Por qué React y no C#/Blazor?**
Dado que tu backend será un Excel vía API y no un servidor .NET, React es la opción más natural. C# lo reservamos para si en el futuro migras a un backend propio con ASP.NET Core.

#### BACKEND — Excel en Google Drive + API
```
Fuente de datos:  Google Sheets (tu Excel subido a Drive)
API intermedia:   Tu API existente que extrae datos del Excel
Comunicación:     REST API → JSON → React
Alternativa:      Google Sheets API v4 directa (lectura/escritura)
Cache:            Service Worker + IndexedDB para modo offline
```

#### Arquitectura del Flujo de Datos
```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  React App  │◄───►│  Tu API      │◄───►│  Google Sheets   │
│  (Frontend) │     │  (Middleware) │     │  (Excel en Drive)│
└─────────────┘     └──────────────┘     └──────────────────┘
       │                                          │
       ▼                                          ▼
  ┌──────────┐                              ┌──────────┐
  │ IndexedDB│                              │  20 hojas│
  │ (Cache)  │                              │  del Excel│
  └──────────┘                              └──────────┘
```

---

### 3.2 Estructura de Módulos del Sistema

#### MÓDULO 1: DASHBOARD PRINCIPAL
```
Componentes:
├── KPIs en tiempo real
│   ├── Tickets abiertos / en proceso / escalados
│   ├── Instalaciones pendientes
│   ├── Clientes ONLINE vs OFFLINE
│   ├── SLA cumplido vs vencido (% y contador)
│   └── Técnicos disponibles vs en ruta
├── Gráficos
│   ├── Tickets por categoría (donut)
│   ├── Instalaciones por mes (barras)
│   ├── Ingresos por tecnología (línea)
│   ├── Distribución clientes Radio vs Fibra (pie)
│   └── Tiempo promedio de resolución (gauge)
├── Mapa de cobertura (Leaflet)
│   ├── Torres de Radio Enlace con radio de cobertura
│   ├── Nodos de Fibra Óptica
│   ├── Ubicación de clientes (color por estado)
│   └── Técnicos en ruta (GPS en tiempo real)
└── Alertas activas
    ├── Tickets próximos a vencer SLA
    ├── APs con saturación >80%
    ├── ONTs con potencia límite (>-24 dBm)
    └── Clientes con deuda >2 meses
```

#### MÓDULO 2: GESTIÓN DE CLIENTES
```
├── Lista de clientes (TanStack Table)
│   ├── Búsqueda por nombre, DNI, código, dirección
│   ├── Filtros: estado, zona, tecnología, plan
│   ├── Exportar a Excel/PDF
│   └── Vista rápida hover con datos principales
├── Ficha de cliente (vista detallada)
│   ├── Datos personales
│   ├── Servicio(s) contratado(s)
│   ├── Historial de tickets
│   ├── Historial de pagos
│   ├── Equipos asignados
│   ├── Métricas técnicas actuales
│   └── Timeline de interacciones
├── Estado de cuenta
│   ├── Deuda actual
│   ├── Historial de pagos
│   ├── Próximo vencimiento
│   └── Generar comprobante
└── Acciones rápidas
    ├── Suspender/Reconectar servicio
    ├── Cambiar plan
    ├── Crear ticket
    └── Programar visita técnica
```

#### MÓDULO 3: TICKETS Y SOPORTE
```
├── Kanban Board de tickets
│   ├── Columnas: Abierto → En Proceso → Escalado → Resuelto → Cerrado
│   ├── Drag & drop para cambiar estado
│   ├── Colores por prioridad (Crítica=rojo, Alta=naranja, Media=amarillo, Baja=verde)
│   └── Timer de SLA visible en cada tarjeta
├── Crear ticket
│   ├── Buscador de cliente (autocompletado)
│   ├── Categoría → Subcategoría (cascada)
│   ├── Prioridad auto-asignada por SLA
│   ├── Tipo de atención sugerido
│   ├── Upload de evidencias (fotos/video)
│   └── Canal de registro
├── Soporte Remoto
│   ├── Formulario de diagnóstico por tecnología
│   ├── Radio: RSSI, CCQ, Chains, Modulación
│   ├── Fibra: Potencia ONT, LOS, OLT
│   ├── WiFi: canales, interferencia
│   ├── Speedtest integrado
│   └── Auto-generación de protocolo técnico
├── Escalamiento
│   ├── Razón de escalamiento
│   ├── Derivar a planta externa
│   └── Notificación automática a supervisor
└── Cierre de ticket
    ├── Solución aplicada
    ├── Calificación del cliente (1-5 estrellas)
    ├── NPS Score
    └── Auto-cálculo de tiempo de resolución
```

#### MÓDULO 4: INSTALACIONES (Flujo Completo)
```
├── Pipeline de instalaciones
│   ├── Solicitud Recibida
│   ├── Estudio de Factibilidad
│   ├── Aprobada / Rechazada
│   ├── Programada
│   ├── En Instalación
│   ├── Completada → Crear Cliente
│   └── Derivada a Planta Externa
├── Nueva solicitud de instalación
│   ├── Datos del prospecto
│   ├── Ubicación con mapa (pin en Leaflet)
│   ├── Selección de tecnología
│   ├── Estudio de factibilidad
│   │   ├── Radio: torre, visibilidad, distancia, señal estimada
│   │   └── Fibra: poste, drop estimado, cobertura OLT
│   ├── Cotización automática (materiales + mano de obra)
│   └── Registro de pago previo
├── Orden de instalación para técnico
│   ├── Checklist dinámico por tecnología
│   ├── Radio: 22 campos específicos
│   ├── Fibra: 25 campos específicos
│   ├── Pruebas de conectividad
│   ├── Captura de fotos con cámara
│   ├── Firma digital del cliente
│   └── Geolocalización automática
└── Post-instalación
    ├── Creación automática de cliente
    ├── Creación automática de servicio
    ├── Asignación de equipos en inventario
    └── Envío de bienvenida (WhatsApp/Email)
```

#### MÓDULO 5: VISITAS TÉCNICAS
```
├── Agenda de visitas (calendario)
│   ├── Vista diaria/semanal
│   ├── Por técnico
│   ├── Color por tipo (instalación, reparación, post-venta)
│   └── Conflictos de horario alertados
├── Orden de trabajo digital
│   ├── Datos del cliente
│   ├── Historial del ticket
│   ├── Protocolo técnico previo (si existe)
│   ├── Herramientas y materiales sugeridos
│   └── Ruta optimizada (si hay múltiples visitas)
├── Registro de visita (formulario técnico)
│   ├── Formulario condicional por tecnología
│   ├── Cambio de equipo (retiro + instalación)
│   ├── Material utilizado vs. estimado
│   ├── 7 tipos de fotos
│   └── Firma digital
└── Derivación a planta externa
    ├── Tipo de problema detectado
    ├── Impacto (individual vs. masivo)
    ├── Fotos y métricas de evidencia
    └── Asignación a cuadrilla de planta
```

#### MÓDULO 6: PLANTA EXTERNA
```
├── Panel de derivaciones activas
│   ├── Radio: APs saturados, nodos caídos
│   ├── Fibra: atenuación excesiva, cortes
│   └── Prioridad por cantidad de clientes afectados
├── Gestión de intervención
│   ├── Asignación de personal/cuadrilla
│   ├── Equipo especial requerido
│   ├── Ventana de mantenimiento
│   ├── Trabajo realizado (detalle técnico)
│   └── Métricas antes/después
├── Red de infraestructura
│   ├── Mapa de torres con APs (saturación %)
│   ├── Mapa de nodos de fibra con OLTs
│   ├── Estado de cada elemento
│   └── Historial de intervenciones
└── Mantenimiento preventivo
    ├── Calendario de limpieza NAPs
    ├── Revisión de APs por saturación
    └── Alertas automáticas por umbral
```

#### MÓDULO 7: INVENTARIO DE EQUIPOS
```
├── Stock actual
│   ├── Filtrar por tipo, marca, estado
│   ├── Alertas de stock bajo
│   └── Valor total del inventario
├── Movimientos
│   ├── Ingreso (compra)
│   ├── Asignación (instalación)
│   ├── Cambio (por falla)
│   ├── Retiro (baja)
│   └── Préstamo temporal
├── Trazabilidad por equipo
│   ├── Historial completo de movimientos
│   ├── Cliente actual asignado
│   ├── Técnico que lo instaló
│   └── Ticket asociado a cada movimiento
└── Equipos con mejoras propuestas
    ├── Costo de adquisición
    ├── Proveedor
    ├── Fecha de garantía
    ├── Depreciación
    └── QR code para escaneo rápido
```

#### MÓDULO 8: POST-VENTA
```
├── Solicitudes activas
│   ├── Punto adicional CATV/Red
│   ├── Configuración IPTV (solo Radio)
│   ├── Repetidor WiFi
│   ├── Cambio de plan
│   └── Reubicación
├── Formulario dinámico
│   ├── Campos condicionales según tipo
│   ├── Cotización automática
│   ├── Registro de pago
│   └── Programación de ejecución
└── Ejecución
    ├── Remota (cambio plan, config)
    └── Presencial (punto adicional, repetidor)
```

#### MÓDULO 9: REPORTES Y ANALYTICS
```
├── Operativos
│   ├── Tickets por período, categoría, técnico
│   ├── Cumplimiento de SLA (%)
│   ├── Tiempo promedio de resolución
│   └── Tasa de resolución al primer contacto
├── Comerciales
│   ├── Clientes nuevos por mes
│   ├── Churn rate (retiros)
│   ├── Ingresos por tecnología
│   ├── Morosidad por zona
│   └── Conversión prospecto→cliente
├── Técnicos
│   ├── Saturación de APs (Radio)
│   ├── Potencia promedio ONTs (Fibra)
│   ├── Top 10 clientes con más tickets
│   ├── Equipos con más fallas
│   └── Eficiencia por técnico
└── Exportación
    ├── PDF con gráficos
    ├── Excel detallado
    └── Envío automático por email
```

#### MÓDULO 10: IPTV (Específico Radio Enlace)
```
├── Gestión de servicio IPTV
│   ├── Clientes con IPTV activo
│   ├── Decodificador/App asignada
│   ├── Lista de canales/paquetes
│   └── Estado del servicio
├── Configuración
│   ├── Aplicativo (FlixIPTV, etc.)
│   ├── Equipo del cliente (Smart TV, caja Android)
│   └── Configuración remota vs. presencial
└── Señal de TV por cable coaxial (Fibra)
    ├── Clientes con CTV
    ├── Splitters instalados
    └── Puntos adicionales
```

#### MÓDULO 11: ADMINISTRACIÓN
```
├── Usuarios y roles
│   ├── CRUD de usuarios
│   ├── Roles: Admin, Supervisor, Asesor, Técnico, Facturación
│   ├── Permisos por módulo
│   └── Log de actividades
├── Catálogos del sistema
│   ├── Categorías/Subcategorías
│   ├── Prioridades y SLAs
│   ├── Estados
│   ├── Planes y precios
│   ├── Catálogo de servicios
│   └── Zonas de cobertura
├── Configuración general
│   ├── Datos de la empresa
│   ├── Logo y branding
│   ├── Plantillas de WhatsApp
│   └── Parámetros del sistema
└── Integración API
    ├── Conexión con Google Sheets
    ├── Estado de sincronización
    ├── Logs de errores
    └── Configuración de intervalos de refresh
```

---

### 3.3 Mejoras a los Datos Propuestas

#### Nuevas tablas recomendadas:
| Tabla | Propósito |
|---|---|
| tb_Roles_Permisos | RBAC con permisos granulares por módulo |
| tb_Planes | Catálogo normalizado de planes (actualmente mezclado en datos) |
| tb_Zonas_Cobertura | Zonas con polígonos GPS, torres asignadas, estado |
| tb_Torres | Infraestructura de torres con APs, capacidad, ubicación |
| tb_OLTs | OLTs de fibra con puertos, nodos, capacidad |
| tb_Pagos | Historial de pagos separado de servicios |
| tb_Notificaciones | Alertas del sistema (SLA, morosidad, saturación) |
| tb_IPTV_Servicios | Servicio IPTV independiente con canales y configuración |
| tb_Logs_Auditoria | Registro de todas las acciones del sistema |
| tb_Archivos | Gestión centralizada de fotos, firmas, documentos |

#### Campos a corregir en datos existentes:
1. **tb_Clientes.Email** → Migrar datos de plan/equipo a campos correctos, dejar solo email real
2. **tb_Clientes.Movil** → Eliminar comas trailing
3. **tb_Servicios_Cliente.Deuda_Actual** → Cambiar a valor numérico
4. **tb_Servicios_Cliente.Tecnologia** → Resolver "No Definido" para todos los registros
5. **tb_Subcategorias** → Corregir ID de SUB-0020, eliminar duplicidad con 102
6. **tb_Prioridades_SLA** → Completar SLAs faltantes para las 13 subcategorías sin SLA

---

### 3.4 Estructura de Carpetas del Proyecto React

```
isp-system/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── sheetsApi.js          // Conexión a tu API de Google Sheets
│   │   ├── clientesApi.js        // CRUD clientes
│   │   ├── ticketsApi.js         // CRUD tickets
│   │   ├── instalacionesApi.js   // CRUD instalaciones
│   │   ├── visitasApi.js         // CRUD visitas
│   │   ├── equiposApi.js         // CRUD equipos
│   │   └── reportesApi.js        // Endpoints de reportes
│   ├── components/
│   │   ├── common/
│   │   │   ├── DataTable.jsx     // Tabla reutilizable (TanStack)
│   │   │   ├── StatusBadge.jsx   // Badge con colores de tb_Estados
│   │   │   ├── PriorityTag.jsx   // Tag de prioridad con SLA
│   │   │   ├── SearchBar.jsx     // Búsqueda global
│   │   │   ├── FileUpload.jsx    // Upload de fotos/evidencias
│   │   │   ├── MapView.jsx       // Componente Leaflet reutilizable
│   │   │   └── KPICard.jsx       // Tarjeta de indicador
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TicketsSummary.jsx
│   │   │   ├── CoverageMap.jsx
│   │   │   └── AlertsPanel.jsx
│   │   ├── clientes/
│   │   │   ├── ClientesList.jsx
│   │   │   ├── ClienteDetail.jsx
│   │   │   ├── ClienteForm.jsx
│   │   │   └── ServicioCard.jsx
│   │   ├── tickets/
│   │   │   ├── TicketsKanban.jsx
│   │   │   ├── TicketCreate.jsx
│   │   │   ├── TicketDetail.jsx
│   │   │   ├── SoporteRemotoForm.jsx
│   │   │   └── ProtocoloTecnico.jsx
│   │   ├── instalaciones/
│   │   │   ├── InstalacionPipeline.jsx
│   │   │   ├── SolicitudForm.jsx
│   │   │   ├── FactibilidadRadio.jsx
│   │   │   ├── FactibilidadFibra.jsx
│   │   │   └── OrdenInstalacion.jsx
│   │   ├── visitas/
│   │   │   ├── CalendarioVisitas.jsx
│   │   │   ├── OrdenTrabajo.jsx
│   │   │   └── RegistroVisita.jsx
│   │   ├── planta-externa/
│   │   │   ├── DerivacionesPanel.jsx
│   │   │   ├── IntervencionForm.jsx
│   │   │   └── InfraestructuraMap.jsx
│   │   ├── equipos/
│   │   │   ├── InventarioList.jsx
│   │   │   ├── EquipoDetail.jsx
│   │   │   └── MovimientoForm.jsx
│   │   ├── post-venta/
│   │   │   ├── SolicitudesPV.jsx
│   │   │   └── ServicioForm.jsx
│   │   ├── reportes/
│   │   │   ├── ReporteDashboard.jsx
│   │   │   ├── SLAReport.jsx
│   │   │   └── TecnicoReport.jsx
│   │   └── admin/
│   │       ├── UsuariosManager.jsx
│   │       ├── CatalogosEditor.jsx
│   │       └── ConfiguracionAPI.jsx
│   ├── hooks/
│   │   ├── useSheetData.js       // Hook para leer datos del Excel
│   │   ├── useWriteSheet.js      // Hook para escribir al Excel
│   │   ├── useSLA.js             // Cálculo de SLA en tiempo real
│   │   └── useNotifications.js   // Alertas del sistema
│   ├── store/
│   │   └── useStore.js           // Zustand store global
│   ├── utils/
│   │   ├── formatters.js         // Formato de datos (moneda, fecha, etc.)
│   │   ├── validators.js         // Validaciones Zod
│   │   ├── mappers.js            // Mapeo Excel columns → objetos JS
│   │   └── constants.js          // IDs de estados, categorías, etc.
│   ├── layouts/
│   │   ├── MainLayout.jsx        // Sidebar + Header + Content
│   │   └── TecnicoLayout.jsx     // Layout simplificado para técnicos
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── ClientesPage.jsx
│   │   ├── TicketsPage.jsx
│   │   ├── InstalacionesPage.jsx
│   │   ├── VisitasPage.jsx
│   │   ├── PlantaExternaPage.jsx
│   │   ├── EquiposPage.jsx
│   │   ├── PostVentaPage.jsx
│   │   ├── ReportesPage.jsx
│   │   └── AdminPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

### 3.5 Integración con API de Google Sheets

```javascript
// api/sheetsApi.js — Ejemplo de capa de conexión

const API_BASE = 'https://tu-api-existente.com/api'; // Tu API que lee el Excel

// Lectura de datos
export async function getClientes() {
  const response = await fetch(`${API_BASE}/sheets/tb_Clientes`);
  const rawData = await response.json();
  // Mapear columnas del Excel a objetos JS
  return rawData.map(row => ({
    id: row[0],          // ID_Cliente
    nombre: row[1],      // Nombre_Completo
    dni: row[2],         // DNI_Cedula
    email: row[3],       // Email (necesita limpieza)
    telefono: row[4],    // Telefono
    movil: row[5]?.replace(/,\s*$/, ''), // Limpiar comas
    direccion: row[6],   // Direccion_Principal
    zona: row[8],        // Zona
    estado: row[11],     // Estado_Cliente
    fechaRegistro: row[12],
  }));
}

// Escritura de datos (actualizar Excel)
export async function updateTicketEstado(ticketId, nuevoEstado) {
  return fetch(`${API_BASE}/sheets/tb_Tickets/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sheet: 'tb_Tickets',
      filter: { column: 'A', value: ticketId },
      updates: { 'U': nuevoEstado } // Columna U = Estado_Ticket
    })
  });
}
```

---

### 3.6 Consideraciones Específicas por Tecnología ISP

#### Radio Enlace
- **Dashboard de APs:** Saturación en tiempo real, clientes por AP, frecuencias usadas
- **Alineación:** Registro de azimut/elevación en cada instalación
- **Chains:** Monitoreo de ambos chains (cadena de señal) crítico para diagnóstico
- **IPTV:** Solo disponible en radio, gestión de decodificadores/apps
- **Cable coaxial desde router:** Gestión de splitters y puntos CATV

#### Fibra Óptica
- **Dashboard de OLTs:** Puertos activos, potencia por ONT, atenuación
- **Fusiones:** Registro de pérdida por fusión en cada empalme
- **NAPs:** Ubicación, estado, última limpieza
- **Potencia óptica:** Alertas automáticas si Rx > -24 dBm o < -8 dBm
- **CTV por coaxial:** Sale directo del router, gestión independiente

---

## 4. ROADMAP DE IMPLEMENTACIÓN

### Fase 1 — MVP (4-6 semanas)
- Dashboard con KPIs principales
- CRUD de Clientes (lectura/escritura al Excel)
- Sistema de Tickets con Kanban
- Conexión con tu API existente

### Fase 2 — Operaciones (4-6 semanas)
- Módulo de Instalaciones completo
- Visitas Técnicas con calendario
- Soporte Remoto con formulario técnico
- Inventario de Equipos

### Fase 3 — Avanzado (4-6 semanas)
- Planta Externa
- Post-Venta
- IPTV
- Reportes y Analytics

### Fase 4 — Optimización (continuo)
- PWA para técnicos (modo offline)
- Notificaciones push
- Integración WhatsApp Business API
- Migración eventual a base de datos real (PostgreSQL)

---

## 5. CONCLUSIÓN

Tu Excel es un sistema sorprendentemente bien diseñado con 889 campos que cubren prácticamente cada aspecto operativo de un ISP. El nivel de detalle técnico en Radio Enlace y Fibra Óptica es profesional y demuestra conocimiento profundo del negocio. Sin embargo, Excel ya alcanzó su límite como plataforma: no escala, no permite concurrencia, y no automatiza procesos.

La propuesta es construir un frontend React que consuma tu API existente de Google Sheets, respetando la estructura de datos que ya tienes (con las mejoras propuestas) y agregando los 11 módulos descritos. Esto te dará un sistema ISP completo, profesional y escalable sin necesidad de cambiar tu backend inmediatamente.

El sistema propuesto cubre: gestión comercial (clientes, planes, pagos), gestión técnica (tickets, soporte remoto, visitas, protocolos), gestión de infraestructura (planta externa, torres, OLTs), gestión de inventario (equipos, movimientos), y gestión de servicios especializados (IPTV, CTV).

---

*Documento generado como análisis de ingeniería de sistemas para migración de sistema ISP basado en Excel a plataforma web.*
