// src/App.jsx
import { useState, useEffect } from 'react';
import { db } from './firebase/config';
import { collection, getDocs, onSnapshot } from 'firebase/firestore'; // Importamos onSnapshot
import AdminPanel from './components/AdminPanel'; // Importamos el nuevo componente

function App() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Usaremos onSnapshot para escuchar cambios en tiempo real
  useEffect(() => {
    const salasCollection = collection(db, 'salas');

    // onSnapshot es un listener. Cada vez que algo cambia en la colección,
    // esta función se ejecuta de nuevo con los datos actualizados.
    const unsubscribe = onSnapshot(salasCollection, (snapshot) => {
      const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalas(salasData);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener las salas en tiempo real: ", error);
      setLoading(false);
    });

    // La función de limpieza se ejecuta cuando el componente se desmonta.
    // Es importante para detener el listener y evitar fugas de memoria.
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Sistema de Salas - SalaSmart</h1>
      
      {/* Aquí integramos el panel de administración */}
      <AdminPanel />

      <hr />
      <h2>Salas Existentes en Firestore (en Tiempo Real):</h2>
      {loading ? (
        <p>Cargando salas...</p>
      ) : (
        <ul>
          {salas.map(sala => (
            <li key={sala.id}>
              <strong>Sala:</strong> {sala.nombre} - <strong>Piso:</strong> {sala.piso} - <strong>Capacidad:</strong> {sala.capacidad}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;