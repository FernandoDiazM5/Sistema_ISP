import { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from './GoogleAuthProvider';
import { CONFIG } from '../utils/constants';
import useStore from '../store/useStore';
import { loginWithPassword } from '../api/authAPI';

export default function LoginPage() {
  const { login } = useAuth();
  const loadCurrentUserByEmail = useStore(s => s.loadCurrentUserByEmail);
  const getUserByUid = useStore(s => s.getUserByUid);

  const [loginMethod, setLoginMethod] = useState('email'); // 'email' o 'google'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleError, setGoogleError] = useState(''); // Error específico de Google OAuth
  const googleInitialized = useRef(false);
  const googleButtonRef = useRef(null);

  const handleGoogleCredential = useCallback(async (response) => {
    try {
      setLoading(true);
      setError('');

      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userEmail = payload.email;

      // Verificar si el usuario existe en Firebase
      const firebaseUser = await loadCurrentUserByEmail(userEmail);

      if (!firebaseUser) {
        setError('No tienes autorización para acceder a este sistema. Contacta al administrador.');
        setLoading(false);
        return;
      }

      if (!firebaseUser.activo) {
        setError('Tu cuenta ha sido desactivada. Contacta al administrador.');
        setLoading(false);
        return;
      }

      // Usuario autenticado y autorizado, completar login
      login({
        email: firebaseUser.email,
        nombre: firebaseUser.nombre,
        foto: firebaseUser.foto || payload.picture,
        rol: firebaseUser.rol,
        uid: firebaseUser.uid,
        permisos: firebaseUser.permisos,
      });

      setLoading(false);
    } catch (err) {
      setError('Error al procesar el inicio de sesión. Intenta nuevamente.');
      console.error('Error en login:', err);
      setLoading(false);
    }
  }, [login, loadCurrentUserByEmail]);

  useEffect(() => {
    let checkInterval;
    let retries = 0;
    const MAX_RETRIES = 20; // 10 segundos máximo de espera

    const initGoogleOAuth = () => {
      const clientId = CONFIG.GOOGLE_CLIENT_ID;

      // Si ya se inicializó, no reintentar
      if (googleInitialized.current) return true;

      // Si no hay clientId configurado, mostrar error y dejar de reintentar
      if (!clientId) {
        setGoogleError('No se encontró el GOOGLE_CLIENT_ID. Si limpiaste la caché del navegador, necesitas volver a configurarlo en el archivo .env o en localStorage.');
        return true; // retornar true para detener el polling
      }

      // Si el script de Google aún no termina de cargar en el navegador (ej. Firefox)
      if (!window.google || !window.google.accounts) {
        retries++;
        if (retries >= MAX_RETRIES) {
          setGoogleError('No se pudo cargar el servicio de Google. Verifica tu conexión a internet o intenta recargar la página.');
          return true;
        }
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          ux_mode: 'popup',
        });
        googleInitialized.current = true;
        setGoogleError(''); // Limpiar cualquier error previo
        return true;
      } catch (err) {
        console.error('Error al inicializar Google:', err);
        setGoogleError('Error al inicializar Google OAuth. Verifica la configuración del Client ID.');
        return true;
      }
    };

    const tryInit = () => {
      if (!initGoogleOAuth()) {
        checkInterval = setTimeout(tryInit, 500);
      }
    };

    tryInit();

    return () => {
      clearTimeout(checkInterval);
      // Permitir re-inicialización si las dependencias cambian
      googleInitialized.current = false;
    };
  }, [handleGoogleCredential]);

  // Renderizar el botón nativo de Google cuando la pestaña es 'google'
  useEffect(() => {
    if (loginMethod !== 'google' || !googleButtonRef.current || googleError) return;

    let renderInterval;
    let renderRetries = 0;

    const tryRenderButton = () => {
      if (googleInitialized.current && window.google && window.google.accounts) {
        googleButtonRef.current.innerHTML = '';
        try {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 360,
            locale: 'es',
          });
        } catch (e) {
          console.error("Error renderizando boton de google:", e);
        }
      } else {
        renderRetries++;
        if (renderRetries < 20) {
          renderInterval = setTimeout(tryRenderButton, 500);
        }
      }
    };

    tryRenderButton();

    return () => clearTimeout(renderInterval);
  }, [loginMethod, googleError]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Autenticar con Firebase Auth
      const authResult = await loginWithPassword(email, password);

      if (!authResult.success) {
        setError(authResult.error);
        setLoading(false);
        return;
      }

      // Cargar datos del usuario desde Firestore usando el UID de Firebase Auth
      const firebaseUser = await getUserByUid(authResult.uid);

      if (!firebaseUser) {
        setError('Usuario no encontrado en el sistema. Contacta al administrador.');
        setLoading(false);
        return;
      }

      if (!firebaseUser.activo) {
        setError('Tu cuenta ha sido desactivada. Contacta al administrador.');
        setLoading(false);
        return;
      }

      // Login exitoso
      login({
        email: firebaseUser.email,
        nombre: firebaseUser.nombre,
        foto: firebaseUser.foto,
        rol: firebaseUser.rol,
        uid: firebaseUser.uid,
        permisos: firebaseUser.permisos,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al iniciar sesión. Intenta nuevamente.');
      setLoading(false);
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
      <div className="animate-fade w-full max-w-[420px] mx-4 p-6 sm:p-10 rounded-[20px] relative z-10"
        style={{
          background: 'linear-gradient(145deg, rgba(26,32,53,0.9) 0%, rgba(17,24,39,0.95) 100%)',
          border: '1px solid rgba(59,130,246,0.15)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.05)',
          backdropFilter: 'blur(20px)',
        }}>

        {/* Logo */}
        <div className="text-center mb-6">
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

        {/* Method Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-bg-secondary rounded-xl">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${loginMethod === 'email'
              ? 'bg-accent-blue text-white shadow-sm'
              : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}>
            Email y Contraseña
          </button>
          <button
            onClick={() => setLoginMethod('google')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${loginMethod === 'google'
              ? 'bg-accent-blue text-white shadow-sm'
              : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}>
            Google OAuth
          </button>
        </div>

        {/* Email/Password Login Form */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  className="w-full py-2.5 pl-10 pr-4 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2.5 pl-10 pr-10 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-blue placeholder:text-text-muted transition-colors"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 rounded-xl text-white border-none text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* Google Login */}
        {loginMethod === 'google' && (
          <div className="flex flex-col gap-4">
            {googleError ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-amber-400" />
                </div>
                <p className="text-xs text-amber-300 text-center leading-relaxed max-w-[320px]">
                  {googleError}
                </p>
                <p className="text-[11px] text-text-muted text-center leading-relaxed">
                  Usa la pestaña <strong className="text-text-secondary">Email y Contraseña</strong> como alternativa, o configura el <code className="bg-bg-secondary px-1.5 py-0.5 rounded text-accent-cyan text-[10px]">VITE_GOOGLE_CLIENT_ID</code> en tu archivo <code className="bg-bg-secondary px-1.5 py-0.5 rounded text-accent-cyan text-[10px]">.env</code>
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-text-secondary text-center mb-2">
                  Inicia sesión con tu cuenta de Google autorizada
                </p>
                {loading ? (
                  <div className="w-full py-3 text-center text-sm text-text-secondary">
                    Verificando...
                  </div>
                ) : (
                  <div ref={googleButtonRef} className="flex justify-center" />
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
            <p className="text-xs text-accent-red text-center leading-relaxed">{error}</p>
          </div>
        )}

        <p className="mt-6 text-[11px] text-text-muted text-center">
          Solo usuarios autorizados pueden acceder
        </p>
      </div>
    </div>
  );
}
