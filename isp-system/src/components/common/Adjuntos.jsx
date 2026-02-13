import { useState, useRef, useEffect } from 'react';
import { Paperclip, X, Image, FileText, Upload, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// Helper para comprimir imágenes antes de guardar
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; // Límite razonable para visualización web
        const scaleSize = MAX_WIDTH / Math.max(img.width, MAX_WIDTH);
        const width = img.width * scaleSize;
        const height = img.height * scaleSize;

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Comprimir a JPEG con calidad 0.7
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const head = 'data:image/jpeg;base64,';
        const size = Math.round((dataUrl.length - head.length) * 3 / 4);

        resolve({
          name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
          type: 'image/jpeg',
          size: size,
          dataUrl: dataUrl
        });
      };
    };
  });
};

/**
 * Reusable file attachments component.
 * - Supports up to `max` files (default 5)
 * - Stores files as { name, type, size, dataUrl } objects
 * - Shows image previews for image types
 * - Not mandatory by default
 *
 * Props:
 *  - value: array of attachment objects
 *  - onChange: (newAttachments) => void
 *  - max: max number of files (default 5)
 *  - label: custom label text
 *  - compact: boolean, smaller UI for inline use
 *  - readOnly: boolean, disable uploads
 */
export default function Adjuntos({ value = [], onChange, max = 5, label, compact = false, readOnly = false }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);

  const handleFiles = (fileList) => {
    if (readOnly) return;
    const remaining = max - value.length;
    if (remaining <= 0) return;

    const files = Array.from(fileList).slice(0, remaining);
    const promises = files.map(file => {
      if (file.type.startsWith('image/')) {
        return compressImage(file);
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newFiles => {
      onChange([...value, ...newFiles]);
    });
  };

  const handleInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    if (readOnly) return;
    onChange(value.filter((_, i) => i !== index));
  };

  const isImage = (type) => type && type.startsWith('image/');

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Navigation logic
  const imageIndices = value.map((f, i) => isImage(f.type) ? i : -1).filter(i => i !== -1);
  const currentImageIndex = imageIndices.indexOf(previewIndex);
  const hasPrev = currentImageIndex > 0;
  const hasNext = currentImageIndex < imageIndices.length - 1;

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (hasPrev) setPreviewIndex(imageIndices[currentImageIndex - 1]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (hasNext) setPreviewIndex(imageIndices[currentImageIndex + 1]);
  };

  const handleKeyDown = (e) => {
    if (previewIndex === null) return;
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setPreviewIndex(null);
  };

  const handleDownload = (e) => {
    e?.stopPropagation();
    if (!currentFile) return;
    const link = document.createElement('a');
    link.href = currentFile.dataUrl;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (previewIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewIndex, value]);

  const currentFile = previewIndex !== null ? value[previewIndex] : null;

  return (
    <div>
      {label !== false && (
        <label className="text-xs text-text-secondary font-medium mb-1.5 block">
          {label || 'Adjuntos'} <span className="text-text-muted font-normal">({value.length}/{max}, opcional)</span>
        </label>
      )}

      {/* Upload area */}
      {!readOnly && value.length < max && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 ${
            compact ? 'p-2' : 'p-4'
          } ${
            dragOver
              ? 'border-accent-blue/60 bg-accent-blue/5'
              : 'border-border hover:border-accent-blue/40 bg-bg-secondary/30'
          }`}
        >
          <Upload size={compact ? 14 : 16} className="text-text-muted" />
          <span className={`text-text-muted ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {compact ? 'Adjuntar archivos' : 'Arrastra archivos aqui o haz clic para seleccionar'}
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* File previews */}
      {value.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${!readOnly && value.length < max ? 'mt-2' : ''}`}>
          {value.map((file, idx) => (
            <div
              key={idx}
              className={`relative group bg-bg-secondary rounded-lg border border-border overflow-hidden ${
                compact ? 'w-16 h-16' : 'w-20 h-20' 
              } ${isImage(file.type) ? 'cursor-pointer' : ''}`}
              onClick={() => isImage(file.type) && setPreviewIndex(idx)}
            >
              {isImage(file.type) ? (
                <>
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-1">
                  <FileText size={compact ? 16 : 20} className="text-text-muted mb-1" />
                  <span className="text-[8px] text-text-muted text-center truncate w-full px-1 leading-tight">
                    {file.name}
                  </span>
                </div>
              )}
              {/* File info tooltip on hover */}
              <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[8px] text-white px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                {file.name} ({formatSize(file.size)})
              </div>
              {/* Remove button */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none p-0"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {currentFile && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade"
          onClick={() => setPreviewIndex(null)}
        >
          <div className="absolute top-5 right-5 z-10 flex gap-4">
            <button 
              className="text-white/70 hover:text-white bg-transparent border-none cursor-pointer transition-colors"
              onClick={handleDownload}
              title="Descargar imagen"
            >
              <Download size={32} />
            </button>
            <button 
              className="text-white/70 hover:text-white bg-transparent border-none cursor-pointer transition-colors"
              onClick={() => setPreviewIndex(null)}
            >
              <X size={32} />
            </button>
          </div>
          
          {hasPrev && (
            <button onClick={handlePrev} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-transparent border-none cursor-pointer p-2 z-10">
              <ChevronLeft size={48} />
            </button>
          )}

          <div className="max-w-5xl max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img 
              src={currentFile.dataUrl} 
              alt={currentFile.name} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium text-lg">{currentFile.name}</p>
              <p className="text-white/60 text-sm">{formatSize(currentFile.size)} {imageIndices.length > 1 && `(${currentImageIndex + 1} de ${imageIndices.length})`}</p>
            </div>
          </div>

          {hasNext && (
            <button onClick={handleNext} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-transparent border-none cursor-pointer p-2 z-10">
              <ChevronRight size={48} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline display for adjuntos in list cards.
 * Shows a small icon + count.
 */
export function AdjuntosCount({ count }) {
  if (!count || count === 0) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] text-text-muted">
      <Paperclip size={10} />
      {count}
    </span>
  );
}
