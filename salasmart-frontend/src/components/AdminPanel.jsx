// src/components/AdminPanel.jsx
import React, { useState } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

function AdminPanel() {
  // Estados para cada campo del formulario
  const [salaId, setSalaId] = useState('');
  const [piso, setPiso] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Función que se ejecuta al enviar el formulario
  const handleCreateSala = async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    if (!salaId || !piso || !capacidad) {
      setMessage('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Creamos una referencia al documento con el ID que proporcionamos (ej. "A310")
      const salaRef = doc(db, 'salas', salaId);
      
      // Creamos el objeto con los datos de la nueva sala
      const nuevaSalaData = {
        nombre: salaId,
        piso: Number(piso),
        capacidad: Number(capacidad),
        equipamiento: ["Proyector", "Pizarra"] // Equipamiento por defecto
      };

      // Usamos setDoc para guardar el documento. Si ya existe un doc con ese ID, lo sobrescribirá.
      await setDoc(salaRef, nuevaSalaData);

      setMessage(`¡Sala ${salaId} creada exitosamente!`);
      // Limpiamos el formulario
      setSalaId('');
      setPiso('');
      setCapacidad('');
    } catch (error) {
      console.error("Error al crear la sala: ", error);
      setMessage("Hubo un error al crear la sala. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px' }}>
      <h2>Panel de Administración - Crear Sala</h2>
      <form onSubmit={handleCreateSala}>
        <div>
          <label>ID de la Sala (ej. A310): </label>
          <input 
            type="text" 
            value={salaId} 
            onChange={(e) => setSalaId(e.target.value)} 
            placeholder="ID único de la sala"
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Piso: </label>
          <input 
            type="number" 
            value={piso} 
            onChange={(e) => setPiso(e.target.value)} 
            placeholder="Número del piso"
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Capacidad: </label>
          <input 
            type="number" 
            value={capacidad} 
            onChange={(e) => setCapacidad(e.target.value)} 
            placeholder="Número de asientos"
          />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
          {loading ? 'Creando...' : 'Crear Sala'}
        </button>
      </form>
      {message && <p style={{ color: message.includes('error') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}

export default AdminPanel;