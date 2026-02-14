
import React, { useState, useEffect, useRef } from 'react';

interface TerminalProps {
  onExecute?: (command: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ onExecute }) => {
  const [history, setHistory] = useState<string[]>([
    'Cline Mission Control OS [Version 1.0.5]',
    '(c) 2tinteractive.com. All rights reserved.',
    '',
    'root@cline:~$ agent --init-workspace',
    'Initializing workspace environment...',
    'Done. Ready for instructions.'
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setHistory(prev => [...prev, `root@cline:~$ ${input}`]);
    if (onExecute) onExecute(input);
    
    // Simulate some generic output if it's not handled
    setTimeout(() => {
      setHistory(prev => [...prev, `Executing: ${input}...`, 'Exit code: 0']);
    }, 500);
    
    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-black/90 font-mono text-xs p-3 terminal-glow border-t border-white/5">
      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-2 space-y-1">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith('root@') ? 'text-blue-400' : 'text-zinc-400'}>
            {line}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <span className="text-blue-500">root@cline:~$</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-transparent border-none outline-none flex-1 text-white caret-blue-500"
          autoFocus
        />
      </form>
    </div>
  );
};

export default Terminal;
