# Convex Developer Guide for Senior Engineers

## Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Quick Start](#quick-start)
3. [TypeScript & Type Safety](#typescript--type-safety)
4. [Database & Schema](#database--schema)
5. [Functions (Query, Mutation, Action)](#functions-query-mutation-action)
6. [Indexes & Performance](#indexes--performance)
7. [Authentication & Security](#authentication--security)
8. [File Storage](#file-storage)
9. [Vector Search](#vector-search)
10. [Real-time & Reactivity](#real-time--reactivity)
11. [Error Handling](#error-handling)
12. [Best Practices](#best-practices)
13. [Advanced Patterns](#advanced-patterns)
14. [Deployment & Production](#deployment--production)

## Overview & Architecture

Convex is an open-source reactive database with a built-in backend platform. Key concepts:
- **Document-relational database** with ACID guarantees
- **TypeScript-first** with end-to-end type safety
- **Reactive queries** that automatically update when data changes
- **Serverless functions** that run in a sandboxed V8 environment
- **Built-in features**: auth, file storage, vector search, scheduling

### Architecture Components
- **Database**: Serializable isolation, optimistic concurrency control
- **Functions**: Queries (read-only), Mutations (transactional writes), Actions (side effects)
- **Sync Engine**: Automatic reactivity and real-time updates via WebSockets
- **Storage**: File storage with metadata tracking
- **Search**: Full-text and vector search capabilities

## Quick Start

### Installation
```bash
npm create convex
# or add to existing project:
npm install convex
npx convex dev
```

### Project Structure
```
project/
├── convex/
│   ├── _generated/       # Auto-generated types
│   ├── schema.ts        # Database schema
│   ├── functions.ts     # Your backend functions
│   └── auth.config.ts   # Auth configuration
└── src/                 # Frontend code
```

### Essential Links
- [TypeScript Best Practices](https://docs.convex.dev/understanding/best-practices/typescript)
- [API Reference](https://docs.convex.dev/api)
- [convex/server Module](https://docs.convex.dev/api/modules/server)
- [convex/values Module](https://docs.convex.dev/api/modules/values)

## TypeScript & Type Safety

### Core Types
```typescript
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { Auth, StorageReader, StorageWriter } from "convex/server";
import { Infer, v } from "convex/values";
```

### Validator System
```typescript
// Define validators
const messageValidator = v.object({
  text: v.string(),
  author: v.id("users"),
  timestamp: v.number(),
  tags: v.optional(v.array(v.string())),
});

// Extract TypeScript type from validator
type Message = Infer<typeof messageValidator>;
```

### Function Type Inference
```typescript
import { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";

// Get return type of any function
type MessagesData = FunctionReturnType<typeof api.messages.list>;
```

### Helper Function Types
```typescript
// Reusable helper with proper typing
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  
  if (!user) throw new Error("User not found");
  return user;
}
```

## Database & Schema

### Schema Definition
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    metadata: v.optional(v.object({
      lastLogin: v.number(),
      preferences: v.any(),
    })),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role", "name"]),
    
  messages: defineTable({
    text: v.string(),
    userId: v.id("users"),
    channelId: v.id("channels"),
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId", "createdAt"])
    .index("by_user", ["userId", "createdAt"]),
});
```

### Database Operations
```typescript
// Reading data
const user = await ctx.db.get(userId);
const users = await ctx.db.query("users").collect();
const admins = await ctx.db
  .query("users")
  .withIndex("by_role", q => q.eq("role", "admin"))
  .collect();

// Writing data
const id = await ctx.db.insert("users", { name: "Alice", email: "alice@example.com" });
await ctx.db.patch(id, { name: "Alice Smith" });
await ctx.db.delete(id);
```

### Advanced Patterns
```typescript
// Unique constraint simulation
const existing = await ctx.db
  .query("users")
  .withIndex("by_email", q => q.eq("email", email))
  .unique();
if (existing) throw new Error("Email already exists");

// Transactions are automatic within mutations
await ctx.db.insert("accounts", { balance: 100 });
await ctx.db.insert("transactions", { amount: -50 });
// Both succeed or both fail
```

## Functions (Query, Mutation, Action)

### Query Functions (Read-Only)
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getMessages = query({
  args: { 
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { channelId, limit = 50 }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", q => q.eq("channelId", channelId))
      .order("desc")
      .take(limit);
  },
});
```

### Mutation Functions (Transactional Writes)
```typescript
import { mutation } from "./_generated/server";

export const sendMessage = mutation({
  args: { 
    text: v.string(),
    channelId: v.id("channels"),
  },
  handler: async (ctx, { text, channelId }) => {
    const user = await requireAuth(ctx);
    
    const messageId = await ctx.db.insert("messages", {
      text,
      channelId,
      userId: user._id,
      createdAt: Date.now(),
    });
    
    // Schedule background work
    await ctx.scheduler.runAfter(0, internal.tasks.processMessage, { messageId });
    
    return messageId;
  },
});
```

### Action Functions (Side Effects)
```typescript
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateEmbedding = internalAction({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    // External API calls allowed in actions
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });
    
    const data = await response.json();
    const embedding = data.data[0].embedding;
    
    // Write results back via mutation
    await ctx.runMutation(internal.embeddings.store, { text, embedding });
    
    return embedding;
  },
});
```

## Indexes & Performance

### Index Types
```typescript
// Single field index
.index("by_email", ["email"])

// Compound index (order matters!)
.index("by_channel_time", ["channelId", "createdAt"])

// Index on nested fields
.index("by_metadata_status", ["metadata.status"])
```

### Query Patterns
```typescript
// Efficient: Uses index
const messages = await ctx.db
  .query("messages")
  .withIndex("by_channel_time", q => 
    q.eq("channelId", channelId)
     .gte("createdAt", startTime)
     .lte("createdAt", endTime)
  )
  .collect();

// Inefficient: Full table scan
const messages = await ctx.db
  .query("messages")
  .filter(q => q.eq(q.field("channelId"), channelId))
  .collect();
```

### Performance Best Practices
- Always use indexes for queries returning >100 documents
- Use `.take(n)` to limit results
- Paginate large result sets
- Denormalize data when appropriate
- Use staged indexes for large tables

### Pagination
```typescript
export const paginatedMessages = query({
  args: {
    channelId: v.id("channels"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { channelId, paginationOpts }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", q => q.eq("channelId", channelId))
      .order("desc")
      .paginate(paginationOpts);
  },
});
```

## Authentication & Security

### Convex Auth Setup
```typescript
// convex/auth.config.ts
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@convex-dev/auth/providers/GitHub";

const CustomPassword = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
    };
  },
});

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [GitHub, CustomPassword],
});
```

### Secure Functions
```typescript
// Custom wrapper for authenticated functions
export const authenticatedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await requireAuth(ctx);
    return { user };
  })
);

// Usage
export const getPrivateData = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // ctx.user is guaranteed to exist
    return await ctx.db
      .query("private_data")
      .filter(q => q.eq(q.field("userId"), ctx.user._id))
      .collect();
  },
});
```

### Row-Level Security
```typescript
import { wrapDatabaseReader } from "convex-helpers/server/rowLevelSecurity";

const rlsRules = {
  messages: {
    read: async (ctx, doc) => {
      const user = await ctx.auth.getUserIdentity();
      if (!user) return false;
      // Check if user has access to channel
      return await hasChannelAccess(ctx, user, doc.channelId);
    },
    modify: async (ctx, doc) => {
      const user = await ctx.auth.getUserIdentity();
      return doc.userId === user?.subject;
    },
  },
};
```

## File Storage

### Upload Pattern
```typescript
// 1. Generate upload URL
export const generateUploadUrl = mutation(async (ctx) => {
  await requireAuth(ctx);
  return await ctx.storage.generateUploadUrl();
});

// 2. Store file reference
export const saveFile = mutation({
  args: { 
    storageId: v.id("_storage"),
    metadata: v.object({
      name: v.string(),
      type: v.string(),
      size: v.number(),
    }),
  },
  handler: async (ctx, { storageId, metadata }) => {
    const user = await requireAuth(ctx);
    
    await ctx.db.insert("files", {
      storageId,
      userId: user._id,
      ...metadata,
      uploadedAt: Date.now(),
    });
  },
});

// 3. Serve files
export const getFileUrl = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, { fileId }) => {
    const file = await ctx.db.get(fileId);
    if (!file) return null;
    
    return await ctx.storage.getUrl(file.storageId);
  },
});
```

## Vector Search

### Vector Index Definition
```typescript
// In schema.ts
documents: defineTable({
  content: v.string(),
  embedding: v.array(v.float64()),
  metadata: v.object({
    source: v.string(),
    category: v.string(),
  }),
}).vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,
  filterFields: ["metadata.category"],
})
```

### Vector Search Implementation
```typescript
export const semanticSearch = action({
  args: { 
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, category, limit = 10 }) => {
    // Generate embedding for query
    const embedding = await generateEmbedding(query);
    
    // Perform vector search
    const results = await ctx.vectorSearch("documents", "by_embedding", {
      vector: embedding,
      limit,
      filter: category ? q => q.eq("metadata.category", category) : undefined,
    });
    
    // Load full documents
    const documents = await ctx.runQuery(internal.documents.getMany, {
      ids: results.map(r => r._id),
    });
    
    return documents.map((doc, i) => ({
      ...doc,
      score: results[i]._score,
    }));
  },
});
```

## Real-time & Reactivity

### Client Integration
```typescript
// React
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function ChatRoom({ channelId }) {
  // Automatically updates when data changes
  const messages = useQuery(api.messages.getMessages, { channelId });
  const sendMessage = useMutation(api.messages.sendMessage);
  
  if (messages === undefined) return <Loading />;
  
  return (
    <div>
      {messages.map(msg => <Message key={msg._id} {...msg} />)}
      <MessageInput onSend={(text) => sendMessage({ text, channelId })} />
    </div>
  );
}
```

### Optimistic Updates
```typescript
const sendMessage = useMutation(api.messages.sendMessage)
  .withOptimisticUpdate((localStore, { text, channelId }) => {
    const current = localStore.getQuery(api.messages.getMessages, { channelId });
    if (current) {
      localStore.setQuery(
        api.messages.getMessages,
        { channelId },
        [...current, {
          _id: "optimistic-" + Date.now(),
          text,
          channelId,
          createdAt: Date.now(),
          pending: true,
        }]
      );
    }
  });
```

## Error Handling

### Application Errors
```typescript
import { ConvexError } from "convex/values";

export const transfer = mutation({
  args: { 
    amount: v.number(),
    toAccountId: v.id("accounts"),
  },
  handler: async (ctx, { amount, toAccountId }) => {
    const account = await getAccount(ctx);
    
    if (account.balance < amount) {
      throw new ConvexError({
        code: "INSUFFICIENT_FUNDS",
        message: "Insufficient balance",
        required: amount,
        available: account.balance,
      });
    }
    
    // Transfer logic...
  },
});

// Client-side handling
try {
  await transfer({ amount: 100, toAccountId });
} catch (error) {
  if (error instanceof ConvexError) {
    const { code, message, required, available } = error.data;
    // Handle specific error
  }
}
```

### Error Boundaries
```typescript
function ConvexErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        // Log to error service
        console.error('Convex error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Best Practices

### Database Patterns
1. **Use indexes** for queries returning >100 documents
2. **Denormalize** when it improves query performance
3. **Batch operations** when possible
4. **Soft deletes** for audit trails
5. **Version fields** for optimistic concurrency

### Function Organization
```typescript
// Separate public and internal APIs
// public.ts
export const publicFunction = mutation({...});

// internal.ts  
export const internalHelper = internalMutation({...});

// Use folders for logical grouping
// convex/users/mutations.ts
// convex/users/queries.ts
// convex/users/actions.ts
```

### Type Safety
```typescript
// Use branded types for IDs
type UserId = Id<"users"> & { __brand: "UserId" };
type TeamId = Id<"teams"> & { __brand: "TeamId" };

// Validate at boundaries
function validateUserId(id: string): UserId {
  if (!id.startsWith("user_")) throw new Error("Invalid user ID");
  return id as UserId;
}
```

### Performance Optimization
```typescript
// Use projection to limit data transfer
const userNames = await ctx.db
  .query("users")
  .withIndex("by_team", q => q.eq("teamId", teamId))
  .map(user => ({ id: user._id, name: user.name }))
  .collect();

// Batch related queries
const [users, messages, channels] = await Promise.all([
  ctx.db.query("users").collect(),
  ctx.db.query("messages").take(100),
  ctx.db.query("channels").collect(),
]);
```

## Advanced Patterns

### Workflow Pattern
```typescript
// Long-running workflows with retries
export const processOrder = action({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.runQuery(internal.orders.get, { orderId });
    
    try {
      // Step 1: Charge payment
      const chargeResult = await chargePayment(order);
      await ctx.runMutation(internal.orders.updateStatus, {
        orderId,
        status: "charged",
        chargeId: chargeResult.id,
      });
      
      // Step 2: Create shipment
      const shipment = await createShipment(order);
      await ctx.runMutation(internal.orders.updateStatus, {
        orderId,
        status: "shipped",
        trackingNumber: shipment.tracking,
      });
      
    } catch (error) {
      // Schedule retry
      await ctx.scheduler.runAfter(60000, internal.workflows.processOrder, {
        orderId,
        retryCount: (order.retryCount || 0) + 1,
      });
    }
  },
});
```

### Event Sourcing
```typescript
// Store events instead of state
events: defineTable({
  aggregateId: v.string(),
  type: v.string(),
  payload: v.any(),
  timestamp: v.number(),
}).index("by_aggregate", ["aggregateId", "timestamp"])

// Rebuild state from events
export const getAccountBalance = query({
  args: { accountId: v.string() },
  handler: async (ctx, { accountId }) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_aggregate", q => q.eq("aggregateId", accountId))
      .collect();
    
    return events.reduce((balance, event) => {
      switch (event.type) {
        case "DEPOSIT": return balance + event.payload.amount;
        case "WITHDRAW": return balance - event.payload.amount;
        default: return balance;
      }
    }, 0);
  },
});
```

### CQRS Pattern
```typescript
// Commands (writes)
export const createProduct = mutation({
  args: productValidator,
  handler: async (ctx, product) => {
    const id = await ctx.db.insert("products", product);
    
    // Update read models
    await ctx.scheduler.runAfter(0, internal.readModels.updateProductSearch, { id });
    await ctx.scheduler.runAfter(0, internal.readModels.updateCategoryCount, {
      category: product.category,
    });
    
    return id;
  },
});

// Queries (reads from optimized models)
export const searchProducts = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    return await ctx.db
      .query("product_search")
      .withSearchIndex("search", q => q.search("text", query))
      .take(20);
  },
});
```

## Deployment & Production

### Environment Configuration
```typescript
// Access environment variables
const apiKey = process.env.STRIPE_API_KEY;

// Environment-specific logic
const isDev = process.env.CONVEX_ENV === "development";
```

### Monitoring & Debugging
1. Use `console.log()` - shows in dashboard logs
2. Enable log streaming for production monitoring
3. Use structured logging:
```typescript
console.log("Processing order", {
  orderId,
  userId: user._id,
  amount,
  timestamp: Date.now(),
});
```

### Production Checklist
- [ ] All public functions have authentication
- [ ] Indexes defined for all large queries
- [ ] Error boundaries in place
- [ ] Rate limiting for expensive operations
- [ ] Monitoring and alerting configured
- [ ] Environment variables set
- [ ] Backup strategy defined

### Self-Hosting
```bash
# Using Docker (recommended)
docker run -p 3210:3210 \
  -v convex-data:/data \
  ghcr.io/get-convex/convex-backend:latest

# Configure with PostgreSQL
CONVEX_POSTGRES_URL=postgresql://user:pass@host:5432/convex
```

## Additional Resources

### Official Documentation
- [Convex Docs](https://docs.convex.dev/)
- [TypeScript Guide](https://docs.convex.dev/understanding/best-practices/typescript)
- [API Reference](https://docs.convex.dev/api/modules/server)
- [Stack Articles](https://stack.convex.dev/)

### Community Resources
- [Discord](https://discord.gg/convex)
- [GitHub](https://github.com/get-convex)
- [convex-helpers](https://github.com/get-convex/convex-helpers)
- [Example Projects](https://github.com/get-convex/convex-demos)

### Performance Resources
- [Indexes Guide](https://docs.convex.dev/database/reading-data/indexes)
- [Query Performance](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf)
- [Best Practices](https://docs.convex.dev/understanding/best-practices/)

### Advanced Topics
- [How Convex Works](https://stack.convex.dev/how-convex-works)
- [End-to-End TypeScript](https://stack.convex.dev/end-to-end-ts)
- [Vector Search Guide](https://stack.convex.dev/ai-chat-with-convex-vector-search)
- [Row Level Security](https://stack.convex.dev/row-level-security)