import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalParticipant, useSessionMessages } from '@livekit/components-react';
import { Send, Mic, Keyboard, User } from 'lucide-react';

/**
 * Renders the unified session message list: voice transcriptions + typed chat.
 * `useSessionMessages` merges the same room chat pipeline as `useChat` with transcription streams.
 */
const ChatPanel = ({ agentState, user, onLogout }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const { messages: sessionMessages, send, isSending } = useSessionMessages();
  const { localParticipant } = useLocalParticipant();

  const displayMessages = useMemo(() => {
    const localId = localParticipant?.identity;
    return sessionMessages.map((msg) => mapSessionMessageToDisplay(msg, localId));
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
    <div className="flex flex-col h-full bg-background border-r border-border shadow-inner relative">
      {/* Messages */}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth custom-scrollbar">
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 animate-pulse">
               <Mic size={24} className="text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-400">
                Ready to learn?
              </p>
              <p className="text-[11px] text-gray-300 uppercase tracking-widest font-bold">
                Start speaking or type below
              </p>
            </div>
          </div>
        )}

        {displayMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Live typing indicator */}
        {agentState === 'thinking' && (
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
              <span className="text-[8px] font-bold text-primary">AI</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-3 py-1.5 shadow-sm">
              <ThinkingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white mt-auto">
        <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2 ring-1 ring-slate-200 focus-within:ring-primary/30 focus-within:bg-white focus-within:shadow-lg transition-all duration-300 group">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none py-2.5"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || isSending}
            className={`p-2.5 rounded-xl transition-all duration-300 shadow-md ${
              !inputText.trim() || isSending 
                ? 'bg-indigo-50 text-indigo-300 cursor-not-allowed scale-95 shadow-none' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-200'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {/* <p className="text-[10px] text-gray-400 text-center mt-3 font-medium uppercase tracking-[0.2em] opacity-40">
           Enterprise Learning AI • Secured Connection
        </p> */}
      </div>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1 shadow-md shadow-indigo-100 border border-indigo-500/20">
          <span className="text-[7px] font-bold text-white tracking-tighter">AI</span>
        </div>
      )}
      {isUser && (
        <div className="w-5 h-5 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 mt-1 shadow-md shadow-slate-200 border border-slate-800">
          <span className="text-[7px] font-bold text-white">ME</span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[85%] px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all duration-300 ${
          isUser
            ? 'bg-primary text-white rounded-2xl rounded-tr-sm font-medium border border-indigo-500 shadow-indigo-100/50'
            : 'bg-white border border-slate-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-slate-200/40'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.text}</div>
        <div className={`flex items-center gap-2 mt-2 pt-2 border-t opacity-40 ${isUser ? 'border-white/10' : 'border-slate-50'}`}>
          {message.source === 'voice' ? (
            <div className="flex items-center gap-1">
               <Mic className="w-3 h-3" />
               <span className="text-[9px] font-bold uppercase tracking-wider">Voice</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
               <Keyboard className="w-3 h-3" />
               <span className="text-[9px] font-bold uppercase tracking-wider">Text</span>
            </div>
          )}
          <span className="text-[9px] font-bold ml-auto opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

const ThinkingDots = () => (
  <div className="flex items-center gap-1.5 py-1">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-1 h-1 rounded-full bg-indigo-200/80 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
      />
    ))}
  </div>
);

function mapSessionMessageToDisplay(msg, localIdentity) {
  if (msg.type === 'userTranscript') {
    return {
      id: msg.id,
      role: 'user',
      text: msg.message,
      timestamp: msg.timestamp,
      source: 'voice',
    };
  }
  if (msg.type === 'agentTranscript') {
    return {
      id: msg.id,
      role: 'agent',
      text: msg.message,
      timestamp: msg.timestamp,
      source: 'voice',
    };
  }
  const isUser = localIdentity && msg.from?.identity === localIdentity;
  return {
    id: `chat-${msg.id}`,
    role: isUser ? 'user' : 'agent',
    text: msg.message,
    timestamp: msg.timestamp,
    source: 'text',
  };
}

export default ChatPanel;
