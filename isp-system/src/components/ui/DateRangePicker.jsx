import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import 'react-day-picker/style.css';

// Basic styles override for dark mode harmony if not using CSS variables
const css = `
  .rdp {
    --rdp-cell-size: 32px;
    --rdp-accent-color: #3b82f6;
    --rdp-background-color: #1a1f2e;
    margin: 0;
  }
  .rdp-day_selected:not([disabled]), .rdp-day_selected:focus:not([disabled]), .rdp-day_selected:active:not([disabled]), .rdp-day_selected:hover:not([disabled]) {
    background-color: var(--rdp-accent-color);
    color: white;
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .rdp-caption_label {
    color: #e2e8f0; 
  }
  .rdp-head_cell {
    color: #94a3b8;
  }
  .rdp-day {
    color: #e2e8f0;
  }
  .rdp-day_disabled {
    color: #475569;
  }
  /* Custom popover animation */
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export default function DateRangePicker({
    dateRange = { from: undefined, to: undefined },
    onChange,
    placeholder = "Seleccionar fecha"
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (range) => {
        onChange(range);
    };

    const formatDateDisplay = () => {
        if (dateRange?.from) {
            if (dateRange.to) {
                return `${format(dateRange.from, 'dd MMM y', { locale: es })} - ${format(dateRange.to, 'dd MMM y', { locale: es })}`;
            }
            return format(dateRange.from, 'dd MMM y', { locale: es });
        }
        return placeholder;
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange({ from: undefined, to: undefined });
    };

    return (
        <div className="relative inline-block" ref={containerRef}>
            <style>{css}</style>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-3 py-2 h-[42px] min-w-[240px]
          bg-bg-secondary border border-border rounded-xl cursor-pointer
          hover:border-accent-blue/50 transition-colors
          ${isOpen ? 'border-accent-blue ring-1 ring-accent-blue/20' : ''}
        `}
            >
                <CalendarIcon size={16} className="text-text-muted" />
                <span className={`text-sm flex-1 ${!dateRange?.from ? 'text-text-muted' : 'text-text-primary'}`}>
                    {formatDateDisplay()}
                </span>
                {(dateRange?.from || dateRange?.to) && (
                    <button
                        onClick={handleClear}
                        className="p-1 hover:bg-bg-tertiary rounded-full text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-bg-card border border-border rounded-xl shadow-xl p-3 animate-[slideDown_0.2s_ease-out]">
                    <DayPicker
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleSelect}
                        locale={es}
                        numberOfMonths={1}
                        modifiersClassNames={{
                            selected: 'rdp-day_selected'
                        }}
                    />
                </div>
            )}
        </div>
    );
}
