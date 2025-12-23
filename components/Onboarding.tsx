import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Message } from '../types';
import { createOnboardingChat, summarizeUserProfile } from '../services/geminiService';
import { parseFile } from '../utils/fileParsers';
import { GenerateContentResponse, Chat } from "@google/genai";
import { User, Bot, ArrowRight, Save, Send, Loader2, Upload, FileText } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step 1: Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    github: '',
    linkedin: '',
    cv: ''
  });

  // Step 2: Chat Data
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat when entering step 2
  useEffect(() => {
    if (step === 2 && !chatSession) {
      const initChat = async () => {
        setLoading(true);
        const chat = createOnboardingChat();
        setChatSession(chat);
        try {
          const res: GenerateContentResponse = await chat.sendMessage({ 
            message: `Hi, I am ${formData.name}. My email is ${formData.email}. I want to start my career in IT.` 
          });
          setChatHistory([{ role: 'model', content: res.text || "Привіт! Розкажи, який напрямок тебе цікавить?" }]);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      initChat();
    }
  }, [step, formData.name, formData.email]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleNext = () => {
    if (formData.name && formData.email) setStep(2);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await parseFile(file);
      setFormData(prev => ({ ...prev, cv: text }));
    } catch (error: any) {
      alert(error.message || "Помилка читання файлу");
    } finally {
      setLoading(false);
      // Reset input value to allow re-uploading the same file if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChatSend = async () => {
    if (!input.trim() || !chatSession) return;
    const userMsg = input;
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res: GenerateContentResponse = await chatSession.sendMessage({ message: userMsg });
      setChatHistory(prev => [...prev, { role: 'model', content: res.text || "..." }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    // Combine chat history into a single string context
    const chatContext = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    
    // Generate AI Summary
    const bioSummary = await summarizeUserProfile(formData, chatContext);

    const newProfile: UserProfile = {
      name: formData.name,
      email: formData.email,
      githubUrl: formData.github,
      linkedinUrl: formData.linkedin,
      cvText: formData.cv,
      bioSummary: bioSummary,
      isOnboarded: true,
      integrations: {
        notion: false,
        obsidian: false
      }
    };

    onComplete(newProfile);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900/50 p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">Налаштування Профілю</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-400'}`}>1. Дані</span>
            <span className="text-slate-600">→</span>
            <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-400'}`}>2. Інтерв'ю</span>
          </div>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="p-8 space-y-6 animate-fade-in relative">
            {loading && (
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="animate-spin text-sky-400" size={32} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Ім'я <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-sky-500 focus:outline-none"
                  placeholder="Ім'я Прізвище"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Email <span className="text-red-400">*</span></label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-sky-500 focus:outline-none"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">GitHub URL</label>
                <input 
                  type="text" 
                  value={formData.github}
                  onChange={e => setFormData({...formData, github: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-sky-500 focus:outline-none"
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">LinkedIn URL</label>
                <input 
                  type="text" 
                  value={formData.linkedin}
                  onChange={e => setFormData({...formData, linkedin: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-sky-500 focus:outline-none"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-slate-400 text-sm">Резюме (CV) / Навички</label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <Upload size={12} /> Завантажити файл
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".txt,.md,.json,.csv,.pdf,.docx"
                />
              </div>
              <textarea 
                value={formData.cv}
                onChange={e => setFormData({...formData, cv: e.target.value})}
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-sky-500 focus:outline-none resize-none font-mono text-xs"
                placeholder="Вставте текст резюме або завантажте файл (PDF, DOCX, TXT)..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleNext}
                disabled={!formData.name || !formData.email}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Продовжити <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: AI Interview (Unchanged logic, just re-rendering for completion) */}
        {step === 2 && (
          <div className="flex flex-col h-[500px] animate-fade-in">
             <div className="p-4 bg-sky-900/20 border-b border-sky-900/30">
               <p className="text-sky-200 text-sm">
                 ШІ-Ментор задасть декілька питань, щоб краще зрозуміти твій рівень та цілі. 
                 Відповідай чесно.
               </p>
             </div>
             
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
               {chatHistory.map((msg, i) => (
                 <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-sky-600'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-slate-700 text-slate-200' : 'bg-sky-900/40 text-sky-100 border border-sky-800'}`}>
                      {msg.content}
                    </div>
                 </div>
               ))}
               {loading && <div className="text-slate-500 text-xs italic pl-12">Ментор друкує...</div>}
             </div>

             <div className="p-4 bg-slate-900 border-t border-slate-700 flex gap-2">
               <input 
                 type="text" 
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                 placeholder="Напиши відповідь..."
                 className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 text-white focus:border-sky-500 focus:outline-none"
               />
               <button 
                 onClick={handleChatSend}
                 disabled={!input || loading}
                 className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
               >
                 <Send size={18} />
               </button>
               
               {chatHistory.length > 3 && (
                 <button 
                   onClick={handleFinish}
                   className="ml-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
                 >
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
                    Зберегти
                 </button>
               )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};