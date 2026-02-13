import React from 'react';

const VARIANTS = {
    default: 'bg-bg-secondary text-text-primary border-border',
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const SIZES = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
};

const Badge = React.memo(function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    dot = false,
    ...props
}) {
    const variantStyles = VARIANTS[variant] || VARIANTS.default;
    const sizeStyles = SIZES[size] || SIZES.md;

    return (
        <span
            className={`
        inline-flex items-center justify-center font-medium rounded-full border
        whitespace-nowrap transition-colors
        ${variantStyles} ${sizeStyles} ${className}
      `}
            {...props}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60`} />
            )}
            {children}
        </span>
    );
});

export default Badge;
