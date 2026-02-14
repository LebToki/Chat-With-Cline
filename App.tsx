
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import ControlPanel from './components/ControlPanel';
import Terminal from './components/Terminal';
import { Icons, CLINE_BLUE } from './constants';
import { Message, ProviderType, ToolCall, Task, ClineStatus, AgentInstance, Skill, MemoryEntry } from './types';
import { GeminiAgent } from './services/geminiService';

const App: React.FC = () => {
  // Multi-agent state
  const [agents, setAgents] = useState<AgentInstance[]>([{
    id: 'default',
    name: 'Primary Agent',
    status: 'online',
    messages: [],
    toolCalls: []
  }]);
  const [activeAgentId, setActiveAgentId] = useState('default');
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeProvider, setActiveProvider] = useState<ProviderType>(ProviderType.GEMINI);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'memory' | 'skills'>('terminal');
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('cline_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [skills] = useState<Skill[]>([
    { id: '1', name: 'Web Scraping', description: 'Advanced DOM navigation and data extraction.', enabled: true },
    { id: '2', name: 'Docker Orchestration', description: 'Manage containers and services.', enabled: false },
    { id: '3', name: 'Unit Test Generation', description: 'Auto-generate Vitest/Jest suites.', enabled: true }
  ]);

  const [memory, setMemory] = useState<MemoryEntry[]>([
    { id: 'm1', content: 'User prefers Tailwind CSS over plain CSS.', tags: ['ui', 'config'], timestamp: Date.now() },
    { id: 'm2', content: 'Database schema is located in /docs/schema.db', tags: ['infra'], timestamp: Date.now() }
  ]);

  const [hasError, setHasError] = useState(false);
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
    setAgents(prev => [...prev, {
      id: newId,
      name: `Agent ${prev.length + 1}`,
      status: 'online',
      messages: [],
      toolCalls: []
    }]);
    setActiveAgentId(newId);
  };

  const addTask = (title: string) => {
    setTasks(prev => [...prev, { id: Date.now().toString(), title, completed: false, createdAt: Date.now() }]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileName = files[0].name;
      const systemMsg: Message = {
        id: `sys-${Date.now()}`,
        role: 'system',
        content: `Attached file: ${fileName}`,
        timestamp: Date.now()
      };
      setAgents(prev => prev.map(a => 
        a.id === activeAgentId ? { ...a, messages: [...a.messages, systemMsg] } : a
      ));
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
      a.id === activeAgentId ? { ...a, messages: [...a.messages, userMsg] } : a
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
      setHasError(true);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-zinc-300 font-sans">
      <Sidebar 
        selectedProvider={activeProvider} 
        setProvider={setActiveProvider}
        isSettingsOpen={isSettingsOpen}
        setSettingsOpen={setIsSettingsOpen}
      />

      <FileExplorer />

      <main className="flex-1 flex flex-col min-w-0 bg-zinc-900/10">
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 glass-panel shrink-0">
          <div className="flex items-center gap-4 overflow-x-auto">
            <Icons.Logo />
            <div className="h-6 w-[1px] bg-white/10 ml-2"></div>
            {agents.map(agent => (
              <button 
                key={agent.id}
                onClick={() => setActiveAgentId(agent.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono border transition-all whitespace-nowrap flex items-center gap-2 ${activeAgentId === agent.id ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/5'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeAgentId === agent.id ? 'bg-blue-400 animate-pulse' : 'bg-zinc-700'}`}></span>
                {agent.name}
              </button>
            ))}
            <button onClick={createAgent} className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400">
              <Icons.Plus />
            </button>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase hidden md:inline">Mission Control v1.0.6</span>
             <div className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 uppercase font-bold tracking-tighter">
                {activeProvider} :: OK
             </div>
          </div>
        </header>

        {/* Dynamic Center Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Flow */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {activeAgent.messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto opacity-50">
                <div className="mb-6 animate-pulse-subtle">
                   <Icons.Logo />
                </div>
                <h1 className="text-2xl font-light text-white mb-2">Initialize Objective</h1>
                <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                  Command <span className="text-blue-400 font-bold">Cline</span> to build, refactor, or deploy. System status is nominal.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {["Refactor Auth Layer", "Setup Redis Cache", "Security Audit", "Generate Unit Tests"].map(t => (
                    <button key={t} onClick={() => setInputValue(t)} className="text-xs text-left p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05]">{t}</button>
                  ))}
                </div>
              </div>
            ) : (
              activeAgent.messages.map((m) => (
                <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role !== 'user' && <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0"><Icons.Cpu /></div>}
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/[0.04] text-zinc-100 border border-white/5'}`}>
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Integrated Dock (Terminal/Memory/Skills) */}
          <div className="h-64 border-t border-white/5 glass-panel flex flex-col shrink-0">
            <div className="flex items-center gap-4 px-6 border-b border-white/5 h-10 bg-black/20">
              <button onClick={() => setActiveBottomTab('terminal')} className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-colors ${activeBottomTab === 'terminal' ? 'text-blue-400' : 'text-zinc-500'}`}>
                <Icons.Terminal /> Terminal
              </button>
              <button onClick={() => setActiveBottomTab('memory')} className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-colors ${activeBottomTab === 'memory' ? 'text-purple-400' : 'text-zinc-500'}`}>
                <Icons.Brain /> Memory
              </button>
              <button onClick={() => setActiveBottomTab('skills')} className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-colors ${activeBottomTab === 'skills' ? 'text-orange-400' : 'text-zinc-500'}`}>
                <Icons.Zap /> Skills
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeBottomTab === 'terminal' && <Terminal />}
              {activeBottomTab === 'memory' && (
                <div className="p-4 overflow-y-auto h-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  {memory.map(m => (
                    <div key={m.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                      <div className="flex justify-between mb-2">
                         <span className="text-zinc-500">{new Date(m.timestamp).toLocaleTimeString()}</span>
                         <div className="flex gap-1">
                           {m.tags.map(t => <span key={t} className="px-1.5 bg-blue-500/20 text-blue-400 rounded text-[9px]">{t}</span>)}
                         </div>
                      </div>
                      <p className="text-zinc-300 italic">"{m.content}"</p>
                    </div>
                  ))}
                </div>
              )}
              {activeBottomTab === 'skills' && (
                <div className="p-4 overflow-y-auto h-full flex flex-col gap-2">
                  {skills.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{s.name}</span>
                        <span className="text-[10px] text-zinc-500">{s.description}</span>
                      </div>
                      <div className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${s.enabled ? 'bg-blue-600' : 'bg-zinc-800'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${s.enabled ? 'left-4.5' : 'left-0.5'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Input */}
        <div className="p-6 border-t border-white/5 glass-panel shrink-0">
          <div className="max-w-4xl mx-auto flex items-end gap-3 relative">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mb-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-all border border-white/5"
            >
              <Icons.Upload />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Issue commands to active agent..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-4 pr-16 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all resize-none min-h-[60px] max-h-[200px]"
                rows={1}
              />
              <button 
                onClick={handleSend}
                disabled={isTyping || !inputValue.trim()}
                className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all"
              >
                <Icons.Send />
              </button>
            </div>
          </div>
        </div>
      </main>

      <ControlPanel toolCalls={activeAgent.toolCalls} tasks={tasks} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} />
    </div>
  );
};

export default App;
