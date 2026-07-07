'use client';

import { useState } from 'react';
import ChatInterface from '@/components/chat-interface';
import Sidebar from '@/components/sidebar';
import { useConversations } from '@/lib/use-conversations';
import type { Message } from '@/lib/use-conversations';

export default function ChatPage() {
  const { list, activeId, active, create, select, addMessage, remove } = useConversations();
  const [collapsed, setCollapsed] = useState(false);

  const handleAddMessage = (msg: Message) => addMessage(msg);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden sm:flex">
        <Sidebar
          conversations={list}
          activeId={activeId}
          onSelect={select}
          onCreate={create}
          onDelete={remove}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <ChatInterface conversation={active} onAddMessage={handleAddMessage} />
      </div>
    </div>
  );
}
