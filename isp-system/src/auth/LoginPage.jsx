import { useState, useEffect, useRef } from 'react';
import { Wifi, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
  const googleInitialized = useRef(false);

  useEffect(() => {
    const clientId = CONFIG.GOOGLE_CLIENT_ID;

    if (!clientId || googleInitialized.current || !window.google) {
      return;
    }

    try {
      // Inicializar Google Identity Services solo una vez
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
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
        },
      });

      googleInitialized.current = true;
    } catch (err) {
      console.error('Error al inicializar Google:', err);
    }
  }, [login, loadCurrentUserByEmail]);

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

  const handleGoogleLogin = () => {
    const clientId = CONFIG.GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError('⚠️ Google OAuth no está configurado.');
      return;
    }

    if (!window.google || !googleInitialized.current) {
      setError('Cargando Google Sign-In... Intenta de nuevo en un momento.');
      return;
    }

    try {
      setError('');
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
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
              loginMethod === 'email'
                ? 'bg-accent-blue text-white shadow-sm'
                : 'bg-transparent text-text-secondary hover:text-text-primary'
            }`}>
            Email y Contraseña
          </button>
          <button
            onClick={() => setLoginMethod('google')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
              loginMethod === 'google'
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
            <p className="text-xs text-text-secondary text-center mb-2">
              Inicia sesión con tu cuenta de Google autorizada
            </p>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-5 rounded-xl bg-white text-gray-700 border-none text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <GoogleIcon />
              {loading ? 'Verificando...' : 'Continuar con Google'}
            </button>
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
