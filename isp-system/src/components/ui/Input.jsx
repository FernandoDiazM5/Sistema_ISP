import React from 'react';
import { Search } from 'lucide-react';

const Input = React.memo(function Input({
    label,
    error,
    icon: Icon,
    className = '',
    containerClassName = '',
    type = 'text',
    ...props
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
            {label && (
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-blue transition-colors">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    type={type}
                    className={`
            w-full rounded-xl bg-bg-secondary border border-border 
            text-sm text-text-primary placeholder:text-text-muted 
            outline-none transition-all duration-200
            focus:border-accent-blue focus:bg-bg-card
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-9' : 'pl-3'} 
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
            py-2.5
          `}
                    {...props}
                />
            </div>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
});

export default Input;

export const SearchInput = React.memo(function SearchInput({ className = '', ...props }) {
    return (
        <Input
            icon={Search}
            placeholder="Buscar..."
            className={`rounded-full ${className}`}
            {...props}
        />
    );
});
