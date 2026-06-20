'use client'

import { useState } from 'react'
import { FileCode, FolderOpen, History, Settings, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useChat } from '@/hooks/useChat'

interface SidebarProps {
  open: boolean
  onToggle: (open: boolean) => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const { sessions, currentSessionId, createSession, switchSession, deleteSession } = useChat()
  const [hoveredSession, setHoveredSession] = useState<string | null>(null)

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 bg-card border-r border-border flex flex-col ${
      open ? 'w-72' : 'w-16'
    }`}>
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        {open && <h2 className="font-semibold text-lg">Sessions</h2>}
        <button
          onClick={() => onToggle(!open)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {open && (
          <button
            onClick={createSession}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Session</span>
          </button>
        )}
        
        {sessions.map((session) => (
          <div key={session.session_id} className="relative">
            <button
              onClick={() => switchSession(session.session_id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                session.session_id === currentSessionId
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-accent'
              }`}
            >
              <FileCode className="h-4 w-4 flex-shrink-0" />
              {open && (
                <span className="truncate flex-1">
                  Session {session.session_id.slice(0, 8)}...
                </span>
              )}
            </button>
            {open && (
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(session.session_id); }}
                onMouseEnter={() => setHoveredSession(session.session_id)}
                onMouseLeave={() => setHoveredSession(null)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors opacity-0 hover:opacity-100 ${
                  hoveredSession === session.session_id ? 'opacity-100' : ''
                } text-destructive hover:bg-destructive/10`}
                aria-label="Delete session"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        
        {sessions.length === 0 && open && (
          <div className="px-3 py-4 text-center text-muted-foreground text-sm">
            No sessions yet. Click "New Session" to start.
          </div>
        )}
      </nav>
      
      <div className="p-4 border-t border-border">
        {open ? (
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm">
              <FolderOpen className="h-4 w-4" />
              <span>Workspace</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm">
              <History className="h-4 w-4" />
              <span>History</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button className="mx-auto p-2 rounded-lg hover:bg-accent transition-colors" title="Workspace">
              <FolderOpen className="h-5 w-5" />
            </button>
            <button className="mx-auto p-2 rounded-lg hover:bg-accent transition-colors" title="History">
              <History className="h-5 w-5" />
            </button>
            <button className="mx-auto p-2 rounded-lg hover:bg-accent transition-colors" title="Settings">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}