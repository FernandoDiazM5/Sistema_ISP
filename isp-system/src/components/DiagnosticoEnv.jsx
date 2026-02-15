import { useState } from 'react';

export default function DiagnosticoEnv() {
  const [mostrar, setMostrar] = useState(false);

  const vars = {
    'VITE_GOOGLE_CLIENT_ID': import.meta.env.VITE_GOOGLE_CLIENT_ID,
    'VITE_GOOGLE_API_KEY': import.meta.env.VITE_GOOGLE_API_KEY,
    'VITE_GOOGLE_SHEET_ID': import.meta.env.VITE_GOOGLE_SHEET_ID,
    'VITE_GEMINI_API_KEY': import.meta.env.VITE_GEMINI_API_KEY,
    'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
    'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const enProduccion = import.meta.env.PROD;
  const mode = import.meta.env.MODE;

  if (!mostrar) {
    return (
      <button
        onClick={() => setMostrar(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '8px 16px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        🔍 Diagnosticar Variables
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '20px',
        borderRadius: '12px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 9999,
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        border: '1px solid #334155',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          🔍 Diagnóstico de Variables de Entorno
        </h3>
        <button
          onClick={() => setMostrar(false)}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          Cerrar
        </button>
      </div>

      <div style={{ marginBottom: '15px', padding: '10px', background: '#334155', borderRadius: '6px' }}>
        <div><strong>Modo:</strong> {mode}</div>
        <div><strong>Producción:</strong> {enProduccion ? 'Sí' : 'No'}</div>
        <div><strong>Base URL:</strong> {import.meta.env.BASE_URL}</div>
      </div>

      <h4 style={{ marginTop: '15px', marginBottom: '10px', fontSize: '13px', color: '#60a5fa' }}>
        Variables de Entorno (10 total):
      </h4>

      {Object.entries(vars).map(([key, value]) => {
        const existe = value !== undefined && value !== '';
        const mascarado = value
          ? key.includes('API_KEY') || key.includes('CLIENT_ID')
            ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
            : value
          : 'undefined';

        return (
          <div
            key={key}
            style={{
              marginBottom: '8px',
              padding: '8px',
              background: existe ? '#064e3b' : '#7f1d1d',
              borderRadius: '4px',
              borderLeft: `3px solid ${existe ? '#10b981' : '#ef4444'}`,
            }}
          >
            <div style={{ fontWeight: 'bold', color: existe ? '#6ee7b7' : '#fca5a5' }}>
              {existe ? '✅' : '❌'} {key}
            </div>
            <div style={{ fontSize: '11px', color: existe ? '#d1fae5' : '#fecaca', marginTop: '4px' }}>
              {mascarado}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: '15px', padding: '10px', background: '#1e40af', borderRadius: '6px', fontSize: '11px' }}>
        <strong>💡 Nota:</strong> Si ves ❌ en variables, significa que el build NO tiene los GitHub Secrets.
        El deploy debe ejecutarse DESPUÉS de agregar los secretos en GitHub.
      </div>
    </div>
  );
}
