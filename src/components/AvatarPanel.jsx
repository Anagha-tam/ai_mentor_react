import { useState, useEffect } from 'react';
import { VideoTrack } from '@livekit/components-react';
import { Bot, Bell, CalendarCheck, Loader2 } from 'lucide-react';
import VoiceActivityIndicator from './VoiceActivityIndicator';
import { getReminders } from '../Services/api';

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
      <div className="flex-[6] relative overflow-hidden glass rounded-2xl
                      shadow-[0_8px_32px_rgba(59,71,194,0.10)]">

        {/* Header bar */}
        <div className="absolute top-0 inset-x-0 px-4 py-2.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-orange to-[#6366F1]
                            flex items-center justify-center shrink-0
                            shadow-[0_2px_8px_rgba(59,71,194,0.30)]">
              <span className="text-white text-[11px] font-bold font-heading leading-none">M</span>
            </div>
            <span className={`text-[13px] font-bold font-heading ${hasVideo ? 'text-white' : 'text-brand-navy'}`}>
              AI Mentor
            </span>
          </div>
          {agentState && agentState !== 'idle' && (
            <div className="flex items-center gap-1.5 glass-subtle rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
              <span className={`text-[11px] font-semibold ${hasVideo ? 'text-white/90' : 'text-brand-navy/60'}`}>
                {agentState === 'speaking' ? 'Speaking' : agentState === 'thinking' ? 'Thinking…' : 'Listening'}
              </span>
            </div>
          )}
        </div>

        <div className="w-full h-full flex items-center justify-center">
          {!isAgentPresent && isConnected && <AvatarWaiting />}
          {!isConnected && <AvatarConnecting />}

          {isAgentPresent && !hasVideo && (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-orange/15 to-[#6366F1]/15
                              border border-brand-orange/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-brand-orange" />
              </div>
              <p className="text-xs text-brand-navy/40 font-medium">Audio only</p>
            </div>
          )}

          {hasVideo && (
            <>
              <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
            </>
          )}
        </div>

        {/* Voice activity row */}
        <div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-center justify-between z-10">
          <VoiceActivityIndicator
            isActive={isAgentSpeaking}
            variant="agent"
            label={
              agentState === 'speaking'  ? 'Speaking'
              : agentState === 'thinking'  ? 'Thinking…'
              : agentState === 'listening' ? 'Listening'
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
      <div className="flex-[4] flex flex-col overflow-hidden glass rounded-2xl
                      shadow-[0_8px_32px_rgba(59,71,194,0.08)]">
        <div className="px-5 py-3 border-b border-white/50 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-brand-navy">Planner</h2>
          <span className="text-xs font-medium text-brand-navy/35">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <WeeklyPlanner />
        </div>
      </div>

    </div>
  );
};

const TYPE_LABEL = {
  TEST_SCHEDULED: 'Test Scheduled',
  TOPIC_PENDING:  'Topic Pending',
  REVISION_DUE:   'Revision Due',
};

const TYPE_COLOR = {
  TEST_SCHEDULED: 'bg-blue-50/80 border-blue-200 text-blue-600',
  TOPIC_PENDING:  'bg-brand-orange/5 border-brand-orange/20 text-brand-orange',
  REVISION_DUE:   'bg-amber-50/80 border-amber-200 text-amber-600',
};

function isSameDay(isoDate, jsDate) {
  const d = new Date(isoDate);
  return (
    d.getFullYear() === jsDate.getFullYear() &&
    d.getMonth()    === jsDate.getMonth() &&
    d.getDate()     === jsDate.getDate()
  );
}

const WeeklyPlanner = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [plans, setPlans] = useState({});
  const [done, setDone] = useState({});
  const [input, setInput] = useState('');
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

  useEffect(() => {
    getReminders()
      .then(res => setReminders(res.data ?? []))
      .catch(() => setReminders([]))
      .finally(() => setRemindersLoading(false));
  }, []);

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
      <div className="flex justify-between px-3 pt-2 pb-1 gap-1">
        {days.map((d) => {
          const hasPlans = (plans[d.index] || []).length > 0;
          const dayDate = (() => { const dt = new Date(); dt.setDate(dt.getDate() + d.index); return dt; })();
          const hasReminders = reminders.some(r => !r.isResolved && isSameDay(r.scheduledDate, dayDate));
          const isSelected = selectedDay === d.index;
          return (
            <button
              key={d.index}
              onClick={() => setSelectedDay(d.index)}
              className={`relative flex flex-col items-center flex-1 py-1.5 rounded-xl transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-b from-brand-orange to-[#6366F1] text-white shadow-[0_4px_12px_rgba(59,71,194,0.30)] scale-105'
                  : 'text-brand-navy/55 hover:bg-white/60'
              }`}
            >
              <span className={`text-[9px] font-semibold uppercase tracking-widest mb-0.5 ${
                isSelected ? 'text-white/75' : 'text-brand-navy/35'
              }`}>
                {d.day}
              </span>
              <span className={`text-xs font-bold leading-none ${
                isSelected ? 'text-white' : 'text-brand-navy'
              }`}>
                {d.date}
              </span>
              {(hasPlans || hasReminders) && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-brand-orange/60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-xs font-medium text-brand-navy/40">
          {today.day}, {today.month} {today.date}
        </p>
        {todayPlans.length > 0 && (
          <span className="text-[11px] font-semibold text-brand-orange
                           bg-gradient-to-r from-brand-orange/10 to-[#6366F1]/10
                           px-2 py-0.5 rounded-full border border-brand-orange/15">
            {completedCount}/{todayPlans.length}
          </span>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1.5 custom-scrollbar">

        {(() => {
          const dayDate = days[selectedDay] ? (() => { const d = new Date(); d.setDate(d.getDate() + selectedDay); return d; })() : null;
          const dayReminders = dayDate ? reminders.filter(r => !r.isResolved && isSameDay(r.scheduledDate, dayDate)) : [];
          if (remindersLoading && selectedDay === 0) {
            return (
              <div className="flex items-center gap-2 py-1.5 opacity-50">
                <Loader2 size={11} className="animate-spin text-brand-orange" />
                <span className="text-xs text-brand-navy/40">Loading…</span>
              </div>
            );
          }
          if (!dayReminders.length) return null;
          return (
            <div className="mb-1">
              <p className="text-[10px] font-semibold text-brand-navy/35 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Bell size={9} /> Reminders
              </p>
              <div className="space-y-1">
                {dayReminders.map(r => (
                  <div key={r._id} className={`flex items-start gap-2.5 rounded-xl px-3 py-2 border ${TYPE_COLOR[r.type] ?? 'bg-white/50 border-white/60 text-brand-navy/60'}`}>
                    <CalendarCheck size={12} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-brand-navy leading-tight">{r.topicName}</p>
                      <p className="text-[10px] font-medium mt-0.5 opacity-65">{TYPE_LABEL[r.type] ?? r.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {todayPlans.length > 0 && (
          todayPlans.map((task, i) => {
            const isDone = done[`${selectedDay}-${i}`];
            return (
              <div
                key={i}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-200 group ${
                  isDone
                    ? 'bg-green-50/80 border border-green-100'
                    : 'bg-white/50 border border-white/60 hover:bg-white/70 hover:shadow-[0_2px_8px_rgba(59,71,194,0.08)]'
                }`}
              >
                <button
                  onClick={() => toggleDone(selectedDay, i)}
                  className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isDone
                      ? 'bg-gradient-to-br from-brand-success to-emerald-400 border-transparent'
                      : 'border-brand-navy/20 hover:border-brand-orange'
                  }`}
                >
                  {isDone && <span className="text-white text-[8px] font-black">✓</span>}
                </button>
                <span className={`text-xs flex-1 transition-all ${isDone ? 'line-through text-brand-navy/30' : 'text-brand-navy/80'}`}>
                  {task}
                </span>
                <button
                  onClick={() => removePlan(selectedDay, i)}
                  className="opacity-0 group-hover:opacity-100 text-brand-navy/20 hover:text-red-400 text-[10px] font-bold transition-all"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2">
        <div className="flex gap-2 items-center bg-white/80 backdrop-blur-sm rounded-2xl px-3.5 py-2.5
                        border border-white/70 shadow-[0_2px_12px_rgba(59,71,194,0.08)]
                        focus-within:shadow-[0_4px_16px_rgba(59,71,194,0.15)]
                        focus-within:border-brand-orange/25 transition-all duration-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlan()}
            placeholder="Add a task…"
            className="flex-1 text-xs bg-transparent outline-none text-brand-navy placeholder:text-brand-navy/30"
          />
          <button
            onClick={addPlan}
            disabled={!input.trim()}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all duration-150 ${
              input.trim()
                ? 'bg-gradient-to-r from-brand-orange to-[#6366F1] text-white shadow-[0_2px_8px_rgba(59,71,194,0.25)] hover:opacity-90'
                : 'text-brand-navy/20 cursor-not-allowed'
            }`}
          >
            Add
          </button>
        </div>
      </div>

    </div>
  );
};

const AvatarWaiting = () => (
  <div className="flex flex-col items-center gap-4 text-center px-6">
    <div className="relative">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange/15 to-[#6366F1]/15
                      border border-brand-orange/20 flex items-center justify-center">
        <Bot size={22} className="text-brand-orange" />
      </div>
      <div className="absolute inset-0 rounded-2xl border-2 border-brand-orange/30
                      animate-ping opacity-60" />
    </div>
    <p className="text-[13px] text-brand-navy/40 font-medium">Your mentor is joining…</p>
  </div>
);

const AvatarConnecting = () => (
  <div className="flex flex-col items-center gap-4 text-center px-6">
    <div className="w-12 h-12 rounded-full border-2 border-brand-orange/15
                    border-t-brand-orange animate-spin" />
    <div>
      <p className="text-[13px] font-semibold text-brand-navy/50">Connecting</p>
      <p className="text-xs text-brand-navy/30 mt-0.5">Setting up your session…</p>
    </div>
  </div>
);

export default AvatarPanel;
