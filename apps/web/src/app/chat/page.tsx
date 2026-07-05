import ChatInterface from '@/components/chat-interface';
import Sidebar from '@/components/sidebar';

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <ChatInterface />
      </div>
    </div>
  );
}
