import { useMemo } from 'react';
import { TokenSource } from 'livekit-client';

const MENTOR_TOKEN_STORAGE_KEYS = ['ai_mentor_token', 'token'];

function readStoredMentorToken() {
  if (typeof window === 'undefined') return '';
  for (const key of MENTOR_TOKEN_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  return '';
}

/**
 * Creates a LiveKit TokenSource that obtains credentials from the ai_mentor_node
 * backend's POST /avatar/bey/session endpoint (instead of LiveKit's sandbox).
 *
 * The backend returns `{ livekitUrl, participantToken, roomName }`; we map it
 * to the TokenSourceResponseObject shape `{ serverUrl, participantToken }`
 * expected by `useSession`.
 */
export function useAvatarTokenSource(apiBaseUrl) {
  return useMemo(() => {
    const base = String(apiBaseUrl || '').replace(/\/$/, '');
    return TokenSource.custom(async () => {
      const jwt = readStoredMentorToken();
      const response = await fetch(`${base}/avatar/bey/session`, {
        method: 'POST',
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
      });
      const text = await response.text();
      let payload = null;
      try { payload = text ? JSON.parse(text) : {}; } catch { payload = {}; }
      if (!response.ok) {
        throw new Error(payload?.message || `Avatar session failed (${response.status})`);
      }
      if (!payload?.livekitUrl || !payload?.participantToken) {
        throw new Error('Avatar session response missing livekitUrl / participantToken.');
      }
      return {
        serverUrl: payload.livekitUrl,
        participantToken: payload.participantToken,
      };
    });
  }, [apiBaseUrl]);
}

export async function endAvatarSession(apiBaseUrl) {
  try {
    const base = String(apiBaseUrl || '').replace(/\/$/, '');
    const jwt = readStoredMentorToken();
    await fetch(`${base}/avatar/bey/end`, {
      method: 'POST',
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    });
  } catch {
    // best effort
  }
}
