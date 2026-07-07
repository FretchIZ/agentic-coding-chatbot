'use client';

import { useState } from 'react';
import { PanelLeftClose, PanelLeft, Plus, MessageSquare, Trash2, Sparkles } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

const defaultConversations: Conversation[] = [
  { id: '1', title: 'Build a React component', createdAt: new Date() },
  { id: '2', title: 'Fix API endpoint bug', createdAt: new Date(Date.now() - 86400000) },
  { id: '3', title: 'Database schema design', createdAt: new Date(Date.now() - 172800000) },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [conversations] = useState<Conversation[]>(defaultConversations);

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
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
              <span className="text-sm font-semibold">Kudos.ai</span>
            </div>
            <button
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 px-3 py-2.5 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              type="button"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className="group mb-0.5 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.98]"
                type="button"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
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
