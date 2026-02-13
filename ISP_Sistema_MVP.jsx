import { useState, useEffect, useCallback, createContext, useContext, useMemo } from "react";

// ============================================================
// CONFIGURACIÓN — Cambia estos valores con los tuyos
// ============================================================
const CONFIG = {
  GOOGLE_CLIENT_ID: "TU_CLIENT_ID.apps.googleusercontent.com", // ← De Google Cloud Console
  GOOGLE_SHEET_ID: "TU_SHEET_ID",                               // ← De tu Google Sheet URL
  SHEET_NAME: "Sheet1",                                          // ← Nombre de la hoja
  AUTH_SHEET: "tb_Usuarios_Auth",                                // ← Hoja de usuarios autorizados
};

// ============================================================
// ROLES Y PERMISOS
// ============================================================
const ROLES = {
  ADMIN: { label: "Administrador", color: "#e74c3c", permissions: ["*"] },
  SUPERVISOR: { label: "Supervisor", color: "#f39c12", permissions: ["dashboard", "clientes", "tickets", "reportes"] },
  ASESOR: { label: "Asesor Soporte", color: "#3498db", permissions: ["clientes.read", "tickets", "soporte"] },
  TECNICO: { label: "Técnico", color: "#27ae60", permissions: ["visitas", "equipos", "tickets.read"] },
};

// Usuarios autorizados de ejemplo (en producción se lee del Google Sheet)
const AUTHORIZED_USERS = [
  { email: "demo@gmail.com", rol: "ADMIN", nombre: "Administrador Demo" },
];

// ============================================================
// CONTEXTO DE AUTENTICACIÓN
// ============================================================
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("isp_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { localStorage.removeItem("isp_user"); }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem("isp_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("isp_user");
  }, []);

  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    const role = ROLES[user.rol];
    if (!role) return false;
    return role.permissions.includes("*") || role.permissions.includes(perm);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() { return useContext(AuthContext); }

// ============================================================
// MOTOR DE TRANSFORMACIÓN DE DATOS (ETL)
// ============================================================
function transformClientData(raw) {
  return {
    id: raw.Id || raw.B || "",
    nombre: cleanNombre(raw.Nombre || raw.C || "").nombre,
    estado_cuenta: cleanNombre(raw.Nombre || raw.C || "").estado,
    mac: raw.Mac || raw.D || "",
    ip: raw.Ip || raw.E || "",
    ip_receptor: raw["IP Receptor"] || raw.F || "",
    ultimo_vencimiento: raw["Ultimo vencimiento"] || raw.G || "",
    ultimo_pago: raw["Ultimo pago"] || raw.H || "",
    tipo_estrato: raw["Tipo estrato"] || raw.I || "",
    direccion: raw["Dirección Principal"] || raw.K || "",
    fecha_suspendido: raw["Fecha suspendido"] || raw.L || "",
    direccion_servicio: raw["Dirección Servicio"] || raw.N || "",
    dia_pago: raw["Dia pago"] || raw.O || "",
    deuda_raw: raw["Deuda actual"] || raw.P || "",
    deuda_meses: parseDeuda(raw["Deuda actual"] || raw.P).meses,
    deuda_monto: parseDeuda(raw["Deuda actual"] || raw.P).monto,
    notas_tecnicas: isEmail(raw.Correo || raw.Q) ? "" : (raw.Correo || raw.Q || ""),
    email: isEmail(raw.Correo || raw.Q) ? (raw.Correo || raw.Q) : "",
    telefono: raw.Telefono || raw.R || "",
    plan: cleanPlan(raw.Plan || raw.S || ""),
    proximo_pago: raw["Proximo pago"] || raw.T || "",
    movil_1: splitMovil(raw.Movil || raw.U).movil1,
    movil_2: splitMovil(raw.Movil || raw.U).movil2,
    saldo: raw.Saldo || raw.V || "S/. 0.00",
    nodo_router: raw.Router || raw.X || "",
    fecha_instalacion: raw.Instalado || raw.Y || "",
    dni: padDNI(raw.Cedula || raw.Z),
    user_ppp: raw["User PPP/Hotspot"] || raw.AA || "",
    codigo: raw.Codigo || raw.AC || "",
    total_cobrar: raw["Total cobrar"] || raw.AF || "",
    precio: parseMoney(raw["Total cobrar"] || raw.AF),
    zona: raw.Zona || raw.AG || "",
    status: raw.Status || raw.AH || "",
    servicios_adicionales: parseServiciosTV(raw["Servicios personalizados"] || raw.AI),
    tecnologia: inferTecnologia(raw.Router || raw.X, raw.Plan || raw.S),
    estado_servicio: getEstadoServicio(raw.Plan || raw.S, raw.Nombre || raw.C),
  };
}

function cleanNombre(raw) {
  if (!raw) return { nombre: "", estado: "DESCONOCIDO" };
  const str = String(raw).trim();
  const match = str.match(/^(.+?)\s{2,}(ACTIVO|SUSPENDIDO)\s*$/);
  if (match) return { nombre: match[1].trim(), estado: match[2] };
  if (str.endsWith("ACTIVO")) return { nombre: str.replace(/\s*ACTIVO$/, "").trim(), estado: "ACTIVO" };
  if (str.endsWith("SUSPENDIDO")) return { nombre: str.replace(/\s*SUSPENDIDO$/, "").trim(), estado: "SUSPENDIDO" };
  return { nombre: str, estado: "ACTIVO" };
}

function splitMovil(raw) {
  if (!raw) return { movil1: "", movil2: "" };
  let str = String(raw).replace(/\s/g, "");
  if (str.includes(",")) {
    const parts = str.split(",").filter(Boolean);
    return { movil1: parts[0] || "", movil2: parts[1] || "" };
  }
  if (str.length > 12) return { movil1: str.substring(0, 9), movil2: str.substring(9) };
  return { movil1: str, movil2: "" };
}

function isEmail(val) { return val && String(val).includes("@"); }
function padDNI(val) { if (!val) return ""; return String(val).padStart(8, "0"); }
function parseMoney(val) {
  if (!val) return 0;
  const match = String(val).match(/([\d.]+)/);
  const num = match ? parseFloat(match[1]) : 0;
  return num < 0 ? 0 : num;
}
function parseDeuda(val) {
  if (!val) return { meses: 0, monto: 0 };
  const match = String(val).match(/(\d+)\s*S\/\.\s*([\d.]+)/);
  if (match) return { meses: parseInt(match[1]), monto: parseFloat(match[2]) };
  return { meses: 0, monto: 0 };
}
function inferTecnologia(router, plan) {
  const r = String(router || "").toUpperCase();
  const p = String(plan || "").toUpperCase();
  if (["OLT", "FIBRA", "GPON", "DIXON", "HUWEI"].some(kw => r.includes(kw))) return "Fibra Óptica";
  if (p.includes("FIBRA") || p.includes("GPON")) return "Fibra Óptica";
  if (["ND1", "ND2", "ND3", "/1100", "/4011", "ORCHALL"].some(kw => r.includes(kw))) return "Radio Enlace";
  if (p.includes("ANTENA")) return "Radio Enlace";
  return "No Determinado";
}
function cleanPlan(plan) {
  if (!plan) return "";
  if (plan.toUpperCase() === "CORTE POR DEUDA") return "CORTE POR DEUDA (Sin plan asignado)";
  return plan;
}
function getEstadoServicio(plan, nombre) {
  if (String(plan).toUpperCase() === "CORTE POR DEUDA") return "Cortado";
  if (String(nombre).includes("SUSPENDIDO")) return "Suspendido";
  return "Activo";
}
function parseServiciosTV(raw) {
  if (!raw) return [];
  const regex = /([^(]+)\(S\/\.\s*([\d.]+)\)/g;
  const servicios = [];
  let match;
  while ((match = regex.exec(String(raw))) !== null) {
    servicios.push({ tipo: match[1].trim(), precio: parseFloat(match[2]) });
  }
  return servicios;
}

// ============================================================
// DATOS SIMULADOS PARA DEMO DE IMPORTACIÓN (Variación de DEMO_RAW_DATA)
// ============================================================
const getSimulatedUpdateData = () => {
  // Copiamos la data base y hacemos modificaciones para probar la detección de cambios
  const newData = JSON.parse(JSON.stringify(DEMO_RAW_DATA));
  // 1. MODIFICACIÓN: El cliente 000006 (Ruth) pasa a OFFLINE y aumenta deuda
  newData[1].AH = "OFFLINE"; 
  newData[1].P = "1 S/. 50.00"; // Antes no tenía deuda
  // 2. NUEVO: Agregamos un cliente nuevo
  newData.push({ B:"999999", C:"CLIENTE NUEVO IMPORTADO  ACTIVO", D:"AA:BB:CC:DD:EE:FF", E:"192.168.30.250", H:"07/02/2026", I:4, K:"MZ.Z LT.1 NUEVA ZONA", O:15, S:"PLAN FIBRA 200MB S/40", U:"999888777", X:"DIXON OLT/FIBRA", Z:"12345678", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"ONLINE" });
  return newData;
};

// ============================================================
// DATOS DE DEMO (basados en tu Excel real - 30 registros sample)
// ============================================================
const DEMO_RAW_DATA = [
  { B:"000001", C:"MONICA ROCIO DELGADO LOPEZ  ACTIVO", D:"24:5A:4C:BA:B5:88", E:"192.168.30.5", H:"22/01/2026", I:4, K:"MZA18 LT10 PLANICIE1", L:"2025-08-23", O:21, Q:"25MBX40", S:"PLAN ANTENA 25MB S/40 v1", T:"21/02/2026", U:"991747872", V:"S/. 0.00", X:"PLA1/ND2", Y:"05/01/2024", Z:"08171895", AC:"qnyrgf", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000006", C:"RUTH NUBI ALDAVE ALEJOS  ACTIVO", D:"24:5A:4C:48:4B:50", E:"192.168.30.20", H:"02/02/2026", I:4, K:"MZ. R LT. 7 VILLA 5", O:27, Q:"45MBX50", S:"PLAN ANTIGUO FIBRA 45MB S/50 v1", T:"27/02/2026", U:"935293620", V:"S/. 0.00", X:"PLA1/ND2", Y:"05/01/2024", Z:"43406432", AC:"phskkb", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000011", C:"DANTE MARCOS VALLE ALMORA  ACTIVO", E:"192.168.0.111", H:"04/02/2026", I:4, K:"MZ.A9 LT.18 PLANICIE1", O:4, Q:"ROU.VSOL DBANDA CTV", S:"PLAN OPCIONAL 35MB S/40", T:"04/02/2026", U:"957026760", V:"S/. 0.00", X:"DIXON OLT/FIBRA", Y:"05/01/2024", Z:"09919869", AC:"vjd0o3", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000014", C:"ALBERTO ENRIQUE DA COSTA PEÑA  ACTIVO", D:"24:5A:4C:DC:21:15", E:"192.168.30.64", H:"23/01/2026", K:"MZ.A9 LT.2 PLANICIE2", O:1, Q:"45MBX50", S:"PLAN ANTIGUO FIBRA 65MB S/60 v1", T:"01/02/2026", U:"981730608965231254", V:"S/. 0.00", X:"PLA1/ND2", Z:"41538217", AC:"urfveu", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000016", C:"ERIKA MONTES HUAMANI  ACTIVO", D:"60:22:32:BC:A0:51", E:"192.168.30.72", H:"15/01/2026", K:"MZ.R LT.1 VILLA5", O:8, P:"1 S/. 100.00", Q:"BOLETA MENSUAL NO AD", S:"PLAN ANTENA 100 MB S/100 v1", T:"08/02/2026", U:"991503300", V:"S/. 0.00", X:"PLA1/ND2", Z:"46210801", AC:"pizryu", AF:"S/. 100.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000017", C:"DANNY STUARD MARQUEZ  ACTIVO", D:"9C:05:D6:90:1B:1A", E:"192.168.30.91", H:"17/01/2026", K:"MZ.I LT.20 VILLA5", O:1, S:"PLAN ANTENA 65MB S/70 v1", T:"01/02/2026", U:"990614406", X:"PLA1/ND2", Z:"25866854", AC:"kvfo3j", AF:"S/. 70.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000019", C:"JUANA ESTHER VALDEZ  ACTIVO", D:"24:5A:4C:4E:82:52", E:"192.168.30.76", H:"07/01/2026", K:"MZ R LT6 VILLA 5", O:3, P:"1 S/. 85.00", S:"PLAN ANTENA 65MB S/70 v1", T:"03/02/2026", U:"971133108", X:"PLA1/ND2", Z:"08035274", AC:"e2f6t3", AF:"S/. 70.00", AG:"CARABAYLLO", AH:"OFFLINE", AI:"1TV-15 (S/. 15.00)" },
  { B:"000020", C:"KEVIN JESUS PONTE RIVEROS  ACTIVO", D:"60:22:32:D8:2A:06", E:"192.168.30.79", H:"01/02/2026", K:"Mz.R Lt.3 VILLA 5", O:3, S:"PLAN ANTENA 100MB S/90 v1", U:"926537083", X:"PLA1/ND2", Z:"75678138", AC:"8n33lq", AF:"S/. 90.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000021", C:"FLOR ORTIZ FLORES  ACTIVO", D:"24:5A:4C:48:2D:54", E:"192.168.30.96", H:"30/01/2026", K:"MZ.A LT.7 VILLA5", O:1, S:"PLAN ANTENA 45MB S/50 v2", U:"936914844", X:"PLA1/ND2", Z:"73515362", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000025", C:"KARINA OROAPAZA LAURA  ACTIVO", D:"24:5A:4C:48:33:D5", E:"192.168.30.122", H:"03/12/2025", K:"MZ.C LT.4 VILLA5", O:1, S:"PLAN ANTIGUO FIBRA 25MB S/40 v1", U:"972629497", X:"PLA1/ND2", Z:"47423232", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000032", C:"ROSIL DENYS VERGARA HUIZA  ACTIVO", D:"24:5A:4C:B0:5E:BB", E:"192.168.30.155", H:"27/11/2025", K:"MZ.J LT.32 VILLA5", O:27, S:"PLAN ANTENA 45MB S/50 v2", U:"940953797973130113", X:"PLA1/ND2", Z:"70768999", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000038", C:"KATHERIN MOROCHO HUERTA  ACTIVO", E:"192.168.0.33", H:"05/12/2025", K:"MZ.A9 LT.16 PLANICIE1", O:1, Q:"ANTENA M5-100MB", S:"PLAN FIBRA HUWEI O DIXON 100MB S/40", U:"997688870", X:"DIXON OLT/FIBRA", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000048", C:"MEDALI JAQUELINE RUBIO SILVA  ACTIVO", E:"10.71.100.73", H:"07/12/2025", K:"MZ B4 LT 13 PLANICIE 1", O:1, Q:"MIGRACION FIBRA", S:"PLAN FIBRA 200MB S/40", U:"935667693", X:"DIXON OLT/FIBRA", Z:"43676007", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000055", C:"LESLY STEPHANY LEON ANCAJIMA  ACTIVO", D:"24:5A:4C:DC:34:CA", E:"192.168.30.103", H:"07/12/2025", K:"MZ C LT13 VILLA 5", O:1, S:"PLAN ANTENA 65MB S/80 v1", U:"963364084907587697", X:"PLA1/ND2", Z:"75607281", AF:"S/. 80.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000060", C:"MILAGROS BECERRA JUSCAMAYTA  ACTIVO", D:"24:5A:4C:DC:38:96", E:"192.168.30.150", H:"09/12/2025", K:"MZ A4 LT12 PLANICIE 1", O:1, S:"PLAN ANTIGUO FIBRA 45MB S/50 v1", U:"912305225,952 968 084", X:"PLA1/ND2", Z:"47768630", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000070", C:"LEIDY CAROLINA ESTRADA RAMIREZ  ACTIVO", E:"10.70.100.97", H:"26/11/2025", K:"MZ B7 LT34 PLANICIE 1", O:20, P:"1 S/. 60.00", S:"PLAN 1CTV FIBRA 300MB S/50", U:"918816913", X:"OLT ADMIN HUWEI FICUS 2016/VEMAX", Z:"48105360", AF:"S/. 60.00", AG:"CARABAYLLO", AH:"OFFLINE", AI:"TV CABLE (S/. 10.00)" },
  { B:"000075", C:"ANGELITA DEL ROCIO RAMOS RAMIREZ  ACTIVO", D:"24:5A:4C:DC:3A:27", E:"192.168.30.113", H:"21/11/2025", K:"MZ A13 LT3 PLANICIE 1", O:20, P:"1 S/. 40.00", S:"PLAN ANTENA 25MB S/40 v1", U:"968430283", X:"PLA1/ND2", Z:"45601604", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000082", C:"INDIRA DENNISE BASTIDAS PIZARRO  ACTIVO", D:"60:22:32:D8:1A:FD", E:"142.152.7.76", H:"03/12/2025", K:"MZ.F29 LT.3 SANTA MARIA", O:1, S:"PLAN ANTIGUO FIBRA100MB S/90 v1", U:"957458641", X:"ADMIN/PLAN3/CCRR1036-VEMAX", Z:"43766997", AF:"S/. 80.00", AG:"CARABAYLLO", AH:"ONLINE", AI:"TV CABLE (S/. 10.00)TV CABLE (S/. 10.00)" },
  { B:"000090", C:"SANDRA JANETH FLORES AGUILAR  ACTIVO", D:"24:5A:4C:3E:2D:72", E:"142.152.7.28", H:"04/12/2025", K:"MZ E15 LT54 SANTAMARIA", O:1, S:"PLAN ANTENA 25MB S/40 v1", U:"999023051", X:"ADMIN/PLAN3/CCRR1036-VEMAX", Z:"10439809", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000100", C:"CARLOS ALBERTO PEREZ GUTIERREZ  SUSPENDIDO", E:"192.168.30.200", K:"MZ.F LT.12 VILLA 3", O:15, P:"1 S/. 50.00", S:"CORTE POR DEUDA", U:"945123456", X:"VERONICA/ND1", AF:"S/. -0.01", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000150", C:"MARIA ELENA GONZALES TORRES  ACTIVO", E:"10.72.100.45", H:"01/02/2026", K:"MZ.B LT.8 SANTA MARIA", O:5, S:"PLAN FIBRA GPON 2026/200 MB-S/40", U:"965874123", X:"OLT ADMIN HUWEI FICUS 2016/VEMAX", Z:"87654321", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000200", C:"JORGE LUIS MENDOZA CASTRO  ACTIVO", D:"F4:92:BF:AA:BB:CC", E:"192.168.30.180", H:"28/01/2026", K:"MZ.A LT.5 PLANICIE 2", O:10, S:"PLAN ANTENA 2026/75 MB-S/60", U:"991234567", X:"HUASACA/ND1", Z:"12345678", AF:"S/. 60.00", AG:"CARABAYLLO", AH:"ONLINE", AI:"TV BASICO (S/. 20.00)" },
  { B:"000250", C:"ANA MARIA RODRIGUEZ SILVA  ACTIVO", E:"10.71.100.88", H:"05/02/2026", K:"MZ.C LT.15 VILLA 4", O:8, S:"PLAN FIBRA 300MB S/50", U:"987654321", X:"DIXON OLT/FIBRA", Z:"98765432", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"ONLINE", AI:"1CTV GRATIS (S/. 0.00)" },
  { B:"000300", C:"PEDRO PABLO HUAMAN QUISPE  ACTIVO", D:"74:AC:B9:0C:C4:63", E:"192.168.30.17", H:"03/12/2025", K:"MZ A5 LT2 PLANICIE 1", O:27, S:"PLAN ANTENA 55 MB S/50", U:"930885214", X:"SOSA/4011", Z:"44556677", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000350", C:"ROSA MARIA CHAVEZ DIAZ  ACTIVO", E:"10.70.100.55", H:"30/01/2026", K:"MZ.D LT.3 VILLA 5", O:12, S:"PLAN FIBRA 500 MB S/60", U:"978123456", X:"OLT ADMIN HUWEI FICUS 2016/VEMAX", Z:"55667788", AF:"S/. 60.00", AG:"CARABAYLLO", AH:"OFFLINE", AI:"TV CABLE (S/. 10.00)" },
  { B:"000400", C:"LUIS FERNANDO TORRES MENDEZ  SUSPENDIDO", D:"24:5A:4C:BA:B0:FD", E:"192.168.30.168", K:"MZ D LT7 VILLA 5", O:1, P:"1 S/. 40.00", S:"PLAN ANTENA 25MB S/40 v1", U:"928508070", X:"ELVIA/ND1", Z:"33445566", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000450", C:"CARMEN ROSA SILVA PAREDES  ACTIVO", E:"10.72.100.30", H:"02/02/2026", K:"MZ.E LT.22 SANTA MARIA", O:6, S:"PLAN FIBRA GPON 2026/300 MB-S/50", U:"933558713", X:"OLT ADMIN HUWEI FICUS 2016/VEMAX", Z:"11223344", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000500", C:"MIGUEL ANGEL DIAZ HUERTA  ACTIVO", D:"FC:EC:DA:C6:97:AC", E:"142.152.7.46", H:"06/02/2026", K:"MZ.C8 LT.28 SANTA MARIA", O:6, S:"PLAN ANTENA 2026/55 MB-S/50", U:"991957955", X:"AGAPITO/1100", Z:"10203218", AF:"S/. 50.00", AG:"CARABAYLLO", AH:"OFFLINE" },
  { B:"000550", C:"JANET ELIZABETH MORA CRUZ  ACTIVO", E:"10.71.100.60", H:"01/02/2026", K:"MZ.A LT.9 PLANICIE 1", O:3, S:"PLAN FIBRA 1000MB S/90", U:"945678901", X:"DIXON OLT/FIBRA", Z:"22334455", AF:"S/. 90.00", AG:"CARABAYLLO", AH:"ONLINE" },
  { B:"000600", C:"VICTOR HUGO PAREDES LEON  ACTIVO", D:"28:70:4E:E0:F8:46", E:"142.152.7.79", H:"06/02/2026", K:"MZ 04 LT 6 Vista Sol", O:6, S:"PLAN ANTENA 2026/35 MB-S/40", U:"998983069", X:"MITTEN/ND1/VEMAX", Z:"44392770", AF:"S/. 40.00", AG:"CARABAYLLO", AH:"OFFLINE" },
];

// ============================================================
// ÍCONOS SVG INLINE
// ============================================================
const Icons = {
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Ticket: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2"/><path d="M15 11v2"/><path d="M15 17v2"/><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/></svg>,
  Wifi: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  Box: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Signal: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>,
  AlertTriangle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Google: () => <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
};

// ============================================================
// ESTILOS CSS GLOBALES
// ============================================================
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg-primary: #0a0e1a;
    --bg-secondary: #111827;
    --bg-card: #1a2035;
    --bg-card-hover: #1e2642;
    --bg-sidebar: #0d1117;
    --text-primary: #e8edf5;
    --text-secondary: #8b95a8;
    --text-muted: #5a6478;
    --accent-blue: #3b82f6;
    --accent-green: #10b981;
    --accent-red: #ef4444;
    --accent-yellow: #f59e0b;
    --accent-purple: #8b5cf6;
    --accent-cyan: #06b6d4;
    --border: #1e293b;
    --border-light: #2a3548;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'DM Sans', sans-serif; 
    background: var(--bg-primary); 
    color: var(--text-primary);
    overflow: hidden;
  }
  
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-secondary); }
  ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

  .animate-fade { animation: fadeIn 0.4s ease-out; }
  .animate-slide { animation: slideIn 0.3s ease-out; }
  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.1s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.2s; }
  .stagger-5 { animation-delay: 0.25s; }
  .stagger-6 { animation-delay: 0.3s; }

  input, select {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus, select:focus { border-color: var(--accent-blue); }
  input::placeholder { color: var(--text-muted); }
`;

// ============================================================
// COMPONENTE: LOGIN PAGE
// ============================================================
function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");

  const handleDemoLogin = () => {
    login({
      email: "admin@isp-system.com",
      nombre: "Fernando Díaz",
      foto: null,
      rol: "ADMIN",
    });
  };

  const handleGoogleLogin = () => {
    // En producción, aquí iría el flujo real de Google OAuth
    // Por ahora mostramos un mensaje informativo
    setError("Para activar Google OAuth, configura tu GOOGLE_CLIENT_ID en el archivo de configuración. Por ahora usa el acceso demo.");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 20% 50%, #0f172a 0%, #0a0e1a 50%, #050709 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background grid effect */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}/>
      
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "20%", left: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", borderRadius: "50%" }}/>
      <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 400, height: 400, background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", borderRadius: "50%" }}/>
      
      <div className="animate-fade" style={{
        width: 420, padding: 40, borderRadius: 20,
        background: "linear-gradient(145deg, rgba(26,32,53,0.9) 0%, rgba(17,24,39,0.95) 100%)",
        border: "1px solid rgba(59,130,246,0.15)",
        boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.05)",
        backdropFilter: "blur(20px)",
        position: "relative", zIndex: 1,
      }}>
        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
          }}>
            <Icons.Wifi />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 4 }}>
            ISP Sistema de Gestión
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Radio Enlace · Fibra Óptica · IPTV
          </p>
        </div>

        {/* Google Login Button */}
        <button onClick={handleGoogleLogin} style={{
          width: "100%", padding: "12px 20px", borderRadius: 12,
          background: "#fff", color: "#333", border: "none",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "transform 0.15s, box-shadow 0.15s",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)"; }}
        onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)"; }}
        >
          <Icons.Google /> Iniciar sesión con Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>o acceso demo</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
        </div>

        {/* Demo Login */}
        <button onClick={handleDemoLogin} style={{
          width: "100%", padding: "12px 20px", borderRadius: 12,
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
          cursor: "pointer", transition: "opacity 0.15s",
        }}
        onMouseOver={e => e.currentTarget.style.opacity = 0.9}
        onMouseOut={e => e.currentTarget.style.opacity = 1}
        >
          Entrar como Administrador (Demo)
        </button>

        {error && (
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--accent-yellow)", textAlign: "center", lineHeight: 1.5 }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: 24, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
          Solo usuarios autorizados pueden acceder
        </p>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: KPI CARD
// ============================================================
function KPICard({ title, value, subtitle, icon, color, trend }) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 16, padding: "20px 24px",
      border: "1px solid var(--border)",
      transition: "border-color 0.2s, transform 0.2s",
      cursor: "default",
    }}
    onMouseOver={e => { e.currentTarget.style.borderColor = color || "var(--accent-blue)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>{title}</p>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-1px", fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
          {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{subtitle}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color || "var(--accent-blue)"}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: color || "var(--accent-blue)",
        }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
          <span style={{ color: trend > 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span style={{ color: "var(--text-muted)" }}>vs mes anterior</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE: STATUS BADGE
// ============================================================
function StatusBadge({ status, size = "sm" }) {
  const colors = {
    ONLINE: { bg: "#10b98120", text: "#10b981", dot: "#10b981" },
    OFFLINE: { bg: "#ef444420", text: "#ef4444", dot: "#ef4444" },
    ACTIVO: { bg: "#10b98120", text: "#10b981" },
    SUSPENDIDO: { bg: "#f59e0b20", text: "#f59e0b" },
    "Cortado": { bg: "#ef444420", text: "#ef4444" },
    "Radio Enlace": { bg: "#3b82f620", text: "#3b82f6" },
    "Fibra Óptica": { bg: "#8b5cf620", text: "#8b5cf6" },
    "No Determinado": { bg: "#6b728020", text: "#6b7280" },
  };
  const c = colors[status] || { bg: "#6b728020", text: "#6b7280" };
  const pad = size === "sm" ? "3px 10px" : "5px 14px";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: pad, borderRadius: 20, fontSize: size === "sm" ? 11 : 12,
      fontWeight: 600, background: c.bg, color: c.text, whiteSpace: "nowrap",
    }}>
      {c.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, boxShadow: `0 0 6px ${c.dot}` }}/>}
      {status}
    </span>
  );
}

// ============================================================
// COMPONENTE: DASHBOARD
// ============================================================
function DashboardPage({ data }) {
  const stats = useMemo(() => {
    const total = data.length;
    const online = data.filter(c => c.status === "ONLINE").length;
    const offline = total - online;
    const radio = data.filter(c => c.tecnologia === "Radio Enlace").length;
    const fibra = data.filter(c => c.tecnologia === "Fibra Óptica").length;
    const conDeuda = data.filter(c => c.deuda_monto > 0).length;
    const totalDeuda = data.reduce((s, c) => s + c.deuda_monto, 0);
    const activos = data.filter(c => c.estado_cuenta === "ACTIVO").length;
    const suspendidos = data.filter(c => c.estado_cuenta === "SUSPENDIDO").length;
    const conTV = data.filter(c => c.servicios_adicionales.length > 0).length;

    // Top nodos
    const nodos = {};
    data.forEach(c => { if (c.nodo_router) nodos[c.nodo_router] = (nodos[c.nodo_router] || 0) + 1; });
    const topNodos = Object.entries(nodos).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Planes
    const planes = {};
    data.forEach(c => { if (c.plan) planes[c.plan] = (planes[c.plan] || 0) + 1; });
    const topPlanes = Object.entries(planes).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return { total, online, offline, radio, fibra, conDeuda, totalDeuda, activos, suspendidos, conTV, topNodos, topPlanes };
  }, [data]);

  return (
    <div style={{ padding: "24px 32px", overflowY: "auto", height: "100%" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Resumen operativo del ISP — {stats.total} clientes registrados</p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div className="animate-fade stagger-1"><KPICard title="Total Clientes" value={stats.total} subtitle={`${stats.activos} activos · ${stats.suspendidos} suspendidos`} icon={<Icons.Users />} color="#3b82f6" /></div>
        <div className="animate-fade stagger-2"><KPICard title="En Línea" value={stats.online} subtitle={`${(stats.online / stats.total * 100).toFixed(1)}% conectados`} icon={<Icons.Wifi />} color="#10b981" /></div>
        <div className="animate-fade stagger-3"><KPICard title="Fuera de Línea" value={stats.offline} subtitle={`${(stats.offline / stats.total * 100).toFixed(1)}% desconectados`} icon={<Icons.AlertTriangle />} color="#ef4444" /></div>
        <div className="animate-fade stagger-4"><KPICard title="Deuda Total" value={`S/. ${stats.totalDeuda.toLocaleString()}`} subtitle={`${stats.conDeuda} clientes con deuda`} icon={<Icons.Box />} color="#f59e0b" /></div>
      </div>

      {/* Row 2: Technology distribution + TV services */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Tech distribution */}
        <div className="animate-fade stagger-3" style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "var(--text-secondary)" }}>Distribución por Tecnología</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Radio Enlace", count: stats.radio, color: "#3b82f6", pct: (stats.radio / stats.total * 100).toFixed(1) },
              { label: "Fibra Óptica", count: stats.fibra, color: "#8b5cf6", pct: (stats.fibra / stats.total * 100).toFixed(1) },
              { label: "No Determinado", count: stats.total - stats.radio - stats.fibra, color: "#6b7280", pct: ((stats.total - stats.radio - stats.fibra) / stats.total * 100).toFixed(1) },
            ].map(t => (
              <div key={t.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: t.color, fontWeight: 600 }}>{t.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{t.count} ({t.pct}%)</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${t.pct}%`, background: t.color, borderRadius: 3, transition: "width 0.8s ease" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection status */}
        <div className="animate-fade stagger-4" style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "var(--text-secondary)" }}>Estado de Conexiones</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, height: "calc(100% - 40px)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 90, height: 90, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: `conic-gradient(#10b981 ${stats.online / stats.total * 360}deg, #1e293b ${stats.online / stats.total * 360}deg)`,
                position: "relative",
              }}>
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700 }}>{(stats.online / stats.total * 100).toFixed(0)}%</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>ONLINE</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }}/>
                <span style={{ fontSize: 12 }}>Online: {stats.online}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#1e293b", border: "2px solid #374151" }}/>
                <span style={{ fontSize: 12 }}>Offline: {stats.offline}</span>
              </div>
            </div>
          </div>
        </div>

        {/* TV services */}
        <div className="animate-fade stagger-5" style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "var(--text-secondary)" }}>Servicios Adicionales</h3>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 36, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--accent-cyan)" }}>{stats.conTV}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Clientes con TV/IPTV</p>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <div style={{ textAlign: "center", padding: "8px 16px", background: "var(--bg-secondary)", borderRadius: 10 }}>
              <p style={{ fontSize: 18, fontWeight: 700 }}>{stats.total - stats.conTV}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)" }}>Solo Internet</p>
            </div>
            <div style={{ textAlign: "center", padding: "8px 16px", background: "var(--bg-secondary)", borderRadius: 10 }}>
              <p style={{ fontSize: 18, fontWeight: 700 }}>{((stats.conTV / stats.total) * 100).toFixed(0)}%</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)" }}>Penetración TV</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top nodos + Top planes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="animate-fade stagger-5" style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text-secondary)" }}>Top Nodos / Torres</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.topNodos.map(([nodo, count], i) => (
              <div key={nodo} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)", width: 20 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{nodo}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)" }}>{count}</span>
                  </div>
                  <div style={{ height: 3, background: "var(--bg-secondary)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${(count / stats.topNodos[0][1]) * 100}%`, background: "var(--accent-blue)", borderRadius: 2 }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade stagger-6" style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, border: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text-secondary)" }}>Top Planes Contratados</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.topPlanes.map(([plan, count], i) => (
              <div key={plan} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)", width: 20 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{plan}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)" }}>{count}</span>
                  </div>
                  <div style={{ height: 3, background: "var(--bg-secondary)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${(count / stats.topPlanes[0][1]) * 100}%`, background: "var(--accent-purple)", borderRadius: 2 }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: CLIENTES PAGE
// ============================================================
function ClientesPage({ data }) {
  const [search, setSearch] = useState("");
  const [filterTech, setFilterTech] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterConexion, setFilterConexion] = useState("all");
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => {
    return data.filter(c => {
      const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.dni.includes(search) || c.codigo.includes(search) || c.id.includes(search) ||
        c.movil_1.includes(search) || c.direccion.toLowerCase().includes(search.toLowerCase());
      const matchTech = filterTech === "all" || c.tecnologia === filterTech;
      const matchStatus = filterStatus === "all" || c.estado_cuenta === filterStatus;
      const matchConexion = filterConexion === "all" || c.status === filterConexion;
      return matchSearch && matchTech && matchStatus && matchConexion;
    });
  }, [data, search, filterTech, filterStatus, filterConexion]);

  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  if (selectedCliente) {
    return <ClienteDetalle cliente={selectedCliente} onBack={() => setSelectedCliente(null)} />;
  }

  return (
    <div style={{ padding: "24px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Clientes</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>{filtered.length} de {data.length} clientes</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}><Icons.Search /></span>
          <input
            placeholder="Buscar por nombre, DNI, código, teléfono, dirección..."
            value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ width: "100%", paddingLeft: 38 }}
          />
        </div>
        <select value={filterTech} onChange={e => { setFilterTech(e.target.value); setCurrentPage(1); }} style={{ minWidth: 140 }}>
          <option value="all">Toda Tecnología</option>
          <option value="Radio Enlace">Radio Enlace</option>
          <option value="Fibra Óptica">Fibra Óptica</option>
          <option value="No Determinado">No Determinado</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} style={{ minWidth: 120 }}>
          <option value="all">Todo Estado</option>
          <option value="ACTIVO">Activo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>
        <select value={filterConexion} onChange={e => { setFilterConexion(e.target.value); setCurrentPage(1); }} style={{ minWidth: 120 }}>
          <option value="all">Toda Conexión</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 1 }}>
              {["ID", "Nombre", "Tecnología", "Plan", "Precio", "Estado", "Conexión", "Deuda", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((c, i) => (
              <tr key={c.id + i}
                onClick={() => setSelectedCliente(c)}
                style={{ cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                onMouseOver={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                onMouseOut={e => e.currentTarget.style.background = ""}
              >
                <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)" }}>{c.id}</td>
                <td style={{ padding: "10px 14px", fontWeight: 500, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</td>
                <td style={{ padding: "10px 14px" }}><StatusBadge status={c.tecnologia} /></td>
                <td style={{ padding: "10px 14px", fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.plan}</td>
                <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>S/. {c.precio.toFixed(2)}</td>
                <td style={{ padding: "10px 14px" }}><StatusBadge status={c.estado_cuenta} /></td>
                <td style={{ padding: "10px 14px" }}><StatusBadge status={c.status} /></td>
                <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: c.deuda_monto > 0 ? "var(--accent-red)" : "var(--text-muted)" }}>
                  {c.deuda_monto > 0 ? `S/. ${c.deuda_monto.toFixed(2)}` : "—"}
                </td>
                <td style={{ padding: "10px 14px" }}><span style={{ color: "var(--accent-blue)" }}><Icons.Eye /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let page;
            if (totalPages <= 7) page = i + 1;
            else if (currentPage <= 4) page = i + 1;
            else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
            else page = currentPage - 3 + i;
            return (
              <button key={page} onClick={() => setCurrentPage(page)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border)",
                  background: currentPage === page ? "var(--accent-blue)" : "var(--bg-secondary)",
                  color: currentPage === page ? "#fff" : "var(--text-secondary)",
                  fontSize: 12, cursor: "pointer", fontWeight: currentPage === page ? 600 : 400,
                }}>
                {page}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: CLIENTE DETALLE
// ============================================================
function ClienteDetalle({ cliente: c, onBack }) {
  const Section = ({ title, children }) => (
    <div style={{ background: "var(--bg-card)", borderRadius: 14, padding: 20, border: "1px solid var(--border)" }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-blue)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h3>
      {children}
    </div>
  );
  const Field = ({ label, value, mono }) => (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", wordBreak: "break-all" }}>{value || "—"}</span>
    </div>
  );

  return (
    <div className="animate-fade" style={{ padding: "24px 32px", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={onBack} style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px",
          color: "var(--text-primary)", cursor: "pointer", fontSize: 13, fontWeight: 500,
        }}>
          ← Volver
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{c.nombre}</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <StatusBadge status={c.estado_cuenta} size="md" />
            <StatusBadge status={c.status} size="md" />
            <StatusBadge status={c.tecnologia} size="md" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Section title="Datos Personales">
          <Field label="ID Cliente" value={c.id} mono />
          <Field label="Código" value={c.codigo} mono />
          <Field label="DNI" value={c.dni} mono />
          <Field label="Móvil 1" value={c.movil_1} mono />
          {c.movil_2 && <Field label="Móvil 2" value={c.movil_2} mono />}
          <Field label="Email" value={c.email || "No registrado"} />
          <Field label="Zona" value={c.zona} />
        </Section>

        <Section title="Ubicación">
          <Field label="Dirección Principal" value={c.direccion} />
          <Field label="Dirección Servicio" value={c.direccion_servicio} />
          <Field label="Tipo Estrato" value={c.tipo_estrato} />
        </Section>

        <Section title="Servicio Contratado">
          <Field label="Plan" value={c.plan} />
          <Field label="Precio" value={`S/. ${c.precio.toFixed(2)}`} mono />
          <Field label="Tecnología" value={c.tecnologia} />
          <Field label="Nodo / Router" value={c.nodo_router} />
          <Field label="Fecha Instalación" value={c.fecha_instalacion} />
          <Field label="Estado Servicio" value={c.estado_servicio} />
        </Section>

        <Section title="Conexión Técnica">
          <Field label="IP Asignada" value={c.ip} mono />
          <Field label="IP Receptor" value={c.ip_receptor} mono />
          <Field label="MAC Address" value={c.mac} mono />
          <Field label="User PPP" value={c.user_ppp} mono />
        </Section>

        <Section title="Facturación">
          <Field label="Día de Pago" value={c.dia_pago} />
          <Field label="Próximo Pago" value={c.proximo_pago} />
          <Field label="Último Pago" value={c.ultimo_pago} />
          <Field label="Deuda" value={c.deuda_monto > 0 ? `${c.deuda_meses} mes(es) — S/. ${c.deuda_monto.toFixed(2)}` : "Sin deuda"} />
          <Field label="Saldo" value={c.saldo} mono />
        </Section>

        <Section title="Notas Técnicas / Servicios TV">
          <Field label="Notas del Equipo" value={c.notas_tecnicas} />
          {c.servicios_adicionales.length > 0 ? (
            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Servicios Adicionales</span>
              {c.servicios_adicionales.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px", background: "var(--bg-secondary)", borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
                  <span>{s.tipo}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--accent-cyan)" }}>S/. {s.precio.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <Field label="Servicios Adicionales" value="Ninguno" />
          )}
        </Section>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: IMPORT PAGE (Implementación Informe #2)
// ============================================================
function ImportPage({ currentData, onUpdateData }) {
  const [step, setStep] = useState("upload"); // upload, preview, finished
  const [stats, setStats] = useState({ new: 0, modified: 0, unchanged: 0, total: 0 });
  const [changes, setChanges] = useState([]);
  const [processedData, setProcessedData] = useState([]);

  const handleSimulateUpload = () => {
    // 1. Simular lectura de Excel (usando la data modificada)
    const rawRows = getSimulatedUpdateData();
    
    // 2. Transformación (ETL)
    const newData = rawRows.map(transformClientData);
    
    // 3. Lógica de Comparación (Sync Incremental)
    const newRecords = [];
    const modifiedRecords = [];
    let unchangedCount = 0;

    newData.forEach(row => {
      const existing = currentData.find(c => c.id === row.id);
      
      if (!existing) {
        newRecords.push(row);
      } else {
        // Detectar cambios en campos clave
        const diffs = [];
        if (existing.status !== row.status) diffs.push({ field: "Estado Conexión", old: existing.status, new: row.status });
        if (existing.deuda_monto !== row.deuda_monto) diffs.push({ field: "Deuda", old: `S/. ${existing.deuda_monto}`, new: `S/. ${row.deuda_monto}` });
        if (existing.plan !== row.plan) diffs.push({ field: "Plan", old: existing.plan, new: row.plan });
        
        if (diffs.length > 0) {
          modifiedRecords.push({ id: row.id, nombre: row.nombre, diffs, newData: row });
        } else {
          unchangedCount++;
        }
      }
    });

    setStats({
      new: newRecords.length,
      modified: modifiedRecords.length,
      unchanged: unchangedCount,
      total: newData.length
    });
    
    setChanges([...newRecords.map(r => ({ type: 'NEW', data: r })), ...modifiedRecords.map(r => ({ type: 'MOD', ...r }))]);
    setProcessedData(newData);
    setStep("preview");
  };

  const confirmImport = () => {
    onUpdateData(processedData);
    setStep("finished");
  };

  if (step === "finished") {
    return (
      <div style={{ padding: "40px", textAlign: "center", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Icons.Wifi />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>¡Importación Exitosa!</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>Se han actualizado los datos del sistema correctamente.</p>
        <button onClick={() => setStep("upload")} style={{ padding: "10px 24px", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer" }}>Realizar otra importación</button>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ padding: "24px 32px", height: "100%", overflowY: "auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Importar Datos</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Sincronización desde Excel fuente (ISP Externo)</p>
      </div>

      {step === "upload" && (
        <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 40, border: "2px dashed var(--border)", textAlign: "center" }}>
          <div style={{ marginBottom: 24, color: "var(--accent-blue)" }}><Icons.Upload /></div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Sube tu archivo Excel aquí</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            El sistema aplicará automáticamente las reglas de limpieza definidas en el Informe Técnico #2 (separación de nombres, corrección de móviles, detección de tecnología).
          </p>
          <button onClick={handleSimulateUpload} style={{
            padding: "12px 24px", borderRadius: 10, background: "var(--accent-blue)", color: "#fff",
            border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14
          }}>
            Simular Carga de Excel (Demo)
          </button>
          <p style={{ marginTop: 16, fontSize: 11, color: "var(--text-muted)" }}>Soporta .xlsx, .xls (Formato estándar ISP)</p>
        </div>
      )}

      {step === "preview" && (
        <div>
          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <KPICard title="Registros Leídos" value={stats.total} icon={<Icons.Box />} color="#6b7280" />
            <KPICard title="Nuevos Clientes" value={stats.new} icon={<Icons.Users />} color="#10b981" />
            <KPICard title="Modificados" value={stats.modified} icon={<Icons.Settings />} color="#f59e0b" />
            <KPICard title="Sin Cambios" value={stats.unchanged} icon={<Icons.Wifi />} color="#3b82f6" />
          </div>

          {/* Changes Table */}
          <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Detalle de Cambios Detectados</h3>
              <button onClick={confirmImport} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--accent-green)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                Confirmar Importación
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "12px 24px", width: 80 }}>Tipo</th>
                  <th style={{ padding: "12px 24px" }}>Cliente</th>
                  <th style={{ padding: "12px 24px" }}>Detalle del Cambio</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 24px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: c.type === 'NEW' ? '#10b98120' : '#f59e0b20', color: c.type === 'NEW' ? '#10b981' : '#f59e0b' }}>
                        {c.type === 'NEW' ? 'NUEVO' : 'MODIF'}
                      </span>
                    </td>
                    <td style={{ padding: "12px 24px" }}>
                      <div style={{ fontWeight: 500 }}>{c.type === 'NEW' ? c.data.nombre : c.nombre}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>ID: {c.type === 'NEW' ? c.data.id : c.id}</div>
                    </td>
                    <td style={{ padding: "12px 24px" }}>
                      {c.type === 'NEW' ? (
                        <span style={{ color: "var(--text-muted)" }}>Registro completo nuevo</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {c.diffs.map((d, j) => (
                            <div key={j} style={{ fontSize: 12 }}>
                              <span style={{ color: "var(--text-secondary)" }}>{d.field}:</span> <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>{d.old}</span> ➝ <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{d.new}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {changes.length === 0 && (
                  <tr><td colSpan="3" style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>No hay cambios significativos para revisar.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE: PLACEHOLDER PAGES
// ============================================================
function PlaceholderPage({ title, icon, description }) {
  return (
    <div style={{ padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <div style={{ textAlign: "center", opacity: 0.6 }}>
        <div style={{ marginBottom: 16, transform: "scale(2)", display: "inline-block" }}>{icon}</div>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{description}</p>
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 16 }}>Este módulo se implementará en la siguiente fase</p>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: SIDEBAR
// ============================================================
function Sidebar({ activePage, onNavigate }) {
  const { user, hasPermission } = useAuth();
  const role = ROLES[user?.rol] || ROLES.TECNICO;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Icons.Dashboard />, perm: "dashboard" },
    { id: "clientes", label: "Clientes", icon: <Icons.Users />, perm: "clientes" },
    { id: "tickets", label: "Tickets", icon: <Icons.Ticket />, perm: "tickets" },
    { id: "importar", label: "Importar Datos", icon: <Icons.Upload />, perm: "importar" },
    { id: "equipos", label: "Equipos", icon: <Icons.Box />, perm: "equipos" },
    { id: "config", label: "Configuración", icon: <Icons.Settings />, perm: "config" },
  ];

  return (
    <div style={{
      width: 240, height: "100vh", background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column",
      padding: "20px 12px",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 32 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icons.Wifi />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.3px" }}>ISP System</p>
          <p style={{ fontSize: 10, color: "var(--text-muted)" }}>v1.0 MVP</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => {
          const isActive = activePage === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, border: "none",
                background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                width: "100%",
              }}
              onMouseOver={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseOut={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div style={{
        padding: 12, borderRadius: 12, background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: role.color + "30", color: role.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700,
          }}>
            {user?.nombre?.[0] || "?"}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600 }}>{user?.nombre}</p>
            <p style={{ fontSize: 10, color: role.color, fontWeight: 500 }}>{role.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: HEADER
// ============================================================
function Header() {
  const { user, logout } = useAuth();
  const role = ROLES[user?.rol];

  return (
    <div style={{
      height: 56, borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
    }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Zona: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>CARABAYLLO</span> · 
        Última sync: <span style={{ color: "var(--accent-green)" }}>Hoy 14:30</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user?.email}</span>
        <button onClick={logout} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "1px solid var(--border)", borderRadius: 8,
          padding: "6px 12px", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12,
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent-red)"}
        onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <Icons.Logout /> Salir
        </button>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: MAIN APP
// ============================================================
function MainApp() {
  const [activePage, setActivePage] = useState("dashboard");
  const [clientData, setClientData] = useState([]);

  useEffect(() => {
    // Transform demo data through ETL pipeline
    const transformed = DEMO_RAW_DATA.map(transformClientData);
    setClientData(transformed);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage data={clientData} />;
      case "clientes": return <ClientesPage data={clientData} />;
      case "tickets": return <PlaceholderPage title="Tickets & Soporte" icon={<Icons.Ticket />} description="Sistema de tickets con Kanban, soporte remoto y protocolo técnico" />;
      case "importar": return <PlaceholderPage title="Importar Datos" icon={<Icons.Upload />} description="Importar Excel desde Google Drive con limpieza automática de datos" />;
      case "importar": return <ImportPage currentData={clientData} onUpdateData={setClientData} />;
      case "equipos": return <PlaceholderPage title="Inventario de Equipos" icon={<Icons.Box />} description="Gestión de ONTs, CPEs, routers y movimientos de equipos" />;
      case "config": return <PlaceholderPage title="Configuración" icon={<Icons.Settings />} description="Usuarios, roles, catálogos del sistema y conexión API" />;
      default: return <DashboardPage data={clientData} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <div style={{ flex: 1, overflow: "hidden" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: ROOT APP
// ============================================================
export default function App() {
  const [stylesInjected, setStylesInjected] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = globalStyles;
    document.head.appendChild(style);
    setStylesInjected(true);
    return () => style.remove();
  }, []);

  if (!stylesInjected) return null;

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid var(--border)", borderTopColor: "var(--accent-blue)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}/>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Cargando sistema...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  return <MainApp />;
}
