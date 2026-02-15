import { useState, useEffect, useRef } from 'react';
import { Wifi } from 'lucide-react';
import { useAuth } from './GoogleAuthProvider';
import { CONFIG } from '../utils/constants';
import useStore from '../store/useStore';

// Función para obtener el Client ID desde variable de entorno (PRIORIDAD) o localStorage (fallback)
function getGoogleClientId() {
  return CONFIG.GOOGLE_CLIENT_ID || localStorage.getItem('isp_google_client_id') || '';
}

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const googleInitialized = useRef(false);

  useEffect(() => {
    const clientId = getGoogleClientId();

    if (!clientId || googleInitialized.current || !window.google) {
      return;
    }

    try {
      // Inicializar Google Identity Services solo una vez
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const userEmail = payload.email;

            // Verificar si el correo está autorizado
            const isAuthorized = useStore.getState().isEmailAuthorized(userEmail);

            if (!isAuthorized) {
              setError('No tienes autorización para acceder a este sistema. Contacta al administrador.');
              return;
            }

            // Si está autorizado, continuar con el login
            login({
              email: userEmail,
              nombre: payload.name,
              foto: payload.picture,
              rol: 'ADMIN',
            });
          } catch (err) {
            setError('Error al procesar el inicio de sesión. Intenta nuevamente.');
            console.error('Error en login:', err);
          }
        },
      });

      googleInitialized.current = true;
    } catch (err) {
      console.error('Error al inicializar Google:', err);
    }
  }, [login]);

  const handleDemoLogin = () => {
    login({
      email: 'admin@isp-system.com',
      nombre: 'Fernando Díaz',
      foto: null,
      rol: 'ADMIN',
    });
  };

  const handleGoogleLogin = () => {
    const clientId = getGoogleClientId();

    if (!clientId) {
      setError('Google OAuth no está configurado. Las variables de entorno aún no están disponibles. Por ahora usa el acceso demo.');
      return;
    }

    if (!window.google || !googleInitialized.current) {
      setError('Cargando Google Sign-In... Intenta de nuevo en un momento.');
      return;
    }

    try {
      // Solo mostrar el prompt, no reinicializar
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Prompt not displayed:', notification.getNotDisplayedReason());
        }
      });
    } catch (err) {
      console.error('Error al mostrar prompt:', err);
      setError('Error al iniciar sesión. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, #0f172a 0%, #0a0e1a 50%, #050709 100%)' }}>

      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
      />

      {/* Login card */}
      <div className="animate-fade w-[420px] p-10 rounded-[20px] relative z-10"
        style={{
          background: 'linear-gradient(145deg, rgba(26,32,53,0.9) 0%, rgba(17,24,39,0.95) 100%)',
          border: '1px solid rgba(59,130,246,0.15)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.05)',
          backdropFilter: 'blur(20px)',
        }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
            }}>
            <Wifi size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">ISP Sistema de Gestión</h1>
          <p className="text-text-secondary text-sm">Radio Enlace · Fibra Óptica · IPTV</p>
        </div>

        {/* Google Login */}
        <button onClick={handleGoogleLogin}
          className="w-full py-3 px-5 rounded-xl bg-white text-gray-700 border-none text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <GoogleIcon />
          Iniciar sesión con Google
        </button>

        {/* Divider */}
        <div className="flex items-center my-5 gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">o acceso demo</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Demo Login */}
        <button onClick={handleDemoLogin}
          className="w-full py-3 px-5 rounded-xl text-white border-none text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Entrar como Administrador (Demo)
        </button>

        {error && (
          <p className="mt-4 text-xs text-accent-yellow text-center leading-relaxed">{error}</p>
        )}

        <p className="mt-6 text-[11px] text-text-muted text-center">
          Solo usuarios autorizados pueden acceder
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
