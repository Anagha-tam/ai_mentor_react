function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const VoiceActivityIndicator = ({
  isActive = false,
  variant = 'agent',
  label,
  className,
}) => {
  const isAgent = variant === 'agent';

  return (
    <div className={cn('flex items-center gap-2 transition-all duration-500', className)}>
      {/* Pulse ring dot */}
      <div className="relative flex items-center justify-center w-7 h-7">
        {/* Core dot */}
        <div className={cn(
          'w-2.5 h-2.5 rounded-full transition-all duration-300',
          isActive
            ? isAgent ? 'bg-brand-orange' : 'bg-brand-navy'
            : 'bg-brand-navy/20'
        )} />
        {/* Animated ring */}
        {isActive && (
          <div className={cn(
            'absolute w-7 h-7 rounded-full',
            isAgent ? 'voice-ring-agent' : 'voice-ring-user'
          )} />
        )}
      </div>

      {/* Label */}
      {label && (
        <span className={cn(
          'text-xs font-medium tracking-wide transition-colors duration-300',
          isActive ? 'text-brand-navy' : 'text-brand-navy/35'
        )}>
          {label}
        </span>
      )}
    </div>
  );
};

export default VoiceActivityIndicator;
