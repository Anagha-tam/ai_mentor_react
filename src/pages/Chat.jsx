'use client';

import React, { useMemo, useEffect } from 'react';
import { 
  useSession, 
  useConnectionState,
  StartAudio,
  SessionProvider,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { ConnectionState, TokenSource } from 'livekit-client';
import { Bot, User, LogOut, LayoutDashboard, Zap, Beaker, Calculator, Dna, Clock, Timer, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentSessionProvider } from '../components/agent-session-provider';

// New Components and Hooks
import { useMentorLiveKit } from '../hooks/useMentorLiveKit';
import ChatPanel from '../components/ChatPanel';
import AvatarPanel from '../components/AvatarPanel';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

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
        <SessionProvider session={session}>
          <RoomAudioRenderer room={session?.room} />
          <StartAudio label="Enable Audio" />
          <MentorSessionLayout user={user} onLogout={onLogout} />
        </SessionProvider>
      </div>

      {/* Footer Info */}
      <footer className="w-full bg-white/80 backdrop-blur-md  p-4 z-30">
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [currentView, setCurrentView] = React.useState('chat');

  // Study Tracker State
  const [isStudying, setIsStudying] = React.useState(false);
  const [todaySeconds, setTodaySeconds] = React.useState(5.2 * 3600); // Initial 5.2 hrs in seconds
  
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
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* Header spanning full screen width */}
      <Header agentState={agentState} user={user} onLogout={onLogout} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onNavigate={setCurrentView} 
          currentView={currentView} 
        />

        {currentView === 'chat' && (
          <>
            {/* Left Panel: Chat Transcript */}
            <div className="w-[40%] min-w-[550px] border-r border-gray-100 bg-white shadow-sm z-10">
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
          </>
        )}

        {currentView === 'dashboard' && (
          <div className="flex-1 bg-slate-50 overflow-y-auto">
             <div className="w-full h-full px-4 py-4 overflow-hidden">
  {/* MAIN CONTAINER BOX */}
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 h-full flex flex-col overflow-hidden">

    {/* Welcome Section */}
    <div className="mb-4">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900">
        Welcome back,{" "}
        <span className="text-indigo-600">
          {user?.firstName || 'Anagha'}
        </span>
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Your{" "}
        <span className="text-indigo-600 font-semibold">
          {user?.entranceExam || 'JEE'}
        </span>{" "}
        preparation is progressing steadily.
      </p>
    </div>

    {/* Divider */}
    <div className="border-t border-slate-100 my-4"></div>

    {/* Study Tracker Section */}
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Clock size={18} />
          </div>
          <h2 className="text-base font-bold text-slate-900">Study Time Tracker</h2>
        </div>
        <Button 
          onClick={() => setIsStudying(!isStudying)}
          variant={isStudying ? "destructive" : "default"}
          size="sm"
          className={`rounded-xl px-4 py-1.5 font-bold flex items-center gap-2 transition-all shadow-md ${
            isStudying 
              ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {isStudying ? <Pause size={14} /> : <Play size={14} />}
          <span className="text-xs">{isStudying ? "Stop Session" : "Start Study Session"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Today</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">
              {formatHours(todaySeconds)} <span className="text-lg text-slate-400 font-bold">hrs</span>
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${isStudying ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-slate-400'} border border-slate-100 shadow-sm transition-all`}>
            <Timer size={20} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weekly Average</p>
            <h3 className="text-2xl font-black text-slate-900 leading-none">
              4.8 <span className="text-lg text-slate-400 font-bold">hrs</span>
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-white text-slate-400 border border-slate-100 shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
            <LayoutDashboard size={20} />
          </div>
        </div>
      </div>
    </div>


    {/* Divider */}
    <div className="border-t border-slate-100 my-4"></div>

    {/* Performance Section */}
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900">
          Performance Overview
        </h2>
        <p className="text-xs text-slate-400">
          Latest Test Scores
        </p>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 overflow-hidden">
        {[
          { name: 'Physics', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', score: user?.latestscore?.physics || '85', progress: 75 },
          { name: 'Chemistry', icon: Beaker, color: 'text-emerald-500', bg: 'bg-emerald-50', score: user?.latestscore?.chemistry || '78', progress: 62 },
          { name: 'Maths', icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-50', score: user?.latestscore?.maths || '92', progress: 88 },
          { name: 'Biology', icon: Dna, color: 'text-rose-500', bg: 'bg-rose-50', score: user?.latestscore?.biology || '88', progress: 70 },
        ].map((sub) => (
          <div key={sub.name} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between">
            
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${sub.bg} ${sub.color}`}>
                <sub.icon size={18} />
              </div>

              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Marks
                </p>
                <p className="text-base font-black text-slate-900 leading-none">
                  {sub.score}
                </p>
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-800 mb-2">
              {sub.name}
            </h3>

            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${sub.bg.replace('50', '500')} rounded-full`}
                style={{ width: `${sub.progress}%` }}
              />
            </div>

          </div>
        ))}
      </div>
    </div>

  </div>
</div>
          </div>
        )}
      </div>
    </div>
  );
}