// src/pages/Login.jsx

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate, Link, useLocation } from 'react-router-dom';

// Importamos componentes de Bootstrap
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Usamos useLocation para leer parámetros de la URL
  const location = useLocation();
  // Verificamos si la URL tiene ?status=registered para mostrar un mensaje de éxito
  const registrationSuccess = new URLSearchParams(location.search).get('status') === 'registered';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirigimos a la página principal si el login es exitoso
    } catch (error) {
      // En caso de error, mostramos un mensaje amigable
      setError("Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    // Container principal que centra todo vertical y horizontalmente
    <Container className="d-flex align-items-center justify-content-center h-100">
      <Row className="w-100" style={{ maxWidth: '400px' }}>
        <Col>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Iniciar Sesión</h2>
              
              {/* Mostramos alertas de error o éxito */}
              {error && <Alert variant="danger">{error}</Alert>}
              {registrationSuccess && <Alert variant="success">¡Registro exitoso! Ya puedes iniciar sesión.</Alert>}
              
              <Form onSubmit={handleLogin}>
                <Form.Group id="email" className="mb-3">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Form.Group>
                
                <Form.Group id="password" className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Form.Group>
                
                <Button className="w-100" type="submit">Entrar</Button>
              </Form>
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-2">
            ¿No tienes una cuenta? <Link to="/registro">Regístrate</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;