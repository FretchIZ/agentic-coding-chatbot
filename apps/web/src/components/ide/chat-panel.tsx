'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, StopCircle, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  isStreaming?: boolean;
  onStopStream?: () => void;
}

export default function ChatPanel({ messages = [], onSendMessage, isStreaming, onStopStream }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage?.(input.trim());
    setInput('');
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-foreground">AI Chat</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-xs">
              <Bot className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">Ask me anything about your codebase. I can help you write, refactor, and debug code.</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            }`}>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Ask something..."
              rows={1}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {isStreaming ? (
            <button onClick={onStopStream} type="button" className="btn-ghost h-9 w-9 shrink-0 p-0 text-destructive" title="Stop">
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="btn-primary h-9 w-9 shrink-0 p-0" title="Send">
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
