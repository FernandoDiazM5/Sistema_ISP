import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
    primary: 'bg-accent-blue text-white hover:opacity-90 border-transparent',
    secondary: 'bg-bg-secondary text-text-primary border-border hover:bg-bg-card-hover',
    ghost: 'bg-transparent text-text-muted hover:text-text-primary hover:bg-bg-secondary border-transparent',
    danger: 'bg-red-500/10 text-red-500 border-transparent hover:bg-red-500/20',
    outline: 'bg-transparent border-border text-text-secondary hover:border-text-muted',
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
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent-blue/50 disabled:opacity-50 disabled:cursor-not-allowed border';
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
