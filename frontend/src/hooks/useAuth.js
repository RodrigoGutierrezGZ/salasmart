// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Caché de sesión para evitar re-fetching innecesario
const SESSION_CACHE_KEY = 'salasmart_user_cache';

// Función para obtener caché de sesión
const getSessionCache = () => {
  try {
    const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

// Función para guardar en caché de sesión
const setSessionCache = (data) => {
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignorar errores de sessionStorage
  }
};

// Función para limpiar caché
const clearSessionCache = () => {
  try {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // Ignorar errores
  }
};

export function useAuth() {
  // Intentar cargar desde caché inicialmente para evitar flash
  const cache = getSessionCache();

  const [user, setUser] = useState(cache?.user || null);
  const [role, setRole] = useState(cache?.role || null);
  const [loading, setLoading] = useState(!cache); // Si hay caché, no loading
  const [userData, setUserData] = useState(cache?.userData || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setRole(data.role);
          setUserData(data);

          // Guardar en caché para navegación instantánea
          setSessionCache({
            user: {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
            },
            role: data.role,
            userData: data,
          });
        } else {
          setRole(null);
          setUserData(null);
          clearSessionCache();
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
        setUserData(null);
        clearSessionCache();
      }

      // Sin delay artificial - actualización instantánea
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { user, role, loading, userData };
}