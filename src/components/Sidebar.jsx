import React from 'react';
import { PanelLeftClose, Edit3, Search, LayoutDashboard } from 'lucide-react';

const TooltipButton = ({ icon: Icon, label, onClick, isActive, className }) => (
  <button 
    onClick={onClick}
    className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
      isActive 
        ? 'bg-indigo-50 text-indigo-600' 
        : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
    } ${className || ''}`}
  >
    <Icon size={20} />
    <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold tracking-wide rounded-[8px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
      {label}
    </span>
  </button>
);

const Sidebar = ({ isOpen, onClose, onNavigate, currentView }) => {
  return (
    <div 
      className={`bg-white border-r border-slate-100 transition-all duration-300 ease-in-out flex flex-col items-center py-4 gap-6 shrink-0 z-20 ${
        isOpen ? 'w-16 opacity-100' : 'w-0 opacity-0 overflow-hidden'
      }`}
      style={{
        boxShadow: isOpen ? '2px 0 10px rgba(0,0,0,0.02)' : 'none'
      }}
    >
      {/* Top toggle button */}

      {/* Feature Icons */}
      <TooltipButton 
        icon={LayoutDashboard} 
        label="Dashboard" 
        onClick={() => onNavigate('dashboard')}
        isActive={currentView === 'dashboard'}
      />
      <TooltipButton 
        icon={Edit3} 
        label="New chat" 
        onClick={() => onNavigate('chat')}
        isActive={currentView === 'chat'}
      />
      
    </div>
  );
};

export default Sidebar;
