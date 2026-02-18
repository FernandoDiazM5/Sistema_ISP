import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/whatsappFormats';

/**
 * Botón para copiar texto al portapapeles (formato WhatsApp)
 * @param {function} getTextFn - Función que retorna el texto a copiar
 * @param {string} [title] - Tooltip del botón
 * @param {string} [size] - 'sm' | 'md' (default: 'sm')
 */
export default function CopyButton({ getTextFn, title = 'Copiar para WhatsApp', size = 'sm' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    const text = getTextFn();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const iconSize = size === 'sm' ? 13 : 16;

  return (
    <button
      onClick={handleCopy}
      title={copied ? '¡Copiado!' : title}
      className={`inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
        copied
          ? 'bg-green-500/20 border-green-500/30 text-green-400'
          : 'bg-bg-secondary border-border text-text-muted hover:text-accent-blue hover:border-accent-blue/50 hover:bg-accent-blue/10'
      } ${size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'}`}
    >
      {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
    </button>
  );
}
