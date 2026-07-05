'use client';

import { useState, useRef } from 'react';
import { Button } from '@codeagent/ui';
import { generateId } from '@codeagent/shared';
import { AgentManager, PlannerAgent, CoderAgent, ReviewerAgent, TesterAgent } from '@codeagent/agents';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Paperclip, X } from 'lucide-react';

const manager = new AgentManager();
manager.register(new PlannerAgent());
manager.register(new CoderAgent());
manager.register(new ReviewerAgent());
manager.register(new TesterAgent());

interface Message {
  role: 'user' | 'assistant' | 'agent';
  content: string;
  agent?: string;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agents = useQuery({
    queryKey: ['agents'],
    queryFn: () => manager.getAllAgents(),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const task = {
        id: `task_${Date.now()}`,
        title: input,
        description: input,
        type: 'code' as const,
        priority: 'medium' as const,
      };

      const result = await manager.execute(task, 'coder');
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: result.output,
          agent: 'Coder Agent',
        },
      ]);
    } catch (error) {
      toast.error('Failed to process request');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong.' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-3">
        <h1 className="text-lg font-semibold">CodeAgent</h1>
        <div className="mt-1 flex gap-2">
          {agents.data?.map((agent) => (
            <span key={agent.id} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {agent.name}
            </span>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : msg.role === 'agent'
                    ? 'bg-muted'
                    : 'bg-secondary'
              }`}
            >
              {msg.agent && <p className="mb-1 text-xs font-medium text-muted-foreground">{msg.agent}</p>}
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-4 py-2">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.1s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs">
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.gif,.svg,.txt,.csv,.json,.ts,.tsx,.js,.jsx,.py,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground"
            type="button"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the coding agent..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={isProcessing}
          />
          <Button onClick={handleSend} loading={isProcessing}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
