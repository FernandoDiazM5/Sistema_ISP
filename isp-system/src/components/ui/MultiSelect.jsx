import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

export default function MultiSelect({
    label,
    options = [],
    value = [],
    onChange,
    placeholder = 'Seleccionar...',
    maxDisplay = 2
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleOption = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleSelectAll = () => {
        if (value.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.value));
        }
    };

    const handleClear = () => {
        onChange([]);
    };

    const getDisplayValue = () => {
        if (value.length === 0) return placeholder;
        if (value.length === options.length) return 'Todos';

        if (value.length <= maxDisplay) {
            return value.map(v => options.find(o => o.value === v)?.label).join(', ');
        }

        return `${value.length} seleccionados`;
    };

    return (
        <div className="relative min-w-[150px]" ref={containerRef}>
            {label && <label className="text-xs text-text-secondary font-medium mb-1.5 block">{label}</label>}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center justify-between w-full px-3 py-2.5 rounded-xl
          bg-bg-secondary border border-border text-sm text-text-primary
          cursor-pointer hover:border-accent-blue/50 transition-colors
          ${isOpen ? 'border-accent-blue ring-1 ring-accent-blue/20' : ''}
        `}
            >
                <span className="truncate text-xs font-medium">{getDisplayValue()}</span>
                <ChevronDown size={14} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1.5 w-full min-w-[200px] bg-bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-border/50 flex gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="flex-1 text-[10px] py-1 px-2 rounded bg-bg-secondary hover:bg-bg-tertiary text-text-primary transition-colors font-medium"
                        >
                            {value.length === options.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                            title="Limpiar filtro"
                        >
                            <X size={12} />
                        </button>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {options.map((option) => {
                            const isSelected = value.includes(option.value);
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => handleToggleOption(option.value)}
                                    className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs
                    transition-colors mb-0.5 last:mb-0
                    ${isSelected ? 'bg-accent-blue/10 text-accent-blue font-medium' : 'hover:bg-bg-secondary text-text-secondary'}
                  `}
                                >
                                    <div className={`
                    w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'bg-accent-blue border-accent-blue text-white' : 'border-border bg-bg-secondary'}
                  `}>
                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                    </div>
                                    <span>{option.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
