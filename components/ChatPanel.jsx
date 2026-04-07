import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useLocalParticipant,
  useSessionMessages,
} from '@livekit/components-react';
import { Send, Mic, Keyboard } from 'lucide-react';

/**
 * Renders the unified session message list: voice transcriptions + typed chat.
 * `useSessionMessages` merges the same room chat pipeline as `useChat` with transcription streams.
 */
const ChatPanel = ({ agentState }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const { messages: sessionMessages, send, isSending } = useSessionMessages();
  const { localParticipant } = useLocalParticipant();

  const displayMessages = useMemo(() => {
    const localId = localParticipant?.identity;
    return sessionMessages
      .map((msg) => mapSessionMessageToDisplay(msg, localId))
      .filter(Boolean);
  }, [sessionMessages, localParticipant]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;
    setInputText('');
    try {
      await send(trimmed);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      setInputText(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">AI</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Mentor</h2>
            <StatusDot agentState={agentState} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <p className="text-sm text-muted-foreground">
              Start speaking or type a message below.
            </p>
          </div>
        )}

        {displayMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Live typing indicator */}
        {agentState === 'thinking' && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-primary">AI</span>
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
              <ThinkingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-1.5 ring-1 ring-border focus-within:ring-primary/50 transition-shadow">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || isSending}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-primary">AI</span>
        </div>
      )}
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-green-600">U</span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
            : 'bg-muted text-foreground rounded-2xl rounded-tl-sm'
        }`}
      >
        {message.text}
        <div className="flex items-center gap-1.5 mt-1.5">
          {message.source === 'voice' ? (
            <Mic className="w-3 h-3 opacity-40" />
          ) : (
            <Keyboard className="w-3 h-3 opacity-40" />
          )}
          <span className="text-[10px] opacity-40">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

const StatusDot = ({ agentState }) => {
  const label =
    agentState === 'speaking'
      ? 'Speaking'
      : agentState === 'listening'
        ? 'Listening'
        : agentState === 'thinking'
          ? 'Thinking...'
          : 'Connecting...';

  const color =
    agentState === 'speaking'
      ? 'bg-blue-500'
      : agentState === 'listening'
        ? 'bg-green-500'
        : agentState === 'thinking'
          ? 'bg-amber-500'
          : 'bg-gray-400';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
};

const ThinkingDots = () => (
  <div className="flex items-center gap-1 py-0.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
      />
    ))}
  </div>
);

function mapSessionMessageToDisplay(msg, localIdentity) {
  const text = msg?.message ?? msg?.text ?? msg?.content ?? '';
  if (!text || typeof text !== 'string') return null;

  const type = String(msg?.type || '').toLowerCase();
  if (type.includes('usertranscript') || type === 'user_transcript') {
    return {
      id: msg.id,
      role: 'user',
      text,
      timestamp: msg.timestamp,
      source: 'voice',
    };
  }

  if (
    type.includes('agenttranscript') ||
    type.includes('assistanttranscript') ||
    type === 'agent_transcript' ||
    type === 'assistant_transcript'
  ) {
    // Assistant text now comes from explicit lk.chat forwarding in the agent service.
    // Ignore transcript copies to prevent duplicate AI bubbles.
    return null;
  }

  const authorIdentity = msg?.from?.identity || msg?.participant?.identity || '';
  const roleHint = String(msg?.role || '').toLowerCase();
  const isUser =
    (localIdentity && authorIdentity === localIdentity) || roleHint === 'user';

  return {
    id: `chat-${msg.id}`,
    role: isUser ? 'user' : 'agent',
    text,
    timestamp: resolveDisplayTimestamp(msg, isUser),
    source: 'text',
  };
}

function resolveDisplayTimestamp(msg, isUser) {
  if (isUser) return msg.timestamp;
  const createdAtAttr = msg?.attributes?.assistant_speech_created_at;
  const createdAt = Number(createdAtAttr);
  if (Number.isFinite(createdAt) && createdAt > 0) {
    return createdAt;
  }
  return msg.timestamp;
}

export default ChatPanel;
