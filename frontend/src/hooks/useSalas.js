// src/hooks/useSalas.js

import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { calcularEstadoSala } from '../utils/estadoSala';

/**
 * Hook personalizado para obtener la lista de salas con su estado de disponibilidad en tiempo real.
 *
 * MEJORADO: Ahora calcula 3 estados (VERDE/AMARILLO/ROJO) en lugar de 2
 *
 * @returns {{
 *   salas: Array<object>,
 *   loading: boolean,
 *   error: string | null
 * }}
 */
export function useSalas() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeReservas = null;
    
    const salasCollection = collection(db, 'salas');
    const reservasCollection = collection(db, 'reservas');

    // Escuchamos los cambios en la colección de salas.
    const unsubscribeSalas = onSnapshot(salasCollection, (salasSnapshot) => {
      const salasData = salasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // SIMPLIFICADO: Traemos todas las reservas y filtramos en el frontend
      // Esto evita necesidad de índices compuestos
      unsubscribeReservas = onSnapshot(reservasCollection, (reservasSnapshot) => {
        const ahora = new Date();
        
        // Filtrar en el frontend: solo reservas activas que no han terminado
        const reservasActivas = reservasSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(reserva => {
            if (reserva.estado !== 'activa') return false;
            const horaFin = reserva.horaFin?.toDate();
            return horaFin && horaFin > ahora;
          });

        // ⭐ MEJORADO: Ahora calculamos estados con lógica VERDE/AMARILLO/ROJO
        const salasConEstado = salasData.map(sala => {
          // Filtrar solo las reservas de esta sala
          const reservasDeLaSala = reservasActivas.filter(
            reserva => reserva.salaId === sala.id
          );

          // Calcular el estado usando la lógica completa
          const estadoCalculado = calcularEstadoSala(reservasDeLaSala, new Date());

          return {
            ...sala,
            ...estadoCalculado,  // Incluye: estado, color, texto, textoSecundario, reservaActual, proximaReserva
          };
        });

        setSalas(salasConEstado);
        setLoading(false);
      }, (err) => {
        console.error("Error al obtener reservas: ", err);
        setError('No se pudieron cargar las reservas.');
        setLoading(false);
      });

    }, (err) => {
      console.error("Error al obtener salas: ", err);
      setError('No se pudieron cargar las salas.');
      setLoading(false);
    });

    // Limpiamos ambos listeners al desmontar.
    return () => {
      if (unsubscribeReservas) {
        unsubscribeReservas();
      }
      unsubscribeSalas();
    };
  }, []); // El array vacío asegura que este efecto solo se ejecute una vez.

  return { salas, loading, error };
}
