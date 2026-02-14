
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import ControlPanel from './components/ControlPanel';
import Terminal from './components/Terminal';
import NewAgentModal from './components/NewAgentModal';
import { Icons } from './constants';
import { Message, ProviderType, ToolCall, Task, ClineStatus, AgentInstance, Skill, MemoryEntry, Attachment, Rule, AgentConfig } from './types';
import { GeminiAgent } from './services/geminiService';

const App: React.FC = () => {
  // Global App State - Initializing from LocalStorage for persistence
  const [agents, setAgents] = useState<AgentInstance[]>(() => {
    const saved = localStorage.getItem('cline_agents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Reset volatile status to online on load
        return parsed.map((a: AgentInstance) => ({ ...a, status: 'online' }));
      } catch (e) {
        console.error("Failed to load agents", e);
      }
    }
    return [{
      id: 'default',
      name: 'Architect 1',
      status: 'online',
      messages: [],
      toolCalls: [],
      config: {
        provider: ProviderType.GEMINI,
        model: 'gemini-2.5-flash-lite-latest',
        temperature: 0.1
      }
    }];
  });

  const [activeAgentId, setActiveAgentId] = useState<string>(() => {
    return localStorage.getItem('cline_active_agent_id') || 'default';
  });

  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [isNewAgentModalOpen, setIsNewAgentModalOpen] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'memory' | 'skills' | 'rules'>('terminal');
  
  // Persistence states
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('cline_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [rules, setRules] = useState<Rule[]>(() => {
    const saved = localStorage.getItem('cline_rules');
    return saved ? JSON.parse(saved) : [
      { id: 'r1', content: 'Always use TypeScript for new files.', enabled: true },
      { id: 'r2', content: 'Prefix git commits with chore:, feat: or fix:.', enabled: false },
      { id: 'r3', content: 'Explain code changes before writing them.', enabled: true }
    ];
  });

  const [skills, setSkills] = useState<Skill[]>(() => {
    const saved = localStorage.getItem('cline_skills');
    return saved ? JSON.parse(saved) : [
      { id: 's1', name: 'Web Scraping', description: 'Advanced DOM extraction.', enabled: true },
      { id: 's2', name: 'Docker Orchestrator', description: 'Manage local containers.', enabled: false },
      { id: 's3', name: 'Unit Test Suite', description: 'Auto-generate Vitest suites.', enabled: true }
    ];
  });

  const [memory] = useState<MemoryEntry[]>([
    { id: 'm1', content: 'User prefers Tailwind CSS.', tags: ['ui'], timestamp: Date.now() },
    { id: 'm2', content: 'Project root is /workspace.', tags: ['infra'], timestamp: Date.now() }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<GeminiAgent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAgent = useMemo(() => 
    agents.find(a => a.id === activeAgentId) || agents[0]
  , [agents, activeAgentId]);

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem('cline_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('cline_active_agent_id', activeAgentId);
  }, [activeAgentId]);

  useEffect(() => {
    localStorage.setItem('cline_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('cline_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('cline_skills', JSON.stringify(skills));
  }, [skills]);

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      agentRef.current = new GeminiAgent(apiKey);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeAgent.messages, isTyping]);

  const handleDeployAgent = (name: string, config: AgentConfig) => {
    const newId = `agent-${Date.now()}`;
    const newAgent: AgentInstance = {
      id: newId,
      name,
      status: 'online',
      messages: [],
      toolCalls: [],
      config
    };
    setAgents(prev => [...prev, newAgent]);
    setActiveAgentId(newId);
  };

  const startRenaming = (agent: AgentInstance) => {
    setEditingAgentId(agent.id);
    setEditNameValue(agent.name);
  };

  const handleRenameSubmit = () => {
    if (editingAgentId && editNameValue.trim()) {
      setAgents(prev => prev.map(a => 
        a.id === editingAgentId ? { ...a, name: editNameValue.trim() } : a
      ));
    }
    setEditingAgentId(null);
  };

  const deleteAgent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (agents.length <= 1) return;
    setAgents(prev => {
      const filtered = prev.filter(a => a.id !== id);
      if (activeAgentId === id) {
        setActiveAgentId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      setUploadProgress(0);

      for (let i = 0; i <= 100; i += 25) {
        setUploadProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }

      const attachment: Attachment = { name: file.name, size: file.size, type: file.type };
      const userMsg: Message = {
        id: `up-${Date.now()}`,
        role: 'user',
        content: `Uploaded: ${file.name}`,
        timestamp: Date.now(),
        attachments: [attachment]
      };

      setAgents(prev => prev.map(a => a.id === activeAgentId ? { ...a, messages: [...a.messages, userMsg] } : a));
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !agentRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue, timestamp: Date.now() };

    setAgents(prev => prev.map(a => a.id === activeAgentId ? { ...a, status: 'busy', messages: [...a.messages, userMsg] } : a));
    setInputValue('');
    setIsTyping(true);

    const assistantId = (Date.now() + 1).toString();
    let assistantContent = '';

    try {
      setAgents(prev => prev.map(a => a.id === activeAgentId ? { ...a, messages: [...a.messages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }] } : a));

      const contextPrompt = rules.filter(r => r.enabled).map(r => `Rule: ${r.content}`).join('\n');
      const messagesWithRules = [{ id: 'sys-rules', role: 'system' as const, content: contextPrompt, timestamp: 0 }, ...activeAgent.messages, userMsg];

      // Use active agent's config for generation
      await agentRef.current.generateResponse(messagesWithRules, activeAgent.config, (chunk) => {
        assistantContent += chunk;
        setAgents(prev => prev.map(a => a.id === activeAgentId ? {
          ...a,
          messages: a.messages.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
        } : a));
      });

      const foundTools = agentRef.current.parseToolCalls(assistantContent);
      if (foundTools.length > 0) {
        setAgents(prev => prev.map(a => a.id === activeAgentId ? { ...a, toolCalls: [...a.toolCalls, ...foundTools] } : a));
      }
    } catch (err) {
      console.error(err);
      setAgents(prev => prev.map(a => 
        a.id === activeAgentId ? { ...a, status: 'error' } : a
      ));
    } finally {
      setIsTyping(false);
      setAgents(prev => prev.map(a => 
        (a.id === activeAgentId && a.status !== 'error') ? { ...a, status: 'online' } : a
      ));
    }
  };

  const getStatusColor = (status: ClineStatus) => {
    switch (status) {
      case 'online': return 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.7)]';
      case 'busy': return 'bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.7)]';
      case 'error': return 'bg-red-500 animate-[flash_0.8s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.7)]';
      case 'offline': return 'bg-zinc-600 shadow-none';
      default: return 'bg-zinc-600';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-zinc-300 font-sans selection:bg-blue-500/30">
      <Sidebar 
        selectedProvider={activeAgent.config.provider}
        setProvider={(p) => setAgents(prev => prev.map(a => a.id === activeAgentId ? { ...a, config: { ...a.config, provider: p } } : a))}
        isSettingsOpen={false} 
        setSettingsOpen={() => {}} 
      />

      <FileExplorer />

      <main className="flex-1 flex flex-col min-w-0 bg-zinc-900/10 border-r border-white/5">
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 glass-panel shrink-0 z-20">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar max-w-[70%] pr-4">
            <Icons.Logo />
            <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
            {agents.map(agent => (
              <div 
                key={agent.id}
                className={`group relative px-3 py-1.5 rounded-xl text-[11px] font-mono border transition-all whitespace-nowrap flex items-center gap-2.5 ${activeAgentId === agent.id ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/5 cursor-pointer'}`}
                onClick={() => activeAgentId !== agent.id && setActiveAgentId(agent.id)}
              >
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${getStatusColor(agent.status)}`}></span>
                {editingAgentId === agent.id ? (
                  <input
                    autoFocus
                    className="bg-zinc-800 border-none outline-none text-blue-300 px-1 rounded w-32 font-mono text-[11px]"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span 
                    onDoubleClick={(e) => { e.stopPropagation(); startRenaming(agent); }}
                    className="cursor-text select-none"
                    title="Double click to rename"
                  >
                    {agent.name}
                  </span>
                )}
                {agents.length > 1 && (
                  <button 
                    onClick={(e) => deleteAgent(e, agent.id)}
                    className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity ml-1 p-0.5 hover:bg-red-500/20 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={() => setIsNewAgentModalOpen(true)} 
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5 transition-colors flex items-center gap-2 px-3 shrink-0 group active:scale-95"
            >
              <Icons.Plus />
              <span className="text-[10px] font-mono uppercase tracking-tighter">Spawn specialist</span>
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Expertise</span>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">{activeAgent.name}</span>
             </div>
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shadow-lg shadow-black/50">
                <img src={`https://picsum.photos/seed/${activeAgentId}/80/80`} className="w-full h-full object-cover grayscale opacity-80" />
             </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
            {activeAgent.messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto opacity-30 select-none">
                <div className="mb-10 animate-pulse-subtle bg-blue-600/10 p-8 rounded-[2.5rem] border border-blue-500/10">
                   <Icons.Logo />
                </div>
                <h1 className="text-4xl font-light text-white mb-3 tracking-tighter">{activeAgent.name} Initialized</h1>
                <p className="text-sm text-zinc-400 leading-relaxed mb-12 max-w-md font-light">
                   Expert ready for directives. {activeAgent.name} will handle specialized logic layers within your virtual team environment using <span className="text-blue-400 font-mono">{activeAgent.config.model}</span>.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  {["Analyze project structure", "Setup CI/CD pipeline", "Audit security rules", "Refactor UI components"].map(t => (
                    <button key={t} onClick={() => setInputValue(t)} className="text-[11px] text-left p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10 transition-all font-mono uppercase tracking-[0.15em]">{t}</button>
                  ))}
                </div>
              </div>
            ) : (
              activeAgent.messages.map((m) => (
                <div key={m.id} className={`flex gap-5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role !== 'user' && <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-xl shadow-blue-600/20"><Icons.Cpu /></div>}
                  <div className={`max-w-[85%] rounded-[1.5rem] px-6 py-5 ${m.role === 'user' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/10' : 'bg-white/[0.02] text-zinc-100 border border-white/5 backdrop-blur-2xl'}`}>
                    {m.attachments?.map((file, idx) => (
                      <div key={idx} className="mb-4 flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/10 border-dashed">
                        <Icons.FileCode />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{file.name}</span>
                          <span className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    ))}
                    <p className="text-[14px] leading-relaxed font-light">{m.content}</p>
                  </div>
                  {m.role === 'user' && <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden"><img src={`https://picsum.photos/seed/user/80/80`} className="w-full h-full object-cover grayscale opacity-50" /></div>}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="h-80 border-t border-white/5 glass-panel flex flex-col shrink-0 bg-black/40 relative">
            <div className="flex items-center gap-8 px-8 border-b border-white/5 h-12 bg-black/60 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveBottomTab('terminal')} className={`text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2.5 h-full border-b-2 transition-all ${activeBottomTab === 'terminal' ? 'text-blue-400 border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                <Icons.Terminal /> Monitor
              </button>
              <button onClick={() => setActiveBottomTab('rules')} className={`text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2.5 h-full border-b-2 transition-all ${activeBottomTab === 'rules' ? 'text-green-400 border-green-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                <Icons.Rulebook /> Rules
              </button>
              <button onClick={() => setActiveBottomTab('skills')} className={`text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2.5 h-full border-b-2 transition-all ${activeBottomTab === 'skills' ? 'text-orange-400 border-orange-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                <Icons.Zap /> Skills
              </button>
              <button onClick={() => setActiveBottomTab('memory')} className={`text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2.5 h-full border-b-2 transition-all ${activeBottomTab === 'memory' ? 'text-purple-400 border-purple-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                <Icons.Brain /> Knowledge
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {activeBottomTab === 'terminal' && <Terminal />}
              {activeBottomTab === 'rules' && (
                <div className="p-8 overflow-y-auto h-full grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
                   {rules.map(r => (
                    <div key={r.id} className="p-5 bg-white/[0.02] rounded-3xl border border-white/5 flex items-start gap-4 group hover:border-green-500/30 transition-all">
                      <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400"><Icons.Shield /></div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <p className="text-xs text-zinc-300 font-light leading-relaxed">"{r.content}"</p>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold">Instruction persistent</span>
                      </div>
                      <button 
                        onClick={() => setRules(prev => prev.map(pr => pr.id === r.id ? {...pr, enabled: !pr.enabled} : pr))}
                        className={`w-10 h-5 rounded-full relative transition-all duration-500 ${r.enabled ? 'bg-green-600 shadow-lg shadow-green-600/20' : 'bg-zinc-800'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${r.enabled ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>
                   ))}
                   <button 
                    onClick={() => setRules(prev => [...prev, { id: `r-${Date.now()}`, content: 'New persistent behavioral constraint...', enabled: true }])}
                    className="p-5 bg-white/[0.01] rounded-3xl border border-white/5 border-dashed flex items-center justify-center gap-3 text-[10px] text-zinc-500 uppercase tracking-widest hover:bg-white/[0.03] transition-all"
                   >
                      <Icons.Plus /> Define New Rule
                   </button>
                </div>
              )}
              {activeBottomTab === 'skills' && (
                <div className="p-8 overflow-y-auto h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
                  {skills.map(s => (
                    <div key={s.id} className="p-5 bg-white/[0.02] rounded-3xl border border-white/5 flex flex-col gap-4 group hover:border-orange-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400"><Icons.Zap /></div>
                        <button 
                          onClick={() => setSkills(prev => prev.map(sk => sk.id === s.id ? {...sk, enabled: !sk.enabled} : sk))}
                          className={`w-10 h-5 rounded-full relative transition-all duration-500 ${s.enabled ? 'bg-orange-600 shadow-lg shadow-orange-600/20' : 'bg-zinc-800'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${s.enabled ? 'left-6' : 'left-1'}`}></div>
                        </button>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block mb-1">{s.name}</span>
                        <p className="text-[10px] text-zinc-500 leading-normal">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeBottomTab === 'memory' && (
                <div className="p-8 overflow-y-auto h-full flex flex-col gap-3 custom-scrollbar">
                   {memory.map(m => (
                    <div key={m.id} className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-5">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400"><Icons.Brain /></div>
                        <p className="text-xs text-zinc-300 font-light italic">"{m.content}"</p>
                      </div>
                      <div className="flex gap-2">
                        {m.tags.map(t => <span key={t} className="text-[9px] px-2 py-0.5 bg-zinc-800 rounded-full border border-white/5 text-zinc-500 uppercase font-mono">{t}</span>)}
                      </div>
                    </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 glass-panel bg-black/20 shrink-0">
          {isUploading && (
            <div className="max-w-5xl mx-auto mb-6">
              <div className="flex justify-between text-[10px] text-blue-400 font-mono uppercase tracking-[0.2em] mb-2 px-1">
                <span>Synchronizing Context...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
          <div className="max-w-5xl mx-auto flex items-end gap-5 relative">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mb-1 p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 transition-all border border-white/10 active:scale-95 disabled:opacity-20"
            >
              <Icons.Upload />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            
            <div className="flex-1 relative group">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={`Directive for ${activeAgent.name}...`}
                className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-5 pl-6 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all resize-none min-h-[64px] max-h-[200px] font-sans text-sm font-light placeholder:text-zinc-600"
                rows={1}
              />
              <button 
                onClick={handleSend}
                disabled={isTyping || !inputValue.trim() || isUploading}
                className="absolute right-3.5 bottom-3 p-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-20 disabled:grayscale transition-all shadow-xl shadow-blue-600/20 active:scale-90"
              >
                <Icons.Send />
              </button>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-10 text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-mono">
             <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Terminal Active</span>
             <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Virtual Team Synced</span>
             <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span> Author: Tarek Tarabichi</span>
          </div>
        </div>
      </main>

      <ControlPanel 
        toolCalls={activeAgent.toolCalls} 
        tasks={tasks} 
        onAddTask={(title) => setTasks(prev => [...prev, { id: Date.now().toString(), title, completed: false, createdAt: Date.now() }])} 
        onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? {...t, completed: !t.completed} : t))} 
        onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))} 
      />

      <NewAgentModal 
        isOpen={isNewAgentModalOpen} 
        onClose={() => setIsNewAgentModalOpen(false)} 
        onDeploy={handleDeployAgent}
      />
    </div>
  );
};

export default App;
