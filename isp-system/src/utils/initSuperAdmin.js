import { initFirebase } from '../api/firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { DEFAULT_PERMISSIONS, ROLES } from '../types/user';

/**
 * Script para crear el primer usuario SUPER_ADMIN en Firebase
 * Se ejecuta automáticamente si no hay usuarios en el sistema
 */

// Configuración del primer usuario (MODIFICA ESTO CON TUS DATOS)
const FIRST_SUPER_ADMIN = {
  email: 'fernandodiazm.5@gmail.com',
  nombre: 'Fernando Diaz',
};

/**
 * Verifica si ya existen usuarios en Firebase
 */
async function checkUsersExist() {
  try {
    const db = initFirebase();
    if (!db) return true; // Si no hay Firebase, asumir que ya existe

    const usersSnapshot = await getDocs(collection(db, 'users'));
    return !usersSnapshot.empty;
  } catch (error) {
    console.error('Error verificando usuarios:', error);
    return true; // En caso de error, no crear usuario
  }
}

/**
 * Crea el primer usuario SUPER_ADMIN automáticamente
 */
async function autoCreateFirstAdmin() {
  try {
    const usersExist = await checkUsersExist();

    if (usersExist) {
      console.log('ℹ️ Ya existen usuarios en el sistema. No se creará usuario automático.');
      return { success: false, reason: 'users_exist' };
    }

    console.log('🔧 No se encontraron usuarios. Creando primer SUPER_ADMIN...');

    const db = initFirebase();
    if (!db) {
      console.error('❌ Firebase no configurado');
      return { success: false, reason: 'firebase_error' };
    }

    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const superAdminUser = {
      email: FIRST_SUPER_ADMIN.email.toLowerCase().trim(),
      nombre: FIRST_SUPER_ADMIN.nombre,
      foto: null,
      rol: ROLES.SUPER_ADMIN,
      permisos: { ...DEFAULT_PERMISSIONS[ROLES.SUPER_ADMIN] },
      activo: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'auto_init',
      ultimoAcceso: null,
    };

    await setDoc(doc(db, 'users', uid), superAdminUser);

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ¡USUARIO SUPER_ADMIN CREADO AUTOMÁTICAMENTE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Email:', FIRST_SUPER_ADMIN.email);
    console.log('👤 Nombre:', FIRST_SUPER_ADMIN.nombre);
    console.log('🔑 UID:', uid);
    console.log('🎭 Rol: SUPER_ADMIN (Acceso Total)');
    console.log('');
    console.log('🎉 Ahora puedes iniciar sesión con tu cuenta de Google');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    return { success: true, uid, email: FIRST_SUPER_ADMIN.email, nombre: FIRST_SUPER_ADMIN.nombre };
  } catch (error) {
    console.error('❌ Error al crear usuario automático:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Función manual para crear usuarios adicionales
 */
export async function initSuperAdmin(email, nombre) {
  if (!email || !nombre) {
    console.error('❌ Error: Debes proporcionar email y nombre');
    console.log('Uso: initSuperAdmin("tu-email@gmail.com", "Tu Nombre")');
    return;
  }

  try {
    const db = initFirebase();
    if (!db) {
      console.error('❌ Firebase no está configurado correctamente');
      return;
    }

    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const superAdminUser = {
      email: email.toLowerCase().trim(),
      nombre: nombre,
      foto: null,
      rol: ROLES.SUPER_ADMIN,
      permisos: { ...DEFAULT_PERMISSIONS[ROLES.SUPER_ADMIN] },
      activo: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'manual_init',
      ultimoAcceso: null,
    };

    await setDoc(doc(db, 'users', uid), superAdminUser);

    console.log('✅ ¡Usuario SUPER_ADMIN creado exitosamente!');
    console.log('📧 Email:', email);
    console.log('👤 Nombre:', nombre);
    console.log('🔑 UID:', uid);
    console.log('');
    console.log('🎉 Ahora puedes iniciar sesión con tu cuenta de Google usando el email:', email);

    return { success: true, uid, email, nombre };
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Función para verificar usuarios existentes en Firebase
 */
export async function checkUsers() {
  try {
    const db = initFirebase();
    if (!db) {
      console.error('❌ Firebase no está configurado');
      return;
    }

    const usersSnapshot = await getDocs(collection(db, 'users'));

    if (usersSnapshot.empty) {
      console.log('📋 No hay usuarios en Firebase');
      return [];
    }

    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ uid: doc.id, ...doc.data() });
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📋 USUARIOS EN FIREBASE (${users.length} total)`);
    console.log('═══════════════════════════════════════════════════════');
    users.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.nombre}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 UID: ${user.uid}`);
      console.log(`   🎭 Rol: ${user.rol}`);
      console.log(`   ${user.activo ? '✅' : '🚫'} Activo: ${user.activo}`);
      console.log(`   📅 Creado: ${user.createdAt}`);
    });
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    return users;
  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
    return null;
  }
}

// ==================== AUTO-INICIALIZACIÓN ====================
// Ejecutar automáticamente en desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Exponer funciones globalmente para uso manual
  window.initSuperAdmin = initSuperAdmin;
  window.checkUsers = checkUsers;

  // Esperar a que Firebase esté listo y ejecutar auto-creación
  setTimeout(() => {
    autoCreateFirstAdmin().catch(err => {
      console.error('Error en auto-inicialización:', err);
    });
  }, 2000); // Esperar 2 segundos para que Firebase se inicialice

  console.log('🔧 Modo desarrollo: Auto-inicialización activa');
  console.log('💡 Comandos disponibles:');
  console.log('   • checkUsers() - Ver todos los usuarios en Firebase');
  console.log('   • initSuperAdmin("email@gmail.com", "Nombre") - Crear usuario manualmente');
}
