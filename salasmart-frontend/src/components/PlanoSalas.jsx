// src/components/PlanoSalas.jsx
import React from 'react';
import { Popover, OverlayTrigger, Badge } from 'react-bootstrap';

// --- ¡CAMBIO CLAVE! ---
// Ya no importamos la imagen. La llamamos como una ruta de texto.
// El slash "/" al principio le dice al navegador que busque el archivo en la raíz del sitio web,
// que es nuestra carpeta "public".
const planoImgPath = '/plano_inacap.jpg';

// --- COORDENADAS DE LAS SALAS EN EL PLANO ---
const salasCoordenadas = [
  { id: 'S101', nombre: 'S101', top: '250px', left: '100px' },
  { id: 'S102', nombre: 'S102', top: '250px', left: '230px' },
  { id: 'S103', nombre: 'S103', top: '250px', left: '360px' },
  { id: 'R104', nombre: 'Sala Reunión', top: '250px', left: '490px' },
  { id: 'A105', nombre: 'Auditorio', top: '250px', left: '600px' },
  { id: 'S106', nombre: 'S106', top: '250px', left: '800px' },
  { id: 'S107', nombre: 'S107', top: '250px', left: '930px' },
];

const SalaPunto = ({ sala, estado, onClick }) => {
  const popover = (
    <Popover id={`popover-${sala.id}`}>
      <Popover.Header as="h3">{sala.nombre}</Popover.Header>
      <Popover.Body>
        <strong>Estado:</strong> 
        <span className={`fw-bold text-${estado === 'Disponible' ? 'success' : 'danger'}`}>
          {` ${estado}`}
        </span>
        <br />
        <small>Haz clic para ver más detalles.</small>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover}>
      <div
        onClick={() => onClick(sala)}
        style={{
          position: 'absolute',
          top: sala.top,
          left: sala.left,
          cursor: 'pointer',
          textAlign: 'center',
          padding: '10px',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <Badge 
          pill 
          bg={estado === 'Disponible' ? 'success' : 'danger'}
          style={{ fontSize: '1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}
        >
          {sala.nombre}
        </Badge>
      </div>
    </OverlayTrigger>
  );
};

const PlanoSalas = ({ salasData, onSalaClick }) => {
  return (
    <div style={{ position: 'relative', maxWidth: '1200px', margin: 'auto', border: '1px solid #ddd' }}>
      {/* ¡AQUÍ USAMOS LA NUEVA RUTA! */}
      <img src={planoImgPath} alt="Plano del piso" style={{ width: '100%', display: 'block' }} />

      {salasCoordenadas.map(coord => {
        const salaInfo = salasData.find(s => s.id === coord.id);
        if (!salaInfo) {
          return null;
        }
        return (
          <SalaPunto
            key={coord.id}
            sala={coord} 
            estado={salaInfo.estado}
            onClick={onSalaClick}
          />
        );
      })}
    </div>
  );
};

export default PlanoSalas;