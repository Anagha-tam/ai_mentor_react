import React, { useEffect, useMemo } from 'react';
import {
  SessionProvider,
  RoomAudioRenderer,
  StartAudio,
  useConnectionState,
  useSession,
} from '@livekit/components-react';
import { ConnectionState, TokenSource } from 'livekit-client';
import '@livekit/components-styles';

import { useMentorLiveKit } from './hooks/useMentorLiveKit';
import ChatPanel from './components/ChatPanel';
import AvatarPanel from './components/AvatarPanel';

const getEnv = (key, fallback = '') => {
  const v = import.meta.env[`VITE_${key}`];
  return v ?? fallback;
};

/** New LiveKit room id on every page load (unless `roomName` prop is set). */
function makeUniqueRoomName(prefix) {
  const base = (prefix || 'mentor').trim() || 'mentor';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${base}-${crypto.randomUUID()}`;
  }
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * AI Mentor page — split-pane layout with LiveKit Session API (sandbox token server).
 * See: https://docs.livekit.io/frontends/build/authentication/sandbox-token-server/
 */
const AIMentorPage = ({ sandboxId, roomName, agentName } = {}) => {
  const resolvedSandboxId = sandboxId || getEnv('SANDBOX_ID');
  const resolvedAgentName = agentName || getEnv('AGENT_NAME', 'ai-mentor-node');

  const resolvedRoomName = useMemo(() => {
    if (roomName != null && String(roomName).trim() !== '') {
      return String(roomName).trim();
    }
    const prefix = getEnv('ROOM_PREFIX', getEnv('ROOM_NAME', 'mentor'));
    return makeUniqueRoomName(prefix);
  }, [roomName]);

  if (!resolvedSandboxId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-center px-6 max-w-md">
          <p className="text-destructive text-sm">
            Set <code className="text-xs">VITE_SANDBOX_ID</code> in <code className="text-xs">.env</code>{' '}
            or pass <code className="text-xs">sandboxId</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AIMentorSession
      sandboxId={resolvedSandboxId}
      roomName={resolvedRoomName}
      agentName={resolvedAgentName}
    />
  );
};

/**
 * Holds useSession + SessionProvider; must only mount when sandbox id is valid.
 */
function AIMentorSession({ sandboxId, roomName, agentName }) {
  const tokenSource = useMemo(
    () => TokenSource.sandboxTokenServer(sandboxId),
    [sandboxId],
  );

  const sessionOptions = useMemo(
    () => ({ roomName, agentName }),
    [roomName, agentName]
  );

  const session = useSession(tokenSource, sessionOptions);

  useEffect(() => {
    void session.start();
    return () => {
      void session.end();
    };
    // Intentionally run once on mount; session object identity changes with connection state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionProvider session={session}>
      <RoomAudioRenderer room={session.room} />
      <StartAudio label="Enable Audio" />
      <MentorSessionLayout />
    </SessionProvider>
  );
}

function MentorSessionLayout() {
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;

  const { agentState, agentVideoTrack, isAgentSpeaking, isUserSpeaking } = useMentorLiveKit();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-[45%] min-w-[320px] border-r border-border">
        <ChatPanel agentState={agentState} />
      </div>

      <div className="flex-1">
        <AvatarPanel
          videoTrack={agentVideoTrack}
          isAgentSpeaking={isAgentSpeaking}
          isUserSpeaking={isUserSpeaking}
          agentState={agentState}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}

export default AIMentorPage;
