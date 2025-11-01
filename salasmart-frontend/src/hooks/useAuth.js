// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null); // NUEVO: al final para no romper orden

  useEffect(() => {
    let timeoutId;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const startTime = Date.now();
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setRole(data.role);
          setUserData(data); // Guardar todos los datos
        } else {
          setRole(null);
          setUserData(null);
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
        setUserData(null);
      }
      
      // Delay mínimo de 500ms para evitar "flashes"
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);
      
      timeoutId = setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { user, role, loading, userData }; // userData al final
}