import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const MENTOR_TOKEN_STORAGE_KEYS = ['ai_mentor_token', 'token'];

function readStoredMentorToken() {
  if (typeof window === 'undefined') return '';
  for (const key of MENTOR_TOKEN_STORAGE_KEYS) {
    const v = window.localStorage.getItem(key);
    if (v) return v;
  }
  return '';
}

function computeSocketConfig(apiBaseUrl) {
  try {
    const parsed = new URL(apiBaseUrl);
    return {
      url: parsed.origin,
      path: `${parsed.pathname.replace(/\/$/, '')}/socket.io`,
    };
  } catch {
    return {
      url: typeof window !== 'undefined' ? window.location.origin : '',
      path: '/socket.io',
    };
  }
}

/**
 * Connects to the ai_mentor_node backend's Socket.IO endpoint and exposes
 * conversation history + readiness signals so the Chat UI can hydrate
 * prior messages and show session status.
 */
export function useMentorSocket(apiBaseUrl) {
  const socketRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!apiBaseUrl) return;
    const jwt = readStoredMentorToken();
    if (!jwt) {
      setError('No mentor auth token available. Log in to start the mentor session.');
      return;
    }

    const { url, path } = computeSocketConfig(apiBaseUrl);
    const socket = io(url, {
      transports: ['websocket'],
      path,
      auth: { token: jwt },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      setStatus('connected');
      setError('');
    });
    socket.on('connect_error', (err) => {
      setStatus('error');
      setError(err?.message || 'Socket connection failed.');
    });
    socket.on('disconnect', () => setStatus('offline'));
    socket.on('session_ready', () => setSessionReady(true));
    socket.on('conversation_history', ({ messages } = {}) => {
      if (!Array.isArray(messages)) return;
      const hydrated = messages
        .filter((m) => m && typeof m.text === 'string' && m.text.trim())
        .map((m, i) => ({
          id: `history-${m.id || i}`,
          role: m.role === 'assistant' ? 'agent' : m.role === 'user' ? 'user' : 'system',
          text: String(m.text || '').trim(),
          timestamp: m.timestamp || Date.now() + i,
          source: 'voice',
        }));
      setHistory(hydrated);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiBaseUrl]);

  return { socketRef, history, sessionReady, status, error };
}
