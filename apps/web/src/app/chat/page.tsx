import ChatInterface from '@/components/chat-interface';
import Sidebar from '@/components/sidebar';

export default function ChatPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden sm:flex">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col min-w-0">
        <ChatInterface />
      </div>
    </div>
  );
}
