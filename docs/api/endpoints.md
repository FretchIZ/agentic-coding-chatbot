# API Documentation

## Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Chat
- `GET /api/chat/sessions` - List chat sessions
- `POST /api/chat/sessions` - Create session
- `GET /api/chat/sessions/:id` - Get session
- `POST /api/chat/sessions/:id/messages` - Send message
- `DELETE /api/chat/sessions/:id` - Delete session

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/:id/lessons` - Get lessons

### Analytics
- `POST /api/analytics/events` - Track events
- `GET /api/analytics/progress/:userId` - Get user progress
- `PUT /api/analytics/progress/:userId/:lessonId` - Update progress

### AI Agent
- `POST /api/agent/process` - Process query through AI agent
- `GET /api/agent/sessions/:sessionId` - Get agent session state
- `POST /api/agent/sessions/:sessionId/cancel` - Cancel session

### WebSocket Endpoints
- `ws://host/ws/chat` - Chat WebSocket
- `ws://host/ws/agent` - Agent WebSocket