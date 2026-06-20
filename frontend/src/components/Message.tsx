'use client'

import { useState } from 'react'
import { Copy, Check, Bot, Terminal } from 'lucide-react'
import { ToolCallCard } from './ToolCallCard'
import { ChatMessage } from '@/types/chat'

interface MessageProps {
  message: ChatMessage
}

export function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isAssistant = message.role === 'assistant'
  const isTool = message.type === 'tool_call' || message.type === 'tool_result'

  if (isTool) {
    return (
      <ToolCallCard message={message} />
    )
  }

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isAssistant ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {isAssistant ? <Bot className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
      </div>
      <div className={`max-w-3xl ${isAssistant ? '' : 'text-right'}`}>
        <div className={`bg-card rounded-2xl p-4 ${isAssistant ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.content}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-1 px-1">
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Copy message"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}