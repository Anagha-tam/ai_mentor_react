import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocalParticipant, useSessionMessages, useRoomContext } from '@livekit/components-react';
import { Send, Mic, MicOff, Keyboard, Bot } from 'lucide-react';
import profileImg from '../assets/profile.png';

const SUGGESTIONS = [
  "Explain Newton's laws of motion",
  "Help me with integration by parts",
];

const ChatPanel = ({
  agentState,
  user,
  dataTranscripts = [],
  conversationHistory = [],
  sessionReady,
  socketError,
  isTalking = false,
  onTalkStart,
  onTalkEnd,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);
  const { messages: sessionMessages, send, isSending } = useSessionMessages();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [localMessages, setLocalMessages] = useState([]);

  const displayMessages = useMemo(() => {
    const localId = localParticipant?.identity;
    const liveKitMsgs = sessionMessages.map((msg) => mapSessionMessageToDisplay(msg, localId));

    // Merge all sources and de-duplicate by id. The worker's data-channel
    // transcripts (dataTranscripts) are authoritative for voice text —
    // they arrive immediately rather than being synced to playout — so we
    // prefer them over any overlapping LiveKit built-in transcripts.
    const byId = new Map();
    for (const msg of conversationHistory) byId.set(msg.id, msg);
    for (const msg of liveKitMsgs) byId.set(msg.id, msg);
    for (const msg of dataTranscripts) byId.set(msg.id, msg);
    for (const msg of localMessages) byId.set(msg.id, msg);

    return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
  }, [sessionMessages, localParticipant, dataTranscripts, conversationHistory, localMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  const handleSend = async (text) => {
    const trimmed = (text ?? inputText).trim();
    if (!trimmed || isSending) return;
    setInputText('');

    const localEntry = {
      id: `user-text-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
      source: 'text',
    };
    setLocalMessages((prev) => [...prev, localEntry]);

    try {
      // Prefer LiveKit's lk.chat topic — this is what the backend mentor
      // worker listens on for text input. Fall back to the component lib's
      // send() if the low-level API isn't available.
      if (room?.localParticipant?.sendText) {
        await room.localParticipant.sendText(trimmed, { topic: 'lk.chat' });
      } else {
        await send(trimmed);
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
      if (!text) setInputText(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden"
         style={{ background: 'linear-gradient(160deg, #f8f9ff 0%, #f3f4fd 50%, #eef0fb 100%)' }}>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-5 py-6 space-y-4 scroll-smooth">

        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">

            {/* Hero icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange to-[#6366F1]
                            flex items-center justify-center
                            shadow-[0_8px_32px_rgba(59,71,194,0.30)]">
              <Mic size={18} className="text-white" />
            </div>

            <p className="text-[15px] font-semibold text-brand-navy">Ready to learn?</p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-3.5 py-2 rounded-full glass border-brand-orange/15
                             text-xs font-medium text-brand-navy/60 hover:text-brand-orange
                             hover:bg-brand-orange/8 hover:border-brand-orange/25
                             hover:shadow-[0_2px_12px_rgba(59,71,194,0.12)]
                             transition-all duration-200 text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {displayMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {agentState === 'thinking' && (
          <div className="flex items-end gap-2.5 animate-message-in">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-brand-orange to-[#6366F1]
                            flex items-center justify-center shrink-0
                            shadow-[0_2px_8px_rgba(59,71,194,0.25)]">
              <Bot size={13} className="text-white" />
            </div>
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3
                            shadow-[0_4px_16px_rgba(59,71,194,0.08)]">
              <ThinkingDots />
            </div>
          </div>
        )}
      </div>

      {/* Floating input */}
      <div className="px-4 pb-4 pt-2">
        <p className="text-[10px] text-brand-navy/35 font-medium text-center mb-1.5 select-none">
          Hold <span className="font-bold text-brand-navy/55">Space</span> or the mic button to talk
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2.5 glass-strong rounded-2xl px-4 py-2.5
                     shadow-[0_4px_24px_rgba(59,71,194,0.10)]
                     focus-within:shadow-[0_4px_24px_rgba(59,71,194,0.18)]
                     focus-within:border-brand-orange/30 transition-all duration-200"
        >
          <button
            type="button"
            aria-label={isTalking ? 'Release to stop talking' : 'Hold to talk'}
            onPointerDown={(e) => {
              try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
              onTalkStart?.();
            }}
            onPointerUp={(e) => {
              try { e.currentTarget.releasePointerCapture?.(e.pointerId); } catch {}
              onTalkEnd?.();
            }}
            onPointerCancel={() => onTalkEnd?.()}
            onPointerLeave={(e) => {
              if (e.buttons === 0) return;
              onTalkEnd?.();
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 select-none ${
              isTalking
                ? 'bg-gradient-to-br from-red-500 to-rose-500 text-white scale-105 shadow-[0_2px_12px_rgba(244,63,94,0.40)] animate-pulse'
                : 'bg-brand-navy/8 text-brand-navy/55 hover:bg-brand-navy/12'
            }`}
          >
            {isTalking ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            className="flex-1 bg-transparent text-[13px] text-brand-navy
                       placeholder:text-brand-navy/30 outline-none py-0.5"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
              !inputText.trim() || isSending
                ? 'bg-brand-navy/6 text-brand-navy/20 cursor-not-allowed'
                : 'bg-gradient-to-br from-brand-orange to-[#6366F1] text-white hover:scale-105 active:scale-95 shadow-[0_2px_10px_rgba(59,71,194,0.30)]'
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
    <div className={`flex items-end gap-2.5 animate-message-in ${isUser ? 'flex-row-reverse' : ''}`}>

      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
        isUser
          ? 'border border-white/80 shadow-[0_2px_8px_rgba(59,71,194,0.12)]'
          : 'bg-gradient-to-br from-brand-orange to-[#6366F1] shadow-[0_2px_8px_rgba(59,71,194,0.25)]'
      }`}>
        {isUser ? (
          <img src={profileImg} alt="Me" className="w-full h-full object-cover" />
        ) : (
          <Bot size={13} className="text-white" />
        )}
      </div>

      <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 text-[13px] leading-relaxed rounded-2xl ${
          isUser
            ? 'bg-gradient-to-br from-brand-orange to-[#6366F1] text-white rounded-br-sm shadow-[0_4px_16px_rgba(59,71,194,0.25)]'
            : 'glass rounded-bl-sm shadow-[0_4px_16px_rgba(59,71,194,0.08)] text-brand-navy'
        }`}>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>

        <div className="flex items-center gap-1.5 px-1 opacity-35">
          {message.source === 'voice'
            ? <Mic className="w-2.5 h-2.5 text-brand-navy" />
            : <Keyboard className="w-2.5 h-2.5 text-brand-navy" />
          }
          <span className="text-[10px] font-medium text-brand-navy uppercase tracking-wide">
            {message.source}
          </span>
          <span className="text-[10px] text-brand-navy ml-0.5">
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
        className="w-1.5 h-1.5 rounded-full bg-brand-orange/50 animate-think-fade"
        style={{ animationDelay: `${i * 0.2}s` }}
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
