import { initFirebase } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { DEFAULT_PERMISSIONS, ROLES } from '../types/user';

const COLLECTION_NAME = 'users';

/**
 * Obtener todos los usuarios
 */
export const getAllUsers = async () => {
  const db = initFirebase();
  if (!db) throw new Error('Firebase no configurado');

  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  const users = [];
  snapshot.forEach(doc => {
    users.push({ uid: doc.id, ...doc.data() });
  });

  return users;
};

/**
 * Obtener usuario por email
 */
export const getUserByEmail = async (email) => {
  const db = initFirebase();
  if (!db) throw new Error('Firebase no configurado');

  const q = query(collection(db, COLLECTION_NAME), where('email', '==', email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { uid: doc.id, ...doc.data() };
};

/**
 * Obtener usuario por UID
 */
export const getUserByUid = async (uid) => {
  const db = initFirebase();
  if (!db) throw new Error('Firebase no configurado');

  const docRef = doc(db, COLLECTION_NAME, uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { uid: docSnap.id, ...docSnap.data() };
};

/**
 * Crear nuevo usuario
 */
export const createUser = async (userData, createdBy, authUid = null) => {
  const db = initFirebase();
  if (!db) throw new Error('Firebase no configurado');

  // Verificar si el email ya existe
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Ya existe un usuario con este email');
  }

  // Si se proporciona authUid (de Firebase Auth), usarlo; si no, generar uno custom
  const uid = authUid || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const now = new Date().toISOString();

  const newUser = {
    email: userData.email,
    nombre: userData.nombre,
    foto: userData.foto || null,
    rol: userData.rol || ROLES.VIEWER,
    permisos: userData.permisos || DEFAULT_PERMISSIONS[userData.rol || ROLES.VIEWER],
    authType: userData.authType || 'google_oauth', // 'google_oauth' o 'email_password'
    activo: true,
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy,
    ultimoAcceso: null,
  };

  await setDoc(doc(db, COLLECTION_NAME, uid), newUser);

  return { uid, ...newUser };
};

/**
 * Actualizar usuario
 */
export const updateUser = async (uid, updates) => {
  const db = initFirebase();
  if (!db) throw new Error('Firebase no configurado');

  const userRef = doc(db, COLLECTION_NAME, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('Usuario no encontrado');
  }

  const updatedData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(userRef, updatedData);

  return { uid, ...userSnap.data(), ...updatedData };
};

/**
 * Actualizar último acceso del usuario
 */
export const updateLastAccess = async (uid) => {
  const db = initFirebase();
  if (!db) throw new Error('Firebase no configurado');

  const userRef = doc(db, COLLECTION_NAME, uid);

  await updateDoc(userRef, {
    ultimoAcceso: new Date().toISOString(),
  });
};

/**
 * Activar/Desactivar usuario
 */
export const toggleUserStatus = async (uid, activo) => {
  return updateUser(uid, { activo });
};

/**
 * Eliminar usuario
 */
export const deleteUser = async (uid) => {
  const db = initFirebase();
  if (!db) throw new Error('Firebase no configurado');

  await deleteDoc(doc(db, COLLECTION_NAME, uid));

  return true;
};

/**
 * Actualizar permisos de usuario
 */
export const updateUserPermissions = async (uid, permisos) => {
  return updateUser(uid, { permisos });
};

/**
 * Verificar si un email está autorizado
 */
export const isEmailAuthorized = async (email) => {
  const user = await getUserByEmail(email);
  return user && user.activo;
};

/**
 * Obtener usuarios activos
 */
export const getActiveUsers = async () => {
  const db = initFirebase();
  if (!db) throw new Error('Firebase no configurado');

  const q = query(
    collection(db, COLLECTION_NAME),
    where('activo', '==', true),
    orderBy('nombre')
  );
  const snapshot = await getDocs(q);

  const users = [];
  snapshot.forEach(doc => {
    users.push({ uid: doc.id, ...doc.data() });
  });

  return users;
};
