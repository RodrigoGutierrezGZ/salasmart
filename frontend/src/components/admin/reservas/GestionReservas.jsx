/**
 * Componente para gestionar todas las reservas del sistema (Admin)
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert, Spinner, Form, Row, Col, Modal } from 'react-bootstrap';
import { db } from '../../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { cancelarReserva, eliminarReserva } from '../../../services/reservasService';
import { JORNADAS } from '../../../utils/constants';

function GestionReservas() {
  const [reservas, setReservas] = useState([]);
  const [reservasFiltradas, setReservasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Filtros
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroSala, setFiltroSala] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroFecha, setFiltroFecha] = useState('');
  
  // Listas para los filtros
  const [docentes, setDocentes] = useState([]);
  const [salas, setSalas] = useState([]);
  
  // Modales
  const [reservaACancelar, setReservaACancelar] = useState(null);
  const [reservaAEliminar, setReservaAEliminar] = useState(null);

  // Cargar todas las reservas en tiempo real
  useEffect(() => {
    // SIMPLIFICADO: Traer todas las reservas y ordenar en el frontend
    const unsubscribe = onSnapshot(collection(db, 'reservas'), (snapshot) => {
      const reservasData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Ordenar en el frontend por fecha (más recientes primero)
        .sort((a, b) => {
          const fechaA = a.horaInicio?.toDate() || new Date(0);
          const fechaB = b.horaInicio?.toDate() || new Date(0);
          return fechaB - fechaA; // Descendente
        })
        .slice(0, 100); // Limitar a las últimas 100

      setReservas(reservasData);
      setReservasFiltradas(reservasData);
      
      // Extraer listas únicas de docentes y salas
      const docentesUnicos = [...new Set(reservasData.map(r => r.nombreDocente))].sort();
      const salasUnicas = [...new Set(reservasData.map(r => r.salaNombre || r.salaId))].sort();
      
      setDocentes(docentesUnicos);
      setSalas(salasUnicas);
      setLoading(false);
    }, (error) => {
      console.error('Error al cargar reservas:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar las reservas' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let resultado = [...reservas];

    // Filtro por docente
    if (filtroDocente) {
      resultado = resultado.filter(r => r.nombreDocente === filtroDocente);
    }

    // Filtro por sala
    if (filtroSala) {
      resultado = resultado.filter(r => 
        (r.salaNombre || r.salaId) === filtroSala
      );
    }

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      resultado = resultado.filter(r => {
        const estadoReal = obtenerEstadoReal(r);
        return estadoReal === filtroEstado;
      });
    }

    // Filtro por fecha
    if (filtroFecha) {
      resultado = resultado.filter(r => {
        const fechaReserva = r.horaInicio.toDate ? 
          r.horaInicio.toDate() : 
          new Date(r.horaInicio.seconds * 1000);
        const fechaFiltro = new Date(filtroFecha);
        
        return fechaReserva.toDateString() === fechaFiltro.toDateString();
      });
    }

    setReservasFiltradas(resultado);
  }, [filtroDocente, filtroSala, filtroEstado, filtroFecha, reservas]);

  // Obtener estado real de la reserva
  const obtenerEstadoReal = (reserva) => {
    if (reserva.estado === 'cancelada' || reserva.estado === 'completada') {
      return reserva.estado;
    }

    if (reserva.estado === 'activa') {
      let horaFin;
      
      if (reserva.horaFin.toDate) {
        horaFin = reserva.horaFin.toDate();
      } else if (reserva.horaFin.seconds) {
        horaFin = new Date(reserva.horaFin.seconds * 1000);
      } else if (reserva.horaFin._seconds) {
        horaFin = new Date(reserva.horaFin._seconds * 1000);
      } else if (typeof reserva.horaFin === 'string') {
        horaFin = new Date(reserva.horaFin);
      } else {
        horaFin = reserva.horaFin;
      }

      if (horaFin < new Date()) {
        return 'completada';
      }
    }

    return reserva.estado;
  };

  // Formatear fecha/hora
  const formatearFechaHora = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let fecha;
    
    if (timestamp.toDate) {
      fecha = timestamp.toDate();
    } else if (timestamp.seconds) {
      fecha = new Date(timestamp.seconds * 1000);
    } else if (timestamp._seconds) {
      fecha = new Date(timestamp._seconds * 1000);
    } else if (typeof timestamp === 'string') {
      fecha = new Date(timestamp);
    } else {
      fecha = timestamp;
    }
    
    if (isNaN(fecha.getTime())) {
      return 'Invalid Date';
    }
    
    return fecha.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener variante de badge según estado
  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'activa':
        return 'success';
      case 'cancelada':
        return 'danger';
      case 'completada':
        return 'secondary';
      default:
        return 'info';
    }
  };

  // Obtener badge de jornada
  const getJornadaBadge = (jornada) => {
    if (jornada === JORNADAS.DIURNO) {
      return { variant: 'primary', emoji: '🌞', texto: 'DIURNO' };
    } else if (jornada === JORNADAS.VESPERTINO) {
      return { variant: 'info', emoji: '🌙', texto: 'VESPERTINO' };
    }
    return { variant: 'secondary', emoji: '❓', texto: 'N/A' };
  };

  // Verificar si puede cancelar
  const puedeCancelar = (reserva) => {
    if (reserva.estado !== 'activa') return false;

    let horaInicio;
    
    if (reserva.horaInicio.toDate) {
      horaInicio = reserva.horaInicio.toDate();
    } else if (reserva.horaInicio.seconds) {
      horaInicio = new Date(reserva.horaInicio.seconds * 1000);
    } else if (reserva.horaInicio._seconds) {
      horaInicio = new Date(reserva.horaInicio._seconds * 1000);
    } else if (typeof reserva.horaInicio === 'string') {
      horaInicio = new Date(reserva.horaInicio);
    } else {
      horaInicio = reserva.horaInicio;
    }

    return horaInicio > new Date();
  };

  // Manejar cancelación
  const handleCancelarClick = (reserva) => {
    setReservaACancelar(reserva);
  };

  const handleConfirmarCancelacion = async () => {
    if (!reservaACancelar) return;

    setMensaje({ tipo: '', texto: '' });

    const resultado = await cancelarReserva(reservaACancelar.id);

    if (resultado.success) {
      setMensaje({ tipo: 'success', texto: 'Reserva cancelada exitosamente' });
      setReservaACancelar(null);
    } else {
      setMensaje({ tipo: 'danger', texto: resultado.error });
      setReservaACancelar(null);
    }
  };

  // Manejar eliminación
  const handleEliminarClick = (reserva) => {
    setReservaAEliminar(reserva);
  };

  const handleConfirmarEliminacion = async () => {
    if (!reservaAEliminar) return;

    setMensaje({ tipo: '', texto: '' });

    const resultado = await eliminarReserva(reservaAEliminar.id);

    if (resultado.success) {
      setMensaje({ tipo: 'success', texto: '✅ Reserva eliminada exitosamente' });
      setReservaAEliminar(null);
    } else {
      // Si la reserva no existe, simplemente cerrar el modal sin error
      if (resultado.error.includes('no encontrada') || resultado.error.includes('not found')) {
        setMensaje({ 
          tipo: 'info', 
          texto: 'La reserva ya fue eliminada. Actualizando lista...' 
        });
        setReservaAEliminar(null);
        // Limpiar el mensaje después de 2 segundos
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      } else {
        // Otros errores
        setMensaje({ tipo: 'danger', texto: resultado.error });
        setReservaAEliminar(null);
      }
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroDocente('');
    setFiltroSala('');
    setFiltroEstado('todas');
    setFiltroFecha('');
  };

  return (
    <Card>
      <Card.Header>
        <h4 className="mb-0">Gestión de Reservas</h4>
      </Card.Header>
      <Card.Body>
        {mensaje.texto && (
          <Alert variant={mensaje.tipo} onClose={() => setMensaje({ tipo: '', texto: '' })} dismissible>
            {mensaje.texto}
          </Alert>
        )}

        {/* Filtros */}
        <Card className="mb-3">
          <Card.Body>
            <h5 className="mb-3">Filtros</h5>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Docente</Form.Label>
                  <Form.Select 
                    value={filtroDocente} 
                    onChange={(e) => setFiltroDocente(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {docentes.map(docente => (
                      <option key={docente} value={docente}>{docente}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Sala</Form.Label>
                  <Form.Select 
                    value={filtroSala} 
                    onChange={(e) => setFiltroSala(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {salas.map(sala => (
                      <option key={sala} value={sala}>{sala}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select 
                    value={filtroEstado} 
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  >
                    <option value="todas">Todas</option>
                    <option value="activa">Activas</option>
                    <option value="completada">Completadas</option>
                    <option value="cancelada">Canceladas</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={filtroFecha} 
                    onChange={(e) => setFiltroFecha(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={1} className="d-flex align-items-end">
                <Button 
                  variant="outline-secondary" 
                  className="mb-3 w-100"
                  onClick={limpiarFiltros}
                >
                  Limpiar
                </Button>
              </Col>
            </Row>
            <div className="text-muted">
              <small>
                Mostrando <strong>{reservasFiltradas.length}</strong> de <strong>{reservas.length}</strong> reservas
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Tabla de reservas */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Cargando reservas...</p>
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <Alert variant="info">
            No se encontraron reservas con los filtros aplicados.
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Sala</th>
                  <th>Docente</th>
                  <th>Asignatura</th>
                  <th>Fecha y Hora</th>
                  <th>Jornada</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservasFiltradas.map((reserva) => {
                  const estadoReal = obtenerEstadoReal(reserva);
                  
                  return (
                    <tr key={reserva.id}>
                      <td>
                        <strong>{reserva.salaNombre || reserva.salaId}</strong>
                      </td>
                      <td>{reserva.nombreDocente}</td>
                      <td>{reserva.asignatura}</td>
                      <td>
                        <div>
                          <small className="text-muted">Inicio:</small> {formatearFechaHora(reserva.horaInicio)}
                        </div>
                        <div>
                          <small className="text-muted">Fin:</small> {formatearFechaHora(reserva.horaFin)}
                        </div>
                      </td>
                      <td>
                        {reserva.jornada ? (
                          <Badge bg={getJornadaBadge(reserva.jornada).variant}>
                            {getJornadaBadge(reserva.jornada).emoji} {getJornadaBadge(reserva.jornada).texto}
                          </Badge>
                        ) : (
                          <span className="text-muted"><small>N/A</small></span>
                        )}
                      </td>
                      <td>
                        <Badge bg={getBadgeVariant(estadoReal)}>
                          {estadoReal.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {puedeCancelar(reserva) ? (
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleCancelarClick(reserva)}
                            >
                              Cancelar
                            </Button>
                          ) : null}
                          
                          {estadoReal === 'completada' || estadoReal === 'cancelada' ? (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleEliminarClick(reserva)}
                            >
                              Eliminar
                            </Button>
                          ) : null}
                          
                          {!puedeCancelar(reserva) && estadoReal === 'activa' ? (
                            <span className="text-muted">
                              <small>En curso</small>
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {/* Modal de confirmación de cancelación */}
      <Modal show={!!reservaACancelar} onHide={() => setReservaACancelar(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Cancelación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reservaACancelar && (
            <>
              <p>¿Estás seguro que deseas cancelar esta reserva?</p>
              <div className="bg-light p-3 rounded">
                <p className="mb-1"><strong>Sala:</strong> {reservaACancelar.salaNombre || reservaACancelar.salaId}</p>
                <p className="mb-1"><strong>Docente:</strong> {reservaACancelar.nombreDocente}</p>
                <p className="mb-1"><strong>Asignatura:</strong> {reservaACancelar.asignatura}</p>
                <p className="mb-0"><strong>Inicio:</strong> {formatearFechaHora(reservaACancelar.horaInicio)}</p>
              </div>
              <Alert variant="warning" className="mt-3 mb-0">
                <small>Esta acción cancelará la reserva y liberará la sala.</small>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setReservaACancelar(null)}>
            No, mantener
          </Button>
          <Button variant="warning" onClick={handleConfirmarCancelacion}>
            Sí, cancelar reserva
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal show={!!reservaAEliminar} onHide={() => setReservaAEliminar(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {reservaAEliminar && (
            <>
              <p>¿Estás seguro que deseas eliminar permanentemente esta reserva?</p>
              <div className="bg-light p-3 rounded">
                <p className="mb-1"><strong>Sala:</strong> {reservaAEliminar.salaNombre || reservaAEliminar.salaId}</p>
                <p className="mb-1"><strong>Docente:</strong> {reservaAEliminar.nombreDocente}</p>
                <p className="mb-1"><strong>Asignatura:</strong> {reservaAEliminar.asignatura}</p>
                <p className="mb-1"><strong>Inicio:</strong> {formatearFechaHora(reservaAEliminar.horaInicio)}</p>
                <p className="mb-0"><strong>Estado:</strong> <Badge bg={getBadgeVariant(obtenerEstadoReal(reservaAEliminar))}>
                  {obtenerEstadoReal(reservaAEliminar).toUpperCase()}
                </Badge></p>
              </div>
              <Alert variant="danger" className="mt-3 mb-0">
                <small><strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente el registro.</small>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setReservaAEliminar(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmarEliminacion}>
            Eliminar permanentemente
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

export default GestionReservas;
