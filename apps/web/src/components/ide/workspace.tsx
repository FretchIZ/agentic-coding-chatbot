'use client';

import { useState } from 'react';
import TopBar from './top-bar';
import FileExplorer from './file-explorer';
import CodeEditor from './code-editor';
import ChatPanel from './chat-panel';
import TerminalPanel from './terminal-panel';
import StatusBar from './status-bar';

interface WorkspaceProps {
  defaultSidebarOpen?: boolean;
  defaultChatOpen?: boolean;
}

export default function Workspace({ defaultSidebarOpen = true, defaultChatOpen = true }: WorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);
  const [chatOpen, setChatOpen] = useState(defaultChatOpen);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [activeFile, setActiveFile] = useState<string | undefined>();
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen(!chatOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-[var(--sidebar-width)] shrink-0 border-r border-border overflow-hidden">
            <FileExplorer
              activeFile={activeFile}
              onFileSelect={setActiveFile}
              files={[
                { name: 'src', type: 'folder', path: '/src', children: [
                  { name: 'app', type: 'folder', path: '/src/app', children: [
                    { name: 'layout.tsx', type: 'file', path: '/src/app/layout.tsx' },
                    { name: 'page.tsx', type: 'file', path: '/src/app/page.tsx' },
                  ]},
                  { name: 'components', type: 'folder', path: '/src/components', children: [
                    { name: 'theme-toggle.tsx', type: 'file', path: '/src/components/theme-toggle.tsx' },
                  ]},
                ]},
                { name: 'package.json', type: 'file', path: '/package.json' },
                { name: 'tsconfig.json', type: 'file', path: '/tsconfig.json' },
              ]}
            />
          </aside>
        )}

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  activeTab={activeFile}
                  tabs={activeFile ? [{ id: activeFile, name: activeFile.split('/').pop() || 'untitled', path: activeFile }] : []}
                  onTabClose={() => setActiveFile(undefined)}
                  onTabSelect={setActiveFile}
                />
              </div>
              <TerminalPanel height={terminalHeight} onResize={setTerminalHeight} />
            </div>

            {chatOpen && (
              <aside className="w-[380px] shrink-0 border-l border-border overflow-hidden">
                <ChatPanel
                  messages={[
                    { id: '1', role: 'assistant', content: 'Welcome! I\'m your AI coding assistant. How can I help you today?', timestamp: new Date() },
                  ]}
                  onSendMessage={(msg) => console.log('send:', msg)}
                />
              </aside>
            )}
          </div>
        </main>
      </div>

      <StatusBar cursorPosition={cursorPosition} />
    </div>
  );
}
