'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, Loader2, X, Terminal, FileCode, Search } from 'lucide-react'
import { Message } from './Message'
import { useChat } from '@/hooks/useChat'

export function ChatInterface() {
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { messages, sendMessage, isLoading, sessionId, error, clearError } = useChat()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    await sendMessage(input)
    setInput('')
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
        {messages.map((msg, idx) => (
          <Message key={`${msg.id}-${idx}`} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            </div>
            <div className="bg-card rounded-2xl p-4 max-w-2xl">
              <div className="flex gap-2">
                <div className="w-8 h-4 bg-muted rounded"></div>
                <div className="w-12 h-4 bg-muted rounded"></div>
              </div>
              <div className="mt-2 h-4 bg-muted rounded w-3/4"></div>
              <div className="mt-1 h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
          <span className="text-destructive text-sm">{error}</span>
          <button onClick={clearError} className="p-1 hover:bg-destructive/20 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to write, edit, or explain code..."
              className="w-full min-h-[50px] max-h-[200px] px-4 py-3 bg-input-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-2 focus:ring-ring transition-shadow"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              disabled={isLoading}
              className={`p-3 rounded-xl transition-colors ${
                isRecording
                  ? 'bg-destructive/20 text-destructive animate-pulse'
                  : 'hover:bg-accent text-muted-foreground'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 max-w-4xl mx-auto text-xs text-muted-foreground">
          <span>Session: {sessionId?.slice(0, 8)}...</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Terminal className="h-3 w-3" />
              Python/JS/Bash
            </span>
            <span className="flex items-center gap-1">
              <FileCode className="h-3 w-3" />
              File ops
            </span>
            <span className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Code search
            </span>
          </div>
        </div>
      </form>
    </div>
  )
}