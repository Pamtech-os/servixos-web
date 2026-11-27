'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

// Chrome silently stops long utterances after ~15s, so text is queued as short chunks.
const MAX_CHUNK_LENGTH = 200;

const toSpeakableText = (text: string) =>
  text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#`>~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Splits on sentence ends, then packs sentences into chunks of at most MAX_CHUNK_LENGTH. O(n). */
const chunkText = (text: string): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > MAX_CHUNK_LENGTH) {
      chunks.push(current.trim());
      current = '';
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

export function useSpeechSynthesis() {
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    () => false
  );
  // Which message is being read, so only its button shows the stop state.
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback((id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const chunks = chunkText(toSpeakableText(text));
    if (!chunks.length) return;

    const lang = navigator.language || 'en-US';
    const voice =
      synth.getVoices().find((v) => v.lang === lang) ??
      synth.getVoices().find((v) => v.lang.startsWith(lang.split('-')[0]));

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = lang;
      if (voice) utterance.voice = voice;
      if (index === chunks.length - 1) {
        // Only clear if a newer speak() hasn't taken over in the meantime.
        utterance.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
      }
      utterance.onerror = (e) => {
        // cancel() fires these on queued chunks; stop()/speak() already set the state.
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        setSpeakingId((cur) => (cur === id ? null : cur));
      };
      synth.speak(utterance);
    });
    setSpeakingId(id);
  }, []);

  useEffect(() => stop, [stop]);

  return { isSupported, speakingId, speak, stop };
}
