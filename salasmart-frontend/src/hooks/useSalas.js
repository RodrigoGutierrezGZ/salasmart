// src/hooks/useSalas.js

import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';

/**
 * Hook personalizado para obtener la lista de salas y su estado de disponibilidad en tiempo real.
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
    const salasCollection = collection(db, 'salas');
    const reservasCollection = collection(db, 'reservas');

    // Escuchamos los cambios en la colección de salas.
    const unsubscribeSalas = onSnapshot(salasCollection, (salasSnapshot) => {
      const salasData = salasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Para optimizar, solo consultamos reservas que aún no han terminado.
      const ahora = Timestamp.now();
      const q = query(
        reservasCollection,
        where('horaFin', '>', ahora)
      );

      // Creamos un listener anidado para las reservas.
      // Esto asegura que si se crea una nueva reserva, el estado de las salas se recalcula.
      const unsubscribeReservas = onSnapshot(q, (reservasSnapshot) => {
        const reservasActivas = reservasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Combinamos los datos: por cada sala, verificamos si tiene una reserva activa en este momento.
        const salasConEstado = salasData.map(sala => {
          const reservaActual = reservasActivas.find(reserva => 
            reserva.salaId === sala.id &&
            reserva.horaInicio.toMillis() <= ahora.toMillis()
          );
          
          return {
            ...sala,
            estado: reservaActual ? 'Ocupado' : 'Disponible',
            reservaActual: reservaActual || null
          };
        });

        setSalas(salasConEstado);
        setLoading(false);
      }, (err) => {
        console.error("Error al obtener reservas: ", err);
        setError('No se pudieron cargar las reservas.');
        setLoading(false);
      });

      // Importante: Devolvemos el listener de reservas para que se limpie si las salas cambian.
      return () => unsubscribeReservas();

    }, (err) => {
      console.error("Error al obtener salas: ", err);
      setError('No se pudieron cargar las salas.');
      setLoading(false);
    });

    // Limpiamos el listener principal al desmontar.
    return () => unsubscribeSalas();
  }, []); // El array vacío asegura que este efecto solo se ejecute una vez.

  return { salas, loading, error };
}