import React, { useState } from 'react';
import { generateProjectIdeas, generateLearningRoadmap } from '../services/geminiService';
import { LoadingState, UserProfile, HistoryItem } from '../types';
import { Trello, Zap, Map, Download, Copy, Check, FileDown, History, Clock } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  history: HistoryItem[];
  onSave: (item: HistoryItem) => void;
}

export const Architect: React.FC<Props> = ({ userProfile, history, onSave }) => {
  const [activeTab, setActiveTab] = useState<'project' | 'roadmap'>('roadmap');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const prompt = input.trim() ? input : "Базуючись на моєму профілі"; 
    
    setStatus('loading');
    setResult('');
    
    let response;
    let titlePrefix = "";

    if (activeTab === 'project') {
      response = await generateProjectIdeas(prompt, userProfile);
      titlePrefix = "Project Idea: ";
    } else {
      response = await generateLearningRoadmap(prompt, userProfile);
      titlePrefix = "Roadmap: ";
    }
    
    setResult(response);
    setStatus('success');

    // Auto-save to history
    onSave({
      id: Date.now().toString(),
      type: activeTab,
      title: titlePrefix + (input ? input.substring(0, 20) + "..." : "Auto-generated"),
      content: response,
      timestamp: Date.now()
    });
  };

  const handleHistoryClick = (item: HistoryItem) => {
     if (typeof item.content === 'string') {
        setResult(item.content);
        setActiveTab(item.type as 'project' | 'roadmap');
     }
  };

  const handleCopyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadObsidian = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = "Career_Roadmap.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-12rem)] max-w-7xl mx-auto p-4 gap-6">
      
      {/* Main Panel */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Trello className="text-emerald-400" />
            Фаза 2: Архітектор
          </h2>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-slate-700 pb-2">
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`pb-2 px-2 transition-colors font-medium flex items-center gap-2 ${
                activeTab === 'roadmap' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Map size={18} /> План Навчання
            </button>
            <button
              onClick={() => setActiveTab('project')}
              className={`pb-2 px-2 transition-colors font-medium flex items-center gap-2 ${
                activeTab === 'project' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={18} /> Ідея Пет-Проєкту
            </button>
          </div>

          <p className="text-slate-400 mb-4">
            Я використовую твій профіль ({userProfile.bioSummary}).
          </p>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeTab === 'roadmap' 
              ? "Уточнення: наприклад, React Performance..." 
              : "Уточнення: наприклад, WebSockets Project..."}
            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-4 resize-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={status === 'loading'}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                status === 'loading'
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
              }`}
            >
              {status === 'loading' ? 'Генерую...' : (activeTab === 'roadmap' ? 'Створити План' : 'Згенерувати Ідею')}
              {status !== 'loading' && <Zap size={18} />}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg animate-fade-in relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Твій Результат</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyToClipboard}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                    userProfile.integrations.notion 
                      ? 'bg-green-900/40 text-green-200 hover:bg-green-900/60 border border-green-800'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                  title={userProfile.integrations.notion ? "Save to Notion (Connected)" : "Copy for Notion"}
                >
                  {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                  {userProfile.integrations.notion ? (copied ? 'Sent to Notion' : 'Save to Notion') : (copied ? 'Copied' : 'Copy')}
                </button>
                
                <button 
                  onClick={handleDownloadObsidian}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                    userProfile.integrations.obsidian
                      ? 'bg-purple-900/40 text-purple-200 hover:bg-purple-900/60 border border-purple-800'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                  title={userProfile.integrations.obsidian ? "Export to Obsidian Vault" : "Download Markdown"}
                >
                  {userProfile.integrations.obsidian ? <FileDown size={14} /> : <Download size={14} />}
                  {userProfile.integrations.obsidian ? 'Save to Obsidian' : '.md (Obsidian)'}
                </button>
              </div>
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
               <h3 className="font-bold text-slate-200 text-sm uppercase">Збережене</h3>
            </div>
            <div className="overflow-y-auto p-2 space-y-2">
              {history.length === 0 && <div className="text-slate-500 text-xs p-2 text-center">Історія порожня</div>}
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === 'roadmap' ? <Map size={12} className="text-emerald-400"/> : <Zap size={12} className="text-amber-400"/>}
                    <div className="text-sm font-medium text-slate-300 group-hover:text-white truncate">
                      {item.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 pl-5">
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