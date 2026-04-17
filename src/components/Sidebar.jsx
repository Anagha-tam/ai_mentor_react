import { LayoutDashboard, Settings, HelpCircle, Bot, Map } from 'lucide-react';

const AgentStatus = ({ agentState }) => {
  const label =
    agentState === 'speaking' ? 'Speaking'
    : agentState === 'listening' ? 'Listening'
    : agentState === 'thinking' ? 'Thinking...'
    : 'Connecting...';

  const color =
    agentState === 'speaking' ? 'bg-brand-success'
    : agentState === 'listening' ? 'bg-brand-success/70'
    : agentState === 'thinking' ? 'bg-brand-success animate-pulse'
    : 'bg-brand-navy/30';

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color} transition-colors duration-500`} />
      <span className="text-[10px] font-semibold text-brand-navy/40 tracking-wide mt-[1px]">{label}</span>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`w-full flex flex-row items-center gap-3 py-2.5 transition-all border-l-[3px] ${
      isActive
        ? 'bg-brand-orange/10 text-brand-orange border-brand-orange pl-[13px] pr-4 rounded-r-xl'
        : 'text-brand-navy/50 hover:text-brand-navy hover:bg-brand-navy/5 border-transparent px-4'
    }`}
  >
    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-brand-orange/15 text-brand-orange' : 'text-brand-navy/40'}`}>
      <Icon size={16} className="shrink-0" />
    </div>
    <span className="text-[13px] font-semibold">{label}</span>
  </button>
);

const Sidebar = ({ isOpen, onNavigate, currentView, agentState }) => {
  return (
    <div
      className={`bg-white border-r border-brand-navy/10 transition-all duration-300 ease-in-out flex flex-col shrink-0 z-20 overflow-hidden h-full ${
        isOpen ? 'w-52 opacity-100' : 'w-0 opacity-0'
      }`}
      style={{ boxShadow: isOpen ? '2px 0 16px rgba(26,26,46,0.06)' : 'none' }}
    >
      {/* Logo / App Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange to-brand-orange/80 flex items-center justify-center shrink-0 shadow-lg shadow-brand-orange/20 mt-0.5">
            <Bot size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-[16px] font-black text-brand-navy tracking-tight leading-tight">
              AI<span className="text-brand-orange"> Mentor</span>
            </h1>
            <AgentStatus agentState={agentState} />
          </div>
        </div>
      </div>

      {/* Nav Buttons */}
      <div className="flex flex-col w-full flex-1 pt-3 gap-0.5">
        <NavButton
          icon={LayoutDashboard}
          label="Dashboard"
          onClick={() => onNavigate('dashboard')}
          isActive={currentView === 'dashboard'}
        />
        <NavButton
          icon={Bot}
          label="AI Mentor"
          onClick={() => onNavigate('chat')}
          isActive={currentView === 'chat'}
        />
        <NavButton
          icon={Map}
          label="Roadmap"
          onClick={() => onNavigate('study-plan')}
          isActive={currentView === 'study-plan'}
        />
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-col w-full mb-3 gap-0.5">
        <NavButton
          icon={Settings}
          label="Settings"
          onClick={() => {}}
          isActive={false}
        />
        <NavButton
          icon={HelpCircle}
          label="Support"
          onClick={() => {}}
          isActive={false}
        />
      </div>
    </div>
  );
};

export default Sidebar;
