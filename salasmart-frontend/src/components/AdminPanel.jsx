// src/components/AdminPanel.jsx

import React, { useState, useEffect } from 'react';
// ¡Asegúrate de importar 'auth'!
import { auth, db } from '../firebase/config'; 
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
// ¡Asegúrate de importar 'FormSelect'!
import { Form, Button, ListGroup, Card, Row, Col, Alert, Container, Tabs, Tab, Spinner, FormSelect } from 'react-bootstrap';

function AdminPanel() {
  // --- Estados para Salas ---
  const [salas, setSalas] = useState([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [nombreSala, setNombreSala] = useState('');
  const [piso, setPiso] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [messageSala, setMessageSala] = useState('');
  
  // --- Estados para Usuarios ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [messageUser, setMessageUser] = useState('');

  // --- LÓGICA PARA LEER SALAS (Se mantiene igual) ---
  useEffect(() => {
    const unsubscribeSalas = onSnapshot(collection(db, 'salas'), (snapshot) => {
      const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalas(salasData);
      setLoadingSalas(false);
    });
    return () => unsubscribeSalas();
  }, []);

  // --- LÓGICA PARA LEER USUARIOS (Se mantiene igual) ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
    } catch (error) {
        console.error("Error al obtener usuarios: ", error);
        setMessageUser("No se pudieron cargar los usuarios. Verifica las reglas de Firestore.");
    } finally {
        setLoadingUsers(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // --- FUNCIONES CRUD PARA SALAS (Se mantienen igual) ---
  const resetFormSala = () => {
    setEditingId(null);
    setNombreSala('');
    setPiso('');
    setCapacidad('');
    setMessageSala('');
  };

  const handleSaveSala = async (e) => {
    e.preventDefault();
    if (!nombreSala || !piso || !capacidad) {
      setMessageSala('Por favor, completa todos los campos.');
      return;
    }
    const docId = editingId || nombreSala;
    const salaRef = doc(db, 'salas', docId);
    const salaData = { nombre: nombreSala, piso: Number(piso), capacidad: Number(capacidad) };
    try {
      await setDoc(salaRef, salaData, { merge: true });
      setMessageSala(`¡Sala ${nombreSala} ${editingId ? 'actualizada' : 'creada'}!`);
      resetFormSala();
    } catch (error) {
      setMessageSala("Hubo un error al guardar la sala.");
      console.error("Error: ", error);
    }
  };

  const handleDeleteSala = async (id) => {
    if (window.confirm(`¿Seguro que quieres eliminar la sala ${id}?`)) {
      await deleteDoc(doc(db, 'salas', id));
    }
  };

  const handleEditSala = (sala) => {
    setEditingId(sala.id);
    setNombreSala(sala.nombre);
    setPiso(sala.piso);
    setCapacidad(sala.capacidad);
  };

  // --- ¡NUEVA FUNCIÓN MEJORADA PARA CAMBIAR ROL DE USUARIO! ---
  const handleRoleChange = async (userId, newRole) => {
    setMessageUser('');
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
      setMessageUser(`Rol actualizado a "${newRole}" exitosamente.`);
      fetchUsers(); // Actualizamos la lista para reflejar el cambio
    } catch (error) {
      setMessageUser("Error al actualizar el rol. Revisa las reglas de seguridad.");
      console.error("Error updating role:", error);
    }
  };

  return (
    <Container fluid>
      <Tabs defaultActiveKey="salas" id="admin-tabs" className="mb-3" fill>
        
        {/* Pestaña de Gestionar Salas (se queda igual) */}
        <Tab eventKey="salas" title="Gestionar Salas">
          <Row className="mt-4">
            <Col md={4}>
              <Card>
                <Card.Header as="h3">{editingId ? 'Editando Sala' : 'Crear Nueva Sala'}</Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSaveSala}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre de la Sala</Form.Label>
                      <Form.Control type="text" value={nombreSala} onChange={(e) => setNombreSala(e.target.value)} placeholder="Ej. A310" disabled={editingId !== null} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Piso</Form.Label>
                      <Form.Control type="number" value={piso} onChange={(e) => setPiso(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Capacidad</Form.Label>
                      <Form.Control type="number" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} required />
                    </Form.Group>
                    <Button variant="primary" type="submit">{editingId ? 'Actualizar Sala' : 'Crear Sala'}</Button>
                    {editingId && <Button variant="secondary" onClick={resetFormSala} className="ms-2">Cancelar</Button>}
                  </Form>
                  {messageSala && <Alert variant="info" className="mt-3">{messageSala}</Alert>}
                </Card.Body>
              </Card>
            </Col>
            <Col md={8}>
              <h3>Salas Existentes</h3>
              {loadingSalas ? <Spinner animation="border" /> : (
                <ListGroup>
                  {salas.map(sala => (
                    <ListGroup.Item key={sala.id} className="d-flex justify-content-between align-items-center">
                      <div><strong>{sala.nombre}</strong> (Piso: {sala.piso}, Capacidad: {sala.capacidad})</div>
                      <div>
                        <Button variant="outline-primary" size="sm" onClick={() => handleEditSala(sala)}>Editar</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteSala(sala.id)} className="ms-2">Eliminar</Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Col>
          </Row>
        </Tab>

        {/* Pestaña de Gestionar Usuarios (VERSIÓN MEJORADA) */}
        <Tab eventKey="users" title="Gestionar Usuarios">
          <Row className="mt-4 justify-content-center">
            <Col md={8}>
              <Card>
                <Card.Header as="h3">Usuarios Registrados</Card.Header>
                <Card.Body>
                  {messageUser && <Alert variant="info">{messageUser}</Alert>}
                  {loadingUsers ? <Spinner animation="border" /> : (
                    <ListGroup>
                      {users.map(user => {
                        // Ocultamos nuestra propia cuenta de admin de la lista para evitar accidentes
                        if (user.id === auth.currentUser?.uid) {
                          return null;
                        }
                        
                        return (
                          <ListGroup.Item key={user.id} className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{user.email}</strong>
                              <span className={`ms-3 badge bg-${user.role === 'admin' ? 'success' : (user.role === 'docente' ? 'primary' : 'secondary')}`}>
                                {user.role}
                              </span>
                            </div>
                            
                            {/* Solo mostramos el selector si el usuario no es admin */}
                            {user.role !== 'admin' && (
                              <div>
                                <FormSelect 
                                  size="sm" 
                                  value={user.role} 
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                  style={{ width: '150px' }}
                                >
                                  <option value="estudiante">Estudiante</option>
                                  <option value="docente">Docente</option>
                                </FormSelect>
                              </div>
                            )}
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default AdminPanel;