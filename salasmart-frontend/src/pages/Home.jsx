// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Card } from 'react-bootstrap';

function Home() {
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ height: '80vh' }}>
      <Card className="text-center" style={{ width: '40rem', padding: '30px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <Card.Body>
          <Card.Title as="h1" className="mb-4">Bienvenido a SalaSmart</Card.Title>
          <Card.Text>
            Un sistema inteligente para la gestión y optimización de recursos académicos en INACAP.
            <br />
            Inicia sesión o regístrate para acceder a los paneles interactivos.
          </Card.Text>
          <div className="mt-4">
            <Button as={Link} to="/login" variant="primary" size="lg" className="me-2">
              Iniciar Sesión
            </Button>
            <Button as={Link} to="/registro" variant="outline-secondary" size="lg">
              Registrarse
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Home;