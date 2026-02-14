
import React from 'react';
import { Icons } from '../constants';
import { WorkspaceFile } from '../types';

const mockFiles: WorkspaceFile[] = [
  {
    name: 'src',
    path: '/src',
    type: 'directory',
    children: [
      { name: 'App.tsx', path: '/src/App.tsx', type: 'file' },
      { name: 'main.ts', path: '/src/main.ts', type: 'file' },
      { name: 'styles.css', path: '/src/styles.css', type: 'file' },
    ]
  },
  {
    name: 'package.json',
    path: '/package.json',
    type: 'file'
  },
  {
    name: 'README.md',
    path: '/README.md',
    type: 'file'
  }
];

const FileItem: React.FC<{ item: WorkspaceFile; depth: number }> = ({ item, depth }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  
  return (
    <div>
      <div 
        className="flex items-center py-1.5 px-3 hover:bg-white/5 cursor-pointer rounded-md text-sm text-zinc-400 group transition-colors"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => item.type === 'directory' && setIsOpen(!isOpen)}
      >
        <span className="mr-2 opacity-50">
          {item.type === 'directory' ? <Icons.ChevronRight /> : <Icons.FileCode />}
        </span>
        <span className="group-hover:text-white">{item.name}</span>
      </div>
      {item.type === 'directory' && isOpen && item.children?.map(child => (
        <FileItem key={child.path} item={child} depth={depth + 1} />
      ))}
    </div>
  );
};

const FileExplorer: React.FC = () => {
  return (
    <div className="w-64 glass-panel border-r border-white/5 flex flex-col hidden lg:flex">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Explorer</h2>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">AGENT_ROOT</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {mockFiles.map(file => (
          <FileItem key={file.path} item={file} depth={0} />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
