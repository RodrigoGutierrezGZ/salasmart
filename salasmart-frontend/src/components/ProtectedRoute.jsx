// src/components/ProtectedRoute.jsx

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // Importamos para escuchar cambios
import { Spinner } from 'react-bootstrap';

// Importamos TODOS los posibles destinos
import AdminPanel from './AdminPanel';
import TeacherDashboard from '../pages/TeacherDashboard';
import StudentDashboard from '../pages/StudentDashboard';

const ProtectedRoute = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es un "listener" que se activa
    // cada vez que un usuario inicia o cierra sesión.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Si hay un usuario, vamos a Firestore a buscar su rol
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          setRole(docSnap.data().role); // Guardamos el rol ('admin', 'docente' o 'estudiante')
        } else {
          // Caso borde: el usuario existe en Auth pero no en Firestore
          setRole(null); 
        }
      } else {
        // No hay usuario conectado
        setRole(null);
      }
      setLoading(false); // Terminamos de verificar
    });

    // Limpiamos el listener al desmontar el componente
    return () => unsubscribe();
  }, []);

  // Mientras verificamos, mostramos una pantalla de carga
  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Verificando...</p>
      </div>
    );
  }

  // Si después de verificar no hay rol (no está logueado), redirigimos al login
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  
  // ¡AQUÍ ESTÁ LA LÓGICA DE DECISIÓN!
  // Según el rol, devolvemos el componente correspondiente.
  switch (role) {
    case 'admin':
      return <AdminPanel />;
    case 'docente':
      return <TeacherDashboard />;
    case 'estudiante':
      return <StudentDashboard />;
    default:
      // Si el rol es desconocido o nulo, lo mandamos al login por seguridad
      return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;