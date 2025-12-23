import React, { useState, useEffect, useRef } from 'react';
import { createInterviewChat } from '../services/geminiService';
import { Message, HistoryItem } from '../types';
import { Chat, GenerateContentResponse } from "@google/genai";
import { Mic, Send, User, Bot, Loader2 } from 'lucide-react';

interface Props {
  messages: Message[];
  onUpdateMessages: (msgs: Message[]) => void;
  contextData: {
    lastArchitecture?: HistoryItem;
    lastScan?: HistoryItem;
  };
}

export const Mentor: React.FC<Props> = ({ messages, onUpdateMessages, contextData }) => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Re-create chat session with full history and context whenever the component mounts
    // or when contextData drastically changes (though mainly on mount)
    const chat = createInterviewChat(messages, contextData);
    setChatSession(chat);
    
    // If no history, send initial greeting
    if (messages.length === 0 && !initializedRef.current) {
      const startInterview = async () => {
        setIsTyping(true);
        try {
          // Note: createInterviewChat already sets system instructions, 
          // but we need to trigger the first model response.
          const response: GenerateContentResponse = await chat.sendMessage({ 
              message: "Привіт. Я готовий. Почни з короткого вступу." 
          });
          onUpdateMessages([{ role: 'model', content: response.text || '' }]);
        } catch (e) {
          console.error(e);
        } finally {
          setIsTyping(false);
        }
      };
      startInterview();
      initializedRef.current = true;
    }
  }, []); // Run once on mount to setup chat

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;

    const userMsg = input;
    setInput('');
    const newHistory: Message[] = [...messages, { role: 'user', content: userMsg }];
    onUpdateMessages(newHistory);
    setIsTyping(true);

    try {
      const result: GenerateContentResponse = await chatSession.sendMessage({ message: userMsg });
      const text = result.text || "Вибач, я не зрозумів.";
      onUpdateMessages([...newHistory, { role: 'model', content: text }]);
    } catch (error) {
      console.error(error);
      onUpdateMessages([...newHistory, { role: 'model', content: "Виникла помилка з'єднання." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto p-4">
      <div className="bg-slate-800 p-4 rounded-t-xl border border-slate-700 border-b-0 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Mic className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mock Interview</h2>
            <p className="text-xs text-indigo-300">
              {contextData.lastArchitecture ? `Context: ${contextData.lastArchitecture.title}` : 'Deep Reasoning Mode Active'}
            </p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-900 border-x border-slate-700 p-6 overflow-y-auto space-y-6"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                : 'bg-indigo-900/30 border border-indigo-500/30 text-slate-200 rounded-tl-none'
            }`}>
               <div className="markdown-content whitespace-pre-wrap text-sm leading-relaxed">
                 {msg.content}
               </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
               <Bot size={20} />
             </div>
             <div className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-2xl rounded-tl-none flex items-center">
               <Loader2 className="animate-spin text-indigo-400" size={20} />
             </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-4 rounded-b-xl border border-slate-700 border-t-0 shadow-lg">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введіть вашу відповідь..."
            className="w-full bg-slate-900 border border-slate-600 rounded-full py-3 pl-6 pr-14 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
          />
          <button 
            onClick={handleSend}
            disabled={!input || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};