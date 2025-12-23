import React from 'react';
import { UserProfile } from '../types';
import { X, User, Check, AlertCircle } from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (profile: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileSettings: React.FC<Props> = ({ userProfile, isOpen, onClose, onUpdate, onLogout }) => {
  if (!isOpen) return null;

  const toggleIntegration = (key: 'notion' | 'obsidian') => {
    const newProfile = {
      ...userProfile,
      integrations: {
        ...userProfile.integrations,
        [key]: !userProfile.integrations[key]
      }
    };
    onUpdate(newProfile);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative m-4">
        
        {/* Header */}
        <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="text-sky-400" /> Профіль
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="space-y-4">
             <div>
               <label className="text-xs text-slate-500 uppercase font-semibold">Ім'я</label>
               <div className="text-white text-lg font-medium">{userProfile.name}</div>
             </div>
             <div>
               <label className="text-xs text-slate-500 uppercase font-semibold">Email</label>
               <div className="text-slate-300">{userProfile.email}</div>
             </div>
             <div>
               <label className="text-xs text-slate-500 uppercase font-semibold">Резюме (CV)</label>
               <div className="text-slate-400 text-sm truncate bg-slate-900 p-2 rounded">
                 {userProfile.cvText.length > 50 ? userProfile.cvText.substring(0, 50) + '...' : userProfile.cvText || 'Пусто'}
               </div>
             </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Інтеграції</h3>
            
            {/* Notion */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg mb-3">
              <div className="flex items-center gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" alt="Notion" className="w-6 h-6 rounded" />
                <div>
                  <div className="text-white font-medium text-sm">Notion</div>
                  <div className="text-xs text-slate-500">{userProfile.integrations.notion ? 'Connected' : 'Not Connected'}</div>
                </div>
              </div>
              <button 
                onClick={() => toggleIntegration('notion')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  userProfile.integrations.notion 
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {userProfile.integrations.notion ? 'Connected' : 'Connect'}
              </button>
            </div>

            {/* Obsidian */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-purple-900 flex items-center justify-center text-purple-300 font-bold text-xs">Ob</div>
                <div>
                  <div className="text-white font-medium text-sm">Obsidian</div>
                  <div className="text-xs text-slate-500">{userProfile.integrations.obsidian ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
              <button 
                onClick={() => toggleIntegration('obsidian')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  userProfile.integrations.obsidian
                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {userProfile.integrations.obsidian ? 'Enabled' : 'Enable'}
              </button>
            </div>
          </div>
          
          <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 flex gap-2">
            <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200">
              Note: This is a client-side demo. "Connecting" simulates the auth state. In a real app, this would use OAuth2.
            </p>
          </div>

          <button 
            onClick={onLogout}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold text-sm transition-colors"
          >
            Вийти з акаунту
          </button>
        </div>
      </div>
    </div>
  );
};