import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = memo(function Select({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Seleccionar...',
    error,
    disabled = false,
    icon: Icon,
    className = '',
    size = 'md',
}) {
    const sizeClasses = {
        sm: 'py-1.5 px-3 text-xs',
        md: 'py-2.5 px-3 text-sm',
        lg: 'py-3 px-4 text-base',
    };

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label className="text-xs font-semibold text-text-secondary">{label}</label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                        <Icon size={16} />
                    </div>
                )}
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={`
            w-full ${sizeClasses[size]} 
            ${Icon ? 'pl-10' : ''} pr-10
            bg-bg-card border rounded-xl text-text-primary 
            outline-none transition-all appearance-none cursor-pointer
            ${error ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-accent-blue'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-blue/50'}
            placeholder:text-text-muted
          `}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map(opt => (
                        <option key={opt.value ?? opt} value={opt.value ?? opt}>
                            {opt.label ?? opt}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <ChevronDown size={16} />
                </div>
            </div>
            {error && <span className="text-[11px] text-red-500 mt-0.5">{error}</span>}
        </div>
    );
});

export default Select;
