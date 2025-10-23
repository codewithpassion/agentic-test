# Data Flow Diagrams

This document details how data flows through the system for various operations.

## Table of Contents

1. [User Authentication Flow](#user-authentication-flow)
2. [Todo Creation Flow](#todo-creation-flow)
3. [Real-Time Update Flow](#real-time-update-flow)
4. [User Sync Flow](#user-sync-flow)
5. [Protected Route Access Flow](#protected-route-access-flow)
6. [Role-Based Authorization Flow](#role-based-authorization-flow)

---

## User Authentication Flow

### Sign-In Flow (Complete)

```
┌──────────┐
│  User    │
│  Browser │
└────┬─────┘
     │
     │ 1. Navigate to /login
     ↓
┌─────────────────────────────┐
│  React Router (SSR)         │
│  - Render login page        │
│  - Load Clerk components    │
└────┬────────────────────────┘
     │
     │ 2. Display Clerk <SignIn /> component
     ↓
┌─────────────────────────────┐
│  User enters credentials    │
│  - Email: user@example.com  │
│  - Password: ******         │
└────┬────────────────────────┘
     │
     │ 3. Submit credentials
     ↓
┌─────────────────────────────┐
│  Clerk Service (External)   │
│  - Validate credentials     │
│  - Check password hash      │
│  - Verify account status    │
└────┬────────────────────────┘
     │
     │ 4. Credentials Valid
     ↓
┌─────────────────────────────┐
│  Clerk JWT Generation       │
│  {                          │
│    "sub": "user_abc123",    │
│    "email": "user@...",     │
│    "name": "John Doe",      │
│    "roles": ["user"]        │
│  }                          │
└────┬────────────────────────┘
     │
     │ 5. Return JWT + Set session cookie
     ↓
┌─────────────────────────────┐
│  Browser                    │
│  - Store JWT in memory      │
│  - Set HTTP-only cookie     │
└────┬────────────────────────┘
     │
     │ 6. Redirect to /todos
     ↓
┌─────────────────────────────┐
│  React Router (Client)      │
│  - Navigate to /todos       │
└────┬────────────────────────┘
     │
     │ 7. Initialize Convex connection
     ↓
┌─────────────────────────────────────────┐
│  ConvexProviderWithAuth                 │
│  - Get JWT from Clerk (via useAuth())   │
│  - Pass token to Convex client          │
└────┬────────────────────────────────────┘
     │
     │ 8. WebSocket connection with JWT
     ↓
┌─────────────────────────────────────────┐
│  Convex Server                          │
│  - Validate JWT signature               │
│  - Verify issuer (Clerk)                │
│  - Extract user claims                  │
│  - Make identity available in ctx.auth  │
└────┬────────────────────────────────────┘
     │
     │ 9. Check if user exists in database
     ↓
┌─────────────────────────────────────────┐
│  Convex Database Query                  │
│  users.query()                          │
│    .withIndex("by_clerkId")             │
│    .where(clerkId === "user_abc123")    │
└────┬────────────────────────────────────┘
     │
     │ 10a. User NOT found → Sync user
     ↓
┌─────────────────────────────────────────┐
│  Client calls syncUser mutation         │
│  convex.mutation(api.users.syncUser, {  │
│    clerkId: "user_abc123",              │
│    email: "user@example.com",           │
│    name: "John Doe",                    │
│    roles: ["user"]                      │
│  })                                     │
└────┬────────────────────────────────────┘
     │
     │ 10b. Insert user into Convex
     ↓
┌─────────────────────────────────────────┐
│  Convex users table                     │
│  {                                      │
│    _id: "j123abc",                      │
│    clerkId: "user_abc123",              │
│    email: "user@example.com",           │
│    name: "John Doe",                    │
│    roles: ["user"],                     │
│    createdAt: 1729670000000             │
│  }                                      │
└────┬────────────────────────────────────┘
     │
     │ 11. User synced, ready to use app
     ↓
┌─────────────────────────────────────────┐
│  Browser - Todos Page                   │
│  - Authenticated                        │
│  - User data available                  │
│  - Can query and mutate todos           │
└─────────────────────────────────────────┘
```

---

## Todo Creation Flow

### Optimistic UI Update with Real-Time Sync

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Type "Buy milk" and click Add
     ↓
┌─────────────────────────────────────────┐
│  CreateTodoForm Component               │
│  const createTodo = useMutation(        │
│    api.todos.create                     │
│  );                                     │
│                                         │
│  await createTodo({ text: "Buy milk" })│
└────┬────────────────────────────────────┘
     │
     │ 2. Convex client handles optimistic update
     ↓
┌─────────────────────────────────────────┐
│  Convex Client (Browser)                │
│  - Add temporary todo to local cache    │
│  - Mark as "pending"                    │
│  - Display immediately in UI            │
└────┬────────────────────────────────────┘
     │
     │ 3. UI updates instantly (optimistic)
     ↓
┌─────────────────────────────────────────┐
│  TodoList Component                     │
│  [                                      │
│    { id: "temp_123",                    │
│      text: "Buy milk",                  │
│      completed: false,                  │
│      _pending: true }  ← Optimistic     │
│  ]                                      │
└─────────────────────────────────────────┘
     │
     │ 4. Send mutation to Convex via WebSocket
     ↓
┌─────────────────────────────────────────┐
│  Convex Server                          │
│  mutation: api.todos.create             │
│  args: { text: "Buy milk" }             │
└────┬────────────────────────────────────┘
     │
     │ 5. Validate authentication
     ↓
┌─────────────────────────────────────────┐
│  const user = await requireAuth(ctx)    │
│  // Throws if not authenticated         │
│  // Returns user from database          │
└────┬────────────────────────────────────┘
     │
     │ 6. Validate input
     ↓
┌─────────────────────────────────────────┐
│  if (!text.trim()) {                    │
│    throw new ConvexError(               │
│      "Text cannot be empty"             │
│    );                                   │
│  }                                      │
└────┬────────────────────────────────────┘
     │
     │ 7. Insert into database
     ↓
┌─────────────────────────────────────────┐
│  const todoId = await ctx.db.insert(    │
│    "todos",                             │
│    {                                    │
│      userId: user._id,                  │
│      text: "Buy milk",                  │
│      completed: false,                  │
│      createdAt: Date.now()              │
│    }                                    │
│  );                                     │
└────┬────────────────────────────────────┘
     │
     │ 8. Transaction committed
     ↓
┌─────────────────────────────────────────┐
│  Database                               │
│  todos table:                           │
│  {                                      │
│    _id: "j123xyz",                      │
│    userId: "j123abc",                   │
│    text: "Buy milk",                    │
│    completed: false,                    │
│    createdAt: 1729670123000             │
│  }                                      │
└────┬────────────────────────────────────┘
     │
     │ 9. Convex real-time engine detects change
     ↓
┌─────────────────────────────────────────┐
│  Convex Subscriptions                  │
│  - Find all clients subscribed to       │
│    todos.list query                     │
│  - Where userId matches                 │
└────┬────────────────────────────────────┘
     │
     │ 10. Send update via WebSocket
     ↓
┌─────────────────────────────────────────┐
│  ALL Connected Browsers (User's tabs)   │
│  - Receive real-time update             │
└────┬──────────────┬─────────────────────┘
     │              │
     │              │ 11. Replace optimistic with real data
     ↓              ↓
┌──────────────┐  ┌──────────────┐
│ Tab 1        │  │ Tab 2        │
│ [            │  │ [            │
│   {          │  │   {          │
│     _id: "j  │  │     _id: "j  │
│     text: "  │  │     text: "  │
│     complete │  │     complete │
│     _pending │  │   }          │
│   }          │  │ ]            │
│ ]            │  │              │
└──────────────┘  └──────────────┘
     │                    │
     │ 12. React auto-renders
     ↓                    ↓
┌──────────────┐  ┌──────────────┐
│ Updated UI   │  │ Updated UI   │
│ "Buy milk" ✓ │  │ "Buy milk" ✓ │
└──────────────┘  └──────────────┘
```

---

## Real-Time Update Flow

### When User in Tab A Creates Todo, Tab B Updates Automatically

```
┌──────────────┐                          ┌──────────────┐
│  Tab A       │                          │  Tab B       │
│  (Active)    │                          │  (Background)│
└──────┬───────┘                          └──────┬───────┘
       │                                         │
       │ Both tabs subscribed to same query     │
       ├─────────────────────────────────────────┤
       │                                         │
       │ useQuery(api.todos.list)                │
       │ ↓                                       │ ↓
       │ [WebSocket Connection]                  │ [WebSocket Connection]
       │ to Convex                               │ to Convex
       │                                         │
       │ 1. User creates todo in Tab A           │
       ↓                                         │
┌────────────────────────────┐                  │
│  Tab A                     │                  │
│  createTodo({ ... })       │                  │
└──────┬─────────────────────┘                  │
       │                                         │
       │ 2. Mutation sent to Convex              │
       ↓                                         │
┌────────────────────────────────────────────┐  │
│  Convex Server                             │  │
│  - Process mutation                        │  │
│  - Insert todo                             │  │
│  - Commit transaction                      │  │
└──────┬─────────────────────────────────────┘  │
       │                                         │
       │ 3. Notify subscription engine           │
       ↓                                         │
┌────────────────────────────────────────────┐  │
│  Convex Real-Time Engine                   │  │
│  - Detect: todos table changed             │  │
│  - Find: All subscriptions to todos.list   │  │
│  - Filter: By userId                       │  │
│  - Result: 2 WebSocket connections found   │  │
│    (Tab A and Tab B)                       │  │
└──────┬─────────────────────────────────────┘  │
       │                                         │
       │ 4. Send update to BOTH tabs             │
       ├─────────────────────────────────────────┤
       │                                         │
       ↓                                         ↓
┌──────────────┐                          ┌──────────────┐
│  Tab A       │                          │  Tab B       │
│  Receives:   │                          │  Receives:   │
│  [updated    │                          │  [updated    │
│   todo list] │                          │   todo list] │
└──────┬───────┘                          └──────┬───────┘
       │                                         │
       │ 5. React re-renders                     │ 5. React re-renders
       ↓                                         ↓
┌──────────────┐                          ┌──────────────┐
│  Tab A UI    │                          │  Tab B UI    │
│  [Shows new  │                          │  [Shows new  │
│   todo]      │                          │   todo]      │
└──────────────┘                          └──────────────┘
```

**Key Points**:
- Single mutation updates all subscribed clients
- No manual cache invalidation needed
- Works across tabs, devices, users (if shared data)
- Automatic, no client-side code needed

---

## User Sync Flow

### Clerk User → Convex Database Synchronization

```
┌──────────────────────────────────────────────────────────┐
│  METHOD 1: Client-Side Sync (Current Implementation)    │
└──────────────────────────────────────────────────────────┘

1. User signs in with Clerk
   ↓
2. Clerk issues JWT with claims
   ↓
3. Browser receives JWT
   ↓
4. useClerkConvexSync hook detects new user
   ↓
5. Hook calls convex.mutation(api.users.syncUser, {
     clerkId: user.id,
     email: user.primaryEmailAddress.emailAddress,
     name: user.fullName,
     imageUrl: user.imageUrl,
     roles: user.publicMetadata.roles
   })
   ↓
6. Convex checks if user exists
   - If exists: Update user data
   - If new: Insert user record
   ↓
7. User now available in Convex database
   ↓
8. Future queries can access user data


┌──────────────────────────────────────────────────────────┐
│  METHOD 2: Webhook Sync (Recommended for Production)    │
└──────────────────────────────────────────────────────────┘

1. User signs up or updates profile in Clerk
   ↓
2. Clerk sends webhook to our endpoint
   POST https://our-app.convex.site/clerk-webhook
   {
     "type": "user.created",
     "data": {
       "id": "user_abc123",
       "email_addresses": [...],
       "first_name": "John",
       "last_name": "Doe",
       "public_metadata": { "roles": ["user"] }
     }
   }
   ↓
3. Convex HTTP endpoint receives webhook
   ↓
4. Validate webhook signature (security)
   ↓
5. Call internal mutation to sync user
   ctx.runMutation(internal.users.syncUserInternal, {
     clerkId: data.id,
     email: data.email_addresses[0].email_address,
     name: `${data.first_name} ${data.last_name}`,
     roles: data.public_metadata.roles
   })
   ↓
6. User synced to Convex database
   ↓
7. All apps can access updated user data
```

**Current Flow**: Client-side sync (simpler, works for MVP)
**Future Flow**: Webhook sync (more reliable, handles updates better)

---

## Protected Route Access Flow

### Server-Side Route Protection

```
1. User navigates to /todos (protected route)
   ↓
2. Browser sends request to Cloudflare Workers
   GET /todos
   Cookie: __session=<clerk_session_token>
   ↓
3. Cloudflare Workers (Hono + React Router)
   ↓
4. React Router matches route: _auth.todos.tsx
   ↓
5. Runs parent layout loader: _auth.tsx loader()
   ↓
┌─────────────────────────────────────────────────┐
│  export async function loader(args) {           │
│    const { userId } = await getAuth(args);      │
│    if (!userId) {                               │
│      return redirect("/login");                 │
│    }                                            │
│    return null;                                 │
│  }                                              │
└─────────────────────────────────────────────────┘
   ↓
6. getAuth() calls Clerk SSR
   ↓
7. Clerk validates session cookie
   - If invalid/expired → userId = null
   - If valid → userId = "user_abc123"
   ↓
8a. NOT AUTHENTICATED → Redirect to /login
   Response: 302 Redirect
   Location: /login
   ↓
   Browser redirects to login page

8b. AUTHENTICATED → Continue to route
   ↓
9. Run route loader: _auth.todos.tsx loader()
   ↓
10. Loader can access user data
    const { userId } = await getAuth(args);
    // userId is guaranteed to exist here
    ↓
11. Fetch data needed for page
    (Note: Actual todo data comes from Convex after hydration)
    ↓
12. Render HTML with user data
    ↓
13. Return HTML to browser
    ↓
14. Browser displays page
    ↓
15. React hydrates
    ↓
16. Convex connection established
    ↓
17. useQuery(api.todos.list) loads todos
    ↓
18. Page fully interactive with real-time updates
```

---

## Role-Based Authorization Flow

### Permission Check for Admin Action

```
┌──────────────────────────────────────────────────────────┐
│  SCENARIO: User tries to access Admin Dashboard         │
└──────────────────────────────────────────────────────────┘

1. User navigates to /admin
   ↓
2. React Router SSR loader runs
┌─────────────────────────────────────────────────┐
│  export async function loader(args) {           │
│    const { userId } = await getAuth(args);      │
│    if (!userId) redirect("/login");             │
│    // Auth checked, but role check happens      │
│    // on client or in Convex queries            │
│    return null;                                 │
│  }                                              │
└─────────────────────────────────────────────────┘
   ↓
3. Page rendered, React hydrates
   ↓
4. Component checks role (Client-side - UX only)
┌─────────────────────────────────────────────────┐
│  function AdminDashboard() {                    │
│    const { hasRole } = useAuth();               │
│    if (!hasRole("admin")) {                     │
│      return <Navigate to="/unauthorized" />;    │
│    }                                            │
│    // Render admin UI                           │
│  }                                              │
└─────────────────────────────────────────────────┘
   ↓
5. User sees admin UI (but data queries still protected)
   ↓
6. Component queries admin data
   const stats = useQuery(api.users.getAdminStats);
   ↓
7. Query sent to Convex
   ↓
8. Convex function validates role (SERVER-SIDE - SECURITY)
┌─────────────────────────────────────────────────┐
│  export const getAdminStats = query({           │
│    handler: async (ctx) => {                    │
│      const user = await requireAuth(ctx);       │
│                                                 │
│      // SECURITY CHECK                          │
│      if (!user.roles?.includes("admin")) {      │
│        throw new ConvexError("Unauthorized");   │
│      }                                          │
│                                                 │
│      // Query sensitive data                    │
│      const stats = await ctx.db.query(...)      │
│      return stats;                              │
│    }                                            │
│  });                                            │
└─────────────────────────────────────────────────┘
   ↓
9a. User IS admin → Return stats
   ↓
   UI displays admin stats

9b. User NOT admin → Throw error
   ↓
   Error caught on client
   ↓
   Show error message or redirect
```

**Important**:
- Client-side role checks are for UX (hide buttons, show errors)
- Server-side role checks in Convex are for security (data protection)
- NEVER rely on client-side checks for security!

---

## Data Flow Performance Characteristics

### Latency Breakdown (Typical)

**Initial Page Load (SSR)**:
```
DNS Lookup:               ~20ms
TLS Handshake:            ~50ms
Edge Routing:             ~10ms
Worker Execution:         ~30ms
Clerk Auth Check:         ~50ms
HTML Generation:          ~20ms
─────────────────────────────
Total TTFB:               ~180ms

Then:
HTML Download:            ~50ms
JS Download:              ~200ms
React Hydration:          ~100ms
─────────────────────────────
Total Time to Interactive: ~530ms
```

**Subsequent Client-Side Navigation**:
```
Client-side routing:      ~5ms
Component render:         ~10ms
─────────────────────────────
Total:                    ~15ms (instant)
```

**Convex Query (Real-Time)**:
```
WebSocket latency:        ~20-50ms (already connected)
Query execution:          ~10-30ms
Data serialization:       ~5ms
─────────────────────────────
Total:                    ~35-85ms
```

**Convex Mutation**:
```
Optimistic update:        ~1ms (instant UI)
WebSocket send:           ~20ms
Server processing:        ~30ms
DB transaction:           ~20ms
Real-time broadcast:      ~20ms
─────────────────────────────
Total (server confirm):   ~90ms
(User sees update at ~1ms due to optimistic UI)
```

---

**Last Updated**: 2025-10-23
**Diagram Type**: Data Flow
**Use Case**: Understanding request/data paths through system
