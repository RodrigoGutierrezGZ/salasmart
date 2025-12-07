import { useState, useEffect, useRef } from 'react';

const useVoiceChat = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  // Limpiar texto para síntesis de voz
  const cleanTextForSpeech = (text) => {
    if (!text) return '';

    return text
      // Remover markdown
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Negritas
      .replace(/\*([^*]+)\*/g, '$1') // Cursivas
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/`([^`]+)`/g, '$1') // Código inline
      .replace(/```[\s\S]*?```/g, '') // Bloques de código
      .replace(/#{1,6}\s/g, '') // Headers
      .replace(/[-*+]\s/g, '') // Listas
      .replace(/\d+\.\s/g, '') // Listas numeradas
      .replace(/[_~]/g, '') // Subrayado y tachado
      // Remover caracteres especiales problemáticos
      .replace(/[\n\r]+/g, '. ') // Saltos de línea → pausas
      .replace(/\s+/g, ' ') // Múltiples espacios → uno solo
      // Mejorar puntuación para pausas naturales
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Añadir espacio después de puntuación
      .replace(/,/g, ', ') // Pausas en comas
      .trim();
  };

  // Hablar (text-to-speech)
  const speak = (text, onComplete = null) => {
    // Detener cualquier síntesis en curso
    window.speechSynthesis.cancel();

    if (!text || !window.speechSynthesis) {
      return;
    }

    // Limpiar texto antes de hablar
    const cleanText = cleanTextForSpeech(text);

    if (!cleanText) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95; // Ligeramente más lento para mejor comprensión
    utterance.pitch = 1.05; // Ligeramente más agudo para sonar más natural
    utterance.volume = 1;

    // Intentar usar una voz española si está disponible
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(
      (voice) =>
        voice.lang.startsWith('es-') &&
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    ) || voices.find((voice) => voice.lang.startsWith('es-'));

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };

    utterance.onerror = (event) => {
      setError(`Error en síntesis: ${event.error}`);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Pausar síntesis
  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
    }
  };

  // Reanudar síntesis
  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeaking(true);
    }
  };

  // Cancelar síntesis
  const cancelSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Cargar voces cuando estén disponibles
  useEffect(() => {
    if (window.speechSynthesis) {
      // Cargar voces inicialmente
      window.speechSynthesis.getVoices();
      
      // Recargar cuando cambien (en algunos navegadores se cargan async)
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return {
    isListening,
    transcript,
    isSpeaking,
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
