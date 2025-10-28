// src/App.jsx - Versión Final Completa
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Spinner } from 'react-bootstrap';

import { signOut } from 'firebase/auth';
import { auth } from './firebase/config';
import { useAuth } from './hooks/useAuth';

import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user, role, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Router>
      <div className="d-flex flex-column vh-100">
        <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
          <Container>
            <Navbar.Brand as={Link} to={user ? "/dashboard" : "/"}>SalaSmart</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to={user ? "/dashboard" : "/"}>
                  {user ? "Mi Panel" : "Home"}
                </Nav.Link>
              </Nav>
              <Nav>
                {user ? (
                  <>
                    <Navbar.Text className="me-3">
                      Conectado como: {user.email} <span className={`badge bg-${role === 'admin' ? 'danger' : 'success'}`}>{role}</span>
                    </Navbar.Text>
                    <Button variant="outline-light" onClick={handleLogout}>Cerrar Sesión</Button>
                  </>
                ) : (
                  <>
                    <Nav.Link as={Link} to="/login">Login</Nav.Link>
                    <Nav.Link as={Link} to="/registro">Registro</Nav.Link>
                  </>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <main className="flex-grow-1 bg-light">
          <Routes>
            <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/registro" element={!user ? <Registro /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<ProtectedRoute />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;