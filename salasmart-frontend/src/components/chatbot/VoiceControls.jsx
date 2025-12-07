import React from 'react';
import { Mic, MicOff, Volume2, Pause, Square } from 'lucide-react';

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
        className={`px-4 py-2 text-xs rounded-lg ${
          isDark
            ? 'bg-red-900/20 text-red-400 border border-red-800/30'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}
      >
        ⚠️ Tu navegador no soporta voz. Usa Chrome, Edge o Safari.
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDark
          ? 'border-border-dark bg-neutral-900/50 backdrop-blur-sm'
          : 'border-gray-200 bg-white/80 backdrop-blur-sm'
      }`}
    >
      {/* Barra superior con estado */}
      <div
        className={`px-4 py-2 border-b flex items-center justify-between ${
          isDark ? 'border-border-dark bg-neutral-900' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          {isListening && (
            <>
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <span className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Escuchando...
              </span>
            </>
          )}
          {isSpeaking && !isListening && (
            <>
              <Volume2 size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
              <span className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Reproduciendo...
              </span>
            </>
          )}
          {!isListening && !isSpeaking && (
            <>
              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
              <span className={`text-xs ${isDark ? 'text-text-dark-secondary' : 'text-gray-600'}`}>
                Modo voz activo
              </span>
            </>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-3 space-y-3">
        {/* Botón principal de micrófono */}
        {!isListening ? (
          <button
            onClick={onStartListening}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all transform active:scale-95 ${
              isDark
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/30'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/30'
            }`}
          >
            <Mic size={20} />
            <span>Presiona para hablar</span>
          </button>
        ) : (
          <button
            onClick={onStopListening}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-900/30 transition-all transform active:scale-95 animate-pulse"
          >
            <Square size={20} fill="currentColor" />
            <span>Detener grabación</span>
          </button>
        )}

        {/* Transcripción en vivo */}
        {transcript && (
          <div
            className={`p-3 rounded-lg text-sm border ${
              isDark
                ? 'bg-blue-950/30 border-blue-800/30 text-text-dark-primary'
                : 'bg-blue-50 border-blue-200 text-gray-900'
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              📝 Transcripción
            </p>
            <p className="leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Controles de reproducción */}
        {isSpeaking && (
          <div className="flex gap-2">
            <button
              onClick={onPauseSpeech}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isDark
                  ? 'bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-300 border border-yellow-700/30'
                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200'
              }`}
            >
              <Pause size={16} />
              Pausar
            </button>
            <button
              onClick={onCancelSpeech}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isDark
                  ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-700/30'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              <Square size={16} />
              Detener
            </button>
          </div>
        )}

        {/* Indicador de reproducción sin transcripción */}
        {isSpeaking && !transcript && (
          <div className={`flex items-center justify-center gap-2 py-2 text-sm ${isDark ? 'text-text-dark-secondary' : 'text-gray-600'}`}>
            <div className="flex gap-1">
              <div className={`w-1 h-3 rounded-full animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '0ms' }}></div>
              <div className={`w-1 h-3 rounded-full animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '150ms' }}></div>
              <div className={`w-1 h-3 rounded-full animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>Escucha la respuesta...</span>
          </div>
        )}

        {/* Mensaje de ayuda */}
        {!isListening && !isSpeaking && !transcript && (
          <p className={`text-xs text-center ${isDark ? 'text-text-dark-secondary' : 'text-gray-500'}`}>
            💡 Presiona "Escuchar" para empezar
          </p>
        )}

        {/* Errores */}
        {error && (
          <div
            className={`px-3 py-2 text-xs rounded-lg border ${
              isDark
                ? 'bg-red-900/20 text-red-400 border-red-800/30'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceControls;
