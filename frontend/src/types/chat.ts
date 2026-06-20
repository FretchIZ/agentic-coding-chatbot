export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'
export type MessageType = 'text' | 'tool_call' | 'tool_result' | 'error'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  type: MessageType
  tool_call_id?: string
  tool_name?: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface Session {
  session_id: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export interface ChatRequest {
  message: string
  session_id?: string
  context?: Record<string, any>
}

export interface ChatResponse {
  session_id: string
  message: ChatMessage
  is_complete: boolean
}

export interface WSMessage {
  type: 'message' | 'tool_call' | 'tool_result' | 'done' | 'error'
  message?: ChatMessage
  tool_call?: {
    id: string
    name: string
    arguments: Record<string, any>
  }
  tool_result?: {
    tool_call_id: string
    name: string
    content: string
    is_error?: boolean
  }
  error?: string
}