'use client';

import React, { useMemo, useEffect } from 'react';
import { 
  useSession, 
  useConnectionState,
} from '@livekit/components-react';
import { ConnectionState, TokenSource } from 'livekit-client';
import { Bot, User, LogOut, LayoutDashboard, Zap, Beaker, Calculator, Dna, TrendingUp } from 'lucide-react';
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
    
    <div className="max-w-5xl px-6 py-8">
      
      {/* Welcome Card */}
        
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome back,{" "}
          <span className="text-indigo-600">
            {user?.firstName || 'Anagha'}
          </span>
        </h1>

        <p className="mt-2 text-base text-slate-500">
          Your{" "}
          <span className="text-indigo-600 font-semibold">
            {user?.entranceExam || 'JEE'}
          </span>{" "}
          preparation is progressing steadily.
        </p>
{/*  */}

      </div>

      {/* Subject Grid */}
      <div className="max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Physics', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', score: user?.latestscore?.physics || '85', progress: 75 },
            { name: 'Chemistry', icon: Beaker, color: 'text-emerald-500', bg: 'bg-emerald-50', score: user?.latestscore?.chemistry || '78', progress: 62 },
            { name: 'Maths', icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-50', score: user?.latestscore?.maths || '92', progress: 88 },
            { name: 'Biology', icon: Dna, color: 'text-rose-500', bg: 'bg-rose-50', score: user?.latestscore?.biology || '88', progress: 70  },
          ].map((sub) => (
            <div key={sub.name} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-2xl ${sub.bg} ${sub.color}`}>
                  <sub.icon size={20} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Latest Test Marks</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{sub.score}</p>
                </div>
              </div>
              
              <h3 className="text-sm font-bold text-slate-800 mb-4">{sub.name}</h3>
              
              <div className="space-y-3">
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${sub.bg.replace('bg-', 'bg-').replace('50', '500')} rounded-full transition-all duration-1000`} 
                    style={{ width: `${sub.progress}%` }}
                  />
                </div>
                
                
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
)}
      </div>
    </div>
  );
}