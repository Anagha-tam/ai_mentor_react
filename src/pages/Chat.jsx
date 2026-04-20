'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  useSession,
  useConnectionState,
  useRoomContext,
  SessionProvider,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { ConnectionState, TokenSource } from 'livekit-client';
import { Volume2, LayoutDashboard, Zap, Beaker, Calculator, Dna, Clock, Timer, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentSessionProvider } from '../components/agent-session-provider';

import { useMentorLiveKit } from '../hooks/useMentorLiveKit';
import ChatPanel from '../components/ChatPanel';
import AvatarPanel from '../components/AvatarPanel';
import Sidebar from '../components/Sidebar';
import RoadmapView from './RoadmapView';

import '@livekit/components-styles';

const getEnv = (key, fallback = '') => {
  const v = import.meta.env[`VITE_${key}`];
  return v ?? fallback;
};

function AudioPermissionModal() {
  const room = useRoomContext();
  const [canPlay, setCanPlay] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const update = () => setCanPlay(room.canPlaybackAudio);
    update();
    room.on('audioPlaybackChanged', update);
    return () => { room.off('audioPlaybackChanged', update); };
  }, [room]);

  if (canPlay || dismissed) return null;

  const handleOk = () => {
    room.startAudio();
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-navy/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-brand-navy/10 w-full max-w-sm p-6 flex flex-col items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center">
          <Volume2 size={22} className="text-brand-orange" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-black text-brand-navy font-heading tracking-tight">Enable Audio</h2>
          <p className="mt-1.5 text-xs text-brand-navy/55 leading-relaxed">
            Your browser requires permission to play audio.<br />
            Click <span className="font-bold text-brand-navy">OK</span> to enable voice from your AI Mentor.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 h-10 rounded-xl border border-brand-navy/20 text-brand-navy/60 text-sm font-bold hover:bg-brand-navy/5 transition-all"
          >
            Close
          </button>
          <button
            onClick={handleOk}
            className="flex-1 h-10 rounded-xl bg-brand-orange text-white text-sm font-bold hover:bg-brand-orange-hover transition-all shadow-md shadow-brand-orange/20"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function makeUniqueRoomName(prefix) {
  const base = (prefix || 'mentor').trim() || 'mentor';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${base}-${crypto.randomUUID()}`;
  }
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function ChatPage({ user, onLogout, sandboxId, roomName }) {
  const resolvedSandboxId = sandboxId || getEnv('SANDBOX_ID', 'aimentor-1t8exu');
  const resolvedAgentName = getEnv('AGENT_NAME', 'ai-mentor-node');

  const resolvedRoomName = useMemo(() => roomName || makeUniqueRoomName("mentor"), [roomName]);

  const tokenSource = useMemo(
    () => TokenSource.sandboxTokenServer(resolvedSandboxId),
    [resolvedSandboxId],
  );

  const sessionOptions = useMemo(() => ({
    roomName: resolvedRoomName,
    agentName: resolvedAgentName
  }), [resolvedRoomName, resolvedAgentName]);

  const session = useSession(tokenSource, sessionOptions);
  console.log("session", session);

  useEffect(() => {
    void session.start();
    return () => {
      void session.end();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background w-full text-left overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <SessionProvider session={session}>
          <RoomAudioRenderer room={session?.room} />
          <AudioPermissionModal />
          <MentorSessionLayout user={user} onLogout={onLogout} />
        </SessionProvider>
      </div>

      {/* Footer Info - hidden to reduce vertical gap */}
      <footer className="w-full bg-background/80 backdrop-blur-md h-0 z-20">
        {/* <div className="max-w-2xl mx-auto w-full text-center">
          <p className="text-xs text-brand-navy/40 font-medium tracking-wide">
            Powered by <span className="text-green-600 font-bold">LiveKit AI</span>. Voice and Text interactions enabled.
          </p>
        </div> */}
      </footer>
    </div>
  );
}

function MentorSessionLayout({ user, onLogout }) {
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;

  const { agent, agentState, agentVideoTrack, isAgentSpeaking, isUserSpeaking } = useMentorLiveKit();
  const [isSidebarOpen] = React.useState(true);
  const [currentView, setCurrentView] = React.useState('chat');

  const [isStudying, setIsStudying] = React.useState(false);
  const [todaySeconds, setTodaySeconds] = React.useState(5.2 * 3600);

  React.useEffect(() => {
    let interval;
    if (isStudying) {
      interval = setInterval(() => {
        setTodaySeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying]);

  const formatHours = (seconds) => (seconds / 3600).toFixed(1);

  return (
    <div className="flex h-full w-full overflow-visible bg-background p-2 pb-0 gap-2">

      {/* Sidebar */}
      <div className="-mt-2 -ml-2 -mb-0 h-[calc(100%+8px)] overflow-visible z-30 relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onNavigate={setCurrentView}
          currentView={currentView}
          agentState={agentState}
          user={user}
          onLogout={onLogout}
        />
      </div>

      {/* Main area: content only */}
      <div className="flex flex-col flex-1 overflow-hidden h-full -mt-2 -mr-2">
        <div className="flex-1 overflow-hidden flex flex-col pt-1.5 min-h-0">
            {currentView === 'chat' && (
              <div className="flex-1 flex overflow-hidden gap-2 px-2 pb-1.5 min-h-0">
                {/* Left Panel: Avatar/Video & Planner */}
                <div className="w-[370px] shrink-0 overflow-hidden min-h-0">
                  <AvatarPanel
                    agent={agent}
                    videoTrack={agentVideoTrack}
                    isAgentSpeaking={isAgentSpeaking}
                    isUserSpeaking={isUserSpeaking}
                    agentState={agentState}
                    isConnected={isConnected}
                  />
                </div>

                {/* Right Panel: Chat Transcript */}
                <div className="flex-1 bg-white shadow-sm z-10 rounded-2xl overflow-hidden border border-brand-navy/10">
                  <ChatPanel agentState={agentState} user={user} onLogout={onLogout} />
                </div>
              </div>
            )}

        {currentView === 'dashboard' && (
          <div className="flex-1 bg-background overflow-y-auto custom-scrollbar p-2">
            <div className="w-full h-full overflow-hidden">
              {/* MAIN CONTAINER BOX */}
              <div className="bg-white rounded-2xl border border-brand-navy/10 shadow-sm p-6 h-full flex flex-col overflow-hidden">

                {/* Welcome Section */}
                <div className="mb-4">
                  <h1 className="text-xl md:text-2xl font-bold text-brand-navy font-heading">
                    Welcome back,{" "}
                    <span className="text-brand-orange">
                      {user?.firstName || 'Anagha'}
                    </span>
                  </h1>

                  <p className="mt-1 text-sm text-brand-navy/60">
                    Your{" "}
                    <span className="text-brand-orange font-semibold">
                      {user?.entranceExam || 'JEE'}
                    </span>{" "}
                    preparation is progressing steadily.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-brand-navy/10 my-4"></div>

                {/* Study Tracker Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-brand-orange/10 rounded-lg text-brand-orange">
                        <Clock size={18} />
                      </div>
                      <h2 className="text-base font-bold text-brand-navy font-heading">Study Time Tracker</h2>
                    </div>
                    <Button
                      onClick={() => setIsStudying(!isStudying)}
                      variant={isStudying ? "destructive" : "default"}
                      size="sm"
                      className={`rounded-xl px-4 py-1.5 font-bold flex items-center gap-2 transition-all shadow-md ${
                        isStudying
                          ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                          : 'bg-brand-orange hover:bg-brand-orange-hover shadow-brand-orange/20'
                      }`}
                    >
                      {isStudying ? <Pause size={14} /> : <Play size={14} />}
                      <span className="text-xs">{isStudying ? "Stop Session" : "Start Study Session"}</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-brand-navy/[0.03] border border-brand-navy/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isStudying ? 'bg-brand-orange text-white animate-pulse' : 'bg-brand-orange/10 text-brand-orange'} transition-all`}>
                          <Timer size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">Total Today</p>
                          <h3 className="text-xl font-black text-brand-navy leading-tight">
                            {formatHours(todaySeconds)} <span className="text-sm text-brand-navy/30">hrs</span>
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="bg-brand-navy/[0.03] border border-brand-navy/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                          <LayoutDashboard size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">Weekly Average</p>
                          <h3 className="text-xl font-black text-brand-navy leading-tight">
                            4.8 <span className="text-sm text-brand-navy/30">hrs</span>
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-brand-navy/10 my-4"></div>

                {/* Performance Section */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-brand-navy font-heading">
                      Performance Overview
                    </h2>
                    <p className="text-xs text-brand-navy/40">
                      Latest Test Scores
                    </p>
                  </div>

                  {/* Subject Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'Physics', icon: Zap, color: 'bg-amber-500', iconColor: 'text-amber-500', bg: 'bg-amber-50', score: user?.latestscore?.physics || '85', progress: 75 },
                      { name: 'Chemistry', icon: Beaker, color: 'bg-emerald-500', iconColor: 'text-emerald-500', bg: 'bg-emerald-50', score: user?.latestscore?.chemistry || '78', progress: 62 },
                      { name: 'Maths', icon: Calculator, color: 'bg-blue-500', iconColor: 'text-blue-500', bg: 'bg-blue-50', score: user?.latestscore?.maths || '92', progress: 88 },
                      { name: 'Biology', icon: Dna, color: 'bg-rose-500', iconColor: 'text-rose-500', bg: 'bg-rose-50', score: user?.latestscore?.biology || '88', progress: 70 },
                    ].map((sub) => (
                      <div key={sub.name} className="bg-white p-5 rounded-2xl border border-brand-navy/10 hover:shadow-lg transition-all flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className={`p-2.5 rounded-xl ${sub.bg} ${sub.iconColor}`}>
                            <sub.icon size={20} />
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-brand-navy/30 uppercase tracking-wider mb-0.5">Marks</p>
                            <p className="text-xl font-black text-brand-navy leading-tight">{sub.score}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-brand-navy mb-3">{sub.name}</h3>
                          <div className="w-full h-1.5 bg-brand-navy/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${sub.color} rounded-full`}
                              style={{ width: `${sub.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-[10px] text-brand-navy/40 font-medium">Progress</span>
                            <span className="text-[10px] text-brand-navy/60 font-bold">{sub.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}


        {currentView === 'study-plan' && (
          <RoadmapView />
        )}

      </div>
    </div>
  </div>
  );
}
