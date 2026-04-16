import React, { useState, useRef, useEffect } from 'react';
import { User, Power, Flame, Trophy } from 'lucide-react';
import profileImg from '../assets/profile.png';

const Header = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-white px-5 py-3 flex items-center justify-end gap-3 z-30 rounded-b-2xl shadow-sm border-b border-brand-navy/10 relative">

      {/* Streak */}
      <div className="flex items-center gap-1.5 bg-brand-orange/10 px-3 py-1.5 rounded-full">
        <Flame size={13} className="text-brand-orange" />
        <span className="text-[11px] font-bold text-brand-orange">12 Days</span>
      </div>

      {/* Trophy */}
      <button className="w-8 h-8 rounded-full bg-brand-navy/5 border border-brand-navy/10 flex items-center justify-center text-brand-navy/40 hover:text-brand-orange hover:bg-brand-orange/10 transition-all">
        <Trophy size={14} />
      </button>

      {/* Divider */}
      <div className="h-6 w-px bg-brand-navy/10" />

      {/* Profile */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2.5 hover:bg-brand-navy/5 px-2 py-1.5 rounded-xl transition-all group"
        >
          <div className="flex flex-col text-right">
            <span className="text-[12px] font-bold text-brand-navy leading-tight">
              {user?.firstName || 'Anna'} {user?.lastName || ''}
            </span>
            <span className="text-[10px] text-brand-navy/40 font-medium">
              {user?.class ? `class ${user.class}` : 'class 11'} · {(user?.stream || 'Science').toLowerCase()}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-navy/10 group-hover:border-brand-orange/30 transition-all shrink-0">
            <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-background rounded-2xl shadow-2xl border border-brand-navy/5 py-2 z-[100]">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-brand-navy hover:bg-brand-navy/5 transition-colors text-left">
              <User size={14} className="text-brand-navy/40" />
              My Profile
            </button>
            <div className="h-px bg-brand-navy/10 my-1 mx-2" />
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              <Power size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
