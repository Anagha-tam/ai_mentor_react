import React from 'react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const BAR_COUNT = 5;

/**
 * Animated bars that visualise who is currently speaking.
 * Accepts `variant` ("user" | "agent") for colour theming.
 */
const VoiceActivityIndicator = ({
  isActive = false,
  variant = 'agent',
  label,
  className,
}) => {
  const barColor =
    variant === 'user'
      ? 'bg-slate-900'
      : 'bg-green-600 shadow-green-100';

  const glowColor =
    variant === 'user'
      ? 'shadow-slate-400/30'
      : 'shadow-green-500/30';

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2 bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm transition-all duration-500', className)}>
      {/* Bars */}
      <div className="flex items-center gap-[4px] h-8 min-w-[30px] justify-center">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-[4px] rounded-full transition-all duration-300',
              isActive ? barColor : 'bg-slate-300',
              isActive && `shadow-sm ${glowColor}`
            )}
            style={{
              height: isActive ? `${randomBarHeight(i)}px` : '4px',
              animation: isActive ? `voiceBar 0.5s ease-in-out infinite alternate` : 'none',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest',
            isActive ? 'text-slate-900 animate-pulse' : 'text-slate-400'
          )}
        >
          {label}
        </span>
      )}

      {/* Inline keyframes */}
      <VoiceBarKeyframes />
    </div>
  );
};

function randomBarHeight(index) {
  const heights = [16, 24, 20, 28, 18];
  return heights[index % heights.length];
}

let keyframesInjected = false;

const VoiceBarKeyframes = () => {
  if (typeof document === 'undefined') return null; // SSR check
  
  // Actually, using a global style tag is safer if we want it to persist correctly
  // but for simplicity in a component, we can use a hidden style tag or just inject it
  return (
    <style>{`
      @keyframes voiceBar {
        0%   { transform: scaleY(0.4); }
        50%  { transform: scaleY(1.2); }
        100% { transform: scaleY(0.8); }
      }
    `}</style>
  );
};

export default VoiceActivityIndicator;
