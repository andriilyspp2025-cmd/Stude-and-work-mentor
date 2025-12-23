import React, { useState } from 'react';
import { analyzeCodeOrProfile } from '../services/geminiService';
import { LoadingState, UserProfile, HistoryItem } from '../types';
import { ScanSearch, FileCode, ArrowRight, History, Clock } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  history: HistoryItem[];
  onSave: (item: HistoryItem) => void;
}

export const Scanner: React.FC<Props> = ({ userProfile, history, onSave }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setStatus('loading');
    
    const response = await analyzeCodeOrProfile(input, userProfile);
    
    setResult(response);
    setStatus('success');

    // Generate a title based on input (first 30 chars)
    const title = input.length > 40 ? input.substring(0, 40) + '...' : input;

    onSave({
      id: Date.now().toString(),
      type: 'scanner',
      title: title || "Scan Result",
      content: response,
      timestamp: Date.now()
    });
  };

  const handleHistoryClick = (item: HistoryItem) => {
    // If content is an object (from previous Agent search), handle it, though Scanner usually expects string.
    if (typeof item.content === 'string') {
        setResult(item.content);
    } else {
        setResult(JSON.stringify(item.content, null, 2));
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-12rem)] max-w-7xl mx-auto p-4 gap-6">
      
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <ScanSearch className="text-sky-400" /> 
            Фаза 1: Сканер Навичок
          </h2>
          <p className="text-slate-400 mb-4">
            Я знаю про твій профіль ({userProfile.bioSummary}). 
            Встав код для рев'ю або опиши нову навичку.
          </p>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Встав код або опис навички..."
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono text-sm resize-none"
          />
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={status === 'loading' || !input}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                status === 'loading' 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/50'
              }`}
            >
              {status === 'loading' ? 'Аналізую...' : 'Почати Сканування'}
              {!status && <ArrowRight size={18} />}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="text-pink-400" />
              <h3 className="text-xl font-semibold text-white">Результат Аналізу</h3>
            </div>
            <div className="markdown-content text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {result}
            </div>
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
         <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden h-fit max-h-[600px] flex flex-col sticky top-24">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
               <History size={16} className="text-slate-400"/>
               <h3 className="font-bold text-slate-200 text-sm uppercase">Історія Запитів</h3>
            </div>
            <div className="overflow-y-auto p-2 space-y-2">
              {history.length === 0 && <div className="text-slate-500 text-xs p-2 text-center">Історія порожня</div>}
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-700 transition-colors group"
                >
                  <div className="text-sm font-medium text-slate-300 group-hover:text-white truncate mb-1">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock size={10} />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
         </div>
      </div>

    </div>
  );
};