// src/components/PlanoSalas.jsx
import React from 'react';
import { ESTADOS_SALA } from '../../utils/constants';

// --- ¡CAMBIO CLAVE! ---
// Ya no importamos la imagen. La llamamos como una ruta de texto.
// El slash "/" al principio le dice al navegador que busque el archivo en la raíz del sitio web,
// que es nuestra carpeta "public".
const planoImgPath = '/plano_inacap.jpg';

// --- COORDENADAS DE LAS SALAS EN EL PLANO (en porcentajes para responsive) ---
// Basadas en las posiciones reales del plano arquitectónico
const salasCoordenadas = [
  { id: 'A103', nombre: 'A103', topPercent: 30, leftPercent: 68 },
  { id: 'A120', nombre: 'A120', topPercent: 40, leftPercent: 40 },
  { id: 'A140', nombre: 'A140', topPercent: 40, leftPercent: 58 },
  { id: 'A150', nombre: 'A150', topPercent: 50, leftPercent: 38 },
  { id: 'A115', nombre: 'A115', topPercent: 52, leftPercent: 58 },
  { id: 'GYM A102', nombre: 'GYM A102', topPercent: 55, leftPercent: 48 },
  { id: 'A130', nombre: 'A130', topPercent: 60, leftPercent: 58 },
  { id: 'A138', nombre: 'A138', topPercent: 32, leftPercent: 20 },
  { id: 'A107', nombre: 'A107', topPercent: 70, leftPercent: 25 },
  { id: 'A105', nombre: 'A105', topPercent: 70, leftPercent: 35 },
  { id: 'A108', nombre: 'A108', topPercent: 70, leftPercent: 53 },
  { id: 'A110', nombre: 'A110', topPercent: 70, leftPercent: 65 },
];

const SalaPunto = ({ sala, estado, texto, textoSecundario, color, onClick, showReservarText = true }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  // Mapear estado a colores Tailwind
  const getColorClasses = (estado) => {
    switch (estado) {
      case ESTADOS_SALA.DISPONIBLE:
        return 'bg-success text-white hover:bg-success/90 hover:scale-110';
      case ESTADOS_SALA.PROXIMAMENTE:
        return 'bg-warning text-neutral-dark hover:bg-warning/90 hover:scale-110';
      case ESTADOS_SALA.OCUPADO:
        return 'bg-danger text-white hover:bg-danger/90 hover:scale-110';
      default:
        return 'bg-gray-400 text-white hover:bg-gray-500 hover:scale-110';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case ESTADOS_SALA.DISPONIBLE:
        return 'text-success';
      case ESTADOS_SALA.OCUPADO:
        return 'text-danger';
      default:
        return 'text-warning';
    }
  };

  return (
    <div
      className="absolute"
      style={{
        top: `${sala.topPercent}%`,
        left: `${sala.leftPercent}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip mejorado */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none" style={{ zIndex: 999 }}>
          <div className="relative bg-white rounded-xl shadow-2xl border-2 border-primary/20 overflow-hidden w-72 animate-fadeIn">
            {/* Header con color según estado */}
            <div className={`px-4 py-3 ${
              estado === ESTADOS_SALA.DISPONIBLE 
                ? 'bg-success/10 border-b-2 border-success/30' 
                : estado === ESTADOS_SALA.PROXIMAMENTE 
                ? 'bg-warning/10 border-b-2 border-warning/30'
                : 'bg-danger/10 border-b-2 border-danger/30'
            }`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-primary">meeting_room</span>
                <h4 className="font-bold text-lg text-neutral-dark">{sala.nombre}</h4>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="p-4 space-y-3">
              {/* Estado */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Estado:</span>
                <span className={`flex items-center gap-1 font-bold text-sm ${getEstadoColor(estado)}`}>
                  <span className="material-symbols-outlined text-base">
                    {estado === ESTADOS_SALA.DISPONIBLE ? 'check_circle' : 
                     estado === ESTADOS_SALA.PROXIMAMENTE ? 'schedule' : 'cancel'}
                  </span>
                  {texto}
                </span>
              </div>
              
              {/* Información adicional */}
              {textoSecundario && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="material-symbols-outlined text-base text-primary">info</span>
                  <span>{textoSecundario}</span>
                </div>
              )}
              
              {/* Call to action - Solo para profesores */}
              {showReservarText && (
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm">
                    <span className="material-symbols-outlined text-base">touch_app</span>
                    <span>Haz clic para reservar</span>
                  </div>
                </div>
              )}
            </div>

            {/* Arrow pointer */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-transparent border-t-white drop-shadow"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Badge de la sala */}
      <div
        onClick={() => onClick(sala)}
        className={`cursor-pointer transition-all duration-200 ${getColorClasses(estado)}`}
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.95rem',
          fontWeight: '600',
          boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
        }}
      >
        {sala.nombre}
      </div>
    </div>
  );
};

const PlanoSalas = ({ salasData, onSalaClick, showReservarText = true }) => {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', margin: '0 auto', border: '1px solid #ddd' }}>
      {/* ¡AQUÍ USAMOS LA NUEVA RUTA! */}
      <img src={planoImgPath} alt="Plano del piso" style={{ width: '100%', display: 'block', height: 'auto' }} />

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
            texto={salaInfo.texto}
            textoSecundario={salaInfo.textoSecundario}
            color={salaInfo.color}
            onClick={onSalaClick}
            showReservarText={showReservarText}
          />
        );
      })}
    </div>
  );
};

export default PlanoSalas;