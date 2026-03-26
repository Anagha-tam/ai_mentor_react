'use client';

import React, { useMemo, useEffect } from 'react';
import { 
  useSession, 
  useConnectionState,
} from '@livekit/components-react';
import { ConnectionState, TokenSource } from 'livekit-client';
import { Bot, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentSessionProvider } from '../components/agent-session-provider';

// New Components and Hooks
import { useMentorLiveKit } from '../hooks/useMentorLiveKit';
import ChatPanel from '../components/ChatPanel';
import AvatarPanel from '../components/AvatarPanel';
import Header from '../components/Header';

import '@livekit/components-styles';

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

export default function ChatPage({ user, onLogout, sandboxId, roomName }) {
  const resolvedSandboxId = sandboxId || getEnv('SANDBOX_ID', 'aimentor-1t8exu');

  const resolvedRoomName = useMemo(() => roomName || makeUniqueRoomName("mentor"), [roomName]);


  const tokenSource = useMemo(
    () => TokenSource.sandboxTokenServer(resolvedSandboxId),
    [resolvedSandboxId],
  );

  const sessionOptions = useMemo(() => ({ roomName: resolvedRoomName }), [resolvedRoomName]);

  const session = useSession(tokenSource, sessionOptions);
  console.log("session",session)

  useEffect(() => {
    void session.start();
    return () => {
      void session.end();
    };
    // Intentionally run once on mount; session object identity changes with connection state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50 w-full text-left overflow-hidden">
      {/* Main Layout Content - Using Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        <AgentSessionProvider session={session}>
          <MentorSessionLayout user={user} onLogout={onLogout} />
        </AgentSessionProvider>
      </div>

      {/* Footer Info */}
      <footer className="w-full bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-30">
        <div className="max-w-4xl mx-auto w-full text-center">
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            Powered by <span className="text-green-600 font-bold">LiveKit AI</span>. Voice and Text interactions enabled.
          </p>
        </div>
      </footer>
    </div>
  );
}

function MentorSessionLayout({ user, onLogout }) {
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;

  const { agent, agentState, agentVideoTrack, isAgentSpeaking, isUserSpeaking } = useMentorLiveKit();

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* Header spanning full screen width */}
      <Header agentState={agentState} user={user} onLogout={onLogout} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Chat Transcript */}
        <div className="w-[40%] min-w-[360px] border-r border-gray-100 bg-white shadow-sm z-10">
          <ChatPanel agentState={agentState} user={user} onLogout={onLogout} />
        </div>

        {/* Right Panel: Avatar/Video */}
        <div className="flex-1 bg-slate-50 relative overflow-hidden">
          <AvatarPanel
            agent={agent}
            videoTrack={agentVideoTrack}
            isAgentSpeaking={isAgentSpeaking}
            isUserSpeaking={isUserSpeaking}
            agentState={agentState}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  );
}