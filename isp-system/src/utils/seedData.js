import { DEMO_RAW_DATA } from './constants';

export const DEMO_TEMPLATES = [
    { id: 'TPL-001', titulo: 'Cobro Mensual', categoria: 'Cobranza', mensaje: '{Saludo}, {Nombre}. Le recordamos que su pago mensual de {precio} por el servicio de internet vence el día {proximo_pago}. Puede realizar su pago por transferencia o en efectivo. Gracias por su preferencia.', favorito: true, uso: 24 },
    { id: 'TPL-002', titulo: 'Aviso de Corte', categoria: 'Cobranza', mensaje: '{Saludo}, {Nombre}. Le informamos que su servicio de internet será suspendido por deuda pendiente de {deuda_monto}. Para evitar el corte, realice su pago a la brevedad. Contacto: 999-000-111.', favorito: false, uso: 15 },
    { id: 'TPL-003', titulo: 'Bienvenida Nuevo Cliente', categoria: 'General', mensaje: '{Saludo}, {Nombre}. Bienvenido/a a nuestro servicio de internet. Su plan contratado es {plan} con velocidad garantizada. Ante cualquier consulta comuníquese al 999-000-111.', favorito: true, uso: 8 },
    { id: 'TPL-004', titulo: 'Soporte Técnico', categoria: 'Soporte', mensaje: '{Saludo}, {Nombre}. Hemos recibido su reporte técnico. Un técnico visitará su domicilio en {direccion} para atender su caso. Le confirmaremos la hora exacta. Gracias por su paciencia.', favorito: false, uso: 12 },
];

export const DEMO_TECNICOS = [
    { id: 'TEC-001', nombre: 'Jose Mendoza', cargo: 'Técnico de Campo', telefono: '987654321', email: 'jose.mendoza@isp.com', zona: 'PLANICIE 1', especialidad: 'Fibra Óptica', estado: 'Activo' },
    { id: 'TEC-002', nombre: 'Luis Mendoza', cargo: 'Técnico de Campo', telefono: '987654322', email: 'luis.mendoza@isp.com', zona: 'VILLA 5', especialidad: 'Radio Enlace', estado: 'Activo' },
    { id: 'TEC-003', nombre: 'Fernando Díaz', cargo: 'Supervisor Técnico', telefono: '987654323', email: 'fernando.diaz@isp.com', zona: 'CARABAYLLO', especialidad: 'Fibra Óptica', estado: 'Activo' },
    { id: 'TEC-004', nombre: 'Carlos Ruiz', cargo: 'Técnico de Planta', telefono: '987654324', email: 'carlos.ruiz@isp.com', zona: 'SANTA MARIA', especialidad: 'Radio Enlace', estado: 'Inactivo' },
];

export const DEMO_VISITAS = [
    { id: 'VT-001', clienteId: '000016', clienteNombre: 'ERIKA MONTES HUAMANI', tecnicoId: 'TEC-002', tecnicoNombre: 'Luis Mendoza', tipo: 'Reparación', estado: 'Completada', prioridad: 'Alta', direccion: 'MZ. B LT. 12 PLANICIE 1', descripcion: 'Router no enciende. Cliente reporta corte de luz previo.', resultado: 'Se reemplazó fuente de poder del router. Servicio restablecido.', fecha: '2026-02-06', horaInicio: '09:00', horaFin: '10:30', ticketId: 'TK-001', historial: [{ fecha: '2026-02-06T09:00:00.000Z', estadoAnterior: 'Programada', estadoNuevo: 'Completada', motivo: 'Atención finalizada' }] },
    { id: 'VT-002', clienteId: '000082', clienteNombre: 'INDIRA DENNISE BASTIDAS PIZARRO', tecnicoId: 'TEC-001', tecnicoNombre: 'Jose Mendoza', tipo: 'Diagnóstico', estado: 'Completada', prioridad: 'Media', direccion: 'AV. CENTRAL 456 VILLA 5', descripcion: 'Velocidad inferior a la contratada.', resultado: 'Se detectó interferencia en canal 5.8GHz. Se cambió a canal libre.', fecha: '2026-02-05', horaInicio: '14:00', horaFin: '15:00', ticketId: 'TK-005' },
    { id: 'VT-003', clienteId: '000019', clienteNombre: 'JUANA ESTHER VALDEZ', tecnicoId: 'TEC-001', tecnicoNombre: 'Jose Mendoza', tipo: 'Cambio de plan', estado: 'Programada', prioridad: 'Baja', direccion: 'JR. LOS PINOS 789 PLANICIE 1', descripcion: 'Migración de plan 65MB a 100MB.', resultado: '', fecha: '2026-02-08', horaInicio: '10:00', horaFin: null, ticketId: 'TK-002' },
];

export const DEMO_INSTALACIONES = [
    { id: 'INS-001', clienteId: '000001', clienteNombre: 'MONICA ROCIO DELGADO LOPEZ', tecnicoId: 'TEC-001', tecnicoNombre: 'Jose Mendoza', tipo: 'Nueva Instalación', estado: 'Completada', plan: 'INTERNET FIBRA 100MB', tecnologia: 'Fibra Óptica', direccion: 'MZ. A LT. 1 PLANICIE 1', zona: 'PLANICIE 1', equipoInstalado: 'ONU Huawei HG8310M', fecha: '2024-01-05', horaInicio: '08:00', horaFin: '11:00', observaciones: 'Instalación sin inconvenientes. Cable de 50m desde poste principal.' },
    { id: 'INS-002', clienteId: '000017', clienteNombre: 'DANNY STUARD MARQUEZ', tecnicoId: 'TEC-002', tecnicoNombre: 'Luis Mendoza', tipo: 'Nueva Instalación', estado: 'Completada', plan: 'INTERNET RADIO 30MB', tecnologia: 'Radio Enlace', direccion: 'VILLA 5 SECTOR B', zona: 'VILLA 5', equipoInstalado: 'Antena CPE Ubiquiti LiteBeam 5AC', fecha: '2024-03-15', horaInicio: '09:00', horaFin: '12:00', observaciones: 'Línea de vista directa con torre ND1.' },
    { id: 'INS-003', clienteId: '000100', clienteNombre: 'CARLOS ALBERTO PEREZ GUTIERREZ', tecnicoId: 'TEC-003', tecnicoNombre: 'Fernando Díaz', tipo: 'Migración', estado: 'Programada', plan: 'INTERNET FIBRA 100MB', tecnologia: 'Fibra Óptica', direccion: 'AV. PRINCIPAL 100 CARABAYLLO', zona: 'CARABAYLLO', equipoInstalado: '', fecha: '2026-02-10', horaInicio: '08:00', horaFin: null, observaciones: 'Migración de Radio a Fibra. Requiere tendido nuevo.' },
];

export const DEMO_DERIVACIONES = [
    { id: 'DPE-001', tipo: 'Tendido de fibra', zona: 'PLANICIE 1', direccion: 'MZ. C LT. 5 hasta poste P-12', tecnicoId: 'TEC-001', tecnicoNombre: 'Jose Mendoza', estado: 'En progreso', prioridad: 'Alta', descripcion: 'Tendido de fibra óptica para nuevo sector. 200m de cable.', clienteRelacionado: 'INS-003', instalacionId: 'INS-003', fecha: '2026-02-07', fechaCompletado: null, metraje: 200, material: 'Fibra monomodo 12 hilos' },
    { id: 'DPE-002', tipo: 'Reparación de poste', zona: 'VILLA 5', direccion: 'Esquina AV. CENTRAL con JR. LIMA', tecnicoId: 'TEC-002', tecnicoNombre: 'Luis Mendoza', estado: 'Completada', prioridad: 'Crítica', descripcion: 'Poste dañado por accidente vehicular. Reparación urgente.', clienteRelacionado: null, instalacionId: null, fecha: '2026-02-05', fechaCompletado: '2026-02-06', metraje: 0, material: 'Poste de concreto 9m, herrajes' },
];

export const DEMO_POST_VENTA = [
    { id: 'PV-001', clienteId: '000016', clienteNombre: 'ERIKA MONTES HUAMANI', tipoServicio: 'Punto Adicional CATV', estado: 'Ejecutada', tecnicoId: 'TEC-002', tecnicoNombre: 'Luis Mendoza', descripcion: 'Punto adicional de TV para dormitorio.', costoEstimado: 15, costoReal: 15, fecha: '2026-01-20', fechaEjecucion: '2026-01-22', observaciones: 'Splitter 1x2 instalado correctamente.' },
    { id: 'PV-002', clienteId: '000082', clienteNombre: 'INDIRA DENNISE BASTIDAS PIZARRO', tipoServicio: 'Cambio de Plan', estado: 'Pendiente', tecnicoId: null, tecnicoNombre: null, descripcion: 'Upgrade de 65MB a 100MB. Cliente solicita mayor velocidad.', costoEstimado: 0, costoReal: null, fecha: '2026-02-06', fechaEjecucion: null, observaciones: '' },
];

export const DEMO_MOV_EQUIPOS = [
    { id: 'MOV-001', equipoId: 'EQ-001', tipoMovimiento: 'Instalación', tecnicoId: 'TEC-001', tecnicoNombre: 'Jose Mendoza', clienteId: '000001', clienteNombre: 'MONICA ROCIO DELGADO LOPEZ', ticketId: null, estadoAnterior: 'Disponible', estadoNuevo: 'En uso', fecha: '2024-01-05', observaciones: 'Instalación nueva de fibra óptica' },
    { id: 'MOV-002', equipoId: 'EQ-004', tipoMovimiento: 'Instalación', tecnicoId: 'TEC-002', tecnicoNombre: 'Luis Mendoza', clienteId: '000017', clienteNombre: 'DANNY STUARD MARQUEZ', ticketId: null, estadoAnterior: 'Disponible', estadoNuevo: 'En uso', fecha: '2024-03-15', observaciones: 'Instalación radio enlace con LiteBeam 5AC' },
    { id: 'MOV-003', equipoId: 'EQ-005', tipoMovimiento: 'Retiro', tecnicoId: 'TEC-003', tecnicoNombre: 'Fernando Díaz', clienteId: '000019', clienteNombre: 'JUANA ESTHER VALDEZ', ticketId: 'TK-002', estadoAnterior: 'En uso', estadoNuevo: 'En reparación', fecha: '2026-02-04', observaciones: 'ONU con puertos LAN dañados, enviada a reparación' },
];

export const DEMO_TICKETS = [
    { id: 'TK-001', clienteId: '000016', clienteNombre: 'ERIKA MONTES HUAMANI', tipo: 'Reclamo', prioridad: 'Alta', estado: 'Abierto', asignado: 'Luis Mendoza', tecnicoId: 'TEC-002', descripcion: 'Sin servicio de internet desde hace 2 días. Cliente reporta que el router no enciende.', fecha: '2026-02-05', fechaUpdate: '2026-02-06', historial: [{ fecha: '2026-02-05T10:00:00.000Z', estadoAnterior: 'Abierto', estadoNuevo: 'Abierto', motivo: 'Creación del Ticket' }] },
    { id: 'TK-002', clienteId: '000019', clienteNombre: 'JUANA ESTHER VALDEZ', tipo: 'Consulta', prioridad: 'Media', estado: 'En Proceso', asignado: 'Jose Mendoza', tecnicoId: 'TEC-001', descripcion: 'Consulta sobre cambio de plan de 65MB a 100MB. Solicita información de precios.', fecha: '2026-02-04', fechaUpdate: '2026-02-05' },
    { id: 'TK-003', clienteId: '000070', clienteNombre: 'LEIDY CAROLINA ESTRADA RAMIREZ', tipo: 'Soporte', prioridad: 'Baja', estado: 'Resuelto', asignado: 'Luis Mendoza', tecnicoId: 'TEC-002', descripcion: 'Configuración de TV Cable adicional. Se realizó instalación exitosa.', fecha: '2026-02-01', fechaUpdate: '2026-02-02' },
    { id: 'TK-004', clienteId: '000100', clienteNombre: 'CARLOS ALBERTO PEREZ GUTIERREZ', tipo: 'Reclamo', prioridad: 'Alta', estado: 'Abierto', asignado: 'Fernando Díaz', tecnicoId: 'TEC-003', descripcion: 'Cliente con corte por deuda solicita reconexión. Ya realizó el pago pero no se refleja.', fecha: '2026-02-06', fechaUpdate: '2026-02-06' },
    { id: 'TK-005', clienteId: '000082', clienteNombre: 'INDIRA DENNISE BASTIDAS PIZARRO', tipo: 'Técnico', prioridad: 'Media', estado: 'En Proceso', asignado: 'Jose Mendoza', tecnicoId: 'TEC-001', descripcion: 'Velocidad inferior a la contratada. Plan 100MB pero speedtest muestra 45MB.', fecha: '2026-02-03', fechaUpdate: '2026-02-05' },
];

export const DEMO_AVERIAS = [
    { id: 'AV-001', tipo: 'Corte de fibra', zona: 'PLANICIE 1', nodo: 'DIXON OLT/FIBRA', clientesAfectados: 12, estado: 'Activa', prioridad: 'Crítica', reportadoPor: 'Fernando Díaz', tecnicoAsignado: 'Jose Mendoza', descripcion: 'Corte de fibra óptica en poste de MZ.A9. Posible daño por obras municipales.', fecha: '2026-02-06', fechaResolucion: null },
    { id: 'AV-002', tipo: 'Caída de nodo', zona: 'VILLA 5', nodo: 'PLA1/ND2', clientesAfectados: 53, estado: 'En reparación', prioridad: 'Crítica', reportadoPor: 'Luis Mendoza', tecnicoAsignado: 'Jose Mendoza', descripcion: 'Nodo ND2 sin energía eléctrica. Se requiere generador de respaldo.', fecha: '2026-02-05', fechaResolucion: null },
    { id: 'AV-003', tipo: 'Interferencia', zona: 'SANTA MARIA', nodo: 'ADMIN/PLAN3/CCRR1036-VEMAX', clientesAfectados: 5, estado: 'Resuelta', prioridad: 'Media', reportadoPor: 'Jose Mendoza', tecnicoAsignado: 'Luis Mendoza', descripcion: 'Interferencia en frecuencia 5.8GHz por antena vecina. Se cambió canal.', fecha: '2026-02-03', fechaResolucion: '2026-02-04' },
];

export const DEMO_EQUIPOS = [
    { id: 'EQ-001', tipo: 'ONU', marca: 'Huawei', modelo: 'HG8310M', serial: 'HWT-2024-001', estado: 'En uso', clienteId: '000001', clienteNombre: 'MONICA ROCIO DELGADO LOPEZ', ubicacion: 'PLANICIE 1', fechaAsignacion: '2024-01-05' },
    { id: 'EQ-002', tipo: 'ONU', marca: 'VSOL', modelo: 'V2802GW', serial: 'VSL-2024-015', estado: 'En uso', clienteId: '000011', clienteNombre: 'DANTE MARCOS VALLE ALMORA', ubicacion: 'PLANICIE 1', fechaAsignacion: '2024-01-05' },
    { id: 'EQ-003', tipo: 'Router', marca: 'Mikrotik', modelo: 'hAP ac2', serial: 'MKT-2023-088', estado: 'Disponible', clienteId: null, clienteNombre: null, ubicacion: 'Almacén', fechaAsignacion: null },
    { id: 'EQ-004', tipo: 'Antena CPE', marca: 'Ubiquiti', modelo: 'LiteBeam 5AC', serial: 'UBQ-2024-042', estado: 'En uso', clienteId: '000017', clienteNombre: 'DANNY STUARD MARQUEZ', ubicacion: 'VILLA 5', fechaAsignacion: '2024-03-15' },
    { id: 'EQ-005', tipo: 'ONU', marca: 'Tenda', modelo: 'G103', serial: 'TND-2024-033', estado: 'En reparación', clienteId: null, clienteNombre: null, ubicacion: 'Taller', fechaAsignacion: null },
    { id: 'EQ-006', tipo: 'Switch', marca: 'TP-Link', modelo: 'TL-SG108', serial: 'TPL-2023-005', estado: 'En uso', clienteId: null, clienteNombre: 'Nodo PLA1/ND2', ubicacion: 'VILLA 5', fechaAsignacion: '2023-06-10' },
    { id: 'EQ-007', tipo: 'Router', marca: 'Mikrotik', modelo: 'RB750Gr3', serial: 'MKT-2024-101', estado: 'Disponible', clienteId: null, clienteNombre: null, ubicacion: 'Almacén', fechaAsignacion: null },
    { id: 'EQ-008', tipo: 'Antena AP', marca: 'Ubiquiti', modelo: 'Rocket M5', serial: 'UBQ-2022-011', estado: 'En uso', clienteId: null, clienteNombre: 'Torre VERONICA/ND1', ubicacion: 'CARABAYLLO', fechaAsignacion: '2022-08-20' },
];

export const DEMO_SESIONES_REMOTO = [
    { id: 'SR-001', clienteId: '000016', clienteNombre: 'ERIKA MONTES HUAMANI', tipo: 'Diagnóstico', ip: '192.168.30.72', estado: 'Completada', tecnico: 'Luis Mendoza', duracion: '15 min', resultado: 'Router sin respuesta ICMP. Se confirma equipo apagado.', fecha: '2026-02-06' },
    { id: 'SR-002', clienteId: '000082', clienteNombre: 'INDIRA DENNISE BASTIDAS PIZARRO', tipo: 'Configuración', ip: '142.152.7.76', estado: 'Completada', tecnico: 'Jose Mendoza', duracion: '25 min', resultado: 'Se reconfiguró PPPoE y ajustó ancho de banda a 100MB. Speedtest OK.', fecha: '2026-02-05' },
    { id: 'SR-003', clienteId: '000006', clienteNombre: 'RUTH NUBI ALDAVE ALEJOS', tipo: 'Monitoreo', ip: '192.168.30.20', estado: 'En curso', tecnico: 'Fernando Díaz', duracion: '—', resultado: '', fecha: '2026-02-07' },
];

export const getSeedData = (transformClientData) => {
    return {
        templates: DEMO_TEMPLATES,
        tecnicos: DEMO_TECNICOS,
        visitas: DEMO_VISITAS,
        instalaciones: DEMO_INSTALACIONES,
        derivaciones: DEMO_DERIVACIONES,
        postVenta: DEMO_POST_VENTA,
        movimientosEquipos: DEMO_MOV_EQUIPOS,
        tickets: DEMO_TICKETS,
        averias: DEMO_AVERIAS,
        equipos: DEMO_EQUIPOS,
        sesionesRemoto: DEMO_SESIONES_REMOTO,
        clients: DEMO_RAW_DATA.map(transformClientData)
    };
};
