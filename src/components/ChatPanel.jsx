import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocalParticipant, useSessionMessages } from '@livekit/components-react';
import { Send, Mic, Keyboard, Bot } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import profileImg from '../assets/profile.png';

const ChatPanel = ({ agentState, user }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const { messages: sessionMessages, send, isSending } = useSessionMessages();
  const { localParticipant } = useLocalParticipant();
  const [socketMessage, setSocketMessage] = useState([]);
  const socketRef = useSocket(user?.id || user?.email);

  const displayMessages = useMemo(() => {
    const localId = localParticipant?.identity;
    const liveKitMsgs = sessionMessages.map((msg) => mapSessionMessageToDisplay(msg, localId));
    return [...liveKitMsgs, ...socketMessage].sort((a, b) => a.timestamp - b.timestamp);
  }, [sessionMessages, localParticipant, socketMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  useEffect(() => {
    const socket = socketRef.current;
    socket?.on('chat:message', (msg) => {
      setSocketMessage(prev => [...prev, {
        id: `socket-${Date.now()}`,
        role: msg.from === (user?.id || user?.email) ? 'user' : 'agent',
        text: msg.text,
        timestamp: msg.timestamp,
        source: 'text',
      }]);
    });
    return () => socket?.off('chat:message');
  }, [user]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;
    setInputText('');
    socketRef.current?.emit('chat:message', {
      text: trimmed,
      roomId: `room-${user?.id || user?.email}`,
    });
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
    <div className="flex flex-col h-full bg-white relative">

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 space-y-4 scroll-smooth">

        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
              <Mic size={20} className="text-brand-orange/60" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-navy/40">Ready to learn?</p>
              <p className="text-[10px] text-brand-navy/25 uppercase tracking-widest mt-0.5">Start speaking or type below</p>
            </div>
          </div>
        )}

        {displayMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {agentState === 'thinking' && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center shrink-0 shadow-sm shadow-brand-orange/20">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-brand-navy/5 border border-brand-navy/8 rounded-2xl rounded-bl-sm px-4 py-3">
              <ThinkingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-2.5 bg-white">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center gap-2 bg-brand-navy/5 rounded-xl px-4 py-2 focus-within:ring-1 focus-within:ring-brand-orange/40 focus-within:bg-background transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-1 bg-transparent text-xs text-brand-navy placeholder:text-brand-navy/35 outline-none py-1"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!inputText.trim() || isSending}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
              !inputText.trim() || isSending
                ? 'bg-brand-navy/5 text-brand-navy/20 cursor-not-allowed'
                : 'bg-brand-orange text-white hover:bg-brand-orange/90 active:scale-95 shadow-sm shadow-brand-orange/30'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>

      {/* Avatar dot */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
        isUser ? 'border border-brand-navy/10' : 'bg-brand-orange shadow-sm shadow-brand-orange/20'
      }`}>
        {isUser ? (
          <img src={profileImg} alt="Me" className="w-full h-full object-cover" />
        ) : (
          <Bot size={14} className="text-white" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-3.5 py-2.5 text-xs leading-relaxed ${
          isUser
            ? 'bg-brand-orange text-white rounded-2xl rounded-br-sm'
            : 'bg-brand-navy/5 border border-brand-navy/8 text-brand-navy rounded-2xl rounded-bl-sm'
        }`}>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 px-1 opacity-50">
          {message.source === 'voice'
            ? <Mic className="w-2.5 h-2.5 text-brand-navy" />
            : <Keyboard className="w-2.5 h-2.5 text-brand-navy" />
          }
          <span className="text-[9px] font-bold text-brand-navy uppercase tracking-wide">
            {message.source}
          </span>
          <span className="text-[9px] text-brand-navy ml-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>
      </div>

    </div>
  );
};

const ThinkingDots = () => (
  <div className="flex items-center gap-1 py-0.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-brand-orange/40 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
      />
    ))}
  </div>
);

function mapSessionMessageToDisplay(msg, localIdentity) {
  if (msg.type === 'userTranscript') {
    return { id: msg.id, role: 'user', text: msg.message, timestamp: msg.timestamp, source: 'voice' };
  }
  if (msg.type === 'agentTranscript') {
    return { id: msg.id, role: 'agent', text: msg.message, timestamp: msg.timestamp, source: 'voice' };
  }
  const isUser = localIdentity && msg.from?.identity === localIdentity;
  return { id: `chat-${msg.id}`, role: isUser ? 'user' : 'agent', text: msg.message, timestamp: msg.timestamp, source: 'text' };
}

export default ChatPanel;
