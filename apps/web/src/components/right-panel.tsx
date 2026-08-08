'use client';

import { useState, useEffect } from 'react';
import { PanelRightClose, PanelRight, FolderTree, FileText, Folder, FolderOpen, Loader2 } from 'lucide-react';

interface DirEntry {
  name: string;
  type: 'file' | 'dir';
  path: string;
  size?: number;
  children?: DirEntry[];
}

interface Props {
  open: boolean;
  onToggle: () => void;
}

function TreeNode({ node, depth, onSelect }: { node: DirEntry; depth: number; onSelect: (path: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDir = node.type === 'dir';

  return (
    <div>
      <button
        onClick={() => {
          if (isDir) setExpanded((e) => !e);
          else onSelect(node.path);
        }}
        className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-xs transition-colors ${
          isDir ? 'font-medium text-foreground/80 hover:bg-muted' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        type="button"
      >
        {isDir ? (
          expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary/60" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-primary/40" />
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        )}
        <span className="truncate">{node.name}</span>
        {!isDir && node.size !== undefined && (
          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/50">{node.size < 1024 ? `${node.size}B` : `${(node.size / 1024).toFixed(1)}K`}</span>
        )}
      </button>
      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RightPanel({ open, onToggle }: Props) {
  const [tree, setTree] = useState<DirEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || tree) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/codebase-tree');
        const data = await res.json();
        if (data.error) setError(data.error);
        else setTree(data.tree);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, tree]);

  return (
    <>
      <button
        onClick={onToggle}
        className="absolute -left-3 top-3 z-10 hidden h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md transition-all hover:scale-105 hover:text-foreground sm:flex"
        type="button"
      >
        {open ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRight className="h-3.5 w-3.5" />}
      </button>
      <aside
        className={`relative hidden h-full flex-col border-l bg-background/95 backdrop-blur-sm transition-all duration-300 sm:flex ${
          open ? 'w-72' : 'w-0 overflow-hidden border-l-0'
        }`}
      >
        <div className={`flex h-full min-w-72 flex-col ${open ? '' : 'hidden'}`}>
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <FolderTree className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Codebase</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scanning project...
              </div>
            )}
            {error && <p className="px-3 py-6 text-xs text-muted-foreground">No codebase available in this environment.</p>}
            {!loading && !error && tree && <TreeNode node={tree} depth={0} onSelect={() => {}} />}
          </div>
          <div className="border-t p-3 text-center text-[10px] text-muted-foreground/60">
            Files available to the coding agent
          </div>
        </div>
      </aside>
    </>
  );
}
