
import React, { useState } from 'react';
import { Icons } from '../constants';
import { ToolCall, Task } from '../types';

interface ControlPanelProps {
  toolCalls: ToolCall[];
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  toolCalls, 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask 
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="w-80 glass-panel border-l border-white/5 flex flex-col hidden xl:flex">
      {/* Tasks Section */}
      <div className="p-4 border-b border-white/5 bg-white/[0.01]">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex justify-between items-center">
          Mission Tasks
          <span className="text-[10px] text-blue-400">{completedCount}/{tasks.length}</span>
        </h2>
        
        <form onSubmit={handleAddTask} className="mb-4">
          <input 
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New objective..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </form>

        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {tasks.length === 0 ? (
            <div className="text-[11px] text-zinc-600 italic py-2 text-center">No active objectives defined.</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="group flex items-center gap-2 text-xs bg-white/[0.02] border border-white/5 p-2 rounded-lg hover:border-white/10 transition-colors">
                <button 
                  onClick={() => onToggleTask(task.id)}
                  className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${task.completed ? 'bg-blue-600 border-blue-600' : 'border-white/20'}`}
                >
                  {task.completed && <Icons.CheckCircle />}
                </button>
                <span className={`flex-1 truncate ${task.completed ? 'line-through text-zinc-600' : 'text-zinc-400'}`}>
                  {task.title}
                </span>
                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-b border-white/5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Agent Activity</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {toolCalls.length === 0 ? (
          <div className="text-zinc-600 text-sm italic text-center mt-8">
            No active processes...
          </div>
        ) : (
          toolCalls.slice().reverse().map(call => (
            <div key={call.id} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-blue-400 text-xs">{call.name}</span>
                <span className={`text-[10px] px-1.5 rounded uppercase ${
                  call.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                  call.status === 'running' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                  'bg-zinc-500/10 text-zinc-400'
                }`}>
                  {call.status}
                </span>
              </div>
              <div className="font-mono text-[11px] text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap">
                {JSON.stringify(call.args)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-zinc-500">Mission Progress</span>
          <span className="text-blue-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
