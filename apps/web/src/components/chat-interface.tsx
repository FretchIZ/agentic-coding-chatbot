'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, X, Send, Sparkles, Share2, Download, Terminal } from 'lucide-react';
import Markdown from './markdown';
import type { Conversation, Message } from '@/lib/use-conversations';

interface Props {
  conversation: Conversation | null;
  onAddMessage: (msg: Message) => void;
}

const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp|svg)$/i;

export default function ChatInterface({ conversation, onAddMessage }: Props) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState(false);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const images = newFiles.filter((f) => IMAGE_EXT.test(f.name));
    if (images.length > 0 && images[0]) {
      setPreviewUrl(URL.createObjectURL(images[0]));
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
      const endpoint = agentMode ? '/api/code-agent' : '/api/chat';
      const body = agentMode
        ? JSON.stringify({ messages: chatMessages })
        : JSON.stringify({ messages: chatMessages, webSearch: true, execute: true });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`h-5 w-5 ${agentMode ? 'text-emerald-500' : 'text-primary'}`} />
            <h1 className="text-lg font-semibold">{agentMode ? 'Coding Agent' : 'Sai.ai'}</h1>
          </div>
          <button
            onClick={() => setAgentMode((a) => !a)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              agentMode
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            type="button"
          >
            <Terminal className="h-3.5 w-3.5" />
            {agentMode ? 'Agent ON' : 'Agent'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        {messages.length === 0 && !isProcessing && (
          <div className="flex h-full items-center justify-center">
            <div className="animate-fade-in text-center max-w-sm">
              {agentMode ? (
                <>
                  <Terminal className="mx-auto mb-3 h-10 w-10 text-emerald-500/40" />
                  <h2 className="text-xl font-semibold text-foreground/80">Autonomous Coding Agent</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ask me to refactor, debug, or build features across your codebase. I can explore, edit, test, and iterate on multiple files.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Refactor this component', 'Find and fix bugs', 'Add a new feature', 'Optimize performance'].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => { setInput(hint); }}
                        className="rounded-lg border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        type="button"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary/40" />
                  <h2 className="text-xl font-semibold text-foreground/80">How can I help you?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Ask a coding question or describe your task</p>
                </>
              )}
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
                  : agentMode
                    ? 'bg-emerald-500/5 border border-emerald-500/10 shadow-sm'
                    : 'bg-muted/80 shadow-sm backdrop-blur-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <>
                  {agentMode && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-500">Agent</span>
                    </div>
                  )}
                  <Markdown content={msg.content} />
                  <div className="mt-2 flex items-center gap-1 border-t border-border/40 pt-1.5">
                    <button
                      onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied'); }}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      title="Copy"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button
                      onClick={() => { const blob = new Blob([msg.content], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sai-response.txt`; a.click(); URL.revokeObjectURL(a.href); }}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (navigator.share) navigator.share({ text: msg.content }); else navigator.clipboard.writeText(msg.content); }}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      title="Share"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="animate-fade-in mb-4 flex justify-start">
            <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 sm:max-w-[75%] ${
              agentMode
                ? 'bg-emerald-500/5 border border-emerald-500/10 shadow-sm'
                : 'bg-muted/80 shadow-sm backdrop-blur-sm'
            }`}>
              {agentMode && (
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-500">Agent</span>
                </div>
              )}
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
                  className="animate-fade-in flex items-center gap-1.5 rounded-xl border bg-muted/50 px-2 py-1 text-xs shadow-sm"
                >
                  {IMAGE_EXT.test(file.name) ? (
                    <img
                      src={URL.createObjectURL(file)}
                      className="h-6 w-6 rounded object-cover cursor-pointer"
                      onClick={() => setPreviewUrl(URL.createObjectURL(file))}
                      alt={file.name}
                    />
                  ) : null}
                  <span className="max-w-[120px] truncate">{file.name}</span>
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
              accept="*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/20"
              type="button"
              title="Attach file"
            >
              <Plus className="h-4 w-4" />
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
              placeholder={agentMode ? 'Ask the coding agent to build, refactor, or debug...' : 'Ask the coding agent...'}
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

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => { setPreviewUrl(null); URL.revokeObjectURL(previewUrl); }}
        >
          <div className="relative max-h-[85vh] max-w-[90vw] animate-fade-in-scale">
            <img src={previewUrl} alt="Preview" className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain" />
            <button
              onClick={() => { setPreviewUrl(null); URL.revokeObjectURL(previewUrl); }}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
