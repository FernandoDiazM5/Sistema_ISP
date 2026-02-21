import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
    primary: 'bg-accent-blue text-white shadow-sm hover:shadow-md hover:bg-accent-blue/90 border-transparent',
    secondary: 'bg-bg-secondary text-text-primary border-border hover:bg-bg-card-hover shadow-sm',
    ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-bg-secondary border-transparent',
    danger: 'bg-red-500/10 text-red-500 border-transparent hover:bg-red-500/20',
    outline: 'bg-transparent border-border text-text-secondary hover:border-text-primary hover:bg-bg-secondary/50',
    success: 'bg-green-500/10 text-green-500 border-transparent hover:bg-green-500/20',
};

const SIZES = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
};

const Button = React.memo(function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    disabled = false,
    icon: Icon,
    type = 'button',
    onClick,
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-blue/50 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none border border-transparent';
    const variantStyles = VARIANTS[variant] || VARIANTS.primary;
    const sizeStyles = SIZES[size] || SIZES.md;

    return (
        <button
            type={type}
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
            disabled={disabled || isLoading}
            onClick={onClick}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : Icon ? (
                <Icon className={`mr-2 h-4 w-4 ${size === 'sm' ? 'h-3 w-3' : ''}`} />
            ) : null}
            {children}
        </button>
    );
});

export default Button;
