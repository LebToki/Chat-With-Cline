
import React, { useState } from 'react';
import { Icons } from '../constants';
import { ProviderType, AgentConfig } from '../types';

interface NewAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (name: string, config: AgentConfig) => void;
}

const NewAgentModal: React.FC<NewAgentModalProps> = ({ isOpen, onClose, onDeploy }) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<ProviderType>(ProviderType.GEMINI);
  const [model, setModel] = useState('gemini-2.5-flash-lite-latest');
  const [temperature, setTemperature] = useState(0.1);
  const [baseUrl, setBaseUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onDeploy(name, { provider, model, temperature, baseUrl });
    // Reset defaults
    setName('');
    setProvider(ProviderType.GEMINI);
    setModel('gemini-2.5-flash-lite-latest');
    setTemperature(0.1);
    setBaseUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col glass-panel animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-xl text-blue-500">
              <Icons.Plus />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Deploy Specialist</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Expert Designation</label>
            <input 
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frontend Architect"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Provider</label>
              <select 
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderType)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
              >
                {Object.values(ProviderType).map(p => <option key={p} value={p} className="bg-zinc-900">{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Temperature</label>
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                max="1" 
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Model String</label>
            <input 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gemini-2.5-flash-lite-latest"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {(provider === ProviderType.OLLAMA || provider === ProviderType.LMSTUDIO) && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">Local Base URL</label>
              <input 
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-sm transition-all"
            >
              Abort
            </button>
            <button 
              type="submit"
              className="flex-[2] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              Initialize specialist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAgentModal;
