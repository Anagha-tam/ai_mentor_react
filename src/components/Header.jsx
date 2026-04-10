import React from 'react';
import { LogOut, PanelLeft } from 'lucide-react';

const StatusDot = ({ agentState }) => {
  const label =
    agentState === 'speaking'
      ? 'speaking'
      : agentState === 'listening'
        ? 'listening'
        : agentState === 'thinking'
          ? 'thinking'
          : 'connecting...';

  const color =
    agentState === 'speaking'
      ? 'bg-green-500 shadow-green-200'
      : agentState === 'listening'
        ? 'bg-green-400 shadow-green-100'
        : agentState === 'thinking'
          ? 'bg-green-600 animate-pulse shadow-green-200'
          : 'bg-slate-400 shadow-slate-100';

  return (
    <div className="flex items-center gap-1.5 leading-none">
      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${color}`} />
      <span className="text-[10px] font-bold text-gray-400 tracking-[0.05em]">{label}</span>
    </div>
  );
};

const Header = ({ agentState, user, onLogout, onToggleSidebar }) => {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white w-full sticky top-0 z-50">
      <button 
        onClick={onToggleSidebar}
        className="flex items-center gap-3 hover:bg-slate-50 p-1.5 -ml-1.5 rounded-xl transition-colors cursor-pointer text-left"
        title="Toggle Sidebar"
      >
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
          <span className="text-sm font-bold text-white tracking-widest leading-none">AI</span>
        </div>
        <div className="flex flex-col text-left">
          <h2 className="text-sm font-bold text-gray-900 leading-tight tracking-tight uppercase tracking-[0.1em]">AI Mentor</h2>
          <StatusDot agentState={agentState} />
        </div>
      </button>
      
      <div className="flex items-center gap-4">
         {user && (
           <div className="flex flex-col items-end mr-1 text-right">
             <span className="text-[11px] font-bold text-gray-900 leading-none">{user.firstName || user.email}</span>
             <span className="text-[9px] text-primary font-bold uppercase tracking-tight mt-0.5">{user.stream || 'SESSION'}</span>
           </div>
         )}
         <button 
           onClick={onLogout}
           className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
         >
           <LogOut size={16} />
         </button>
      </div>
    </div>
  );
};

export default Header;
