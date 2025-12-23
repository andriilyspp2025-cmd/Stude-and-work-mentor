import React, { useState, useEffect } from 'react';
import { AppMode, UserProfile, AppState, HistoryItem, Message } from './types';
import { Scanner } from './components/Scanner';
import { Architect } from './components/Architect';
import { Mentor } from './components/Mentor';
import { Agent } from './components/Agent';
import { Onboarding } from './components/Onboarding';
import { ProfileSettings } from './components/ProfileSettings';
import { ScanSearch, Trello, Mic, Briefcase, BrainCircuit, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SCANNER);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Global State for Persistence
  const [appState, setAppState] = useState<AppState>({
    scannerHistory: [],
    architectHistory: [],
    agentHistory: [],
    mentorMessages: []
  });

  // Load profile and history from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('ua_tech_mentor_profile');
    const savedHistory = localStorage.getItem('ua_tech_mentor_history');

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (!parsed.integrations) parsed.integrations = { notion: false, obsidian: false };
        setUserProfile(parsed);
      } catch (e) {
        console.error("Failed to parse profile", e);
      }
    }

    if (savedHistory) {
      try {
        setAppState(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (userProfile) { // Only save if user is logged in
        localStorage.setItem('ua_tech_mentor_history', JSON.stringify(appState));
    }
  }, [appState, userProfile]);

  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('ua_tech_mentor_profile', JSON.stringify(profile));
  };

  const handleLogout = () => {
    localStorage.removeItem('ua_tech_mentor_profile');
    localStorage.removeItem('ua_tech_mentor_history');
    setUserProfile(null);
    setAppState({ scannerHistory: [], architectHistory: [], agentHistory: [], mentorMessages: [] });
    setIsProfileOpen(false);
  };

  // State updaters
  const addHistoryItem = (category: keyof AppState, item: HistoryItem) => {
    setAppState(prev => ({
      ...prev,
      [category]: [item, ...(prev[category] as any[]).slice(0, 19)] // Keep last 20 items
    }));
  };

  const updateMentorMessages = (messages: Message[]) => {
    setAppState(prev => ({ ...prev, mentorMessages: messages }));
  };

  const renderContent = () => {
    if (!userProfile) return null;

    switch (mode) {
      case AppMode.SCANNER: 
        return <Scanner 
          userProfile={userProfile} 
          history={appState.scannerHistory} 
          onSave={(item) => addHistoryItem('scannerHistory', item)} 
        />;
      case AppMode.ARCHITECT: 
        return <Architect 
          userProfile={userProfile} 
          history={appState.architectHistory}
          onSave={(item) => addHistoryItem('architectHistory', item)}
        />;
      case AppMode.MENTOR: 
        return <Mentor 
          messages={appState.mentorMessages}
          onUpdateMessages={updateMentorMessages}
          contextData={{
            lastArchitecture: appState.architectHistory[0],
            lastScan: appState.scannerHistory[0]
          }}
        />; 
      case AppMode.AGENT: 
        return <Agent 
          userProfile={userProfile} 
          history={appState.agentHistory}
          onSave={(item) => addHistoryItem('agentHistory', item)}
        />;
      default: return <Scanner userProfile={userProfile} history={appState.scannerHistory} onSave={() => {}} />;
    }
  };

  const NavItem = ({ m, icon: Icon, label, colorClass }: { m: AppMode, icon: any, label: string, colorClass: string }) => (
    <button
      onClick={() => setMode(m)}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 w-full md:w-auto md:flex-1 ${
        mode === m 
          ? `bg-slate-800 border-b-4 ${colorClass} text-white shadow-lg scale-105` 
          : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
      }`}
    >
      <Icon className={`mb-2 ${mode === m ? 'text-white' : 'opacity-70'}`} size={24} />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200">
         <Onboarding onComplete={handleUpdateProfile} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <ProfileSettings 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onUpdate={handleUpdateProfile}
        onLogout={handleLogout}
      />

      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">UA Tech Mentor</h1>
              <p className="text-xs text-slate-400">Вітаємо, {userProfile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-xs text-slate-500 font-mono">
              v1.3.0 • History Sync
            </div>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Налаштування профілю"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                {userProfile.name.charAt(0)}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Профіль</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-8 mb-6">
        <nav className="flex flex-row gap-2 md:gap-4 justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800/50">
          <NavItem 
            m={AppMode.SCANNER} 
            icon={ScanSearch} 
            label="Scanner" 
            colorClass="border-sky-500" 
          />
          <NavItem 
            m={AppMode.ARCHITECT} 
            icon={Trello} 
            label="Architect" 
            colorClass="border-emerald-500" 
          />
          <NavItem 
            m={AppMode.MENTOR} 
            icon={Mic} 
            label="Mentor" 
            colorClass="border-indigo-500" 
          />
          <NavItem 
            m={AppMode.AGENT} 
            icon={Briefcase} 
            label="Agent" 
            colorClass="border-amber-500" 
          />
        </nav>
      </div>

      <main className="pb-12 animate-fade-in">
        {renderContent()}
      </main>
      
       <footer className="text-center py-6 text-slate-600 text-xs">
        <p>This AI agent creates simulated career advice. Always verify with real market data.</p>
      </footer>
    </div>
  );
};

export default App;