'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, MoreHorizontal } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  path: string;
}

interface FileExplorerProps {
  files?: FileNode[];
  onFileSelect?: (path: string) => void;
  activeFile?: string;
}

function FileTreeItem({ node, depth, onFileSelect, activeFile }: { node: FileNode; depth: number; onFileSelect?: (path: string) => void; activeFile?: string }) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.type === 'file') {
    const isActive = node.path === activeFile;
    return (
      <button
        onClick={() => onFileSelect?.(node.path)}
        type="button"
        className={`flex w-full items-center gap-2 px-2 py-1 text-left text-xs transition-colors ${
          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        type="button"
        className="flex w-full items-center gap-2 px-2 py-1 text-left text-xs text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        {expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <span className="truncate">{node.name}</span>
      </button>
      {expanded && node.children?.map((child) => (
        <FileTreeItem key={child.path} node={child} depth={depth + 1} onFileSelect={onFileSelect} activeFile={activeFile} />
      ))}
    </div>
  );
}

export default function FileExplorer({ files, onFileSelect, activeFile }: FileExplorerProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar-background">
      <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2">
        <span className="text-xs font-medium text-sidebar-foreground">Explorer</span>
        <div className="flex items-center gap-0.5">
          <button type="button" className="btn-ghost h-6 w-6 p-0" title="New file">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="btn-ghost h-6 w-6 p-0" title="More">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {files?.map((node) => (
          <FileTreeItem key={node.path} node={node} depth={0} onFileSelect={onFileSelect} activeFile={activeFile} />
        ))}
      </div>
    </div>
  );
}
