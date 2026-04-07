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
      ? 'bg-green-500'
      : 'bg-primary';

  const glowColor =
    variant === 'user'
      ? 'shadow-green-500/30'
      : 'shadow-primary/30';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Bars */}
      <div className="flex items-center gap-[3px] h-6">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-[3px] rounded-full transition-all duration-150',
              isActive ? barColor : 'bg-muted-foreground/20',
              isActive && `shadow-sm ${glowColor}`
            )}
            style={{
              height: isActive ? `${randomBarHeight(i)}px` : '6px',
              animationName: isActive ? 'voiceBar' : 'none',
              animationDuration: `${0.4 + i * 0.08}s`,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
            }}
          />
        ))}
      </div>

      {/* Label */}
      {label && (
        <span
          className={cn(
            'text-xs font-medium',
            isActive ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {label}
        </span>
      )}

      {/* Inline keyframes (injected once) */}
      <VoiceBarKeyframes />
    </div>
  );
};

function randomBarHeight(index) {
  const heights = [14, 22, 18, 24, 16];
  return heights[index % heights.length];
}

let keyframesInjected = false;

const VoiceBarKeyframes = () => {
  if (keyframesInjected) return null;
  keyframesInjected = true;

  return (
    <style>{`
      @keyframes voiceBar {
        0%   { height: 6px; }
        50%  { height: 20px; }
        100% { height: 8px; }
      }
    `}</style>
  );
};

export default VoiceActivityIndicator;
