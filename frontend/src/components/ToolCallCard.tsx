'use client'

import { Terminal, FileCode, Search, Loader2, CheckCircle, ChevronDown } from 'lucide-react'
import { ChatMessage } from '@/types/chat'

interface ToolCallCardProps {
  message: ChatMessage
}

export function ToolCallCard({ message }: ToolCallCardProps) {
  const isToolCall = message.type === 'tool_call'
  const isToolResult = message.type === 'tool_result'
  
  const getIcon = (name: string) => {
    if (name.includes('file') || name.includes('read') || name.includes('write') || name.includes('list')) return FileCode
    if (name.includes('execute') || name.includes('code')) return Terminal
    if (name.includes('search')) return Search
    return Terminal
  }
  
  const Icon = getIcon(message.tool_name || '')
  
  if (isToolCall) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        </div>
        <div className="bg-card rounded-2xl p-4 max-w-3xl border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-primary">{message.tool_name}</span>
            <span className="text-xs text-muted-foreground">executing...</span>
          </div>
          <details>
            <summary className="flex items-center justify-between cursor-pointer text-sm text-muted-foreground">
              <span>Arguments</span>
              <ChevronDown className="h-4 w-4 transition-transform" />
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto font-mono">
              {JSON.stringify(message.metadata?.arguments, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    )
  }
  
  if (isToolResult) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
        <div className="bg-card rounded-2xl p-4 max-w-3xl border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-green-500" />
            <span className="font-mono text-sm text-green-500">{message.tool_name}</span>
            <span className="text-xs text-muted-foreground">completed</span>
          </div>
          <details>
            <summary className="flex items-center justify-between cursor-pointer text-sm text-muted-foreground">
              <span>Result</span>
              <ChevronDown className="h-4 w-4 transition-transform" />
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto font-mono max-h-60 overflow-y-auto">
              {message.content}
            </pre>
          </details>
        </div>
      </div>
    )
  }
  
  return null
}