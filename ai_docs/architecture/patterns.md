# Architectural Patterns & Best Practices

**Version**: 1.0
**Date**: 2025-10-23

## Overview

This document describes the architectural patterns, design principles, and best practices used throughout the application. It serves as a guide for developers to maintain consistency and make architecture-aligned decisions.

---

## Table of Contents

1. [Primary Architectural Pattern](#primary-architectural-pattern)
2. [Code Organization Patterns](#code-organization-patterns)
3. [Data Access Patterns](#data-access-patterns)
4. [Authentication & Authorization Patterns](#authentication--authorization-patterns)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Performance Patterns](#performance-patterns)
7. [Security Patterns](#security-patterns)
8. [Testing Patterns](#testing-patterns)
9. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Primary Architectural Pattern

### Edge-First JAMstack with Real-Time Capabilities

**Pattern Classification**: Hybrid Architecture

This application combines multiple architectural patterns:

1. **JAMstack** (JavaScript, APIs, Markup)
   - Static assets served from CDN
   - Client-side JavaScript for interactivity
   - APIs for dynamic functionality

2. **Edge Computing**
   - Application logic runs on edge nodes (Cloudflare Workers)
   - Minimal latency worldwide
   - Serverless execution model

3. **Backend-as-a-Service (BaaS)**
   - Database: Convex (managed)
   - Auth: Clerk (managed)
   - No traditional backend servers

4. **Real-Time Architecture**
   - WebSocket subscriptions for live updates
   - Optimistic UI updates
   - Reactive data layer

### Pattern Visualization

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Browser)                               │
│  - React components                                         │
│  - Client-side routing                                      │
│  - Real-time subscriptions                                  │
└─────────────────────────────────────────────────────────────┘
                        ↓ ↑ (HTTPS/WSS)
┌─────────────────────────────────────────────────────────────┐
│  EDGE COMPUTE LAYER (Cloudflare Network)                    │
│  - SSR (server-side rendering)                              │
│  - API endpoints                                            │
│  - Routing logic                                            │
└─────────────────────────────────────────────────────────────┘
                        ↓ ↑ (API Calls)
┌────────────────────────────────────┬────────────────────────┐
│  DATA LAYER (Convex)               │  AUTH LAYER (Clerk)    │
│  - Real-time database              │  - User management     │
│  - Business logic functions        │  - JWT issuance        │
│  - Schema & indexes                │  - Session handling    │
└────────────────────────────────────┴────────────────────────┘
```

---

## Code Organization Patterns

### 1. File-Based Routing Pattern

**Location**: `/app/routes/`

**Pattern**:
```
routes/
  _index.tsx              → / (public home)
  login.tsx               → /login (public)
  _auth.tsx               → Layout for protected routes
  _auth.todos.tsx         → /todos (protected)
  _auth.admin.tsx         → Layout for admin routes
  _auth.admin._index.tsx  → /admin (admin dashboard)
```

**Rules**:
- `_` prefix = layout route (no route segment)
- `_auth.*` = requires authentication
- Nested folders = nested routes
- `_index.tsx` = index route for segment

**Benefits**:
- Clear route structure
- Co-location of route code
- Automatic route generation
- Type-safe route parameters

### 2. Component Organization Pattern

**Location**: `/app/components/`

```
components/
  ui/                     # ShadCN components (auto-generated)
    button.tsx
    dialog.tsx
  layouts/                # Layout components
    public-layout.tsx
    admin-layout.tsx
  features/               # Feature-specific components
    todos/
      todo-list.tsx
      todo-item.tsx
      create-todo-form.tsx
```

**Rules**:
- One component per file
- Component name matches filename (PascalCase)
- Co-locate related components
- Extract reusable components to shared directory

### 3. Convex Function Organization Pattern

**Location**: `/convex/`

```
convex/
  schema.ts              # Database schema
  auth.ts                # Auth helpers
  users.ts               # User-related functions
  todos.ts               # Todo-related functions
  http.ts                # HTTP endpoints (webhooks)
  _generated/            # Auto-generated types (DO NOT EDIT)
```

**Pattern**: Domain-Driven File Organization
- Each file represents a domain (users, todos)
- Functions grouped by entity type
- Shared auth logic in separate file

### 4. Worker Organization Pattern

**Location**: `/workers/`

```
workers/
  app.ts                 # Main worker entry point
  types.ts               # Worker-specific types
  permissions.ts         # Permission definitions
```

**Pattern**: Minimal worker code
- Keep edge functions lightweight
- Delegate to React Router for rendering
- Use Hono for routing logic

---

## Data Access Patterns

### 1. Query Pattern (Read Data)

**Use Case**: Fetch data from Convex

**Client-Side**:
```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function TodoList() {
  const todos = useQuery(api.todos.list);

  if (todos === undefined) return <LoadingSpinner />;
  if (todos === null) return <ErrorMessage />;

  return <div>{todos.map(...)}</div>;
}
```

**Server-Side (Convex)**:
```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("todos")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .order("desc")
      .collect();
  }
});
```

**Key Points**:
- `useQuery` returns `undefined` while loading
- Returns `null` on error
- Automatically subscribes to real-time updates
- Always validate auth in handler

### 2. Mutation Pattern (Write Data)

**Use Case**: Create, update, delete data

**Client-Side**:
```typescript
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function CreateTodoForm() {
  const createTodo = useMutation(api.todos.create);

  async function handleSubmit(text: string) {
    try {
      await createTodo({ text });
      toast.success("Todo created!");
    } catch (error) {
      toast.error("Failed to create todo");
    }
  }

  return <form onSubmit={...} />;
}
```

**Server-Side (Convex)**:
```typescript
export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const user = await requireAuth(ctx);

    // Validation
    if (!text.trim()) {
      throw new ConvexError("Text cannot be empty");
    }

    // Insert
    const todoId = await ctx.db.insert("todos", {
      userId: user._id,
      text: text.trim(),
      completed: false,
      createdAt: Date.now()
    });

    return todoId;
  }
});
```

**Key Points**:
- Always validate inputs
- Use Convex validators (`v.string()`, `v.number()`)
- Throw ConvexError for user-facing errors
- Return created ID for optimistic updates

### 3. Optimistic Update Pattern

**Use Case**: Instant UI feedback before server confirms

```typescript
function ToggleTodo({ todoId, completed }: Props) {
  const toggleTodo = useMutation(api.todos.toggle);

  async function handleToggle() {
    // Optimistic UI update handled by Convex automatically
    await toggleTodo({ todoId });
  }

  return <Checkbox checked={completed} onCheckedChange={handleToggle} />;
}
```

**Convex handles optimistic updates automatically!**

### 4. Protected Query/Mutation Pattern

**Always require authentication**:

```typescript
import { requireAuth } from "./auth";

export const protectedQuery = query({
  args: {},
  handler: async (ctx) => {
    // This throws if not authenticated
    const user = await requireAuth(ctx);

    // User is guaranteed to exist here
    return await ctx.db.query("todos")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
  }
});
```

**Never skip auth checks in Convex functions!**

---

## Authentication & Authorization Patterns

### 1. Client-Side Authentication Check

**Pattern**: Use Clerk hooks

```typescript
import { useAuth } from "@clerk/react-router";

function ProtectedComponent() {
  const { isSignedIn, userId } = useAuth();

  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  return <div>Protected content</div>;
}
```

### 2. Server-Side Authentication (React Router Loader)

**Pattern**: Check auth in loader

```typescript
import { getAuth } from "@clerk/react-router/ssr.server";
import { redirect } from "react-router";

export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/login");
  }

  return { userId };
}
```

### 3. Layout-Based Route Protection

**Pattern**: Protected route layout

```typescript
// _auth.tsx
export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/login");
  }

  return null;
}

export default function Protected() {
  return <Outlet />; // All child routes are protected
}
```

All routes under `_auth.*` inherit this protection.

### 4. Role-Based Authorization

**Client-Side** (UI only):
```typescript
import { useAuth } from "~/hooks/use-auth";

function AdminPanel() {
  const { hasRole } = useAuth();

  if (!hasRole("admin")) {
    return <Navigate to="/unauthorized" />;
  }

  return <div>Admin panel</div>;
}
```

**Server-Side** (security boundary):
```typescript
export const adminQuery = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    if (!user.roles?.includes("admin")) {
      throw new ConvexError("Unauthorized: Admin access required");
    }

    // Admin logic here
  }
});
```

**Never trust client-side auth checks for security!**

### 5. Permission-Based Authorization

**Pattern**: Check granular permissions

```typescript
import { rolesHavePermission } from "~/lib/permissions";

// Client-side
const { user } = useAuth();
const canEdit = rolesHavePermission(user.roles, "users.edit");

if (!canEdit) {
  return <div>Permission denied</div>;
}
```

**Server-side**: Similar check in Convex function

---

## Error Handling Patterns

### 1. Convex Error Pattern

**Pattern**: Use ConvexError for user-facing errors

```typescript
import { ConvexError } from "convex/values";

export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    if (!text.trim()) {
      throw new ConvexError("Todo text cannot be empty");
    }

    // Success path
  }
});
```

### 2. Client-Side Error Handling

**Pattern**: Try-catch with toast notifications

```typescript
async function handleCreate(text: string) {
  try {
    await createTodo({ text });
    toast.success("Todo created!");
  } catch (error) {
    console.error("Failed to create todo:", error);
    toast.error("Failed to create todo. Please try again.");
  }
}
```

### 3. React Error Boundary Pattern

**Pattern**: Catch rendering errors

```typescript
import { ErrorBoundary } from "react-router";

export function ErrorPage() {
  const error = useRouteError();

  return (
    <div>
      <h1>Oops!</h1>
      <p>Something went wrong</p>
      <code>{error.message}</code>
    </div>
  );
}
```

### 4. Loading State Pattern

**Pattern**: Handle undefined state from useQuery

```typescript
function TodoList() {
  const todos = useQuery(api.todos.list);

  if (todos === undefined) {
    return <LoadingSpinner />;
  }

  if (todos.length === 0) {
    return <EmptyState />;
  }

  return <div>{todos.map(...)}</div>;
}
```

---

## Performance Patterns

### 1. Index Usage Pattern

**Pattern**: Always query with indexes

```typescript
// Good: Uses index
const user = await ctx.db
  .query("users")
  .withIndex("by_clerkId", q => q.eq("clerkId", clerkId))
  .unique();

// Bad: Full table scan
const user = await ctx.db
  .query("users")
  .filter(q => q.eq(q.field("clerkId"), clerkId))
  .unique();
```

**Rule**: If you're filtering, you should have an index.

### 2. Pagination Pattern

**Pattern**: Limit query results

```typescript
export const listTodos = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, { limit = 20, cursor }) => {
    const user = await requireAuth(ctx);

    let query = ctx.db
      .query("todos")
      .withIndex("by_user", q => q.eq("userId", user._id));

    if (cursor) {
      // Implement cursor-based pagination
    }

    return await query.take(limit);
  }
});
```

### 3. Code Splitting Pattern

**Pattern**: Lazy load routes

```typescript
import { lazy } from "react";

const AdminDashboard = lazy(() => import("./routes/_auth.admin._index"));
```

React Router 7 does this automatically for route components.

### 4. Memoization Pattern

**Pattern**: Memoize expensive computations

```typescript
import { useMemo } from "react";

function TodoStats({ todos }: Props) {
  const stats = useMemo(() => {
    return {
      total: todos.length,
      completed: todos.filter(t => t.completed).length
    };
  }, [todos]);

  return <div>Total: {stats.total}</div>;
}
```

---

## Security Patterns

### 1. Input Validation Pattern

**Pattern**: Validate all inputs server-side

```typescript
export const create = mutation({
  args: {
    text: v.string(),
    dueDate: v.optional(v.number())
  },
  handler: async (ctx, { text, dueDate }) => {
    // Validate
    if (text.length > 500) {
      throw new ConvexError("Text too long (max 500 characters)");
    }

    if (dueDate && dueDate < Date.now()) {
      throw new ConvexError("Due date must be in the future");
    }

    // Process...
  }
});
```

**Never trust client input!**

### 2. Authorization Check Pattern

**Pattern**: Check ownership before modifications

```typescript
export const deleteTodo = mutation({
  args: { todoId: v.id("todos") },
  handler: async (ctx, { todoId }) => {
    const user = await requireAuth(ctx);
    const todo = await ctx.db.get(todoId);

    if (!todo) {
      throw new ConvexError("Todo not found");
    }

    // Check ownership
    if (todo.userId !== user._id) {
      throw new ConvexError("Unauthorized: Not your todo");
    }

    await ctx.db.delete(todoId);
  }
});
```

### 3. Sensitive Data Pattern

**Pattern**: Never expose secrets to client

```typescript
// Server-side only (Convex function)
export const processPayment = action({
  args: { amount: v.number() },
  handler: async (ctx, { amount }) => {
    // Use secret from environment
    const apiKey = process.env.STRIPE_SECRET_KEY;

    // Never return secret to client
    const result = await stripe.charges.create({ ... });

    return { success: true }; // Don't leak sensitive data
  }
});
```

### 4. XSS Prevention Pattern

**Pattern**: React auto-escapes by default

```typescript
// Safe: React escapes automatically
<div>{userInput}</div>

// Dangerous: Only use for trusted HTML
<div dangerouslySetInnerHTML={{ __html: trustedHtml }} />
```

**Avoid `dangerouslySetInnerHTML` unless absolutely necessary!**

---

## Testing Patterns

### 1. Component Testing Pattern

**Pattern**: Test user interactions

```typescript
import { render, screen, fireEvent } from "@testing-library/react";

test("creates todo on submit", async () => {
  render(<CreateTodoForm />);

  const input = screen.getByPlaceholderText("New todo");
  fireEvent.change(input, { target: { value: "Buy milk" } });

  const button = screen.getByText("Add");
  fireEvent.click(button);

  expect(await screen.findByText("Todo created!")).toBeInTheDocument();
});
```

### 2. Convex Function Testing Pattern

**Pattern**: Use Convex test helpers

```typescript
import { convexTest } from "convex-test";
import { api } from "./_generated/api";

test("creates todo", async () => {
  const t = convexTest(schema);

  const userId = await t.mutation(api.users.create, {
    email: "test@example.com"
  });

  const todoId = await t.mutation(api.todos.create, {
    text: "Test todo"
  });

  expect(todoId).toBeDefined();
});
```

---

## Anti-Patterns to Avoid

### 1. Using `any` Type

```typescript
// ❌ Bad: Breaks type safety
function process(data: any) {
  return data.value;
}

// ✅ Good: Use specific types
function process(data: { value: string }) {
  return data.value;
}

// ✅ Good: Use unknown for truly unknown types
function process(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value: string }).value;
  }
}
```

### 2. Client-Side Authorization

```typescript
// ❌ Bad: Client can bypass this
function DeleteButton({ todoId }: Props) {
  const { hasRole } = useAuth();

  if (!hasRole("admin")) return null;

  return <button onClick={() => deleteTodo({ todoId })}>Delete</button>;
}

// ✅ Good: Server-side check in Convex
export const deleteTodo = mutation({
  args: { todoId: v.id("todos") },
  handler: async (ctx, { todoId }) => {
    const user = await requireAuth(ctx);

    // Server-side authorization check
    if (!user.roles?.includes("admin")) {
      throw new ConvexError("Unauthorized");
    }

    await ctx.db.delete(todoId);
  }
});
```

### 3. Direct Database Access from Client

```typescript
// ❌ Bad: Never expose database directly
// (Not possible with Convex, but don't try to work around it)

// ✅ Good: Always go through Convex functions
const todos = useQuery(api.todos.list);
```

### 4. Blocking Operations in Workers

```typescript
// ❌ Bad: CPU-intensive work on edge
export async function loader() {
  const data = await fetchData();

  // This will timeout on Workers (125ms CPU limit)
  const result = heavyComputation(data);

  return result;
}

// ✅ Good: Offload to Convex action or external service
export async function loader() {
  // Convex can handle longer operations
  const result = await convex.action(api.compute.heavy, { data });
  return result;
}
```

### 5. Fetching in Loops (N+1 Problem)

```typescript
// ❌ Bad: N+1 queries
for (const todo of todos) {
  const user = await ctx.db.get(todo.userId);
  // Process user...
}

// ✅ Good: Batch fetch
const userIds = [...new Set(todos.map(t => t.userId))];
const users = await Promise.all(
  userIds.map(id => ctx.db.get(id))
);
```

### 6. Missing Indexes

```typescript
// ❌ Bad: No index for common query
todos: defineTable({
  userId: v.id("users"),
  text: v.string()
})

// ✅ Good: Add index for query patterns
todos: defineTable({
  userId: v.id("users"),
  text: v.string()
}).index("by_user", ["userId"])
```

### 7. Storing Secrets in Code

```typescript
// ❌ Bad: Secret in code
const API_KEY = "sk_live_123abc";

// ✅ Good: Secret in environment variable
const API_KEY = process.env.API_KEY;
```

### 8. Not Handling Loading States

```typescript
// ❌ Bad: Assumes data is always available
function TodoList() {
  const todos = useQuery(api.todos.list);
  return <div>{todos.map(...)}</div>; // Crashes if undefined
}

// ✅ Good: Handle loading state
function TodoList() {
  const todos = useQuery(api.todos.list);

  if (todos === undefined) return <LoadingSpinner />;

  return <div>{todos.map(...)}</div>;
}
```

---

## Pattern Decision Tree

**When to use Query vs Mutation?**
- Reading data → Query
- Writing data → Mutation

**When to use Action?**
- Calling external APIs
- Non-transactional operations
- Long-running tasks (>5 seconds)

**When to use Server-Side Rendering?**
- SEO-critical pages
- Initial page load performance matters
- Public-facing content

**When to use Client-Side Rendering?**
- Highly interactive pages
- Real-time updates important
- Authenticated user dashboards

**When to cache data?**
- Frequently accessed, rarely changed data
- Public data (not user-specific)
- High read-to-write ratio

**When to add an index?**
- Querying by a field regularly
- Filtering or sorting by a field
- Performance becomes an issue

---

## Pattern Evolution

As the application grows, patterns may evolve:

**Current State** (MVP):
- Simple patterns
- Minimal abstractions
- Direct Convex calls

**Future State** (Scale):
- Repository pattern for database access
- Service layer for business logic
- Advanced caching strategies
- Background job processing

**Migration Path**:
1. Start simple (current patterns)
2. Identify pain points as you scale
3. Introduce abstractions gradually
4. Refactor incrementally, not all at once

---

## Resources

- [Convex Best Practices](https://docs.convex.dev/production/best-practices)
- [React Router Patterns](https://reactrouter.com/en/main/start/concepts)
- [Cloudflare Workers Patterns](https://developers.cloudflare.com/workers/examples/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Document Owner**: Engineering Team
**Last Updated**: 2025-10-23
**Next Review**: 2026-01-23 (Quarterly)
