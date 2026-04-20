import { useState, useRef, useEffect } from 'react';
import { User, Power, Trophy, Flame } from 'lucide-react';
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
    <header className="w-full bg-white px-5 py-2.5 flex items-center justify-end gap-3 z-30 rounded-b-2xl border-b border-brand-navy/6">

      {/* Streak pill */}
      <div className="flex items-center gap-1.5 bg-brand-accent/10 px-3 py-1.5 rounded-full">
        <Flame size={12} className="text-brand-accent" />
        <span className="text-xs font-semibold text-brand-accent">12 day streak</span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-brand-navy/8" />

      {/* Profile */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2.5 hover:bg-brand-navy/5 px-2 py-1.5 rounded-xl transition-colors duration-150 group"
        >
          <div className="flex flex-col text-right">
            <span className="text-[13px] font-semibold text-brand-navy leading-tight">
              {user?.firstName || 'Anagha'} {user?.lastName || ''}
            </span>
            <span className="text-[11px] text-brand-navy/40 font-medium">
              {user?.class ? `Class ${user.class}` : 'Class 11'} · {(user?.stream || 'Science')}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand-navy/8 group-hover:border-brand-orange/25 transition-colors duration-150 shrink-0">
            <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-modal border border-brand-navy/8 py-2 z-[100]">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-brand-navy hover:bg-brand-navy/5 transition-colors text-left">
              <User size={14} className="text-brand-navy/35" />
              My Profile
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-brand-navy hover:bg-brand-navy/5 transition-colors text-left">
              <Trophy size={14} className="text-brand-accent/70" />
              Achievements
            </button>
            <div className="h-px bg-brand-navy/8 my-1 mx-3" />
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              <Power size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
