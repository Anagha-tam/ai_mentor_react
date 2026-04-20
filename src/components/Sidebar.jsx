import { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Bot, Map, Settings, HelpCircle, Power, User, Trophy, Flame } from 'lucide-react';
import profileImg from '../assets/profile.png';

const NAV_ITEMS = [
  { id: 'chat',       icon: Bot,             label: 'Mentor'     },
  { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { id: 'study-plan', icon: Map,             label: 'Study Plan' },
];

const BOTTOM_ITEMS = [
  { id: 'settings', icon: Settings,   label: 'Settings' },
  { id: 'help',     icon: HelpCircle, label: 'Help'     },
];

const Tooltip = ({ label, children }) => (
  <div className="relative group flex items-center">
    {children}
    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-brand-navy/90 backdrop-blur-sm text-white text-xs
                    font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none
                    group-hover:opacity-100 transition-opacity duration-150 z-50
                    shadow-[0_4px_16px_rgba(17,17,24,0.2)]">
      {label}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-brand-navy/90" />
    </div>
  </div>
);

const Sidebar = ({ onNavigate, currentView, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col items-center w-[68px] h-[calc(100%-16px)] my-2 ml-2 glass rounded-2xl
                    shadow-[0_8px_32px_rgba(59,71,194,0.10)] py-4 gap-0 shrink-0 z-20">

      {/* Logo mark */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange to-[#6366F1] flex items-center
                      justify-center shadow-[0_4px_12px_rgba(59,71,194,0.35)] shrink-0">
        <span className="text-white text-sm font-bold font-heading leading-none">M</span>
      </div>

      <div className="w-8 h-px bg-brand-navy/8 my-4" />

      {/* Primary nav */}
      <div className="flex flex-col items-center gap-2 flex-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = currentView === id;
          return (
            <Tooltip key={id} label={label}>
              <button
                onClick={() => onNavigate(id)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-brand-orange to-[#6366F1] text-white shadow-[0_4px_16px_rgba(59,71,194,0.30)] scale-105'
                    : 'text-brand-navy/35 hover:text-brand-navy/70 hover:bg-white/60 hover:shadow-[0_2px_8px_rgba(59,71,194,0.10)]'
                }`}
              >
                <Icon size={18} />
              </button>
            </Tooltip>
          );
        })}
      </div>

      <div className="w-8 h-px bg-brand-navy/8 my-3" />

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-2">
        {BOTTOM_ITEMS.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id} label={label}>
            <button className="w-11 h-11 rounded-2xl flex items-center justify-center text-brand-navy/25
                               hover:text-brand-navy/55 hover:bg-white/60 hover:shadow-[0_2px_8px_rgba(59,71,194,0.08)]
                               transition-all duration-200">
              <Icon size={18} />
            </button>
          </Tooltip>
        ))}

        <div className="w-8 h-px bg-brand-navy/8 my-1" />

        {/* Streak */}
        <Tooltip label="12 day streak">
          <div className="flex flex-col items-center gap-0.5 cursor-default p-1">
            <Flame size={15} className="text-brand-accent" />
            <span className="text-[10px] font-bold text-brand-accent leading-none">12</span>
          </div>
        </Tooltip>

        {/* User avatar */}
        <div className="relative mt-1" ref={menuRef}>
          <Tooltip label={user?.firstName || 'Profile'}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/80
                         shadow-[0_2px_8px_rgba(59,71,194,0.15)] hover:border-brand-orange/40
                         hover:shadow-[0_4px_12px_rgba(59,71,194,0.25)] transition-all duration-200"
            >
              <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
            </button>
          </Tooltip>

          {isMenuOpen && (
            <div className="absolute left-full bottom-0 ml-3 w-52 glass-strong rounded-2xl
                            shadow-[0_16px_48px_rgba(59,71,194,0.15)] py-2 z-[100]">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-brand-navy
                                 hover:bg-brand-navy/5 transition-colors text-left rounded-xl mx-0">
                <User size={14} className="text-brand-navy/35" />
                My Profile
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-brand-navy
                                 hover:bg-brand-navy/5 transition-colors text-left">
                <Trophy size={14} className="text-brand-accent/70" />
                Achievements
              </button>
              <div className="h-px bg-brand-navy/8 my-1 mx-3" />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold
                           text-red-500 hover:bg-red-50/80 transition-colors text-left"
              >
                <Power size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Sidebar;
