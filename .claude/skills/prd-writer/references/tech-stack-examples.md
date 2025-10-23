# Tech Stack Examples

This document provides specific guidance for common tech stacks and patterns.

## Cloudflare Workers + Hono

### Project Structure
```
workers-app/
├── src/
│   ├── index.ts           # Main entry point
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, CORS, etc
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
├── wrangler.toml         # Configuration
├── migrations/           # D1 migrations
└── tests/               # Test files
```

### Key Patterns

**Environment Types**
```typescript
export interface Env {
  DB: D1Database
  KV: KVNamespace
  AUTH_SECRET: string
}
```

**Error Handling**
```typescript
app.onError((err, c) => {
  console.error(err)
  return c.json({ 
    error: 'Internal server error',
    requestId: c.req.header('cf-ray') 
  }, 500)
})
```

**CORS Middleware**
```typescript
import { cors } from 'hono/cors'

app.use('/*', cors({
  origin: ['https://yourapp.com'],
  credentials: true
}))
```

### Common Gotchas
- No access to Node.js APIs (fs, path, etc)
- 30 second execution limit
- 128MB memory limit
- Use Durable Objects for WebSockets
- Cold starts can be 50-100ms

## React + TypeScript Frontend

### Project Structure
```
frontend/
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # API clients, utils
│   ├── types/           # TypeScript types
│   └── main.tsx         # Entry point
├── public/              # Static assets
└── vite.config.ts       # Build config
```

### Key Patterns

**API Client**
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 3,
    },
  },
})
```

**Custom Hook**
```typescript
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
    enabled: !!userId,
  })
}
```

**Error Boundary**
```typescript
export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

## D1 Database Patterns

### Schema Design
```sql
-- Use TEXT for IDs (UUID or ULID)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Always add indexes for foreign keys
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- Use UNIQUE constraints
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

### Query Patterns
```typescript
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { users, posts } from './schema'

const db = drizzle(env.DB)

// Type-safe queries with Drizzle
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1)
  .then(rows => rows[0])

// Batch queries for performance
const [userResults, postResults] = await Promise.all([
  db.select().from(users).where(eq(users.id, id1)),
  db.select().from(posts).where(eq(posts.userId, id1)),
])
```

### Transactions
```typescript
import { sql } from 'drizzle-orm'
import { and, eq } from 'drizzle-orm'

// D1 doesn't support transactions yet
// Use optimistic locking or idempotent operations
const result = await db
  .update(users)
  .set({ version: sql`${users.version} + 1` })
  .where(and(
    eq(users.id, id),
    eq(users.version, currentVersion)
  ))

if (result.changes === 0) {
  throw new Error('Concurrent modification')
}
```

## Durable Objects for Real-Time

### Structure
```typescript
export class ChatRoom {
  state: DurableObjectState
  sessions: Set<WebSocket>
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.sessions = new Set()
  }
  
  async fetch(request: Request) {
    const { 0: client, 1: server } = new WebSocketPair()
    
    this.sessions.add(server)
    server.accept()
    
    server.addEventListener('message', (event) => {
      this.broadcast(event.data)
    })
    
    return new Response(null, { status: 101, webSocket: client })
  }
  
  broadcast(message: string) {
    this.sessions.forEach(socket => {
      socket.send(message)
    })
  }
}
```

### Coordination Patterns
```typescript
// Get Durable Object instance
const id = env.CHAT.idFromName(roomId)
const stub = env.CHAT.get(id)

// Call methods
const response = await stub.fetch(request)
```

## AI Agent Systems

### Agent Structure
```typescript
interface Agent {
  name: string
  description: string
  tools: Tool[]
  execute: (input: string) => Promise<AgentResult>
}

interface Tool {
  name: string
  description: string
  parameters: z.ZodSchema
  execute: (params: any) => Promise<any>
}
```

### Multi-Agent Coordination
```typescript
class AgentCoordinator {
  agents: Map<string, Agent>
  
  async route(input: string): Promise<Agent> {
    // Use LLM to determine which agent to use
    const decision = await this.decisionModel.generate({
      prompt: `Which agent should handle: ${input}`,
      agents: Array.from(this.agents.values())
    })
    return this.agents.get(decision.agentName)
  }
  
  async execute(input: string): Promise<any> {
    const agent = await this.route(input)
    return agent.execute(input)
  }
}
```

### Error Handling
```typescript
class AgentWithFallback implements Agent {
  async execute(input: string): Promise<AgentResult> {
    try {
      return await this.primaryExecution(input)
    } catch (error) {
      console.error('Primary execution failed:', error)
      return this.fallbackExecution(input)
    }
  }
  
  private async fallbackExecution(input: string) {
    // Simpler, more reliable approach
    return { success: false, error: 'Agent unavailable' }
  }
}
```

## Testing Patterns

### API Tests
```typescript
import { describe, it, expect, beforeAll } from 'vitest'

describe('User API', () => {
  let env: Env
  
  beforeAll(() => {
    env = getMiniflareBindings()
  })
  
  it('creates a user', async () => {
    const response = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' })
    }, env)
    
    expect(response.status).toBe(201)
    const user = await response.json()
    expect(user.email).toBe('test@example.com')
  })
})
```

### Component Tests
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'

it('displays user profile', async () => {
  render(
    <QueryClientProvider client={queryClient}>
      <UserProfile userId="123" />
    </QueryClientProvider>
  )
  
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

## Performance Optimization

### Caching Strategies
```typescript
// KV for simple caching
await env.KV.put(`user:${id}`, JSON.stringify(user), {
  expirationTtl: 3600 // 1 hour
})

// Conditional requests
app.get('/api/data', async (c) => {
  const etag = generateETag(data)
  if (c.req.header('if-none-match') === etag) {
    return c.body(null, 304)
  }
  return c.json(data, { headers: { 'etag': etag } })
})
```

### Database Optimization
```sql
-- Use covering indexes
CREATE INDEX idx_posts_user_created
ON posts(user_id, created_at DESC);
```

```typescript
import { desc, eq } from 'drizzle-orm'

// Query uses index - Drizzle generates optimized SQL
const recentPosts = await db
  .select()
  .from(posts)
  .where(eq(posts.userId, userId))
  .orderBy(desc(posts.createdAt))
  .limit(10)
```

### Bundle Size
```typescript
// Lazy load components
const Dashboard = lazy(() => import('./Dashboard'))

// Code splitting
const routes = [
  { path: '/dashboard', element: <Suspense><Dashboard /></Suspense> }
]
```

## Security Best Practices

### Input Validation
```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(120)
})

app.post('/api/users', async (c) => {
  const body = await c.req.json()
  const validated = userSchema.parse(body) // Throws on invalid
  // ... use validated data
})
```

### Authentication
```typescript
// Middleware to verify JWT
app.use('/api/*', async (c, next) => {
  const token = c.req.header('authorization')?.split(' ')[1]
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const payload = await verifyJWT(token, c.env.AUTH_SECRET)
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
```

### CORS Security
```typescript
// Restrict origins
app.use(cors({
  origin: (origin) => {
    const allowed = ['https://yourapp.com', 'https://staging.yourapp.com']
    return allowed.includes(origin) ? origin : allowed[0]
  },
  credentials: true,
  maxAge: 86400
}))
```
