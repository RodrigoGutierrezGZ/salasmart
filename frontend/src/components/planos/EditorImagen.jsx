/**
 * Componente EditorImagen - Editor de imagen con crop y rotate antes de subir
 * Sin dependencias externas, usando Canvas API
 */

import React, { useState, useRef, useEffect } from 'react';

function EditorImagen({ imagenFile, onGuardar, onCancelar }) {
  const [imagenOriginal, setImagenOriginal] = useState(null);
  const [rotacion, setRotacion] = useState(0);
  const [escala, setEscala] = useState(1);
  const [recorte, setRecorte] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [arrastrando, setArrastrando] = useState(false);
  const [posicionInicio, setPosicionInicio] = useState({ x: 0, y: 0 });
  const [cargando, setCargando] = useState(false);

  const canvasRef = useRef(null);
  const contenedorRef = useRef(null);

  // Cargar imagen al montar
  useEffect(() => {
    if (imagenFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImagenOriginal(img);
          // Inicializar recorte al tamaño de la imagen
          setRecorte({
            x: 0,
            y: 0,
            width: img.width,
            height: img.height
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imagenFile);
    }
  }, [imagenFile]);

  // Dibujar canvas cuando cambien los parámetros
  useEffect(() => {
    if (imagenOriginal && canvasRef.current) {
      dibujarCanvas();
    }
  }, [imagenOriginal, rotacion, escala, recorte]);

  const dibujarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imagenOriginal) return;

    const ctx = canvas.getContext('2d');
    
    // Calcular dimensiones con rotación
    const radianes = (rotacion * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radianes));
    const sin = Math.abs(Math.sin(radianes));
    
    const anchoRotado = imagenOriginal.width * cos + imagenOriginal.height * sin;
    const altoRotado = imagenOriginal.width * sin + imagenOriginal.height * cos;
    
    // Establecer tamaño del canvas
    canvas.width = anchoRotado * escala;
    canvas.height = altoRotado * escala;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar transformaciones
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radianes);
    ctx.scale(escala, escala);
    ctx.drawImage(
      imagenOriginal,
      -imagenOriginal.width / 2,
      -imagenOriginal.height / 2,
      imagenOriginal.width,
      imagenOriginal.height
    );
    ctx.restore();

    // Dibujar área de recorte
    if (recorte.width > 0 && recorte.height > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(recorte.x * escala, recorte.y * escala, recorte.width * escala, recorte.height * escala);
      ctx.setLineDash([]);
    }
  };

  const handleRotarIzquierda = () => {
    setRotacion((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotarDerecha = () => {
    setRotacion((prev) => (prev + 90) % 360);
  };

  const handleZoomMas = () => {
    setEscala((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomMenos = () => {
    setEscala((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleResetear = () => {
    setRotacion(0);
    setEscala(1);
    if (imagenOriginal) {
      setRecorte({
        x: 0,
        y: 0,
        width: imagenOriginal.width,
        height: imagenOriginal.height
      });
    }
  };

  const handleGuardar = async () => {
    setCargando(true);
    try {
      // Crear canvas final con la imagen procesada
      const canvasFinal = document.createElement('canvas');
      const ctx = canvasFinal.getContext('2d');

      // Aplicar rotación y escala
      const radianes = (rotacion * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radianes));
      const sin = Math.abs(Math.sin(radianes));
      
      const anchoFinal = imagenOriginal.width * cos + imagenOriginal.height * sin;
      const altoFinal = imagenOriginal.width * sin + imagenOriginal.height * cos;
      
      canvasFinal.width = anchoFinal;
      canvasFinal.height = altoFinal;
      
      ctx.translate(canvasFinal.width / 2, canvasFinal.height / 2);
      ctx.rotate(radianes);
      ctx.drawImage(
        imagenOriginal,
        -imagenOriginal.width / 2,
        -imagenOriginal.height / 2,
        imagenOriginal.width,
        imagenOriginal.height
      );

      // Convertir a Blob
      const blob = await new Promise((resolve) => {
        canvasFinal.toBlob(resolve, imagenFile.type || 'image/jpeg', 0.9);
      });

      // Crear File desde Blob con el nombre original
      const archivoEditado = new File([blob], imagenFile.name, {
        type: imagenFile.type || 'image/jpeg',
        lastModified: Date.now()
      });

      onGuardar(archivoEditado);
    } catch (error) {
      console.error('Error al guardar imagen editada:', error);
      alert('Error al procesar la imagen');
    } finally {
      setCargando(false);
    }
  };

  if (!imagenOriginal) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
            edit
          </span>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Editor de Imagen
          </h3>
        </div>
        <button
          onClick={onCancelar}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        {/* Rotación */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRotarIzquierda}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Rotar 90° a la izquierda"
          >
            <span className="material-symbols-outlined">rotate_left</span>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
            {rotacion}°
          </span>
          <button
            onClick={handleRotarDerecha}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Rotar 90° a la derecha"
          >
            <span className="material-symbols-outlined">rotate_right</span>
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleZoomMenos}
            disabled={escala <= 0.5}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Alejar"
          >
            <span className="material-symbols-outlined">zoom_out</span>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
            {Math.round(escala * 100)}%
          </span>
          <button
            onClick={handleZoomMas}
            disabled={escala >= 3}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Acercar"
          >
            <span className="material-symbols-outlined">zoom_in</span>
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={handleResetear}
          className="ml-auto p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          title="Restablecer"
        >
          <span className="material-symbols-outlined">restart_alt</span>
          <span className="text-sm">Restablecer</span>
        </button>
      </div>

      {/* Canvas de previsualización */}
      <div
        ref={contenedorRef}
        className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto border-2 border-gray-300 dark:border-gray-600"
        style={{ maxHeight: '500px' }}
      >
        <canvas
          ref={canvasRef}
          className="mx-auto"
          style={{ display: 'block' }}
        />
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300">
          <span className="material-symbols-outlined text-base">info</span>
          <div>
            <p className="font-medium mb-1">Vista previa de edición</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Usa los controles para rotar y ajustar el zoom de la imagen. Los cambios se aplicarán al guardar.
            </p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancelar}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={cargando}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">
            {cargando ? 'hourglass_empty' : 'check'}
          </span>
          {cargando ? 'Procesando...' : 'Aplicar y Continuar'}
        </button>
      </div>
    </div>
  );
}

export default EditorImagen;
