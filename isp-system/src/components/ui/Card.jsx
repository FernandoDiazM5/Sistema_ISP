import React from 'react';

const Card = React.memo(function Card({
    children,
    className = '',
    title,
    subtitle,
    actions,
    padding = 'p-6',
    ...props
}) {
    return (
        <div
            className={`bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
            {...props}
        >
            {(title || subtitle || actions) && (
                <div className={`flex items-start justify-between mb-4 ${padding} pb-0`}>
                    <div>
                        {title && <h3 className="text-lg font-bold text-text-primary tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            <div className={padding}>
                {children}
            </div>
        </div>
    );
});

export default Card;
