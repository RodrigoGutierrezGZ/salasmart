// src/components/VisualizadorSalas.jsx
// Componente compartido para visualizar salas (usado por estudiantes y docentes)

import React, { useState } from 'react';
import { Card, Row, Col, Form, Alert, Table, Badge, Button } from 'react-bootstrap';
import PlanoSalas from './PlanoSalas';
import { ESTADOS_SALA } from '../utils/constants';

function VisualizadorSalas({ 
  salas, 
  onSalaClick, 
  mostrarBotonReservar = false, // Solo docentes pueden reservar
  onReservar = null 
}) {
  const [vistaActual, setVistaActual] = useState('plano');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPiso, setFiltroPiso] = useState('todos');

  // Filtrar salas
  const salasFiltradas = salas.filter(sala => {
    const matchesBusqueda = sala.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ?? true;
    const matchesEstado = filtroEstado === 'todos' || sala.estado === filtroEstado;
    const matchesPiso = filtroPiso === 'todos' || sala.piso?.toString() === filtroPiso;
    return matchesBusqueda && matchesEstado && matchesPiso;
  });

  // Estadísticas de disponibilidad
  const estadisticas = {
    disponibles: salas.filter(s => s?.estado === ESTADOS_SALA.DISPONIBLE).length,
    proximamente: salas.filter(s => s?.estado === ESTADOS_SALA.PROXIMAMENTE).length,
    ocupadas: salas.filter(s => s?.estado === ESTADOS_SALA.OCUPADO).length,
    total: salas.length
  };

  // Obtener pisos únicos
  const pisosUnicos = [...new Set(salas.map(s => s.piso).filter(p => p !== undefined))].sort((a, b) => a - b);

  return (
    <>
      {/* Tarjetas de Estadísticas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <h3 className="text-success">{estadisticas.disponibles}</h3>
              <p className="mb-0 text-muted">🟢 Disponibles</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <h3 className="text-warning">{estadisticas.proximamente}</h3>
              <p className="mb-0 text-muted">🟡 Próximamente</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-danger">
            <Card.Body>
              <h3 className="text-danger">{estadisticas.ocupadas}</h3>
              <p className="mb-0 text-muted">🔴 Ocupadas</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <h3 className="text-primary">{estadisticas.total}</h3>
              <p className="mb-0 text-muted">📊 Total Salas</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Selector de Vista y Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>👁️ Vista</Form.Label>
                <Form.Select 
                  value={vistaActual} 
                  onChange={(e) => setVistaActual(e.target.value)}
                >
                  <option value="plano">Plano de Salas</option>
                  <option value="lista">Lista de Salas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>🔍 Buscar</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre de sala..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>📊 Estado</Form.Label>
                <Form.Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value={ESTADOS_SALA.DISPONIBLE}>Disponibles</option>
                  <option value={ESTADOS_SALA.PROXIMAMENTE}>Próximamente</option>
                  <option value={ESTADOS_SALA.OCUPADO}>Ocupadas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>🏢 Piso</Form.Label>
                <Form.Select
                  value={filtroPiso}
                  onChange={(e) => setFiltroPiso(e.target.value)}
                >
                  <option value="todos">Todos los pisos</option>
                  {pisosUnicos.map(piso => (
                    <option key={piso} value={piso}>Piso {piso}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Vista de Plano o Lista */}
      {vistaActual === 'plano' ? (
        <Card className="mb-4">
          <Card.Header as="h5">🗺️ Plano de Salas - Disponibilidad en Tiempo Real</Card.Header>
          <Card.Body>
            <PlanoSalas salasData={salasFiltradas} onSalaClick={onSalaClick} />
          </Card.Body>
        </Card>
      ) : (
        <Card className="mb-4">
          <Card.Header as="h5">📋 Lista de Salas ({salasFiltradas.length})</Card.Header>
          <Card.Body>
            {salasFiltradas.length === 0 ? (
              <Alert variant="info">No se encontraron salas con los filtros seleccionados.</Alert>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Sala</th>
                    <th>Piso</th>
                    <th>Capacidad</th>
                    <th>Estado</th>
                    <th>Información</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {salasFiltradas.map(sala => (
                    <tr key={sala.id}>
                      <td><strong>{sala.nombre}</strong></td>
                      <td>Piso {sala.piso}</td>
                      <td>{sala.capacidad} personas</td>
                      <td>
                        <Badge bg={
                          sala.estado === ESTADOS_SALA.DISPONIBLE ? 'success' :
                          sala.estado === ESTADOS_SALA.PROXIMAMENTE ? 'warning' : 'danger'
                        }>
                          {sala.texto}
                        </Badge>
                      </td>
                      <td>
                        {sala.textoSecundario && (
                          <small className="text-muted">{sala.textoSecundario}</small>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onSalaClick(sala)}
                          className="me-1"
                        >
                          Ver Detalles
                        </Button>
                        {mostrarBotonReservar && onReservar && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onReservar(sala)}
                            disabled={sala.estado === ESTADOS_SALA.OCUPADO}
                          >
                            Reservar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
}

export default VisualizadorSalas;
