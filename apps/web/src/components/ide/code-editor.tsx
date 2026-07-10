'use client';

import { useState } from 'react';
import { X, Circle, GitBranch } from 'lucide-react';

interface EditorTab {
  id: string;
  name: string;
  path: string;
  modified?: boolean;
}

interface CodeEditorProps {
  tabs?: EditorTab[];
  activeTab?: string;
  onTabClose?: (id: string) => void;
  onTabSelect?: (id: string) => void;
  content?: string;
  language?: string;
}

export default function CodeEditor({ tabs = [], activeTab, onTabClose, onTabSelect, content, language }: CodeEditorProps) {
  const activeFile = tabs.find((t) => t.id === activeTab);

  return (
    <div className="flex h-full flex-col bg-background">
      {tabs.length > 0 && (
        <div className="flex items-center border-b border-border bg-muted/30">
          <div className="flex flex-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <div
                  key={tab.id}
                  onClick={() => onTabSelect?.(tab.id)}
                  className={`group flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-3 py-1.5 text-xs transition-colors ${
                    isActive ? 'bg-background text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {tab.modified && <Circle className="h-2 w-2 fill-current text-muted-foreground" />}
                  <span className="truncate max-w-28">{tab.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onTabClose?.(tab.id); }}
                    type="button"
                    className="ml-0.5 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {activeFile ? (
          <div className="relative h-full">
            <div className="flex items-center justify-between border-b border-border px-4 py-1">
              <span className="text-xs text-muted-foreground">{language || 'plaintext'}</span>
            </div>
            <pre className="p-4 text-sm text-foreground">
              <code>{content || '// Select a file to view its contents'}</code>
            </pre>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <GitBranch className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Open a file from the explorer to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
