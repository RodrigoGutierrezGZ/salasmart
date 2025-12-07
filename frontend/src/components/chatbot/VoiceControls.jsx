import React from 'react';

const VoiceControls = ({
  isListening,
  isSpeaking,
  transcript,
  error,
  onStartListening,
  onStopListening,
  onPauseSpeech,
  onCancelSpeech,
  isSupported,
  isDark,
}) => {
  if (!isSupported) {
    return (
      <div
        className={`p-3 text-sm rounded-lg ${
          isDark
            ? 'bg-red-900/20 text-red-400'
            : 'bg-red-100 text-red-700'
        }`}
      >
        Tu navegador no soporta voz. Usa Chrome, Edge o Firefox.
      </div>
    );
  }

  return (
    <div
      className={`space-y-3 p-4 rounded-lg border ${
        isDark
          ? 'border-border-dark bg-neutral-900'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Controles de micrófono */}
      <div className="flex gap-2">
        {!isListening ? (
          <button
            onClick={onStartListening}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">mic</span>
            Escuchar
          </button>
        ) : (
          <button
            onClick={onStopListening}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition animate-pulse"
          >
            <span className="material-symbols-outlined text-lg">mic_off</span>
            Grabando...
          </button>
        )}
      </div>

      {/* Mostrar transcripción */}
      {transcript && (
        <div
          className={`p-3 rounded-lg text-sm ${
            isDark
              ? 'bg-card-bg-dark border border-border-dark text-text-dark-primary'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          <p className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-1`}>
            Detectado:
          </p>
          <p>{transcript}</p>
        </div>
      )}

      {/* Controles de reproducción de voz */}
      {isSpeaking && (
        <div className="flex gap-2">
          <button
            onClick={onPauseSpeech}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              isDark
                ? 'bg-yellow-700 hover:bg-yellow-800 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            Pausar
          </button>
          <button
            onClick={onCancelSpeech}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              isDark
                ? 'bg-red-700 hover:bg-red-800 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Detener
          </button>
        </div>
      )}

      {isSpeaking && !transcript && (
        <div className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-lg" style={{animation: 'pulse 1s infinite'}}>
            volume_2
          </span>
          <span className={isDark ? 'text-text-dark-secondary' : 'text-gray-600'}>
            Reproduciendo respuesta...
          </span>
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div
          className={`p-3 text-sm rounded-lg ${
            isDark
              ? 'bg-red-900/20 text-red-400'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceControls;
