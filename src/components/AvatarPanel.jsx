import React, { useState } from 'react';
import { VideoTrack } from '@livekit/components-react';
import { Bot } from 'lucide-react';
import VoiceActivityIndicator from './VoiceActivityIndicator';

const AvatarPanel = ({
  agent,
  videoTrack,
  isAgentSpeaking,
  isUserSpeaking,
  agentState,
  isConnected,
}) => {
  const isAgentPresent = !!agent;
  const hasVideo = !!videoTrack;

  return (
    <div className="flex flex-col h-full overflow-hidden gap-2">

      {/* TOP (60%) — AI Avatar Card */}
      <div className="flex-[6] relative overflow-hidden bg-white rounded-2xl border border-brand-navy/10">
        <div className="w-full h-full flex items-center justify-center">
          {!isAgentPresent && isConnected && <AvatarWaiting />}
          {!isConnected && <AvatarConnecting />}

          {isAgentPresent && !hasVideo && (
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Agent Joined (Audio Only)</p>
            </div>
          )}

          {hasVideo && (
            <>
              <VideoTrack
                trackRef={videoTrack}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </>
          )}
        </div>

        {/* Voice activity bar */}
        <div className="absolute bottom-0 inset-x-0 px-5 py-3 flex items-center justify-between z-10">
          <VoiceActivityIndicator
            isActive={isAgentSpeaking}
            variant="agent"
            label={
              agentState === 'speaking'
                ? 'AI Speaking'
                : agentState === 'thinking'
                  ? 'Thinking...'
                  : agentState === 'listening'
                    ? 'Listening'
                    : ''
            }
            className={hasVideo ? '[&_span]:text-white' : ''}
          />
          <VoiceActivityIndicator
            isActive={isUserSpeaking}
            variant="user"
            label="You"
            className={hasVideo ? '[&_span]:text-white' : ''}
          />
        </div>
      </div>

      {/* BOTTOM (40%) — Planner Card */}
      <div className="flex-[4] flex flex-col overflow-hidden bg-white rounded-2xl border border-brand-navy/10">
        <div className="px-5 py-3 border-b border-brand-navy/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-brand-navy">Planner</h2>
          <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString('en-US', { month: 'long' })}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <WeeklyPlanner />
        </div>
      </div>

    </div>
  );
};

const WeeklyPlanner = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [plans, setPlans] = useState({});
  const [done, setDone] = useState({});
  const [input, setInput] = useState('');

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      index: i,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  const addPlan = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setPlans(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), trimmed],
    }));
    setInput('');
  };

  const removePlan = (dayIndex, taskIndex) => {
    setPlans(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter((_, i) => i !== taskIndex),
    }));
    setDone(prev => {
      const key = `${dayIndex}-${taskIndex}`;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const toggleDone = (dayIndex, taskIndex) => {
    const key = `${dayIndex}-${taskIndex}`;
    setDone(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const today = days[selectedDay];
  const todayPlans = plans[selectedDay] || [];
  const completedCount = todayPlans.filter((_, i) => done[`${selectedDay}-${i}`]).length;

  return (
    <div className="flex flex-col h-full">

      {/* 7-Day Strip */}
      <div className="flex justify-between px-4 pt-2 pb-1 gap-1">
        {days.map((d) => {
          const hasPlans = (plans[d.index] || []).length > 0;
          const isSelected = selectedDay === d.index;
          return (
            <button
              key={d.index}
              onClick={() => setSelectedDay(d.index)}
              className={`relative flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${
                isSelected
                  ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/25 scale-105'
                  : 'text-brand-navy/60 hover:bg-brand-navy/5'
              }`}
            >
              <span className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${isSelected ? 'text-white/80' : 'text-brand-navy/40'}`}>
                {d.day}
              </span>
              <span className={`text-xs font-black leading-none ${isSelected ? 'text-white' : 'text-brand-navy'}`}>
                {d.date}
              </span>
              {hasPlans && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-orange" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-[10px] font-black text-brand-navy/50 uppercase tracking-widest">
          {today.day}, {today.month} {today.date}
        </p>
        {todayPlans.length > 0 && (
          <span className="text-[9px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
            {completedCount}/{todayPlans.length} done
          </span>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-2">
        {todayPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 gap-1 opacity-40">
            <span className="text-xl">📋</span>
            <p className="text-[10px] font-semibold text-brand-navy/50">No plans for this day</p>
          </div>
        ) : (
          todayPlans.map((task, i) => {
            const isDone = done[`${selectedDay}-${i}`];
            return (
              <div
                key={i}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all group ${
                  isDone ? 'bg-green-50 border border-green-100' : 'bg-brand-navy/5 border border-transparent'
                }`}
              >
                <button
                  onClick={() => toggleDone(selectedDay, i)}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isDone ? 'bg-green-500 border-green-500' : 'border-brand-navy/20 hover:border-brand-orange'
                  }`}
                >
                  {isDone && <span className="text-white text-[8px] font-black">✓</span>}
                </button>
                <span className={`text-xs flex-1 transition-all ${isDone ? 'line-through text-brand-navy/30' : 'text-brand-navy'}`}>
                  {task}
                </span>
                <button
                  onClick={() => removePlan(selectedDay, i)}
                  className="opacity-0 group-hover:opacity-100 text-brand-navy/20 hover:text-red-400 text-[10px] font-black transition-all"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-2.5">
        <div className="flex gap-2 items-center bg-brand-navy/5 rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-brand-orange/40 focus-within:bg-background transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlan()}
            placeholder="Add a plan and press Enter..."
            className="flex-1 text-xs bg-transparent outline-none text-brand-navy placeholder:text-brand-navy/30 py-1"
          />
          <button
            onClick={addPlan}
            disabled={!input.trim()}
            className="text-[10px] font-black text-brand-orange disabled:opacity-30 hover:text-brand-orange/70 transition-all px-1"
          >
            + ADD
          </button>
        </div>
      </div>

    </div>
  );
};

const AvatarWaiting = () => (
  <div className="flex flex-col items-center gap-4 text-center px-6">
    <div className="w-10 h-10 border-3 border-transparent border-t-primary rounded-full animate-spin" />
    <p className="text-sm text-muted-foreground">Your AI mentor is preparing…</p>
  </div>
);

const AvatarConnecting = () => (
  <div className="flex flex-col items-center gap-4 text-center px-6">
    <div className="w-10 h-10 border-3 border-transparent border-t-primary rounded-full animate-spin" />
    <p className="text-sm text-muted-foreground">connecting...</p>
  </div>
);

export default AvatarPanel;
