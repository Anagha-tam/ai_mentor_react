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
              ? '#27AE60' // brand.success
              : '#DFD7CC', // brand.accent / muted
            boxShadow: bar.isActive 
              ? '0 0 12px rgba(39, 174, 96, 0.4)' 
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
