/**
 * Servicio de autenticación centralizado
 * Maneja todas las operaciones de auth con Firebase
 */

import { auth, db } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Inicia sesión con email y contraseña
 */
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error.code)
    };
  }
}

/**
 * Registra un nuevo usuario
 */
export async function register(email, password, nombre, role = 'estudiante') {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar perfil con nombre
    await updateProfile(user, {
      displayName: nombre
    });

    // Crear documento en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      nombre: nombre,
      role: role,
      activo: true,
      fechaCreacion: new Date()
    });

    return {
      success: true,
      user: user
    };
  } catch (error) {
    console.error('Error en registro:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error.code)
    };
  }
}

/**
 * Cierra sesión
 */
export async function logout() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return {
      success: false,
      error: 'Error al cerrar sesión'
    };
  }
}

/**
 * Obtiene el usuario actual
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Obtiene los datos del usuario desde Firestore
 */
export async function getUserData(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        success: true,
        data: userDoc.data()
      };
    } else {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return {
      success: false,
      error: 'Error al obtener datos del usuario'
    };
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated() {
  return auth.currentUser !== null;
}

/**
 * Traduce códigos de error de Firebase a mensajes legibles
 */
function getAuthErrorMessage(errorCode) {
  const errorMessages = {
    'auth/invalid-email': 'El email no es válido',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/user-not-found': 'No existe una cuenta con este email',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    'auth/invalid-credential': 'Credenciales inválidas'
  };

  return errorMessages[errorCode] || 'Error de autenticación';
}
