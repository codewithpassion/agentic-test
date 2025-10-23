# ADR-005: Hono as Backend Web Framework

**Status**: Accepted
**Date**: 2025-10-23
**Deciders**: Engineering Team
**Technical Story**: Backend web framework for edge runtime

## Context

We need a backend web framework that can:
- Run on Cloudflare Workers (edge runtime)
- Handle API routes and middleware
- Integrate with React Router 7 for SSR
- Provide routing and request handling
- Support TypeScript with excellent type inference
- Be lightweight (small bundle size)
- Offer good developer experience
- Handle CORS and other middleware

### Requirements

**Functional Requirements**:
- HTTP request routing
- Middleware support (CORS, auth, logging)
- Type-safe context and variables
- Integration with React Router SSR handler
- API endpoint creation
- Request/response handling
- Error handling

**Non-Functional Requirements**:
- Bundle size < 50KB
- Fast routing performance
- Works on edge runtimes (V8 isolates)
- TypeScript-first design
- Minimal dependencies

**Team Constraints**:
- Team familiar with Express-like APIs
- Need simple, not over-engineered
- Want fast iteration
- Prefer convention over configuration

## Decision

We will use **Hono** as our backend web framework for Cloudflare Workers.

## Rationale

### What is Hono?

Hono is a small, fast web framework for edge runtimes:
- Ultra-lightweight (~12KB)
- Express-like API (familiar)
- Built for edge (Cloudflare Workers, Deno, Bun)
- TypeScript-first with excellent type inference
- Fast routing (uses RegExpRouter)

### Core Value Propositions

**1. Edge-First Design**:
```typescript
// Built specifically for edge runtimes
import { Hono } from "hono";

const app = new Hono();

export default {
  fetch: app.fetch,
} satisfies ExportedHandler;
```

Not adapted for edge – designed for it from day one.

**2. Ultra-Lightweight**:
- ~12KB gzipped
- No dependencies
- Fast cold starts
- Minimal overhead

**3. Type Inference**:
```typescript
type AppType = {
  Bindings: CloudflareEnvironment;
  Variables: CloudflareVariables;
};

const app = new Hono<AppType>();

app.get("/api/user", (c) => {
  // c.env is typed as CloudflareEnvironment
  // c.var is typed as CloudflareVariables
  return c.json({ ... });
});
```

Excellent TypeScript support without manual typing.

**4. Express-Like API**:
```typescript
// Familiar if you know Express
app.get("/", (c) => c.text("Hello"));
app.post("/api/data", async (c) => {
  const body = await c.req.json();
  return c.json({ success: true });
});
```

Low learning curve for team.

**5. Built-In Middleware**:
```typescript
import { cors } from "hono/cors";
import { logger } from "hono/logger";

app.use("*", logger());
app.use("/api/*", cors());
```

Common middleware included.

**6. Performance**:
- RegExpRouter: ~100x faster than Express
- Optimized for V8
- No blocking operations
- Efficient request handling

### Comparison to Alternatives

| Feature | Hono | Itty Router | Worktop | Express | Fastify |
|---------|------|-------------|---------|---------|---------|
| **Bundle Size** | 12KB | 3KB | 15KB | 200KB+ | 100KB+ |
| **Edge Support** | ✅ Native | ✅ Native | ✅ Native | ❌ No | ❌ No |
| **TypeScript** | ✅ Excellent | ⚠️ Basic | ✅ Good | ⚠️ Manual | ✅ Good |
| **Middleware** | ✅ Rich | ⚠️ Limited | ✅ Good | ✅ Excellent | ✅ Excellent |
| **Routing** | ✅ Fast | ✅ Fast | ✅ Fast | ⚠️ Slow | ✅ Fast |
| **Learning Curve** | Low | Low | Medium | Low | Medium |
| **Ecosystem** | Growing | Small | Small | Huge | Large |
| **Maturity** | Medium (2021) | Low | Low | Very High | High |

## Consequences

### Positive Consequences

**Developer Experience**:
- Express-like API (familiar patterns)
- Excellent TypeScript inference
- Great error messages
- Simple and intuitive

**Performance**:
- Tiny bundle size (faster cold starts)
- Fast routing algorithm
- Minimal overhead
- Optimized for edge

**Flexibility**:
- Works on multiple runtimes (Workers, Deno, Bun, Node)
- Not locked to single platform
- Easy to test locally
- Can run anywhere

**Integration**:
- Works seamlessly with React Router
- Easy CORS setup
- Middleware composable
- Clean separation of concerns

**Type Safety**:
- Context properly typed
- Environment variables typed
- Request/response typed
- Autocomplete works perfectly

**Community & Ecosystem**:
- Active development
- Growing community
- Good documentation
- Regular updates

**Simplicity**:
- Minimal API surface
- No magic or hidden behavior
- Easy to understand
- Quick to learn

### Negative Consequences

**Ecosystem Immaturity**:
- Fewer third-party middlewares than Express
- Less Stack Overflow answers
- Fewer tutorials and examples
- Smaller community

**Less Battle-Tested**:
- Relatively new (2021)
- Fewer production deployments than Express
- Potential undiscovered bugs
- Less proven at scale

**Migration Risk**:
- If we need to move off Hono
- Would need to rewrite routing logic
- Custom middleware would need porting
- Not huge effort but still work

**Limited Middleware Ecosystem**:
- Need to write custom middleware sometimes
- Less plug-and-play solutions
- Some Express middleware won't work
- Need to adapt solutions

**Framework Churn Risk**:
- Creator could abandon project
- Breaking changes possible
- API could change
- Community could fragment

**Edge Runtime Dependency**:
- Optimized for edge (good for us)
- But ties us to edge deployment
- Some patterns don't translate to traditional servers
- Lock-in to edge paradigm

## Mitigation Strategies

### For Ecosystem Immaturity:

**1. Build Internal Middleware Library**:
```typescript
// Create reusable middleware
export function authMiddleware() {
  return async (c: Context, next: Next) => {
    // Auth logic
    await next();
  };
}
```

**2. Contribute to Community**:
- Open source our middleware
- Share solutions on GitHub
- Write blog posts
- Help others

**3. Document Patterns**:
- Create internal guides
- Document common solutions
- Build example code

### For Migration Risk:

**1. Keep Framework Logic Minimal**:
```typescript
// Business logic separate from framework
class ApiService {
  async getUser(id: string) { ... }
}

// Framework adapter (thin layer)
app.get("/api/user/:id", async (c) => {
  const service = new ApiService();
  const user = await service.getUser(c.req.param("id"));
  return c.json(user);
});
```

**2. Standard Web APIs**:
- Use standard Request/Response where possible
- Minimize Hono-specific features
- Keep it portable

**3. Document Migration Path**:
- How to migrate to Express/Fastify
- Estimated effort
- Step-by-step guide

### For Framework Stability:

**1. Pin Versions**:
- Don't auto-upgrade major versions
- Test upgrades thoroughly
- Read changelogs carefully

**2. Monitor Project Health**:
- Track GitHub activity
- Follow maintainer
- Watch for red flags

**3. Have Fallback Plan**:
- Know alternative frameworks
- Keep migration cost low
- Don't over-invest in framework-specific features

## Validation

### Success Criteria

**Performance**:
- API response time < 50ms (P95)
- Cold start overhead < 10ms
- Handles 1000 req/sec per worker

**Developer Experience**:
- New API routes added in < 5 minutes
- Team satisfaction with API
- Easy debugging

**Stability**:
- Zero framework-related bugs
- No unexpected breaking changes
- Smooth upgrades

### Failure Conditions (Triggers for Re-evaluation)

- Framework abandoned by maintainer
- Frequent breaking changes
- Performance degrades
- Missing critical features
- Better alternative emerges

## Alternatives Considered

### 1. Itty Router

**Pros**:
- Even smaller (3KB)
- Very fast
- Simple and minimalist
- Edge-native

**Cons**:
- Too minimal (lacks middleware)
- Weaker TypeScript support
- Smaller community
- Would need to build more ourselves

**Why Rejected**: Too barebones, missing features we'd need to build ourselves.

### 2. Worktop

**Pros**:
- Edge-optimized
- Good TypeScript
- Designed for Workers

**Cons**:
- Less active development
- Smaller community
- More complex API
- Cloudflare-specific

**Why Rejected**: Less active, more complex than needed, smaller community.

### 3. Express

**Pros**:
- Industry standard
- Huge ecosystem
- Massive community
- Well-documented

**Cons**:
- Doesn't run on edge
- Heavy (200KB+)
- Node.js-specific
- Slow routing

**Why Rejected**: Cannot run on Cloudflare Workers (edge runtime).

### 4. Fastify

**Pros**:
- Fast performance
- Good TypeScript
- Active ecosystem
- Schema validation built-in

**Cons**:
- Doesn't run on edge
- Node.js-specific
- More complex
- Heavier bundle

**Why Rejected**: Cannot run on Cloudflare Workers.

### 5. Custom Routing (DIY)

**Pros**:
- Full control
- Minimal code
- No dependencies

**Cons**:
- Time to build
- Need to handle edge cases
- Maintenance burden
- Reinventing wheel

**Why Rejected**: Not worth the time, Hono is already lightweight.

## Migration Path (If Needed)

If we need to migrate away from Hono:

**Option 1: To Itty Router (Stay on Edge)**

**Estimated Effort**: 1-2 weeks
- Simpler API, less features
- Mostly straightforward translation
- Need to implement missing middleware

**Option 2: To Express (Move Off Edge)**

**Estimated Effort**: 2-4 weeks
- Requires moving off Cloudflare Workers
- Middleware widely available
- More conventional deployment
- Would need new infrastructure

**Option 3: To Another Edge Framework**

**Estimated Effort**: 1-2 weeks
- Similar patterns
- Mostly API translation
- Stay on edge runtime

## Integration Details

### Hono + React Router Integration

```typescript
import { Hono } from "hono";
import { createRequestHandler } from "react-router";

const app = new Hono<AppType>();

// API routes
app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

// CORS for API
app.use("/api/*", cors());

// React Router SSR handler (catch-all)
app.use(async (c) => {
  const reactRouterContext = {
    cloudflare: {
      env: c.env,
      ctx: c.executionCtx,
    },
  };

  return requestHandler(c.req.raw, reactRouterContext);
});

export default {
  fetch: app.fetch,
};
```

### Middleware Example

```typescript
// Custom logging middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${duration}ms`);
});

// Auth middleware
app.use("/api/protected/*", async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});
```

### Type-Safe Context

```typescript
type AppType = {
  Bindings: CloudflareEnvironment;
  Variables: {
    user: User;
  };
};

const app = new Hono<AppType>();

// Middleware sets typed variable
app.use("/api/*", async (c, next) => {
  const user = await getUser(c.req.header("Authorization"));
  c.set("user", user); // Typed!
  await next();
});

// Route accesses typed variable
app.get("/api/profile", (c) => {
  const user = c.var.user; // Typed as User!
  return c.json(user);
});
```

## Current Usage

**API Routes**:
- `/api/health` - Health check endpoint

**Middleware**:
- CORS for `/api/*` routes
- React Router SSR handler (catch-all)

**Future Additions**:
- Rate limiting middleware
- Request logging
- Error handling middleware
- Authentication middleware

## Related Decisions

- **ADR-001**: Edge-First Architecture (Hono designed for edge)
- **ADR-004**: React Router 7 (Hono integrates with SSR handler)

## References

- [Hono Documentation](https://hono.dev)
- [Hono GitHub](https://github.com/honojs/hono)
- [Hono Benchmarks](https://hono.dev/concepts/benchmarks)
- [Cloudflare + Hono Guide](https://hono.dev/getting-started/cloudflare-workers)

## Review Schedule

- **Annual Review**: Assess framework health and alternatives
- **Trigger Events**:
  - Framework maintenance concerns
  - Missing critical features
  - Better alternative emerges
  - Performance issues

---

**Last Updated**: 2025-10-23
**Next Review**: 2026-10-23 (Annual)
**Risk Level**: Low (simple, focused tool)
**Mitigation Priority**: Low (easy to replace if needed)
