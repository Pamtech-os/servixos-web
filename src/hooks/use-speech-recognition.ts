'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// The Web Speech recognition API is not in TypeScript's DOM lib; these cover what we use.
interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  0: RecognitionAlternative;
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

const getRecognitionCtor = (): RecognitionCtor | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const noopSubscribe = () => () => {};

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser settings to talk.',
  'service-not-allowed': 'Microphone access is blocked. Allow it in your browser settings to talk.',
  'audio-capture': 'No microphone was found.',
  network: 'Voice input needs an internet connection.',
};

interface UseSpeechRecognitionOptions {
  /** Called once when recording ends, with everything that was said. */
  onFinish: (transcript: string) => void;
}

export function useSpeechRecognition({ onFinish }: UseSpeechRecognitionOptions) {
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(getRecognitionCtor()),
    () => false
  );
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');

  const recognitionRef = useRef<Recognition | null>(null);
  const finalRef = useRef('');
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;

    const recognition = new Ctor();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    finalRef.current = '';

    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) finalRef.current += `${result[0].transcript} `;
        else interim += result[0].transcript;
      }
      setInterimTranscript(`${finalRef.current}${interim}`.trim());
    };
    recognition.onerror = (e) => {
      // 'aborted' comes from our own cancel; 'no-speech' just ends an empty recording.
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        setError(ERROR_MESSAGES[e.error] ?? 'Voice input stopped unexpectedly. Please try again.');
      }
    };
    // Fires for stop(), abort(), errors and the browser's own silence timeout.
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setInterimTranscript('');
      const transcript = finalRef.current.trim();
      finalRef.current = '';
      if (transcript) onFinishRef.current(transcript);
    };

    setError('');
    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError('Could not start voice input. Please try again.');
    }
  }, []);

  const stop = useCallback(() => recognitionRef.current?.stop(), []);

  /** Ends recording without delivering the transcript. */
  const cancel = useCallback(() => {
    finalRef.current = '';
    recognitionRef.current?.abort();
  }, []);

  useEffect(() => () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onend = null;
    recognition.abort();
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    error,
    clearError: () => setError(''),
    start,
    stop,
    cancel,
  };
}
