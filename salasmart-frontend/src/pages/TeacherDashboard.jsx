// src/pages/TeacherDashboard.jsx
import React, { useState } from 'react';
import { Container, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import PlanoSalas from '../components/PlanoSalas';
import { useSalas } from '../hooks/useSalas'; // Usamos el mismo hook
import { useAuth } from '../hooks/useAuth'; // Necesitamos saber quién es el usuario

function TeacherDashboard() {
  const { salas, loading, error } = useSalas();
  const { user } = useAuth(); // Obtenemos la información del usuario logueado
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);

  const handleSalaClick = (salaCoordenada) => {
    const infoCompleta = salas.find(s => s.id === salaCoordenada.id);
    setSalaSeleccionada(infoCompleta);
  };

  const handleCloseModal = () => setSalaSeleccionada(null);

  // --- LÓGICA DE RESERVA (Aún es un placeholder) ---
  const handleReservar = (sala) => {
    // Aquí irá la lógica completa de reserva en el futuro.
    // Por ahora, solo muestra una alerta.
    alert(`Funcionalidad para reservar la sala ${sala.nombre} por ${user.email} próximamente.`);
    handleCloseModal();
  };


  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <Container fluid className="mt-4">
      <h2 className="text-center mb-4">Panel del Docente - Plano de Salas</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <PlanoSalas salasData={salas} onSalaClick={handleSalaClick} />

      {/* El Modal del docente es casi igual, pero con el botón de Reservar */}
      <Modal show={!!salaSeleccionada} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Detalles de la Sala: {salaSeleccionada?.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {salaSeleccionada && (
            <>
              <p><strong>Estado:</strong> 
                <span className={`fw-bold text-${salaSeleccionada.estado === 'Disponible' ? 'success' : 'danger'}`}>
                  {salaSeleccionada.estado}
                </span>
              </p>
              <p><strong>Piso:</strong> {salaSeleccionada.piso}</p>
              <p><strong>Capacidad:</strong> {salaSeleccionada.capacidad} personas</p>
              {salaSeleccionada.estado === 'Ocupado' && salaSeleccionada.reservaActual && (
                <Alert variant="warning">
                  Ocupada por: {salaSeleccionada.reservaActual.nombreDocente || 'Docente'} <br/>
                  Asignatura: {salaSeleccionada.reservaActual.asignatura || 'Clase'} <br/>
                  Hasta: {new Date(salaSeleccionada.reservaActual.horaFin.seconds * 1000).toLocaleTimeString()}
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button>
          {/* Mostramos el botón de reservar SOLO si la sala está disponible */}
          {salaSeleccionada?.estado === 'Disponible' && (
            <Button variant="success" onClick={() => handleReservar(salaSeleccionada)}>
              Reservar
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
export default TeacherDashboard;