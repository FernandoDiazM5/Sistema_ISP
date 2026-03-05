import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { getFirebaseApp } from './firebase';
import { CONFIG } from '../utils/constants';

// Inicializar Firebase Auth reutilizando la misma instancia de app
let auth = null;

function initAuth() {
  if (auth) return auth;

  try {
    const app = getFirebaseApp();
    if (!app) {
      console.warn('⚠️ Firebase no configurado para autenticación');
      return null;
    }

    auth = getAuth(app);
    console.log('✅ Firebase Auth inicializado');
    return auth;
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Auth:', error);
    return null;
  }
}

/**
 * Crear usuario en Firebase Auth usando una app secundaria para no
 * cerrar la sesión del administrador actual.
 */
export async function createUserWithPassword(email, password) {
  const primaryApp = getFirebaseApp();
  if (!primaryApp) return { success: false, error: 'Firebase no está configurado' };

  // App secundaria para que createUserWithEmailAndPassword no afecte la sesión admin
  const secondaryApp = initializeApp(primaryApp.options, `admin_create_${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return { success: true, uid: credential.user.uid, email: credential.user.email };
  } catch (error) {
    console.error('Error al crear usuario en Firebase Auth:', error);
    let message = 'Error al crear usuario';
    if (error.code === 'auth/email-already-in-use') message = 'Ya existe una cuenta con este email';
    else if (error.code === 'auth/weak-password') message = 'La contraseña debe tener al menos 6 caracteres';
    else if (error.code === 'auth/invalid-email') message = 'Email inválido';
    return { success: false, error: message };
  } finally {
    await deleteApp(secondaryApp);
  }
}

/**
 * Iniciar sesión con email y contraseña via Firebase Auth.
 */
export async function loginWithPassword(email, password) {
  try {
    const auth = initAuth();
    if (!auth) throw new Error('Firebase Auth no está configurado');

    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return {
      success: true,
      uid: credential.user.uid,
      email: credential.user.email,
    };
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    let message = 'Usuario o clave incorrectos.';
    if (error.code === 'auth/user-disabled') {
      message = 'Tu cuenta ha sido desactivada. Contacta al administrador.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Demasiados intentos fallidos. Intenta más tarde.';
    }
    return { success: false, error: message };
  }
}

/**
 * Cerrar sesión
 */
export async function logout() {
  try {
    const auth = initAuth();
    if (!auth) return { success: true };

    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return {
      success: false,
      error: 'Error al cerrar sesión',
    };
  }
}

/**
 * Enviar email de recuperación de contraseña
 */
export async function sendPasswordReset(email) {
  try {
    const auth = initAuth();
    if (!auth) throw new Error('Firebase Auth no está configurado');

    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: 'Email de recuperación enviado',
    };
  } catch (error) {
    console.error('Error al enviar email de recuperación:', error);

    let message = 'Error al enviar email de recuperación';
    if (error.code === 'auth/user-not-found') {
      message = 'No existe una cuenta con este email';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email inválido';
    }

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Cambiar contraseña (requiere que el usuario esté autenticado)
 */
export async function updatePassword(newPassword) {
  try {
    const auth = initAuth();
    if (!auth) throw new Error('Firebase Auth no está configurado');

    const user = auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    await firebaseUpdatePassword(user, newPassword);
    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);

    let message = 'Error al actualizar contraseña';
    if (error.code === 'auth/weak-password') {
      message = 'La contraseña debe tener al menos 6 caracteres';
    } else if (error.code === 'auth/requires-recent-login') {
      message = 'Por seguridad, debes volver a iniciar sesión';
    }

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Obtener usuario actual autenticado
 */
export function getCurrentAuthUser() {
  const auth = initAuth();
  return auth?.currentUser || null;
}

/**
 * Verificar si hay un usuario autenticado
 */
export function isAuthenticated() {
  const auth = initAuth();
  return !!auth?.currentUser;
}
