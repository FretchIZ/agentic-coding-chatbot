import { Button, Card, Spinner, Badge } from '@learning-platform/ui';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <Badge variant="success">System Online</Badge>
            <Button variant="outline" size="sm">Settings</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">--</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Active Sessions</p>
            <p className="text-2xl font-bold">--</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">AI Requests (24h)</p>
            <p className="text-2xl font-bold">--</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">System Uptime</p>
            <p className="text-2xl font-bold">--</p>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6"><h3 className="mb-4 font-medium">User Activity</h3><p className="text-gray-500">No data available</p></Card>
          <Card className="p-6"><h3 className="mb-4 font-medium">AI Agent Usage</h3><p className="text-gray-500">No data available</p></Card>
        </div>
      </main>
    </div>
  );
}