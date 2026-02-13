import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder = 'Seleccionar...', className }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2 bg-bg-card border border-border rounded-[10px] py-2.5 px-3 text-[13px] outline-none transition-all cursor-pointer hover:border-accent-blue
          ${isOpen ? 'border-accent-blue ring-1 ring-accent-blue/20' : ''}
          ${value ? 'text-text-primary' : 'text-text-muted'}
        `}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg-card border border-border rounded-xl shadow-lg z-50 max-h-[240px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-[13px] transition-colors
                  ${value === opt.value
                                        ? 'bg-accent-blue/10 text-accent-blue font-medium'
                                        : 'text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
                                    }
                `}
                            >
                                <span>{opt.label}</span>
                                {value === opt.value && <Check size={14} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
