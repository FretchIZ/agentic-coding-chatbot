'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import ChatInterface from '@/components/chat-interface';
import Sidebar from '@/components/sidebar';
import { useConversations } from '@/lib/use-conversations';
import type { Message } from '@/lib/use-conversations';

export default function ChatPage() {
  const { list, activeId, active, create, select, addMessage, remove } = useConversations();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleAddMessage = (msg: Message) => addMessage(msg);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:static sm:z-auto sm:block transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        } ${collapsed ? 'sm:w-0 sm:overflow-hidden' : ''}`}
      >
        <Sidebar
          conversations={list}
          activeId={activeId}
          onSelect={(id) => { select(id); setMobileOpen(false); }}
          onCreate={() => { create(); setMobileOpen(false); }}
          onDelete={remove}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <div className="sm:hidden flex items-center gap-2 border-b px-3 py-2.5 bg-background/95 backdrop-blur-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-ghost h-8 w-8 p-0"
            type="button"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">Sai.ai</span>
        </div>
        <ChatInterface conversation={active} onAddMessage={handleAddMessage} />
      </div>
    </div>
  );
}
