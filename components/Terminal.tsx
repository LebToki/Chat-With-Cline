
import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  output?: string;
  onExecute?: (command: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ output = '', onExecute }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const processedOutputRef = useRef<number>(0);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new XTerm({
      theme: {
        background: '#09090b', // zinc-950
        foreground: '#e4e4e7', // zinc-200
        cursor: '#3b82f6', // blue-500
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 12,
      cursorBlink: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.write('\r\n\x1b[38;2;59;130;246mCLINE MISSION CONTROL v2.0\x1b[0m\r\n');
    term.write('Waiting for agent stream...\r\n\r\n');

    // Handle resizing
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Update terminal content when output changes
  useEffect(() => {
    if (!xtermRef.current) return;

    const newContent = output.slice(processedOutputRef.current);
    if (newContent) {
      xtermRef.current.write(newContent);
      processedOutputRef.current = output.length;
    }
  }, [output]);

  return (
    <div className="h-full w-full bg-[#09090b] p-4 overflow-hidden border-t border-white/5">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
};

export default Terminal;
