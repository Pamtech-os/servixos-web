'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  streamOnboardingChat,
  type ChatMessage,
  type OnboardingSession,
  type WebsitePreview,
} from '@/lib/api-client';
import { HttpError, getApiErrorMessage } from '@/common/network/http-client';
import { ONBOARDING_PREVIEW_KEY, ONBOARDING_SESSION_KEY } from '@/hooks/queries/use-onboarding';

export const MAX_CHAT_MESSAGE_LENGTH = 2000;

/**
 * Sends workspace chat messages and applies the streamed events: text grows the live
 * assistant bubble, while section / starting_point / website events update the cached
 * session and preview so the profile panel and site preview re-render as the AI works.
 */
export function useOnboardingChat() {
  const queryClient = useQueryClient();
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateSession = useCallback(
    (fn: (prev: OnboardingSession) => OnboardingSession) => {
      queryClient.setQueryData<OnboardingSession>([ONBOARDING_SESSION_KEY], (prev) =>
        prev ? fn(prev) : prev
      );
    },
    [queryClient]
  );

  const appendMessage = useCallback(
    (role: ChatMessage['role'], content: string) => {
      updateSession((prev) => ({
        ...prev,
        messages: [...prev.messages, { role, content, createdAt: new Date().toISOString() }],
      }));
    },
    [updateSession]
  );

  const send = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || message.length > MAX_CHAT_MESSAGE_LENGTH || abortRef.current) return;

      const controller = new AbortController();
      abortRef.current = controller;
      setError('');
      setIsStreaming(true);
      setStreamingText('');
      appendMessage('user', message);

      // Accumulated outside React state so the final message isn't lost to batching.
      let reply = '';
      const flushReply = () => {
        if (reply.trim()) appendMessage('assistant', reply);
        reply = '';
        setStreamingText('');
      };

      try {
        for await (const event of streamOnboardingChat(message, controller.signal)) {
          switch (event.type) {
            case 'text':
              reply += event.delta;
              setStreamingText(reply);
              break;
            case 'section':
              updateSession((prev) => ({
                ...prev,
                profile: { ...prev.profile, [event.section]: event.data },
              }));
              break;
            case 'starting_point':
              updateSession((prev) => ({ ...prev, startingPoint: event.startingPoint }));
              break;
            case 'website':
              queryClient.setQueryData<WebsitePreview>([ONBOARDING_PREVIEW_KEY], event.preview);
              break;
            case 'error':
              setError(`${event.message} Your progress is saved — you can send that again.`);
              break;
            case 'done':
              break;
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof HttpError && err.status === 409
              ? 'A reply is still on its way. Wait for it to finish, then try again.'
              : getApiErrorMessage(err)
          );
        }
      } finally {
        flushReply();
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [appendMessage, updateSession, queryClient]
  );

  /** Closing the connection cancels the reply server-side. */
  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { send, stop, streamingText, isStreaming, error, clearError: () => setError('') };
}
