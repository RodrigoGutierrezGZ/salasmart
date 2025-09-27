// src/App.jsx
import { useState, useEffect } from 'react';
import { db } from './firebase/config'; // Importamos nuestra conexión a la BD
import { collection, getDocs } from 'firebase/firestore'; // Funciones de Firebase

function App() {
  const [salas, setSalas] = useState([]); // Estado para guardar las salas
  const [loading, setLoading] = useState(true); // Estado para mostrar un mensaje de carga

  // useEffect se ejecuta cuando el componente se monta por primera vez
  useEffect(() => {
    const fetchSalas = async () => {
      try {
        // 1. Apuntamos a la colección 'salas'
        const salasCollection = collection(db, 'salas');
        // 2. Obtenemos todos los documentos de esa colección
        const snapshot = await getDocs(salasCollection);
        // 3. Mapeamos los resultados a un formato más limpio
        const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // 4. Actualizamos nuestro estado con los datos
        setSalas(salasData);
      } catch (error) {
        console.error("Error al obtener las salas: ", error);
      } finally {
        setLoading(false); // Dejamos de cargar, ya sea con éxito o error
      }
    };

    fetchSalas(); // Ejecutamos la función
  }, []); // El array vacío [] asegura que esto solo se ejecute una vez

  return (
    <div>
      <h1>Sistema de Salas - SalaSmart</h1>
      <h2>Salas Disponibles en Firestore:</h2>
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