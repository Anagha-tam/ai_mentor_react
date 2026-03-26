'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useAgentAudioVisualizerBarAnimator } from '../hooks/use-agent-audio-visualizer-bar';

/**
 * A premium audio visualizer bar for the AI Agent.
 * It uses the provided agent state to animate bars when speaking, thinking, or listening.
 */
const AgentAudioVisualizerBar = ({ state, className }) => {
  const columns = 24;
  const interval = 80;
  const activeBars = useAgentAudioVisualizerBarAnimator(state, columns, interval);

  const bars = useMemo(() => {
    return Array.from({ length: columns }).map((_, i) => ({
      id: i,
      isActive: activeBars.includes(i),
    }));
  }, [activeBars, columns]);

  return (
    <div className={`flex items-end justify-center gap-[3px] h-10 ${className}`}>
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          initial={false}
          animate={{
            height: bar.isActive ? '100%' : '15%',
            backgroundColor: bar.isActive 
              ? 'oklch(0.627 0.265 149.214)' // Vibrant green
              : 'oklch(0.92 0 0)',         // Muted gray
            boxShadow: bar.isActive 
              ? '0 0 12px oklch(0.627 0.265 149.214 / 0.4)' 
              : 'none'
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            mass: 0.8
          }}
          className="w-[3px] rounded-full"
        />
      ))}
    </div>
  );
};

export default AgentAudioVisualizerBar;
