import { useState } from 'react';
import { Button, Input, Card } from '@learning-platform/ui';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setMessages(prev => [...prev, { role: 'assistant', content: `Echo: ${input}` }]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">AI Learning Platform</h1>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card className="mb-6 h-[500px] overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </Card>
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="Type your message..." />
          <Button onClick={handleSubmit}>Send</Button>
        </div>
      </main>
    </div>
  );
}