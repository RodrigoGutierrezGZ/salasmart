// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { Container, ListGroup, Card, Spinner, Button } from 'react-bootstrap';

function TeacherDashboard() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'salas'), (snapshot) => {
      const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalas(salasData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReservar = (salaId) => {
    alert(`Funcionalidad de reservar la sala ${salaId} próximamente.`);
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h2">Panel del Docente - Estado de Salas</Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            {salas.map(sala => (
              <ListGroup.Item key={sala.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{sala.nombre}</strong> (Piso: {sala.piso}, Capacidad: {sala.capacidad})
                </div>
                <Button variant="success" size="sm" onClick={() => handleReservar(sala.id)}>
                  Reservar
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default TeacherDashboard;