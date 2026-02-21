import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { getFirebaseApp } from './firebase';

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
 * Crear usuario con email y contraseña en Firebase Auth
 */
export async function createUserWithPassword(email, password) {
  try {
    const auth = initAuth();
    if (!auth) throw new Error('Firebase Auth no está configurado');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    };
  } catch (error) {
    console.error('Error al crear usuario:', error);

    // Mensajes de error traducidos
    let message = 'Error al crear usuario';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Este email ya está registrado';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email inválido';
    } else if (error.code === 'auth/weak-password') {
      message = 'La contraseña debe tener al menos 6 caracteres';
    } else if (error?.message?.includes('api-key-not-valid')) {
      message = 'La API Key de Firebase es inválida o no está configurada por este usuario de Firefox. Revise Configuración > Sistema.';
    }

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Iniciar sesión con email y contraseña
 */
export async function loginWithPassword(email, password) {
  try {
    const auth = initAuth();
    if (!auth) throw new Error('Firebase Auth no está configurado');

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    };
  } catch (error) {
    console.error('Error al iniciar sesión:', error);

    let message = 'Error al iniciar sesión';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      message = 'Email o contraseña incorrectos';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email inválido';
    } else if (error.code === 'auth/user-disabled') {
      message = 'Esta cuenta ha sido desactivada';
    }

    return {
      success: false,
      error: message,
    };
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
