
import React from 'react';
import { Icons, CLINE_BLUE } from '../constants';
import { ProviderType } from '../types';

interface SidebarProps {
  selectedProvider: ProviderType;
  setProvider: (p: ProviderType) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  selectedProvider, 
  setProvider, 
  isSettingsOpen, 
  setSettingsOpen 
}) => {
  const providers = Object.values(ProviderType);

  return (
    <aside className="w-16 md:w-20 glass-panel flex flex-col items-center py-6 gap-8 z-20">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600/20 text-blue-500 mb-4 glow-blue">
        <Icons.Cpu />
      </div>

      <nav className="flex-1 flex flex-col gap-6">
        <button 
          title="Terminal"
          className="p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
        >
          <Icons.Terminal />
        </button>
        <button 
          title="Workspace"
          className="p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
        >
          <Icons.Folder />
        </button>
      </nav>

      <div className="flex flex-col gap-6 mt-auto">
        <button 
          onClick={() => setSettingsOpen(!isSettingsOpen)}
          className={`p-3 rounded-xl transition-all ${isSettingsOpen ? 'bg-blue-600/20 text-blue-500' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
        >
          <Icons.Settings />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
          <img src="https://picsum.photos/seed/user/80/80" alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
