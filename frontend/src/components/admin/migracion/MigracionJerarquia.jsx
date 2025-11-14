// src/components/MigracionJerarquia.jsx

import React, { useState } from 'react';
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';

/**
 * Componente para migrar datos existentes a la nueva estructura jerárquica
 *
 * EJECUTAR SOLO UNA VEZ después de implementar el sistema jerárquico
 *
 * Flujo:
 * 1. Crea sede por defecto "INACAP Renca"
 * 2. Crea edificio por defecto "Edificio Principal"
 * 3. Crea 4 pisos y sube imágenes a Storage
 * 4. Migra todas las salas existentes vinculándolas a pisos
 */
function MigracionJerarquia() {
  const [estado, setEstado] = useState('idle'); // idle, migrando, completado, error
  const [progreso, setProgreso] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    salasAntes: 0,
    salasMigradas: 0,
    pisosCreados: 0,
    imagenesSubidas: 0
  });

  const agregarProgreso = (mensaje, tipo = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setProgreso(prev => [...prev, { mensaje, tipo, timestamp }]);
    console.log(`[${timestamp}] ${tipo.toUpperCase()}: ${mensaje}`);
  };

  /**
   * Obtener ruta local de imagen desde public/planos/
   * NOTA: Sin Firebase Storage, usamos rutas locales directamente
   */
  const obtenerRutaImagenPiso = (numeroPiso) => {
    return `/planos/piso${numeroPiso}.jpg`;
  };

  /**
   * PASO 1: Crear sede por defecto
   */
  const crearSedeDefault = async () => {
    agregarProgreso('📍 Creando sede por defecto...', 'info');

    const sedeId = 'sede_renca'; // ID fijo para facilitar referencias
    const sedeData = {
      nombre: 'INACAP Renca',
      codigo: 'RENCA',
      direccion: 'Av. Departamental 233, Renca',
      activa: true,
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now()
    };

    await setDoc(doc(db, 'sedes', sedeId), sedeData);
    agregarProgreso('✅ Sede "INACAP Renca" creada', 'success');

    return sedeId;
  };

  /**
   * PASO 2: Crear edificio por defecto
   */
  const crearEdificioDefault = async (sedeId) => {
    agregarProgreso('🏢 Creando edificio por defecto...', 'info');

    const edificioId = 'edificio_principal';
    const edificioData = {
      nombre: 'Edificio Principal',
      codigo: 'PRINCIPAL',
      sedeId: sedeId,
      sedeCodigo: 'RENCA',
      sedeNombre: 'INACAP Renca',
      descripcion: 'Edificio principal del campus',
      activo: true,
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now()
    };

    await setDoc(doc(db, 'edificios', edificioId), edificioData);
    agregarProgreso('✅ Edificio "Principal" creado', 'success');

    return edificioId;
  };

  /**
   * PASO 3: Crear pisos con rutas locales de imágenes
   * NOTA: Sin Firebase Storage - usamos rutas locales desde public/planos/
   */
  const crearPisosConImagenes = async (sedeId, edificioId) => {
    agregarProgreso('🏗️ Creando 4 pisos con rutas de imágenes locales...', 'info');

    const pisosIds = {};
    let imagenesConfiguradas = 0;

    for (let numeroPiso = 1; numeroPiso <= 4; numeroPiso++) {
      const pisoId = `piso${numeroPiso}_principal`;

      agregarProgreso(`   → Procesando Piso ${numeroPiso}...`, 'info');

      // Obtener ruta local de imagen
      const imagenURL = obtenerRutaImagenPiso(numeroPiso);
      const imagenPath = imagenURL; // Mismo valor para rutas locales
      const imagenMetadata = {
        nombre: `piso${numeroPiso}.jpg`,
        tipo: 'local', // Indica que es ruta local, no de Storage
        fechaCreacion: Timestamp.now()
      };

      imagenesConfiguradas++;
      agregarProgreso(`   ✅ Ruta imagen Piso ${numeroPiso} configurada: ${imagenURL}`, 'success');

      // Crear documento del piso
      const pisoData = {
        numero: numeroPiso,
        edificioId: edificioId,
        edificioCodigo: 'PRINCIPAL',
        edificioNombre: 'Edificio Principal',
        sedeId: sedeId,
        sedeCodigo: 'RENCA',
        nombreCompleto: `Piso ${numeroPiso} - Edificio Principal - INACAP Renca`,
        imagenURL,
        imagenPath,
        imagenMetadata,
        activo: true,
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now()
      };

      await setDoc(doc(db, 'pisos', pisoId), pisoData);
      pisosIds[numeroPiso] = pisoId;
      agregarProgreso(`   ✅ Piso ${numeroPiso} creado en Firestore`, 'success');
    }

    setEstadisticas(prev => ({
      ...prev,
      pisosCreados: 4,
      imagenesSubidas: imagenesConfiguradas
    }));

    agregarProgreso('✅ 4 pisos creados exitosamente con imágenes locales', 'success');
    return pisosIds;
  };

  /**
   * PASO 4: Migrar salas existentes
   */
  const migrarSalasExistentes = async (sedeId, edificioId, pisosIds) => {
    agregarProgreso('🚪 Migrando salas existentes...', 'info');

    // Obtener todas las salas actuales
    const salasSnap = await getDocs(collection(db, 'salas'));
    const salasExistentes = salasSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setEstadisticas(prev => ({ ...prev, salasAntes: salasExistentes.length }));
    agregarProgreso(`   → Encontradas ${salasExistentes.length} salas para migrar`, 'info');

    let salasMigradas = 0;

    for (const sala of salasExistentes) {
      // Si la sala ya tiene pisoId (ya está migrada), saltar
      if (sala.pisoId) {
        agregarProgreso(`   ⏭️ Sala ${sala.nombre} ya migrada, omitiendo`, 'info');
        continue;
      }

      // Obtener el número de piso de la sala (campo antiguo)
      const numeroPiso = sala.piso || 1; // Default piso 1 si no tiene

      // Verificar que el piso exista en pisosIds
      if (!pisosIds[numeroPiso]) {
        agregarProgreso(`   ⚠️ Sala ${sala.nombre} tiene piso ${numeroPiso} inválido, asignando a Piso 1`, 'warning');
      }

      const pisoId = pisosIds[numeroPiso] || pisosIds[1];

      // Actualizar sala con nueva estructura
      const salaActualizada = {
        ...sala,
        // Nueva jerarquía
        pisoId: pisoId,
        pisoNumero: numeroPiso,
        edificioId: edificioId,
        edificioCodigo: 'PRINCIPAL',
        sedeId: sedeId,
        sedeCodigo: 'RENCA',
        nombreCompleto: `${sala.nombre} - Piso ${numeroPiso} - Edificio Principal - INACAP Renca`,
        fechaActualizacion: Timestamp.now()
      };

      await setDoc(doc(db, 'salas', sala.id), salaActualizada);
      salasMigradas++;
      agregarProgreso(`   ✅ Sala ${sala.nombre} migrada (Piso ${numeroPiso})`, 'success');
    }

    setEstadisticas(prev => ({ ...prev, salasMigradas }));
    agregarProgreso(`✅ ${salasMigradas} salas migradas exitosamente`, 'success');
  };

  /**
   * Ejecutar migración completa
   */
  const ejecutarMigracion = async () => {
    if (estado === 'migrando') return;

    const confirmar = window.confirm(
      '⚠️ MIGRACIÓN A ESTRUCTURA JERÁRQUICA\n\n' +
      'Esta operación va a:\n' +
      '1. Crear sede "INACAP Renca"\n' +
      '2. Crear edificio "Edificio Principal"\n' +
      '3. Crear 4 pisos con rutas de imágenes locales\n' +
      '4. Migrar todas las salas existentes\n\n' +
      'NOTA: Las imágenes se mantienen en public/planos/ (sin Storage)\n\n' +
      '¿Deseas continuar?'
    );

    if (!confirmar) return;

    setEstado('migrando');
    setProgreso([]);
    setEstadisticas({
      salasAntes: 0,
      salasMigradas: 0,
      pisosCreados: 0,
      imagenesSubidas: 0
    });

    try {
      agregarProgreso('🚀 Iniciando migración...', 'info');
      agregarProgreso('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

      // PASO 1: Crear sede
      const sedeId = await crearSedeDefault();
      agregarProgreso('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

      // PASO 2: Crear edificio
      const edificioId = await crearEdificioDefault(sedeId);
      agregarProgreso('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

      // PASO 3: Crear pisos con imágenes
      const pisosIds = await crearPisosConImagenes(sedeId, edificioId);
      agregarProgreso('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

      // PASO 4: Migrar salas
      await migrarSalasExistentes(sedeId, edificioId, pisosIds);
      agregarProgreso('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

      agregarProgreso('🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE', 'success');
      agregarProgreso('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
      agregarProgreso('✅ Puedes verificar en Firebase Console:', 'info');
      agregarProgreso('   • Firestore → sedes, edificios, pisos, salas', 'info');
      agregarProgreso('   • Imágenes → public/planos/ (rutas locales)', 'info');

      setEstado('completado');
    } catch (error) {
      agregarProgreso(`❌ ERROR EN MIGRACIÓN: ${error.message}`, 'error');
      console.error('Error completo:', error);
      setEstado('error');
    }
  };

  const getColorTipo = (tipo) => {
    switch (tipo) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-700';
    }
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined">upgrade</span>
          Migración a Estructura Jerárquica
        </h2>
        <p className="text-blue-100">
          Convierte tus datos actuales al nuevo sistema Sede → Edificio → Piso → Salas
        </p>
      </div>

      {/* Estadísticas */}
      {estadisticas.salasAntes > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{estadisticas.salasAntes}</div>
            <div className="text-sm text-gray-600">Salas Existentes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{estadisticas.salasMigradas}</div>
            <div className="text-sm text-gray-600">Salas Migradas</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{estadisticas.pisosCreados}</div>
            <div className="text-sm text-gray-600">Pisos Creados</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{estadisticas.imagenesSubidas}</div>
            <div className="text-sm text-gray-600">Imágenes Configuradas</div>
          </div>
        </div>
      )}

      {/* Botón de acción */}
      <div className="text-center mb-6">
        <button
          onClick={ejecutarMigracion}
          disabled={estado === 'migrando' || estado === 'completado'}
          className={`px-8 py-3 rounded-lg font-bold text-white text-lg shadow-lg transition-all ${
            estado === 'migrando'
              ? 'bg-gray-400 cursor-not-allowed'
              : estado === 'completado'
              ? 'bg-green-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl transform hover:-translate-y-1'
          }`}
        >
          {estado === 'idle' && '🚀 Iniciar Migración'}
          {estado === 'migrando' && (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Migrando...
            </>
          )}
          {estado === 'completado' && '✅ Migración Completada'}
          {estado === 'error' && '❌ Error en Migración'}
        </button>
      </div>

      {/* Log de progreso */}
      {progreso.length > 0 && (
        <div className="bg-gray-900 text-gray-100 rounded-lg shadow-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
            <h3 className="font-bold text-green-400">📋 Log de Migración</h3>
            <span className="text-gray-400 text-xs">{progreso.length} entradas</span>
          </div>
          {progreso.map((log, index) => (
            <div key={index} className={`py-1 ${getColorTipo(log.tipo)}`}>
              <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
              <span className={`material-symbols-outlined text-xs align-middle mr-1 ${getColorTipo(log.tipo)}`}>
                {getIconoTipo(log.tipo)}
              </span>
              {log.mensaje}
            </div>
          ))}
        </div>
      )}

      {/* Advertencias */}
      {estado === 'idle' && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            Importante antes de migrar
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Esta operación solo debe ejecutarse <strong>UNA VEZ</strong></li>
            <li>• Asegúrate de tener las imágenes en <code>public/planos/</code> (piso1.jpg, piso2.jpg, piso3.jpg, piso4.jpg)</li>
            <li>• Las imágenes se guardarán como rutas locales (sin Firebase Storage)</li>
            <li>• Se recomienda hacer un backup de Firestore antes de proceder</li>
            <li>• Las salas existentes NO se eliminarán, solo se actualizarán</li>
          </ul>
        </div>
      )}

      {estado === 'completado' && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span>
            ¿Qué sigue?
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Verifica en Firebase Console que todo se creó correctamente</li>
            <li>• Verifica que las imágenes en public/planos/ se visualizan correctamente</li>
            <li>• Puedes navegar por la aplicación y verificar que todo funciona</li>
            <li>• Las Firestore Rules ya están actualizadas</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default MigracionJerarquia;
