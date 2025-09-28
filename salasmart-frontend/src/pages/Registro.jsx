// src/pages/Registro.jsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore'; 
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';

const Registro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('estudiante'); // Rol por defecto
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: role // Guardamos el rol elegido
      });
      navigate('/login?status=registered');
    } catch (error) {
      setError('Error al registrar. Revisa los datos.');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center h-100">
      <Row className="w-100" style={{ maxWidth: '400px' }}>
        <Col>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Registro</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleRegistro}>
                <Form.Group id="email" className="mb-3">
                  <Form.Label>Correo</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Form.Group>
                <Form.Group id="password" className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Form.Group>
                <Form.Group id="role" className="mb-3">
                  <Form.Label>Soy un...</Form.Label>
                  <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                  </Form.Select>
                </Form.Group>
                <Button className="w-100" type="submit">Registrarse</Button>
              </Form>
              <div className="w-100 text-center mt-2">
                ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
export default Registro;