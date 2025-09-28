// src/pages/Home.jsx

import React from 'react';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Card } from 'react-bootstrap';

function Home() {
  const user = auth.currentUser;
  const navigate = useNavigate();

  return (
    // Este Container centra todo el contenido en el espacio disponible
    <Container className="d-flex align-items-center justify-content-center h-100">
      <Card className="text-center" style={{ width: '40rem', padding: '20px' }}>
        <Card.Body>
          <Card.Title as="h1">Bienvenido a SalaSmart</Card.Title>
          {user ? (
            <div>
              <Card.Text className="mt-3">
                ¡Has iniciado sesión correctamente!
              </Card.Text>
              <Button variant="primary" onClick={() => navigate('/admin')} className="mt-3">
                Ir al Panel de Administración
              </Button>
            </div>
          ) : (
            <Card.Text className="mt-3">
              Un sistema inteligente para la gestión de recursos académicos.
              <br />
              Por favor, inicia sesión para continuar.
            </Card.Text>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Home;