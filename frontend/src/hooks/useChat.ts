'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChatMessage, Session, WSMessage } from '@/types/chat'

const API_URL = '/api'
const WS_URL = 'ws://localhost:8000/api/ws/chat'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const messageIdCounter = useRef(0)

  const generateId = () => `msg-${Date.now()}-${messageIdCounter.current++}`

  const connectWebSocket = useCallback((sessionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }

    const ws = new WebSocket(`${WS_URL}/${sessionId}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data)
        
        switch (data.type) {
          case 'message': {
            const msg = data.message
            if (msg) {
              setMessages(prev => [...prev, { ...msg, id: msg.id || generateId() }])
            }
            break
          }
          case 'tool_call': {
            const tc = data.tool_call
            if (tc) {
              setMessages(prev => [...prev, {
                id: generateId(),
                role: 'assistant',
                content: `Calling ${tc.name}...`,
                type: 'tool_call',
                tool_call_id: tc.id,
                tool_name: tc.name,
                metadata: { arguments: tc.arguments },
                timestamp: new Date().toISOString(),
              }])
            }
            break
          }
          case 'tool_result': {
            const tr = data.tool_result
            if (tr) {
              setMessages(prev => [...prev, {
                id: generateId(),
                role: 'tool',
                content: tr.content,
                type: 'tool_result',
                tool_call_id: tr.tool_call_id,
                tool_name: tr.name,
                timestamp: new Date().toISOString(),
              }])
            }
            break
          }
          case 'done':
            setIsLoading(false)
            break
          case 'error':
            setError(data.error || 'An error occurred')
            setIsLoading(false)
            break
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e)
      }
    }

    ws.onerror = () => {
      setError('Connection error. Retrying...')
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setTimeout(() => {
        if (currentSessionId) connectWebSocket(currentSessionId)
      }, 3000)
    }
  }, [currentSessionId])

  useEffect(() => {
    fetchSessions()
    return () => wsRef.current?.close()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/sessions`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
        if (data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data[0].session_id)
          await loadSession(data[0].session_id)
        }
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e)
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_URL}/sessions/${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setCurrentSessionId(sessionId)
        connectWebSocket(sessionId)
      }
    } catch (e) {
      console.error('Failed to load session:', e)
    }
  }

  const createSession = async () => {
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      })
      if (res.ok) {
        const data = await res.json()
        await fetchSessions()
        setCurrentSessionId(data.session_id)
        connectWebSocket(data.session_id)
      }
    } catch (e) {
      console.error('Failed to create session:', e)
      setError('Failed to create session')
    }
  }

  const switchSession = async (sessionId: string) => {
    await loadSession(sessionId)
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`${API_URL}/sessions/${sessionId}`, { method: 'DELETE' })
      await fetchSessions()
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null)
        setMessages([])
      }
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  }

  const sendMessage = async (content: string) => {
    if (!currentSessionId) {
      await createSession()
      return
    }

    setIsLoading(true)
    setError(null)

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      type: 'text',
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, session_id: currentSessionId }),
      })

      if (!res.ok) {
        throw new Error('Failed to send message')
      }
    } catch (e) {
      console.error('Failed to send message:', e)
      setError('Failed to send message')
      setIsLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    error,
    sendMessage,
    createSession,
    switchSession,
    deleteSession,
    clearError,
    sessionId: currentSessionId,
  }
}