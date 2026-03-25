import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MentorChatPage({ user, onLogout }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `Hello ${user.firstName || user.email}! I'm your AI Mentor. How can I assist you with your ${user.stream?.toUpperCase() || 'studies'} prep today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // TODO: Connect this to actual backend chat endpoint
    // Simulate AI response for now
    setTimeout(() => {
      const botResponse = {
        role: 'bot',
        content: "I'm still learning how to process that. In the meantime, keep up the great work!",
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full text-left">
      {/* Top Navigation Bar */}
      <header className="flex w-full items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg text-white">
            <Bot size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">AI Mentor</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 font-medium">
             <User size={18} />
             <span>{user.firstName || user.email}</span>
             {user.stream && (
               <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs ml-2">
                 {user.stream?.toUpperCase()} - Class {user.class}
               </span>
             )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onLogout}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Log out"
          >
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col p-4 sm:p-6 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 pb-4 sm:px-4 hide-scrollbar"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex w-full justify-start">
              <div className="flex max-w-[85%] gap-3 flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl shadow-sm bg-white border border-gray-200 text-gray-800 rounded-tl-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input Form Wrapper */}
      <footer className="w-full bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto w-full relative">
          <form onSubmit={handleSend} className="flex gap-2 items-end relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message your AI Mentor..."
              className="w-full rounded-2xl border-gray-300 pr-12 focus-visible:ring-green-500 py-6"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-1.5 rounded-full bg-green-600 hover:bg-green-700 w-[38px] h-[38px] transition-transform active:scale-95"
            >
              <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
            </Button>
          </form>
          <div className="text-center mt-2 text-xs text-gray-400">
            AI Mentor can make mistakes. Consider cross-checking important information.
          </div>
        </div>
      </footer>
    </div>
  );
}
