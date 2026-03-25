'use client';

import { 
  useSession, 
  useAgent,
  useSessionContext,
  useSessionMessages, 
} from '@livekit/components-react';
import { TokenSource } from 'livekit-client';
import { AgentSessionProvider } from '../components/agent-session-provider';
import { AgentChatTranscript } from '../components/agent-chat-transcript';
import { Bot, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOKEN_SOURCE = TokenSource.sandboxTokenServer('aimentor-1t8exu');

export function Demo() {
  const { state } = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);

  return (
    <AgentChatTranscript
      agentState={state}
      messages={messages}
    />
  );
}

export default function DemoWrapper({ user, onLogout }) {
  const session = useSession(TOKEN_SOURCE, {
    roomName: "mentor-room",     
    agentName: "my-agent",   
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full text-left">
      {/* Top Navigation Bar */}
      <header className="flex w-full items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg text-white">
            <Bot size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">AI Mentor Chat</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 font-medium">
             <User size={18} />
             <span>{user?.firstName || user?.email || 'Student'}</span>
             {user?.stream && (
               <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs ml-2">
                 {user?.stream?.toUpperCase()}
               </span>
             )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onLogout}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Log out"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      {/* Main Layout Content */}
<div className="flex-1 flex overflow-hidden">
  {/* Left Section */}
  <section className="flex-1 flex flex-col bg-white border-r border-gray-200 overflow-y-auto">
  </section>

  {/* Right Section / Main Chat Area */}
  <main className="flex-1 flex flex-col overflow-hidden">
    <div className="flex-1 w-full mx-auto flex flex-col p-4 sm:p-6 overflow-hidden">
      <AgentSessionProvider session={session}>
        <Demo />
      </AgentSessionProvider>
      
      {!session.room && (
        <div className="flex items-center justify-center h-full text-gray-500 text-lg font-medium text-center">
          Connecting to AI Mentor Session...
        </div>
      )}
    </div>
  </main>
</div>

      {/* Footer Info */}
      <footer className="w-full bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto w-full text-center text-xs text-gray-400">
          AI Mentor is powered by LiveKit. Speak or type to interact.
        </div>
      </footer>
    </div>
  );
}