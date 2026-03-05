import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getFirebaseApp, initFirebase } from './firebase';
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
 * Simulación de creación de Auth, ya que ahora 
 * el sistema guarda Clave+Usuario directamente en Firestore.
 */
export async function createUserWithPassword(email, password) {
  // Ahora Firebase Auth no se toca, el nuevo usuario
  // será registrado directamente como un documento más por el store.

  // Generamos un ID pseudo-aleatorio que simule el UID de Auth
  const mockUid = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    uid: mockUid,
    email: email,
  };
}

/**
 * Iniciar sesión con email y contraseña
 * [NUEVA LÓGICA] Consulta directamente a Firestore, sin validación en Auth
 */
export async function loginWithPassword(email, password) {
  try {
    const db = initFirebase();
    if (!db) throw new Error('Base de datos no inicializada');

    // Mantenemos la variable 'email' pero internamente verificamos
    // si el campo 'email' de Firestore coincide con la cadena provista,
    // o podríamos buscar por un nuevo campo 'username'.
    // Por simplicidad, el correo actual funcionará como el "Usuario".
    const q = query(
      collection(db, 'usuarios'),
      where('email', '==', email.trim()),
      where('password', '==', password)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Usuario o clave incorrectos.'
      };
    }

    // Como puede haber un solo usuario (esperemos), tomamos el primero
    let foundUser = null;
    let uid = null;
    querySnapshot.forEach((doc) => {
      foundUser = doc.data();
      uid = doc.id;
    });

    if (!foundUser.activo) {
      return {
        success: false,
        error: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      };
    }

    return {
      success: true,
      uid: uid,
      email: foundUser.email,
    };
  } catch (error) {
    console.error('Error al iniciar sesión con clave:', error);
    return {
      success: false,
      error: 'Error de red al consultar credenciales'
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
