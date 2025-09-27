// src/components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

function AdminPanel() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Estados para el formulario ---
  // Guardamos el ID del documento que estamos editando. null si estamos creando.
  const [editingId, setEditingId] = useState(null); // <-- CAMBIO CLAVE
  
  // Estados para los campos del formulario
  const [nombreSala, setNombreSala] = useState('');
  const [piso, setPiso] = useState('');
  const [capacidad, setCapacidad] = useState('');
  
  const [message, setMessage] = useState('');

  // --- EFECTO PARA LEER SALAS EN TIEMPO REAL (Read) ---
  useEffect(() => {
    const salasCollection = collection(db, 'salas');
    const unsubscribe = onSnapshot(salasCollection, (snapshot) => {
      const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalas(salasData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- FUNCIÓN PARA CREAR O ACTUALIZAR (Create & Update) ---
  const handleSaveSala = async (e) => {
    e.preventDefault();
    if (!nombreSala || !piso || !capacidad) {
      setMessage('Por favor, completa todos los campos.');
      return;
    }

    // Si estamos editando, usamos el ID guardado. Si no, usamos el nombre de la sala como nuevo ID.
    const docId = editingId || nombreSala; // <-- CAMBIO CLAVE
    const salaRef = doc(db, 'salas', docId);

    // Los datos a guardar siempre vienen de los estados del formulario
    const salaData = {
      nombre: nombreSala, // <-- CAMBIO CLAVE: Siempre usamos el estado 'nombreSala'
      piso: Number(piso),
      capacidad: Number(capacidad),
    };

    try {
      await setDoc(salaRef, salaData, { merge: true });
      setMessage(`¡Sala ${nombreSala} ${editingId ? 'actualizada' : 'creada'} exitosamente!`);
      resetForm();
    } catch (error) {
      setMessage("Hubo un error al guardar la sala.");
      console.error("Error: ", error);
    }
  };

  // --- FUNCIÓN PARA ELIMINAR (Delete) ---
  const handleDeleteSala = async (id) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la sala ${id}?`)) {
      try {
        await deleteDoc(doc(db, 'salas', id));
        setMessage(`Sala ${id} eliminada exitosamente.`);
      } catch (error) {
        setMessage("Hubo un error al eliminar la sala.");
        console.error("Error: ", error);
      }
    }
  };

  // --- FUNCIÓN PARA PREPARAR LA EDICIÓN ---
  const handleEditSala = (sala) => {
    setEditingId(sala.id); // Guardamos el ID del documento que estamos editando
    
    // Rellenamos el formulario con los datos de la sala seleccionada
    setNombreSala(sala.nombre); // <-- CAMBIO CLAVE: Usamos sala.nombre para el campo de nombre
    setPiso(sala.piso);
    setCapacidad(sala.capacidad);
  };
  
  // --- FUNCIÓN PARA LIMPIAR Y RESETEAR EL FORMULARIO ---
  const resetForm = () => {
    setEditingId(null);
    setNombreSala('');
    setPiso('');
    setCapacidad('');
    setMessage('');
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px' }}>
      <h2>{editingId ? 'Editando Sala' : 'Crear Nueva Sala'}</h2>
      <form onSubmit={handleSaveSala}>
        <div>
          <label>Nombre de la Sala: </label>
          <input 
            type="text" 
            value={nombreSala} 
            onChange={(e) => setNombreSala(e.target.value)} 
            placeholder="ID único (ej. A310)"
            disabled={editingId} // Bloqueamos el nombre/ID durante la edición para evitar inconsistencias
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Piso: </label>
          <input type="number" value={piso} onChange={(e) => setPiso(e.target.value)} />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Capacidad: </label>
          <input type="number" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} />
        </div>
        <button type="submit" style={{ marginTop: '15px' }}>
          {editingId ? 'Actualizar Sala' : 'Crear Sala'}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} style={{ marginLeft: '10px' }}>
            Cancelar Edición
          </button>
        )}
      </form>
      {message && <p>{message}</p>}
      
      <hr />
      <h3>Salas Existentes</h3>
      {loading ? <p>Cargando...</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {salas.map(sala => (
            <li key={sala.id} style={{ marginBottom: '10px', border: '1px solid lightgray', padding: '5px' }}>
              <strong>{sala.nombre}</strong> (ID: {sala.id}, Piso: {sala.piso}, Capacidad: {sala.capacidad})
              <div style={{ marginTop: '5px' }}>
                <button onClick={() => handleEditSala(sala)}>Editar</button> {/* <-- CAMBIO CLAVE: Pasamos el objeto 'sala' completo */}
                <button onClick={() => handleDeleteSala(sala.id)} style={{ marginLeft: '10px', color: 'red' }}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminPanel;