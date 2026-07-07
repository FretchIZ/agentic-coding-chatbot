'use client';

import { PanelLeftClose, PanelLeft, Plus, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import type { Conversation } from '@/lib/use-conversations';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onCreate, onDelete, collapsed, onToggle }: Props) {
  return (
    <>
      <button
        onClick={onToggle}
        className="absolute -left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md transition-all hover:scale-105 hover:text-foreground"
        type="button"
      >
        {collapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
      </button>
      <aside
        className={`relative flex flex-col border-r bg-background/80 backdrop-blur-sm transition-all duration-300 ${
          collapsed ? 'w-0 overflow-hidden border-r-0' : 'w-72'
        }`}
      >
        <div className="flex h-full min-w-72 flex-col">
          <div className="border-b p-3">
            <div className="mb-3 flex items-center gap-2 px-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Sai.ai</span>
            </div>
            <button
              onClick={onCreate}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              type="button"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No conversations yet</p>
            )}
            {[...conversations].reverse().map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group mb-0.5 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all active:scale-[0.98] ${
                  conv.id === activeId
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                type="button"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                  className="hidden shrink-0 text-muted-foreground transition-colors hover:text-destructive group-hover:block"
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
          </nav>
          <div className="border-t p-4 text-xs text-muted-foreground">
            Powered by Mistral AI
          </div>
        </div>
      </aside>
    </>
  );
}
