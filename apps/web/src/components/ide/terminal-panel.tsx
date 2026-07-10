'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Copy, Terminal } from 'lucide-react';

interface TerminalTab {
  id: string;
  name: string;
}

interface TerminalPanelProps {
  height?: number;
  onResize?: (height: number) => void;
}

export default function TerminalPanel({ height = 200, onResize }: TerminalPanelProps) {
  const [tabs] = useState<TerminalTab[]>([{ id: '1', name: 'bash' }]);
  const [activeTab, setActiveTab] = useState('1');
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState('~/project');
  const endRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setHistory((prev) => [...prev, `$ ${input}`, `[mock] command not implemented in preview: ${input}`]);
    setInput('');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    resizeRef.current = { startY: e.clientY, startHeight: height };
    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const diff = resizeRef.current.startY - ev.clientY;
      onResize?.(Math.max(100, Math.min(600, resizeRef.current.startHeight + diff)));
    };
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div style={{ height }} className="flex flex-col bg-background border-t border-border">
      <div
        onMouseDown={handleMouseDown}
        className="absolute -top-1 left-0 right-0 z-10 h-2 cursor-row-resize hover:bg-primary/20 transition-colors"
      />

      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-2">
        <div className="flex items-center gap-1">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`px-3 py-1.5 text-xs transition-colors ${
                tab.id === activeTab ? 'bg-background text-foreground border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.name}
            </button>
          ))}
          <button type="button" className="btn-ghost h-6 w-6 p-0 ml-1" title="New terminal">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" className="btn-ghost h-6 w-6 p-0" title="Copy">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="btn-ghost h-6 w-6 p-0" title="Kill terminal">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#1e1e1e] p-2 font-mono text-xs leading-relaxed">
        <div className="flex items-center gap-1 text-green-400 mb-1">
          <span className="text-green-400">➜</span>
          <span className="text-cyan-300">{currentPath}</span>
        </div>
        {history.map((line, i) => (
          <div key={i} className={`${line.startsWith('$') ? 'text-green-400' : 'text-gray-300'}`}>{line}</div>
        ))}
        <form onSubmit={handleCommand} className="flex items-center gap-1 mt-1">
          <span className="text-green-400">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-gray-200 outline-none"
            autoFocus
          />
        </form>
        <div ref={endRef} />
      </div>
    </div>
  );
}
