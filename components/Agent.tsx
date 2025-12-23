import React, { useState, useEffect, useMemo } from 'react';
import { analyzeJobAndCoverLetter, findOpportunities } from '../services/geminiService';
import { LoadingState, UserProfile, HistoryItem, SearchResultJSON, Vacancy } from '../types';
import { Briefcase, FileText, Search, ExternalLink, Globe, History, Clock, MapPin, Building, Eye, Bookmark, EyeOff, Tag, Filter, CheckCircle, Plus, SearchCheck } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  history: HistoryItem[];
  onSave: (item: HistoryItem) => void;
}

export const Agent: React.FC<Props> = ({ userProfile, history, onSave }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'coverLetter'>('search');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ data: SearchResultJSON, sources: any[] } | null>(null);
  
  // Interaction State (Saved/Hidden/Filter)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [hiddenJobIds, setHiddenJobIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Cover Letter State
  const [jobDesc, setJobDesc] = useState('');
  const [coverLetterResult, setCoverLetterResult] = useState('');
  
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleSearch = async () => {
    const query = searchQuery.trim() || `Junior positions for ${userProfile.bioSummary}`;
    
    setStatus('loading');
    setSearchResults(null);
    setCategoryFilter(null); // Reset filter on new search

    const response = await findOpportunities(query, userProfile);
    setSearchResults(response);
    setStatus('success');

    onSave({
      id: Date.now().toString(),
      type: 'search',
      title: `Search: ${query.substring(0, 20)}`,
      content: response.data,
      timestamp: Date.now(),
      metadata: response.sources
    });
  };

  const handleCoverLetter = async () => {
    if (!jobDesc.trim()) return;
    setStatus('loading');
    setCoverLetterResult('');
    const response = await analyzeJobAndCoverLetter(jobDesc, userProfile);
    setCoverLetterResult(response);
    setStatus('success');

    onSave({
      id: Date.now().toString(),
      type: 'cover_letter',
      title: `Cover Letter (${new Date().toLocaleDateString()})`,
      content: response,
      timestamp: Date.now()
    });
  };

  const handleHistoryClick = (item: HistoryItem) => {
    if (item.type === 'search') {
      setActiveTab('search');
      setCategoryFilter(null);
      if (typeof item.content !== 'string') {
          setSearchResults({ data: item.content as SearchResultJSON, sources: item.metadata || [] });
      } else {
          setSearchResults({ data: { summary: item.content, vacancies: [], internships: [] }, sources: item.metadata || []});
      }
    } else {
      setActiveTab('coverLetter');
      if (typeof item.content === 'string') setCoverLetterResult(item.content);
    }
  };

  const toggleSaveJob = (id: string) => {
    const newSet = new Set(savedJobIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSavedJobIds(newSet);
  };

  const toggleHideJob = (id: string) => {
    const newSet = new Set(hiddenJobIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setHiddenJobIds(newSet);
  };

  // Filter Logic
  const filteredVacancies = useMemo(() => {
    if (!searchResults?.data.vacancies) return [];
    
    return searchResults.data.vacancies.filter(v => {
      if (hiddenJobIds.has(v.id)) return false;
      if (categoryFilter) {
        // Case insensitive match for tags
        return v.tags.some(tag => tag.toLowerCase().includes(categoryFilter.toLowerCase()));
      }
      return true;
    });
  }, [searchResults, hiddenJobIds, categoryFilter]);

  // Extract Categories from Results
  const categories = useMemo(() => {
    if (!searchResults?.data.vacancies) return [];
    const counts: Record<string, number> = {};
    
    searchResults.data.vacancies.forEach(v => {
      v.tags.forEach(tag => {
        // Simple normalization
        const key = tag.trim(); 
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by count desc
      .slice(0, 8); // Top 8 tags
  }, [searchResults]);


  const JobCard = ({ vacancy }: { vacancy: Vacancy }) => {
    const isSaved = savedJobIds.has(vacancy.id);
    // Check if URL is likely a general search or specific post based on typical patterns
    const isSearchLink = vacancy.url.includes('?') || vacancy.url.includes('search') || vacancy.url.includes('jobs.dou.ua/vacancies/?');

    return (
      <div className={`bg-slate-800 rounded-xl p-5 border transition-all mb-4 shadow-sm group ${isSaved ? 'border-sky-500/50 bg-sky-900/10' : 'border-slate-700 hover:border-slate-600'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <div className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
               {vacancy.company.substring(0, 1)}
            </div>
            <span className="font-semibold text-slate-400 hover:underline cursor-pointer">{vacancy.company}</span>
            <span>•</span>
            <span className="text-emerald-500 font-medium">{vacancy.datePosted}</span>
            {vacancy.viewsCount && (
              <>
                 <span>•</span>
                 <span className="flex items-center gap-1"><Eye size={10} /> {vacancy.viewsCount} відгуків</span>
              </>
            )}
          </div>
        </div>

        <a href={vacancy.url} target="_blank" rel="noopener noreferrer" className="block text-lg font-bold text-sky-400 hover:underline mb-2">
          {vacancy.title}
        </a>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-sm text-slate-400 mb-3">
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-slate-500" />
            {vacancy.location}
          </div>
          {vacancy.tags && vacancy.tags.length > 0 && (
            <div className="flex items-center gap-2">
               <span className="text-slate-600">|</span>
               {vacancy.tags.map(tag => (
                 <button 
                  key={tag} 
                  onClick={() => setCategoryFilter(tag)}
                  className="text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded text-xs hover:bg-slate-600 transition-colors"
                 >
                   {tag}
                 </button>
               ))}
            </div>
          )}
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-2">
          {vacancy.descriptionSnippet}
        </p>

        <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
          <div className="flex gap-2">
             <button 
               onClick={() => toggleSaveJob(vacancy.id)}
               className={`flex items-center gap-1 text-xs font-semibold transition-colors px-2 py-1 rounded ${
                 isSaved ? 'text-sky-400 bg-sky-900/30' : 'text-slate-400 hover:text-sky-400 hover:bg-slate-700'
               }`}
             >
               <Bookmark size={14} className={isSaved ? "fill-sky-400" : ""} /> {isSaved ? 'Збережено' : 'Зберегти'}
             </button>
             <button 
               onClick={() => toggleHideJob(vacancy.id)}
               className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors px-2 py-1 hover:bg-slate-700 rounded"
             >
               <EyeOff size={14} /> Сховати
             </button>
          </div>
          {vacancy.source && (
             <a href={vacancy.url} target="_blank" className="text-xs hover:underline flex items-center gap-1 text-sky-500">
               {isSearchLink ? <SearchCheck size={12} /> : <ExternalLink size={12} />}
               {isSearchLink ? `Пошук: ${vacancy.source}` : `Вакансія: ${vacancy.source}`}
             </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-12rem)] max-w-7xl mx-auto p-4 gap-6">
      
      {/* LEFT COLUMN: Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Briefcase className="text-amber-400" />
            Фаза 4: Кар'єрний Агент
          </h2>

          <div className="flex space-x-4 mb-6 border-b border-slate-700 pb-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-2 px-2 transition-colors font-medium flex items-center gap-2 ${
                activeTab === 'search' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe size={18} /> Пошук Можливостей
            </button>
            <button
              onClick={() => setActiveTab('coverLetter')}
              className={`pb-2 px-2 transition-colors font-medium flex items-center gap-2 ${
                activeTab === 'coverLetter' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={18} /> Cover Letter
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="animate-fade-in">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Junior Data Engineer..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={status === 'loading'}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-6 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  {status === 'loading' ? 'Пошук...' : 'Знайти'}
                  {!status && <Search size={18} />}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'coverLetter' && (
            <div className="animate-fade-in">
              <p className="text-slate-400 mb-4">
                Скопіюй опис вакансії. Я напишу Cover Letter.
              </p>
              <div className="mb-4">
                  <textarea
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Встав текст вакансії тут..."
                    className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm resize-none"
                  />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCoverLetter}
                  disabled={status === 'loading' || !jobDesc}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  {status === 'loading' ? 'Обробка...' : 'Написати Cover Letter'}
                  <FileText size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'search' && searchResults && (
          <div className="animate-fade-in space-y-6">
            
            {/* Header / Summary */}
            <div className="mb-4">
                 <h1 className="text-2xl font-bold text-white mb-2">
                   Вакансії {searchResults.data.vacancies.length > 0 ? `${searchResults.data.vacancies[0].title.split(' ')[0]}...` : ''} <span className="text-slate-500 text-lg font-normal">{filteredVacancies.length} (total {searchResults.data.vacancies.length})</span>
                 </h1>
                 <p className="text-slate-400 text-sm">{searchResults.data.summary}</p>
            </div>

            {/* Vacancy List */}
            <div>
              {filteredVacancies.map((v) => (
                <JobCard key={v.id} vacancy={v} />
              ))}
              {filteredVacancies.length === 0 && searchResults.data.vacancies.length > 0 && (
                <div className="text-center p-8 text-slate-500 border border-slate-700/50 rounded-lg border-dashed">
                  Всі вакансії приховані фільтром
                </div>
              )}
               {searchResults.data.vacancies.length === 0 && (
                <div className="text-center p-8 text-slate-500">Вакансій не знайдено</div>
              )}
            </div>

            {/* Internships Section */}
            {searchResults.data.internships && searchResults.data.internships.length > 0 && (
                <div className="mt-8">
                     <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Навчальні програми та стажування</h2>
                     {searchResults.data.internships.map((v) => (
                        <JobCard key={v.id} vacancy={v} />
                     ))}
                </div>
            )}
            
          </div>
        )}

        {activeTab === 'coverLetter' && coverLetterResult && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg animate-fade-in">
            <div className="markdown-content text-slate-300 whitespace-pre-wrap">
              {coverLetterResult}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Sidebar (History + Search Options) */}
      <div className="w-full md:w-72 flex-shrink-0 space-y-6">
         
         {/* Search Filter Widget (Visual only for Agent tab) */}
         {activeTab === 'search' && searchResults && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg p-4">
               <h3 className="font-bold text-white text-sm mb-3">Ваш пошук</h3>
               <div className="flex flex-wrap gap-2 mb-4">
                 <div className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-1 rounded text-xs flex items-center gap-1 group cursor-pointer" onClick={() => { setSearchQuery(''); setCategoryFilter(null); }}>
                   {searchQuery || "Junior"} <span className="group-hover:text-white">x</span>
                 </div>
                 {categoryFilter && (
                   <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-xs flex items-center gap-1 group cursor-pointer" onClick={() => setCategoryFilter(null)}>
                     {categoryFilter} <span className="group-hover:text-white">x</span>
                   </div>
                 )}
               </div>
               
               <div className="space-y-2 text-sm">
                 <button 
                  onClick={() => alert("Підписка створена (симуляція)")}
                  className="flex items-center gap-2 text-sky-400 hover:text-sky-300 w-full text-left"
                 >
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-400"><Plus size={14}/></div>
                    Створити підписку
                 </button>
                 <button className="flex items-center gap-2 text-slate-400 hover:text-white w-full text-left pl-1">
                    <Filter size={14} /> Розширений пошук
                 </button>
                 <button className="flex items-center gap-2 text-slate-400 hover:text-white w-full text-left pl-1">
                    <Building size={14} /> Знайти компанію
                 </button>
                 {savedJobIds.size > 0 && (
                   <div className="pt-2 mt-2 border-t border-slate-700/50">
                      <div className="flex items-center gap-2 text-slate-300 text-xs">
                        <Bookmark size={12} className="fill-slate-300"/> Збережено: {savedJobIds.size}
                      </div>
                   </div>
                 )}
               </div>

               <div className="mt-6 border-t border-slate-700 pt-4">
                  <h4 className="font-bold text-slate-500 text-xs uppercase mb-2">Категорії</h4>
                  <ul className="space-y-1 text-sm text-slate-400">
                     {categories.map(([tag, count]) => (
                       <li 
                        key={tag} 
                        onClick={() => setCategoryFilter(tag)}
                        className={`flex justify-between cursor-pointer transition-colors ${categoryFilter === tag ? 'text-emerald-400 font-bold' : 'hover:text-sky-400'}`}
                       >
                         <span>{tag}</span> <span className="text-slate-600">{count}</span>
                       </li>
                     ))}
                     {categories.length === 0 && <li className="text-xs text-slate-600 italic">Немає категорій</li>}
                  </ul>
               </div>
            </div>
         )}

         {/* History Widget */}
         <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden h-fit max-h-[500px] flex flex-col sticky top-24">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-2">
               <History size={16} className="text-slate-400"/>
               <h3 className="font-bold text-slate-200 text-sm uppercase">Історія</h3>
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