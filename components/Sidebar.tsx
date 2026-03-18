
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
    <aside className="w-20 lg:w-24 bg-zinc-950/90 border-r border-white/10 flex flex-col items-center py-8 gap-10 z-30">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
        <Icons.Logo />
      </div>

      <nav className="flex-1 flex flex-col gap-8">
        <div className="relative group flex items-center justify-center">
          <button
            className="p-4 rounded-xl hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-all duration-300"
          >
            <Icons.Cpu />
          </button>
          <span className="absolute left-16 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Directives</span>
        </div>
        <div className="relative group flex items-center justify-center">
          <button
            className="p-4 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-all duration-300"
          >
            <Icons.Folder />
          </button>
          <span className="absolute left-16 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Repository</span>
        </div>
        <div className="relative group flex items-center justify-center">
          <button
            className="p-4 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-all duration-300"
          >
            <Icons.Zap />
          </button>
          <span className="absolute left-16 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Metrics</span>
        </div>
      </nav>

      <div className="flex flex-col gap-8 mt-auto">
        <div className="relative group">
          <button 
            className="p-4 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-all duration-300"
          >
            <Icons.Settings />
          </button>
          <span className="absolute left-16 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Settings</span>
          <div className="absolute left-full ml-4 bottom-0 w-48 bg-zinc-900 border border-white/10 rounded-2xl p-4 hidden group-hover:block backdrop-blur-3xl shadow-2xl z-50">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-3">Model Matrix</span>
            {providers.map(p => (
              <button 
                key={p}
                onClick={() => setProvider(p)}
                className={`w-full text-left py-2 text-[11px] hover:text-blue-400 transition-colors ${selectedProvider === p ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all cursor-pointer">
          <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
