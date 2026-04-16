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
      ? 'bg-brand-navy'
      : 'bg-brand-orange shadow-brand-orange/10';

  const glowColor =
    variant === 'user'
      ? 'shadow-brand-navy/30'
      : 'shadow-brand-orange/30';

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2 transition-all duration-500', className)}>
      {/* Bars */}
      <div className="flex items-center gap-[4px] h-8 min-w-[30px] justify-center">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-[4px] rounded-full transition-all duration-300',
              isActive ? barColor : 'bg-brand-navy/30',
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
            isActive ? 'text-brand-navy animate-pulse' : 'text-brand-navy/40'
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

const VoiceBarKeyframes = () => {
  if (typeof document === 'undefined') return null;

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
