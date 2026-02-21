export interface IClient {
    id: string;
    nombres: string;
    apellidos: string;
    documento: string;
    tipoDocumento: string;
    email?: string;
    telefono: string;
    direccion: string;
    coordenadas?: { lat: number; lng: number };
    estado: string;
    planId?: string;
    fechaRegistro: string;
    updatedAt?: string;
}

export interface ITicket {
    id: string;
    clienteId: string;
    categoriaId: string;
    subcategoriaId: string;
    prioridadId: string;
    estado: string;
    tecnicoId?: string;
    descripcion: string;
    fechaReporte: string;
    fechaResolucion?: string;
    updatedAt?: string;
}

export interface IAveria {
    id: string;
    ticketId?: string;
    descripcion: string;
    estado: string;
    fechaReporte: string;
    updatedAt?: string;
}

export interface IEquipo {
    id: string;
    modelo: string;
    mac: string;
    serie: string;
    estado: string; // 'Disponible', 'Instalado', 'Dañado'
    clienteId?: string;
    updatedAt?: string;
}

export interface ITecnico {
    id: string;
    nombre: string;
    telefono: string;
    email: string;
    estado: string;
    updatedAt?: string;
}

export interface IVisita {
    id: string;
    ticketId?: string;
    clienteId: string;
    tecnicoId: string;
    fechaProgramada: string;
    estado: string;
    observaciones?: string;
    updatedAt?: string;
}

export interface IInstalacion {
    id: string;
    clienteId: string;
    fecha: string;
    estado: string;
    equiposIds: string[];
    updatedAt?: string;
}

export interface IPostVenta {
    id: string;
    clienteId: string;
    fecha: string;
    tipo: string;
    detalles: string;
    updatedAt?: string;
}

export interface ICatalogoCategoria {
    id: string;
    nombre: string;
    descripcion: string;
}

export interface ICatalogoSubcategoria {
    id: string;
    categoriaId: string;
    nombre: string;
    tipoAtencion: string;
}

export interface ICatalogoServicio {
    id: string;
    nombre: string;
    tipo: string;
    precio: number;
    descripcion: string;
}
