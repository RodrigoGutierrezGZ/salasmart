import { useState, useEffect, useRef } from 'react';

const useVoiceChat = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Inicializar reconocimiento de voz
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Iniciar escucha
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    }
  };

  // Detener escucha
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Hablar (text-to-speech)
  const speak = (text, onComplete = null) => {
    // Detener cualquier síntesis en curso
    window.speechSynthesis.cancel();

    if (!text || !window.speechSynthesis) {
      return;
    }

    // Limpiar el texto antes de leerlo
    let cleanText = text
      // Remover emojis (todos los caracteres Unicode de emoji)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticones
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Símbolos y pictogramas
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte y símbolos de mapa
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Símbolos alquímicos
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Símbolos geométricos extendidos
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Flechas suplementarias-C
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Símbolos y pictogramas suplementarios
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Símbolos de ajedrez
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Símbolos y pictogramas extendidos-A
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Símbolos diversos
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Selectores de variación
      .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '') // Banderas
      // Remover markdown
      .replace(/\*\*/g, '')                    // Negrita **texto**
      .replace(/\*/g, '')                      // Cursiva *texto*
      .replace(/#{1,6}\s/g, '')                // Headers # ## ###
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links [texto](url) -> texto
      .replace(/`{1,3}[^`]*`{1,3}/g, '')       // Código `code` ```code```
      .replace(/^\s*[-*+]\s/gm, '')            // Listas - * +
      .replace(/^\s*\d+\.\s/gm, '')            // Listas numeradas 1. 2.
      .replace(/>\s/g, '')                     // Citas >
      .replace(/---/g, '')                     // Separadores ---
      .replace(/_{2,}/g, '')                   // Underscores múltiples
      // Limpiar espacios múltiples y saltos de línea excesivos
      .replace(/\n{3,}/g, '\n\n')              // Máximo 2 saltos de línea
      .replace(/\s{2,}/g, ' ')                 // Espacios múltiples a uno solo
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };

    utterance.onerror = (event) => {
      // No mostrar error si fue interrumpido manualmente (pausar/detener es normal)
      if (event.error === 'interrupted' || event.error === 'canceled') {
        setIsSpeaking(false);
        return;
      }
      setError(`Error en síntesis: ${event.error}`);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Pausar síntesis
  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
      setIsPaused(true);
    }
  };

  // Reanudar síntesis
  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  // Cancelar síntesis
  const cancelSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return {
    isListening,
    transcript,
    isSpeaking,
    isPaused,
    isSupported,
    error,
    startListening,
    stopListening,
    speak,
    pauseSpeech,
    resumeSpeech,
    cancelSpeech,
    setTranscript,
  };
};

export default useVoiceChat;
