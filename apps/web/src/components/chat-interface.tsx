'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@codeagent/ui';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Paperclip, X } from 'lucide-react';
import Markdown from './markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const { data: agentData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
  });
  const tools = agentData?.tools || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = '';
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    setStreamingContent('');

    try {
      const chatMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages, tools }),
      });

      if (!res.ok) throw new Error(await res.text());

      const contentType = res.headers.get('Content-Type') || '';
      if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setStreamingContent(full);
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: full || '(empty response)' }]);
        setStreamingContent('');
      } else {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch (err: any) {
      toast.error(err.message);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
    } finally {
      setIsProcessing(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Kudos.ai</h1>
        <div className="mt-1 flex flex-wrap gap-2">
          {tools.map((tool: any) => (
            <span key={tool.name} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {tool.name}
            </span>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              ) : (
                <Markdown content={msg.content} />
              )}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-muted px-4 py-2">
              <Markdown content={streamingContent} />
            </div>
          </div>
        )}
        {isProcessing && !streamingContent && (
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
        <div ref={bottomRef} />
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
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.svg,.txt,.csv,.json,.ts,.tsx,.js,.jsx,.py,.md" onChange={handleFileSelect} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground" type="button">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the coding agent..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={isProcessing}
          />
          <Button onClick={handleSend} loading={isProcessing}>Send</Button>
        </div>
      </div>
    </div>
  );
}
