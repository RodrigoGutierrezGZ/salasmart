/**
 * Utilidad para generar emails institucionales automáticos
 * Formato: nombre.apellido@inacap.cl
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Genera un email institucional a partir del nombre completo
 * @param {string} nombreCompleto - Nombre completo del usuario (ej: "Juan Pérez García")
 * @returns {Promise<string>} Email generado (ej: "juan.perez@inacap.cl" o "juan.perez2@inacap.cl")
 */
export async function generarEmailInstitucional(nombreCompleto) {
  // Limpiar y normalizar el nombre
  const nombreLimpio = nombreCompleto
    .trim()
    .toLowerCase()
    .normalize('NFD') // Separar caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z\s]/g, ''); // Solo letras y espacios

  // Separar en partes
  const partes = nombreLimpio.split(/\s+/);

  if (partes.length < 2) {
    throw new Error('Debe ingresar al menos nombre y apellido');
  }

  // Tomar primer nombre y primer apellido
  const nombre = partes[0];
  const apellido = partes[1];

  // Generar email base
  const emailBase = `${nombre}.${apellido}`;

  // Verificar si ya existe
  const emailExiste = await verificarEmailExiste(`${emailBase}@inacap.cl`);

  if (!emailExiste) {
    return `${emailBase}@inacap.cl`;
  }

  // Si existe, buscar el próximo número disponible
  let numero = 2;
  let emailConNumero;

  do {
    emailConNumero = `${emailBase}${numero}@inacap.cl`;
    const existe = await verificarEmailExiste(emailConNumero);

    if (!existe) {
      return emailConNumero;
    }

    numero++;
  } while (numero < 100); // Límite de seguridad

  throw new Error('No se pudo generar un email único. Contacte al administrador.');
}

/**
 * Verifica si un email ya existe en la base de datos
 * @param {string} email - Email a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
async function verificarEmailExiste(email) {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    const snapshot = await getDocs(usersQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error verificando email:', error);
    return false;
  }
}

/**
 * Extrae nombre y apellido del nombre completo
 * @param {string} nombreCompleto - Nombre completo
 * @returns {{nombre: string, apellido: string}}
 */
export function extraerNombreApellido(nombreCompleto) {
  const partes = nombreCompleto.trim().split(/\s+/);

  if (partes.length === 1) {
    return { nombre: partes[0], apellido: '' };
  }

  // Primer parte = nombre, resto = apellidos
  const nombre = partes[0];
  const apellido = partes.slice(1).join(' ');

  return { nombre, apellido };
}
