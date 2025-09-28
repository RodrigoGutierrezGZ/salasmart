// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { Container, ListGroup, Card, Spinner, Alert } from 'react-bootstrap';

function StudentDashboard() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'salas'), 
      (snapshot) => {
        const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSalas(salasData);
        setLoading(false);
      },
      (err) => {
        setError("No se pudieron cargar las salas.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h2">Estado Actual de las Salas</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : (
            <ListGroup variant="flush">
              {salas.map(sala => (
                <ListGroup.Item key={sala.id}>
                  <strong>{sala.nombre}</strong> - Piso: {sala.piso}, Capacidad: {sala.capacidad}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
export default StudentDashboard;