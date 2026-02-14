
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import ControlPanel from './components/ControlPanel';
import Terminal from './components/Terminal';
import { Icons } from './constants';
import { Message, ProviderType, ToolCall, Task, ClineStatus, AgentInstance, Skill, MemoryEntry, Attachment } from './types';
import { GeminiAgent } from './services/geminiService';

const App: React.FC = () => {
  // Global App State
  const [agents, setAgents] = useState<AgentInstance[]>([{
    id: 'default',
    name: 'Agent 1',
    status: 'online',
    messages: [],
    toolCalls: []
  }]);
  const [activeAgentId, setActiveAgentId] = useState('default');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeProvider, setActiveProvider] = useState<ProviderType>(ProviderType.GEMINI);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'memory' | 'skills'>('terminal');
  
  // Persistence states
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('cline_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [skills, setSkills] = useState<Skill[]>([
    { id: '1', name: 'Web Scraping', description: 'DOM navigation and data extraction.', enabled: true },
    { id: '2', name: 'Docker Ops', description: 'Container orchestration logic.', enabled: false },
    { id: '3', name: 'Unit Test Engine', description: 'Auto-generate Vitest suites.', enabled: true },
    { id: '4', name: 'Security Auditor', description: 'Vulnerability scan & patch.', enabled: true }
  ]);

  const [memory] = useState<MemoryEntry[]>([
    { id: 'm1', content: 'User prefers Tailwind CSS over plain CSS.', tags: ['ui', 'config'], timestamp: Date.now() },
    { id: 'm2', content: 'Base project path is set to /home/workspace/project-alpha', tags: ['infra'], timestamp: Date.now() }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<GeminiAgent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAgent = useMemo(() => 
    agents.find(a => a.id === activeAgentId) || agents[0]
  , [agents, activeAgentId]);

  useEffect(() => {
    localStorage.setItem('cline_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      agentRef.current = new GeminiAgent(apiKey);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeAgent.messages, isTyping]);

  const createAgent = () => {
    const newId = `agent-${Date.now()}`;
    const nextNumber = agents.length + 1;
    setAgents(prev => [...prev, {
      id: newId,
      name: `Agent ${nextNumber}`,
      status: 'online',
      messages: [],
      toolCalls: []
    }]);
    setActiveAgentId(newId);
  };

  const addTask = (title: string) => {
    setTasks(prev => [...prev, { id: Date.now().toString(), title, completed: false, createdAt: Date.now() }]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate real-time upload progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(r => setTimeout(r, 150));
      }

      const attachment: Attachment = {
        name: file.name,
        size: file.size,
        type: file.type
      };

      const userMsg: Message = {
        id: `upload-${Date.now()}`,
        role: 'user',
        content: `Uploaded file for context analysis: ${file.name}`,
        timestamp: Date.now(),
        attachments: [attachment]
      };

      setAgents(prev => prev.map(a => 
        a.id === activeAgentId ? { ...a, messages: [...a.messages, userMsg] } : a
      ));
      
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !agentRef.current) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setAgents(prev => prev.map(a => 
      a.id === activeAgentId ? { ...a, status: 'busy', messages: [...a.messages, userMsg] } : a
    ));
    setInputValue('');
    setIsTyping(true);

    const assistantId = (Date.now() + 1).toString();
    let assistantContent = '';

    try {
      setAgents(prev => prev.map(a => 
        a.id === activeAgentId ? { 
          ...a, 
          messages: [...a.messages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }] 
        } : a
      ));

      await agentRef.current.generateResponse([...activeAgent.messages, userMsg], (chunk) => {
        assistantContent += chunk;
        setAgents(prev => prev.map(a => 
          a.id === activeAgentId ? {
            ...a,
            messages: a.messages.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
          } : a
        ));
      });

      const foundTools = agentRef.current.parseToolCalls(assistantContent);
      if (foundTools.length > 0) {
        setAgents(prev => prev.map(a => 
          a.id === activeAgentId ? { ...a, toolCalls: [...a.toolCalls, ...foundTools] } : a
        ));
      }
    } catch (err) {
      console.error(err);
      setAgents(prev => prev.map(a => 
        a.id === activeAgentId ? { ...a, status: 'error' } : a
      ));
    } finally {
      setIsTyping(false);
      setAgents(prev => prev.map(a => 
        a.id === activeAgentId && a.status !== 'error' ? { ...a, status: 'online' } : a
      ));
    }
  };

  const getStatusClass = (status: ClineStatus) => {
    switch (status) {
      case 'online': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]';
      case 'busy': return 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]';
      case 'error': return 'bg-red-500 animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.5)]';
      case 'offline': return 'bg-zinc-600';
      default: return 'bg-zinc-600';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-zinc-300">
      <Sidebar 
        selectedProvider={activeProvider} 
        setProvider={setActiveProvider}
        isSettingsOpen={isSettingsOpen}
        setSettingsOpen={setIsSettingsOpen}
      />

      <FileExplorer />

      <main className="flex-1 flex flex-col min-w-0 bg-zinc-900/10 border-r border-white/5">
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 glass-panel shrink-0 z-10">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <Icons.Logo />
            <div className="h-6 w-[1px] bg-white/10 ml-2"></div>
            {agents.map(agent => (
              <button 
                key={agent.id}
                onClick={() => setActiveAgentId(agent.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono border transition-all whitespace-nowrap flex items-center gap-2 ${activeAgentId === agent.id ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/5'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusClass(agent.status)}`}></span>
                {agent.name}
              </button>
            ))}
            <button 
              onClick={createAgent} 
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5 transition-colors flex items-center gap-1.5 px-3"
            >
              <Icons.Plus />
              <span className="text-[10px] font-mono uppercase tracking-tighter">New Agent</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 uppercase font-bold tracking-tighter">
                ACTIVE_LINK: 2tinteractive
             </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
            {activeAgent.messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto opacity-50 select-none">
                <div className="mb-8 animate-pulse-subtle bg-blue-600/20 p-6 rounded-3xl border border-blue-500/20">
                   <Icons.Logo />
                </div>
                <h1 className="text-3xl font-light text-white mb-2 tracking-tight">Mission Control: {activeAgent.name}</h1>
                <p className="text-sm text-zinc-400 leading-relaxed mb-10 max-w-md">
                  Instruct <span className="text-blue-400 font-bold">Cline</span> to orchestrate architectural shifts or deploy infrastructure. 
                </p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  {["Analyze current architecture", "Refactor services", "Audit vulnerabilities", "Scale instance clusters"].map(t => (
                    <button key={t} onClick={() => setInputValue(t)} className="text-[11px] text-left p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all font-mono uppercase tracking-wider">{t}</button>
                  ))}
                </div>
              </div>
            ) : (
              activeAgent.messages.map((m) => (
                <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role !== 'user' && <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20"><Icons.Cpu /></div>}
                  <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${m.role === 'user' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10' : 'bg-white/[0.04] text-zinc-100 border border-white/5 backdrop-blur-md'}`}>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {m.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/10 min-w-[200px]">
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Icons.FileCode /></div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs font-bold truncate text-white">{file.name}</span>
                              <span className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-sans font-light">{m.content}</p>
                  </div>
                  {m.role === 'user' && <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden"><img src={`https://picsum.photos/seed/${activeAgent.id}/80/80`} className="w-full h-full object-cover" /></div>}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Dock */}
          <div className="h-72 border-t border-white/5 glass-panel flex flex-col shrink-0 bg-black/40">
            <div className="flex items-center gap-6 px-6 border-b border-white/5 h-11 bg-black/40 overflow-x-auto no-scrollbar">
              <button onClick={() => setActiveBottomTab('terminal')} className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all h-full border-b-2 ${activeBottomTab === 'terminal' ? 'text-blue-400 border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                <Icons.Terminal /> Terminal
              </button>
              <button onClick={() => setActiveBottomTab('memory')} className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all h-full border-b-2 ${activeBottomTab === 'memory' ? 'text-purple-400 border-purple-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                <Icons.Brain /> Memory Store
              </button>
              <button onClick={() => setActiveBottomTab('skills')} className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all h-full border-b-2 ${activeBottomTab === 'skills' ? 'text-orange-400 border-orange-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                <Icons.Zap /> Skill Matrix
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeBottomTab === 'terminal' && <Terminal />}
              {activeBottomTab === 'memory' && (
                <div className="p-6 overflow-y-auto h-full grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
                  {memory.map(m => (
                    <div key={m.id} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 text-xs hover:border-purple-500/30 transition-all group">
                      <div className="flex justify-between mb-3">
                         <span className="text-zinc-500 font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                         <div className="flex gap-1">
                           {m.tags.map(t => <span key={t} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full text-[9px] uppercase font-bold tracking-tighter">{t}</span>)}
                         </div>
                      </div>
                      <p className="text-zinc-300 font-light leading-relaxed">"{m.content}"</p>
                    </div>
                  ))}
                </div>
              )}
              {activeBottomTab === 'skills' && (
                <div className="p-6 overflow-y-auto h-full flex flex-col gap-3 custom-scrollbar">
                  {skills.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-white tracking-wide">{s.name}</span>
                        <span className="text-[10px] text-zinc-500">{s.description}</span>
                      </div>
                      <button 
                        onClick={() => setSkills(prev => prev.map(sk => sk.id === s.id ? {...sk, enabled: !sk.enabled} : sk))}
                        className={`w-10 h-5 rounded-full relative transition-all duration-300 ${s.enabled ? 'bg-orange-600 shadow-lg shadow-orange-600/20' : 'bg-zinc-800'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${s.enabled ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Console Input */}
        <div className="p-6 border-t border-white/5 glass-panel shrink-0 bg-black/20">
          {isUploading && (
            <div className="max-w-5xl mx-auto mb-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between text-[10px] text-blue-400 font-mono uppercase tracking-widest mb-1.5 px-1">
                <span>Uploading Context File...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
          <div className="max-w-5xl mx-auto flex items-end gap-3 relative">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Upload file to context"
              className="mb-1 p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 transition-all border border-white/10 active:scale-95 disabled:opacity-30"
            >
              <Icons.Upload />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={`Issue directive to ${activeAgent.name}...`}
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-4.5 pl-5 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all resize-none min-h-[60px] max-h-[200px] font-sans text-sm"
                rows={1}
              />
              <button 
                onClick={handleSend}
                disabled={isTyping || !inputValue.trim() || isUploading}
                className="absolute right-3.5 bottom-3.5 p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-blue-600/20 active:scale-90"
              >
                <Icons.Send />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-8 text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-mono">
             <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-500"></span> Terminal: Connected</span>
             <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-purple-500"></span> Memory: Locked</span>
             <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-green-500"></span> Author: Tarek Tarabichi</span>
          </div>
        </div>
      </main>

      <ControlPanel 
        toolCalls={activeAgent.toolCalls} 
        tasks={tasks} 
        onAddTask={addTask} 
        onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? {...t, completed: !t.completed} : t))} 
        onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))} 
      />
    </div>
  );
};

export default App;
