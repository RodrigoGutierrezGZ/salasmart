// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

import { auth } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import AdminPanel from './components/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div>Cargando aplicación...</div>;
  }

  return (
    <Router>
      <div className="d-flex flex-column vh-100">
        <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
          <Container>
            <Navbar.Brand as={Link} to="/">SalaSmart</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <div className="d-flex justify-content-between w-100">
                <Nav>
                  <Nav.Link as={Link} to="/">Home</Nav.Link>
                  {user && <Nav.Link as={Link} to="/admin">Admin</Nav.Link>}
                </Nav>
                <Nav>
                  {user ? (
                    <>
                      <Navbar.Text className="me-3">Conectado como: {user.email}</Navbar.Text>
                      <Button variant="outline-light" onClick={handleLogout}>Cerrar Sesión</Button>
                    </>
                  ) : (
                    <>
                      <Nav.Link as={Link} to="/login">Login</Nav.Link>
                      <Nav.Link as={Link} to="/registro">Registro</Nav.Link>
                    </>
                  )}
                </Nav>
              </div>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route 
              path="/admin" 
              element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;