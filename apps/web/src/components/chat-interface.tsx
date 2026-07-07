'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Paperclip, X, Send, Sparkles } from 'lucide-react';
import Markdown from './markdown';
import type { Conversation, Message } from '@/lib/use-conversations';

interface Props {
  conversation: Conversation | null;
  onAddMessage: (msg: Message) => void;
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];

interface Props {
  conversation: Conversation | null;
  onAddMessage: (msg: Message) => void;
}

export default function ChatInterface({ conversation, onAddMessage }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (conversation) setMessages(conversation.messages);
    else setMessages([]);
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const { data: agentData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
  });
  const tools = agentData?.tools || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const images = newFiles.filter((f) => IMAGE_TYPES.includes(f.type));
    if (images.length > 0) {
      toast.error('Mistral does not support image input. Only text and code files are supported.');
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: Message = { role: 'user', content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    onAddMessage(userMsg);
    setInput('');
    setIsProcessing(true);
    setStreamingContent('');

    try {
      const chatMessages = updated.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages, tools }),
      });

      if (!res.ok) throw new Error(await res.text());

      const isStream = ['text/event-stream', 'text/plain'].some(
        (t) => res.headers.get('Content-Type')?.includes(t),
      );

      if (isStream) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setStreamingContent(full);
        }

        const assistantMsg: Message = { role: 'assistant', content: full || '(no response)' };
        setMessages((prev) => [...prev, assistantMsg]);
        onAddMessage(assistantMsg);
        setStreamingContent('');
      } else {
        const data = await res.json();
        const assistantMsg: Message = { role: 'assistant', content: data.content };
        setMessages((prev) => [...prev, assistantMsg]);
        onAddMessage(assistantMsg);
      }
    } catch (err: any) {
      toast.error(err.message);
      const errMsg: Message = { role: 'assistant', content: 'Sorry, something went wrong.' };
      setMessages((prev) => [...prev, errMsg]);
      onAddMessage(errMsg);
    } finally {
      setIsProcessing(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Kudos.ai</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        {messages.length === 0 && !isProcessing && (
          <div className="flex h-full items-center justify-center">
            <div className="animate-fade-in text-center">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary/40" />
              <h2 className="text-xl font-semibold text-foreground/80">How can I help you?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ask a coding question or describe your task</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`animate-fade-in mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-2.5 sm:max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/80 shadow-sm backdrop-blur-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <Markdown content={msg.content} />
              )}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="animate-fade-in mb-4 flex justify-start">
            <div className="max-w-[90%] rounded-2xl bg-muted/80 px-4 py-2.5 shadow-sm backdrop-blur-sm sm:max-w-[75%]">
              <div className="mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Kudos</span>
              </div>
              <Markdown content={streamingContent} />
            </div>
          </div>
        )}
        {isProcessing && !streamingContent && (
          <div className="animate-fade-in mb-4 flex justify-start">
            <div className="rounded-2xl bg-muted/80 px-5 py-4 shadow-sm backdrop-blur-sm">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-3 pb-3 pt-2 sm:px-6">
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="animate-fade-in flex items-center gap-1.5 rounded-xl border bg-muted/50 px-3 py-1.5 text-xs shadow-sm"
                >
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-ring/30">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.csv,.json,.ts,.tsx,.js,.jsx,.py,.md,.html,.css"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              type="button"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask the coding agent..."
              rows={1}
              className="min-h-[36px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
