// src/pages/Registro.jsx

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
// ¡Importamos db y funciones de Firestore!
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore'; 
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';

const Registro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // 1. Creamos el usuario en el sistema de Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. ¡CLAVE! Creamos un documento para este usuario en la colección 'users' de Firestore
      // El ID de este documento será el UID del usuario, conectando ambos sistemas.
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "user" // Todos los nuevos usuarios registrados por esta vía serán "user" por defecto.
      });
      
      // 3. Redirigimos al login con un mensaje de éxito
      navigate('/login?status=registered');

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está en uso.');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Error al registrar. Por favor, inténtalo de nuevo.');
        console.error("Error de registro:", error); // Añadimos un log para depuración
      }
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center h-100">
      <Row className="w-100" style={{ maxWidth: '400px' }}>
        <Col>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Registro de Usuario</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleRegistro}>
                <Form.Group id="email" className="mb-3">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Form.Group>
                <Form.Group id="password" className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Form.Group>
                <Button className="w-100" type="submit">Registrarse</Button>
              </Form>
            </Card.Body>
          </Card>
          <div className="w-100 text-center mt-2">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Registro;