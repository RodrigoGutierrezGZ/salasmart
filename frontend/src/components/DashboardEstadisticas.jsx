// src/components/DashboardEstadisticas.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Row, Col, Card, Spinner, Alert, Form } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { ESTADOS_RESERVA } from '../utils/constants';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function DashboardEstadisticas() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSalas: 0,
    totalUsuarios: 0,
    reservasActivasHoy: 0,
    reservasMes: 0,
    salasMasUsadas: [],
    reservasPorJornada: { diurno: 0, vespertino: 0 },
    reservasPorDia: {}
  });

  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  useEffect(() => {
    cargarEstadisticas();
  }, [filtroFechaInicio, filtroFechaFin]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      // 1. Total de Salas
      const salasSnapshot = await getDocs(collection(db, 'salas'));
      const totalSalas = salasSnapshot.size;

      // 2. Total de Usuarios
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsuarios = usersSnapshot.size;

      // 3. TRAER TODAS LAS RESERVAS (sin índices compuestos)
      // Filtramos en el frontend para evitar índices complejos
      const reservasSnapshot = await getDocs(collection(db, 'reservas'));
      const todasReservas = reservasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fechas para filtrar
      const ahora = new Date();
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

      let fechaInicio = inicioMes;
      let fechaFin = finMes;

      // Aplicar filtros personalizados si existen
      if (filtroFechaInicio) {
        fechaInicio = new Date(filtroFechaInicio);
      }
      if (filtroFechaFin) {
        fechaFin = new Date(filtroFechaFin);
        fechaFin.setHours(23, 59, 59);
      }

      // Filtrar reservas activas hoy (en el frontend)
      const reservasActivasHoy = todasReservas.filter(reserva => {
        if (reserva.estado !== ESTADOS_RESERVA.ACTIVA) return false;
        const horaInicio = reserva.horaInicio?.toDate();
        if (!horaInicio) return false;
        return horaInicio >= inicioHoy && horaInicio <= finHoy;
      }).length;

      // Filtrar reservas del período seleccionado (en el frontend)
      const reservasPeriodo = todasReservas.filter(reserva => {
        const horaInicio = reserva.horaInicio?.toDate();
        if (!horaInicio) return false;
        return horaInicio >= fechaInicio && horaInicio <= fechaFin;
      });

      const reservasMes = reservasPeriodo.length;

      // 4. Salas más usadas (del período)
      const conteoSalas = {};
      reservasPeriodo.forEach(reserva => {
        const salaId = reserva.salaId;
        if (salaId) {
          conteoSalas[salaId] = (conteoSalas[salaId] || 0) + 1;
        }
      });

      const salasMasUsadas = Object.entries(conteoSalas)
        .map(([salaId, count]) => ({ salaId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 5. Reservas por jornada (diurno: 8:00-18:00, vespertino: 18:00-22:00)
      let reservasDiurno = 0;
      let reservasVespertino = 0;

      reservasPeriodo.forEach(reserva => {
        const horaInicio = reserva.horaInicio?.toDate();
        if (!horaInicio) return;
        const hora = horaInicio.getHours();

        if (hora >= 8 && hora < 18) {
          reservasDiurno++;
        } else if (hora >= 18 && hora < 22) {
          reservasVespertino++;
        }
      });

      // 6. Reservas por día de la semana
      const reservasPorDia = {
        'Lunes': 0,
        'Martes': 0,
        'Miércoles': 0,
        'Jueves': 0,
        'Viernes': 0,
        'Sábado': 0,
        'Domingo': 0
      };

      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      reservasPeriodo.forEach(reserva => {
        const fecha = reserva.horaInicio?.toDate();
        if (!fecha) return;
        const diaSemana = diasSemana[fecha.getDay()];
        if (reservasPorDia.hasOwnProperty(diaSemana)) {
          reservasPorDia[diaSemana]++;
        }
      });

      setStats({
        totalSalas,
        totalUsuarios,
        reservasActivasHoy,
        reservasMes,
        salasMasUsadas,
        reservasPorJornada: { diurno: reservasDiurno, vespertino: reservasVespertino },
        reservasPorDia
      });

    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      alert('Error al cargar las estadísticas. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  // Datos para gráfico de salas más usadas
  const dataSalasMasUsadas = {
    labels: stats.salasMasUsadas.map(s => s.salaId),
    datasets: [
      {
        label: 'Número de Reservas',
        data: stats.salasMasUsadas.map(s => s.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Datos para gráfico de jornadas
  const dataJornadas = {
    labels: ['Diurno (8:00-18:00)', 'Vespertino (18:00-22:00)'],
    datasets: [
      {
        label: 'Reservas por Jornada',
        data: [stats.reservasPorJornada.diurno, stats.reservasPorJornada.vespertino],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Datos para gráfico de días de la semana
  const dataDiasSemana = {
    labels: Object.keys(stats.reservasPorDia),
    datasets: [
      {
        label: 'Reservas por Día',
        data: Object.values(stats.reservasPorDia),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4">📊 Dashboard de Estadísticas</h3>

      {/* Filtros de Fecha */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>📅 Fecha Inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={filtroFechaInicio}
                  onChange={(e) => setFiltroFechaInicio(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>📅 Fecha Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={filtroFechaFin}
                  onChange={(e) => setFiltroFechaFin(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          {(filtroFechaInicio || filtroFechaFin) && (
            <Alert variant="info" className="mt-3 mb-0">
              Mostrando estadísticas del período seleccionado
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Tarjetas de Métricas Principales */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <h1 className="display-4 text-primary">📚</h1>
              <h3>{stats.totalSalas}</h3>
              <p className="text-muted mb-0">Total de Salas</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <h1 className="display-4 text-success">👥</h1>
              <h3>{stats.totalUsuarios}</h3>
              <p className="text-muted mb-0">Total de Usuarios</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <h1 className="display-4 text-warning">📅</h1>
              <h3>{stats.reservasActivasHoy}</h3>
              <p className="text-muted mb-0">Reservas Activas Hoy</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-info">
            <Card.Body>
              <h1 className="display-4 text-info">📈</h1>
              <h3>{stats.reservasMes}</h3>
              <p className="text-muted mb-0">
                {filtroFechaInicio ? 'Reservas Período' : 'Reservas del Mes'}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <strong>🏆 Top 10 Salas Más Usadas</strong>
            </Card.Header>
            <Card.Body>
              {stats.salasMasUsadas.length > 0 ? (
                <Bar data={dataSalasMasUsadas} options={opcionesGrafico} />
              ) : (
                <Alert variant="info">No hay datos de reservas en el período seleccionado.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <strong>🕐 Reservas por Jornada</strong>
            </Card.Header>
            <Card.Body>
              {(stats.reservasPorJornada.diurno > 0 || stats.reservasPorJornada.vespertino > 0) ? (
                <Pie data={dataJornadas} options={opcionesGrafico} />
              ) : (
                <Alert variant="info">No hay datos de reservas en el período seleccionado.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={12} className="mb-4">
          <Card>
            <Card.Header>
              <strong>📆 Reservas por Día de la Semana</strong>
            </Card.Header>
            <Card.Body>
              {Object.values(stats.reservasPorDia).some(v => v > 0) ? (
                <Bar data={dataDiasSemana} options={opcionesGrafico} />
              ) : (
                <Alert variant="info">No hay datos de reservas en el período seleccionado.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardEstadisticas;
