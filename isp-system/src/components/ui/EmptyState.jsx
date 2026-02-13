import React, { memo } from 'react';
import { SearchX } from 'lucide-react';

const EmptyState = memo(function EmptyState({
    icon: Icon = SearchX,
    title = 'No se encontraron resultados',
    description = 'Intenta ajustar los filtros o realizar una nueva búsqueda.',
    action,
    actionLabel,
    className = '',
}) {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
            <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border flex items-center justify-center mb-4">
                <Icon size={28} className="text-text-muted" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
            <p className="text-xs text-text-muted max-w-xs leading-relaxed">{description}</p>
            {action && actionLabel && (
                <button
                    onClick={action}
                    className="mt-4 px-4 py-2 rounded-lg bg-accent-blue text-white text-xs font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
});

export default EmptyState;
