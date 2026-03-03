import React from 'react';
import Badge from './Badge';

// Master dictionary of status configurations across the entire ISP application
const STATUS_CONFIG = {
    // Global / General States
    'Activa': { variant: 'success', defaultText: 'Activa' },
    'Activo': { variant: 'success', defaultText: 'Activo' },
    'Suspendido': { variant: 'warning', defaultText: 'Suspendido' },
    'Retirado': { variant: 'danger', defaultText: 'Retirado' },

    // Ticket / Troubleshooting Flow
    'Abierto': { variant: 'info', defaultText: 'Abierto' },
    'En curso': { variant: 'info', defaultText: 'En curso' },
    'En Proceso': { variant: 'warning', defaultText: 'En Proceso' },
    'Escalado': { variant: 'orange', defaultText: 'Escalado' },
    'Resuelto': { variant: 'success', defaultText: 'Resuelto' },
    'Cerrado': { variant: 'default', defaultText: 'Cerrado' },
    'Cancelado': { variant: 'default', defaultText: 'Cancelado' },
    'Cancelada': { variant: 'default', defaultText: 'Cancelada' },

    // Inter-module Escalation
    'Derivado a Visita': { variant: 'purple', defaultText: 'Derivado a Visita' },
    'Derivado a Planta Externa': { variant: 'orange', defaultText: 'Derivado Planta Ext.' },

    // Operations / Field Service (Visits & Installations)
    'Programada': { variant: 'info', defaultText: 'Programada' },
    'Reprogramada': { variant: 'warning', defaultText: 'Reprogramada' },
    'En Ruta': { variant: 'purple', defaultText: 'En Ruta' },
    'En Sitio': { variant: 'orange', defaultText: 'En Sitio' },
    'Completada': { variant: 'success', defaultText: 'Completada' },
    'Completado': { variant: 'success', defaultText: 'Completado' },
    'Ausente': { variant: 'danger', defaultText: 'Ausente' },
    'Fallida': { variant: 'danger', defaultText: 'Fallida' },
    'Pendiente': { variant: 'warning', defaultText: 'Pendiente' },

    // Installations pipeline
    'Aprobada': { variant: 'info', defaultText: 'Aprobada' },
    'En Instalación': { variant: 'orange', defaultText: 'En Instalación' },
    'Derivada': { variant: 'danger', defaultText: 'Derivada' },

    // Averías
    'En reparación': { variant: 'warning', defaultText: 'En reparación' },
    'Coordinando': { variant: 'info', defaultText: 'Coordinando' },

    // Admin & Financial
    'En Revisión': { variant: 'info', defaultText: 'En Revisión' },
    'Aprobado': { variant: 'success', defaultText: 'Aprobado' },
    'Rechazado': { variant: 'danger', defaultText: 'Rechazado' },
    'Pagado': { variant: 'success', defaultText: 'Pagado' },
};

export default function StatusBadge({ status, size = 'md', className = '', showDot = false }) {
    if (!status) return null;

    // Fallback to "default" if status is not mapped
    const config = STATUS_CONFIG[status] || { variant: 'default', defaultText: status };

    return (
        <Badge
            variant={config.variant}
            size={size}
            className={className}
            dot={showDot}
        >
            {status}
        </Badge>
    );
}
