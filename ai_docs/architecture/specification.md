# System Architecture Specification

**Version**: 1.0
**Date**: 2025-10-23
**Status**: Active
**Application Type**: Edge-First Full-Stack Web Application

## 1. Executive Summary

This system implements a modern, edge-first full-stack web application with real-time capabilities, deployed to Cloudflare's global network. The architecture leverages serverless edge computing, real-time database synchronization, and third-party authentication services to deliver a scalable, low-latency user experience.

**Key Characteristics**:
- **Pattern**: Edge-First JAMstack with Real-Time Database
- **Primary Deployment**: Cloudflare Workers (Edge Network)
- **Database**: Convex (Real-Time Database as a Service)
- **Authentication**: Clerk (Authentication as a Service)
- **Frontend Framework**: React 19 with React Router 7
- **Backend Framework**: Hono (Edge-optimized web framework)

## 2. Architectural Pattern Analysis

### 2.1 Primary Pattern: Edge-First Architecture

This is an **Edge-First Architecture** that combines:

1. **JAMstack Principles**
   - JavaScript (React) running on the client
   - APIs provided by serverless functions (Cloudflare Workers + Convex)
   - Markup served from edge locations (Cloudflare Pages)

2. **Serverless Edge Computing**
   - Application logic runs on Cloudflare Workers (distributed globally)
   - No traditional backend servers
   - Stateless request handling

3. **Backend-as-a-Service (BaaS)**
   - Database: Convex (real-time database)
   - Authentication: Clerk (user management)
   - Both accessed via API

4. **Real-Time Data Layer**
   - Convex provides reactive subscriptions
   - Automatic UI updates on data changes
   - WebSocket connections for live sync

### 2.2 Why This Pattern?

**Strengths for This Use Case**:
- Global edge deployment = low latency worldwide
- Real-time updates without custom WebSocket infrastructure
- Minimal operational overhead (fully managed services)
- Type-safe end-to-end with TypeScript
- Pay-per-use pricing model (scales to zero)

**Trade-offs**:
- Vendor dependencies (Cloudflare, Convex, Clerk)
- Limited control over infrastructure
- Cold start considerations for edge functions
- Less suitable for CPU-intensive operations

## 3. System Components

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 19 Application (Browser)                          │  │
│  │  - React Router 7 (Routing, SSR)                         │  │
│  │  - TailwindCSS + ShadCN UI (Styling)                     │  │
│  │  - Convex React Client (Real-time subscriptions)         │  │
│  │  - Clerk React Components (Auth UI)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE COMPUTE LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cloudflare Workers (Global Edge Network)                │  │
│  │  - Hono Web Framework (API routes, SSR handler)          │  │
│  │  - React Router SSR (Server-side rendering)              │  │
│  │  - CORS handling                                          │  │
│  │  - Environment variables & secrets                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │  Clerk Auth Service │  │  Convex Database Service        │  │
│  │  - User management  │  │  - Real-time database           │  │
│  │  - JWT issuance     │  │  - Query/Mutation functions     │  │
│  │  - Session handling │  │  - Schema management            │  │
│  │  - Webhooks         │  │  - WebSocket subscriptions      │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Breakdown

#### 3.2.1 Frontend Layer (`/app`)

**Responsibility**: User interface and client-side logic

**Technology Stack**:
- React 19 (UI framework)
- React Router 7 (routing, SSR, file-based routing)
- TailwindCSS 4 (styling)
- ShadCN UI (component library)
- TypeScript (type safety)

**Key Patterns**:
- File-based routing (`/app/routes/`)
- Protected routes via `_auth.tsx` layout
- Real-time data hooks from Convex
- Role-based UI rendering

**Data Flow**:
```
User Interaction
  → React Component
  → Convex Hook (useQuery/useMutation)
  → WebSocket to Convex
  → Real-time UI Update
```

#### 3.2.2 Edge Compute Layer (`/workers`)

**Responsibility**: Server-side rendering, API endpoints, edge logic

**Technology Stack**:
- Cloudflare Workers (serverless edge runtime)
- Hono (web framework)
- React Router SSR integration

**Key Functions**:
- SSR for initial page loads
- API route handling (`/api/*`)
- CORS configuration
- Environment variable injection

**Deployment Characteristics**:
- Deployed to 300+ edge locations globally
- V8 isolates (faster than containers)
- ~125ms CPU time limit per request
- ~50ms cold start typical

#### 3.2.3 Database Layer (Convex)

**Responsibility**: Data persistence, real-time sync, business logic

**Technology Stack**:
- Convex (real-time database platform)
- TypeScript functions
- Generated type-safe client

**Architecture**:
```
/convex/
  schema.ts              # Database schema definitions
  auth.ts                # Authentication helpers
  users.ts               # User management functions
  todos.ts               # Todo CRUD operations
  http.ts                # HTTP endpoints (webhooks)
  _generated/            # Auto-generated types
```

**Data Access Patterns**:
- **Queries**: Real-time reactive reads (auto-subscribe)
- **Mutations**: Write operations with optimistic updates
- **Actions**: External API calls, non-transactional operations
- **HTTP Actions**: Webhook handlers

**Indexes**:
- `users.by_email`: Fast user lookup by email
- `users.by_clerkId`: Clerk ID → Convex user mapping
- `todos.by_user`: User's todos (chronological)
- `todos.by_user_completed`: Filter by completion status

#### 3.2.4 Authentication Layer (Clerk)

**Responsibility**: User authentication, session management, user metadata

**Integration Pattern**:
```
User Login
  → Clerk Hosted UI
  → JWT Token Issued
  → Token Passed to Convex via ConvexProviderWithAuth
  → Convex Validates JWT (Clerk's public key)
  → User Identity Available in ctx.auth.getUserIdentity()
```

**User Sync Flow**:
1. User signs in with Clerk
2. JWT contains user claims (id, email, name, roles)
3. Client calls `syncUser` mutation on Convex
4. User created/updated in Convex database
5. Roles stored in both Clerk metadata and Convex

**Security Model**:
- Clerk manages passwords/credentials
- JWT tokens for authentication
- HTTPS-only communication
- Token expiration and refresh
- Role-based access control (RBAC)

## 4. Data Architecture

### 4.1 Database Schema (Convex)

#### Users Table
```typescript
users: {
  _id: Id<"users">,           // Convex internal ID
  clerkId: string,             // Clerk user ID (unique)
  email: string,
  name?: string,
  imageUrl?: string,
  roles?: string[],            // ["user", "admin", "superadmin"]
  createdAt: number,           // Unix timestamp
  updatedAt: number
}
```

#### Todos Table
```typescript
todos: {
  _id: Id<"todos">,
  userId: Id<"users">,         // Foreign key to users
  text: string,
  completed: boolean,
  createdAt: number
}
```

### 4.2 Data Flow Patterns

**Create Todo Example**:
```
1. User clicks "Add Todo" button
2. React component calls useMutation(api.todos.create)
3. Mutation sent to Convex via WebSocket
4. Convex function validates auth, inserts record
5. All subscribed clients receive update
6. React re-renders automatically
```

**Real-Time Subscription**:
```typescript
// Component automatically re-renders when data changes
const todos = useQuery(api.todos.list);
```

### 4.3 Consistency Model

**Consistency Guarantees**:
- Convex provides **ACID transactions** within single mutation
- **Serializable isolation** level
- **Strong consistency** for reads within same session
- **Eventual consistency** across global regions (multi-region setup)

**Conflict Resolution**:
- Last-write-wins for concurrent updates
- Optimistic UI updates with automatic rollback on failure

## 5. API Design

### 5.1 Convex API Pattern

**Queries** (Read Operations):
```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("todos")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
  }
});
```

**Mutations** (Write Operations):
```typescript
export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const user = await requireAuth(ctx);
    return await ctx.db.insert("todos", {
      userId: user._id,
      text,
      completed: false,
      createdAt: Date.now()
    });
  }
});
```

### 5.2 REST API (Cloudflare Workers)

**Health Check**:
```
GET /api/health
Response: { "status": "ok" }
```

**All other routes**: Handled by React Router SSR

### 5.3 API Versioning Strategy

**Current Approach**: No versioning (early stage)

**Future Strategy** (when needed):
- Convex: Deploy new functions with version suffix (`getUserV2`)
- REST: URL-based versioning (`/api/v2/...`)
- Maintain backward compatibility for 6-12 months

## 6. Security Architecture

### 6.1 Authentication Flow

```
┌────────┐                 ┌───────────┐              ┌──────────┐
│ Client │────Sign In─────→│   Clerk   │              │  Convex  │
│        │←───JWT Token────│           │              │          │
│        │                 └───────────┘              │          │
│        │                                            │          │
│        │────API Call (JWT in header)──────────────→│          │
│        │                                            │          │
│        │                                            │ Verify   │
│        │                                            │ JWT w/   │
│        │                                            │ Public   │
│        │                                            │ Key      │
│        │                                            │          │
│        │←────Authenticated Response─────────────────│          │
└────────┘                                            └──────────┘
```

### 6.2 Authorization Model

**Three-Tier Role System**:

1. **User** (Default)
   - Access own todos
   - CRUD operations on own data
   - View own profile

2. **Admin**
   - All user permissions
   - View all users
   - View system statistics
   - Access admin dashboard
   - View all todos (read-only)

3. **Superadmin**
   - All admin permissions
   - Manage user roles
   - Delete users
   - System configuration
   - Full CRUD on all data

**Permission Enforcement**:
- **Client-side**: UI rendering, route guards (UX only)
- **Server-side**: Convex functions validate permissions (security boundary)

**Example Authorization Check**:
```typescript
// In Convex function
const currentUser = await requireAuth(ctx);
if (!currentUser.roles?.includes("admin")) {
  throw new ConvexError("Unauthorized: Admin access required");
}
```

### 6.3 Data Security

**Encryption**:
- In Transit: HTTPS/TLS 1.3 (enforced by Cloudflare)
- At Rest: Managed by Convex (encrypted storage)

**Secrets Management**:
- Development: `.env` file (gitignored)
- Production: Cloudflare Workers secrets (`wrangler secret put`)
- Convex: Environment variables in Convex dashboard

**Input Validation**:
- Client-side: React Hook Form + Zod schemas
- Server-side: Convex validators (`v.string()`, `v.number()`, etc.)

### 6.4 Security Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **JWT token theft** | High | Short expiration (1 hour), HTTPS-only, HttpOnly cookies |
| **XSS attacks** | High | React auto-escaping, CSP headers, no `dangerouslySetInnerHTML` |
| **CSRF** | Medium | SameSite cookies, Clerk CSRF protection |
| **Role escalation** | High | Server-side role validation in Convex, roles in JWT claims |
| **Data leakage** | High | Query-level auth checks, no direct DB access from client |
| **DDoS** | Medium | Cloudflare DDoS protection, rate limiting |

## 7. Deployment Architecture

### 7.1 Environments

| Environment | Purpose | URL | Database | Auth |
|-------------|---------|-----|----------|------|
| **Development** | Local dev | `localhost:5173` | Convex Dev | Clerk Dev |
| **Staging** | Pre-production testing | `template-app-staging.pages.dev` | Convex Prod* | Clerk Prod |
| **Production** | Live users | `template-app-prod.pages.dev` | Convex Prod | Clerk Prod |

*Note: Staging and production share same Convex deployment (consider separate for true isolation)

### 7.2 Deployment Flow

```
Developer Push to Git
  ↓
GitHub Actions (CI/CD)
  ↓
Bun Check (Type checking, linting)
  ↓
React Router Build (SSR + Client bundles)
  ↓
Wrangler Deploy → Cloudflare Workers
  ↓
Convex Deploy (if schema/functions changed)
  ↓
Live on Edge Network (300+ locations)
```

**Build Commands**:
```bash
bun check                # Type & lint check
bun build               # Build for dev
bun build:staging       # Build for staging
bun build:prod          # Build for production
bun deploy:prod         # Build + deploy to production
```

### 7.3 Infrastructure Components

**Cloudflare Workers**:
- Platform: Cloudflare Workers (V8 isolates)
- Regions: Global edge network (300+ locations)
- Scaling: Auto-scales, no configuration needed
- Pricing: $5/month + $0.50 per million requests

**Cloudflare Pages** (Static Assets):
- Serves React build artifacts
- CDN-cached globally
- Free tier available

**Convex**:
- Hosted database service
- Region: Automatically selected (typically US or EU)
- Scaling: Automatic
- Pricing: Free tier → $25/month → usage-based

**Clerk**:
- Authentication SaaS
- Pricing: Free (10,000 MAU) → $25/month → usage-based

### 7.4 Observability

**Logging**:
- Cloudflare Workers: `wrangler tail` for real-time logs
- Convex: Dashboard logs and function execution traces
- Client: Browser console, error boundaries

**Monitoring**:
- Cloudflare Analytics: Request volume, latency, errors
- Convex Dashboard: Function performance, database size
- Clerk Dashboard: Auth events, user signups

**Alerting**:
- Cloudflare: Email alerts on high error rates
- Convex: No built-in alerting (manual monitoring)
- Clerk: Email alerts on suspicious auth activity

**Missing** (Future Improvements):
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Custom business metrics
- Distributed tracing

## 8. Scalability Strategy

### 8.1 Current Scale Characteristics

**Request Handling**:
- Edge Workers: Unlimited horizontal scale (global distribution)
- Convex: ~1000 queries/second per project (varies by plan)
- Clerk: 10,000 MAU on free tier → unlimited on paid

**Data Volume**:
- Convex: Free tier = 1GB storage, 1GB bandwidth/month
- Production tier: 8GB storage included, then usage-based

### 8.2 Scaling Limits & Bottlenecks

| Component | Scaling Limit | Bottleneck When? |
|-----------|---------------|------------------|
| **Cloudflare Workers** | ~1M req/sec | Rarely (global distribution) |
| **Convex Queries** | ~1000/sec | High read traffic on single dataset |
| **Convex Mutations** | ~100/sec | High write traffic |
| **Convex Storage** | 1GB (free) → 8GB → ∞ | Database grows beyond tier |
| **WebSocket Connections** | ~10,000 concurrent | Many real-time users |
| **Clerk MAU** | 10,000 (free) | User base grows |

### 8.3 Scaling Strategy

**Phase 1: 0-10,000 Users** (Current)
- Current architecture sufficient
- Free/low-cost tiers
- No infrastructure changes needed

**Phase 2: 10,000-100,000 Users**
- Upgrade Convex to production tier
- Implement caching layer (Cloudflare KV or R2)
- Add read replicas if needed (Convex roadmap feature)
- Enable Cloudflare rate limiting

**Phase 3: 100,000+ Users**
- Consider multi-region Convex deployment
- Implement data sharding if single DB bottleneck
- CDN for static assets (already done via Cloudflare)
- Evaluate database migration if Convex becomes constraint

**Horizontal Scaling**:
- Workers: Automatic (edge network)
- Frontend: Automatic (CDN distribution)
- Database: Limited (managed service, vertical scaling only)

**Vertical Scaling**:
- Not applicable for workers (stateless)
- Convex: Automatic within tier, upgrade tier for more capacity

### 8.4 Caching Strategy

**Current Implementation**:
- Browser caching: React Router handles
- CDN caching: Cloudflare Pages for static assets
- No application-level caching

**Future Caching Layers**:
1. **Edge KV Store** (Cloudflare KV)
   - Cache frequently accessed data
   - User sessions, feature flags
   - Low-latency global reads

2. **Client-side Caching**
   - React Query for API responses
   - Convex client caches subscriptions

3. **Database Materialized Views**
   - Pre-computed aggregations in Convex

## 9. Technology Stack

See: `/home/roboto/devel/cf-react-router-convex-clerk-template/ai_docs/architecture/technology-stack.md`

**Summary**:
- **Frontend**: React 19, React Router 7, TypeScript, TailwindCSS, ShadCN
- **Backend**: Cloudflare Workers, Hono, Convex
- **Database**: Convex (NoSQL with relational features)
- **Auth**: Clerk
- **Tooling**: Bun, Biome, Wrangler

## 10. Constraints and Trade-offs

### 10.1 Architectural Constraints

**Hard Constraints**:
1. **Cloudflare Workers CPU Limit**: 50ms-125ms per request
   - Cannot run long computations
   - Must offload to async jobs or external services

2. **Convex Function Timeout**: 60 seconds max
   - Cannot run long-running batch jobs
   - Use actions for longer operations

3. **Stateless Edge Functions**
   - No in-memory state across requests
   - Must use external storage (KV, R2, Convex)

4. **Vendor Lock-in**
   - Tightly coupled to Cloudflare, Convex, Clerk
   - Migration cost would be high

**Soft Constraints**:
1. **TypeScript Strict Mode**
   - No `any` types allowed
   - Higher development rigor

2. **File-based Routing**
   - React Router 7 convention
   - Route structure mirrors file structure

### 10.2 Key Trade-offs Made

#### Trade-off 1: Managed Services vs. Self-Hosted

**Decision**: Use managed services (Convex, Clerk)

**Pros**:
- Zero ops burden (no servers to manage)
- Built-in scaling and reliability
- Faster time-to-market
- Automatic backups and security patches

**Cons**:
- Higher cost at scale
- Less control and customization
- Vendor lock-in risk
- External dependency failures

**Rationale**: For early-stage product, velocity and reliability outweigh control. Can migrate later if needed.

#### Trade-off 2: Real-Time Database vs. Traditional DB

**Decision**: Use Convex (real-time database)

**Pros**:
- Automatic WebSocket subscriptions
- No manual cache invalidation
- Type-safe queries
- Schema migrations handled

**Cons**:
- Less mature than PostgreSQL/MySQL
- Smaller community and ecosystem
- No SQL (learning curve)
- Migration complexity if we outgrow it

**Rationale**: Real-time features are core UX differentiator. Convex provides this out-of-box.

#### Trade-off 3: Edge-First vs. Regional Deployment

**Decision**: Deploy to Cloudflare Workers (edge)

**Pros**:
- Low latency globally (~50ms vs. ~200ms regional)
- DDoS protection included
- Auto-scaling without config
- Pay-per-use pricing

**Cons**:
- Limited runtime capabilities (no Node.js APIs)
- Cold start latency (~50ms)
- Debugging complexity (distributed system)
- Cannot run CPU-intensive tasks

**Rationale**: Application is I/O bound, not CPU bound. Edge deployment provides best UX globally.

#### Trade-off 4: SSR vs. Pure SPA

**Decision**: React Router 7 with SSR

**Pros**:
- Better SEO (server-rendered HTML)
- Faster initial page load
- Progressive enhancement
- Better Core Web Vitals

**Cons**:
- More complex deployment (need edge runtime)
- Hydration complexity
- Higher infrastructure cost
- Slower development iteration

**Rationale**: SEO and performance are critical for growth. SSR worth the complexity.

#### Trade-off 5: Strict TypeScript vs. Lenient

**Decision**: Strict mode with NO `any` types

**Pros**:
- Catch bugs at compile time
- Better IDE autocomplete
- Safer refactoring
- Self-documenting code

**Cons**:
- Slower initial development
- Steeper learning curve
- More boilerplate for types
- Harder to integrate untyped libraries

**Rationale**: Long-term code quality and maintainability worth short-term friction.

## 11. Architecture Decision Records (ADRs)

See: `/home/roboto/devel/cf-react-router-convex-clerk-template/ai_docs/architecture/adrs/`

**Key Decisions**:
- **ADR-001**: Edge-First Architecture with Cloudflare Workers
- **ADR-002**: Convex as Real-Time Database
- **ADR-003**: Clerk for Authentication
- **ADR-004**: React Router 7 for Frontend Framework
- **ADR-005**: Hono as Backend Web Framework

## 12. Risks and Mitigation Strategies

### Critical Risks

#### Risk 1: Vendor Lock-In

**Likelihood**: High
**Impact**: High

**Description**: Heavy dependency on Convex and Clerk. Migration would require significant rewrite.

**Mitigation**:
- Abstract database access behind repository pattern
- Use standard JWT claims (portable across auth providers)
- Document migration paths in architecture docs
- Build with data export capabilities from day one

#### Risk 2: Convex Scaling Limits

**Likelihood**: Medium
**Impact**: High

**Description**: Convex may not scale to millions of users or handle write-heavy workloads.

**Mitigation**:
- Monitor Convex metrics closely (requests/sec, latency)
- Design with eventual migration in mind (use abstraction layer)
- Consider read replicas when available
- Have contingency plan for PostgreSQL migration

#### Risk 3: Cold Start Latency

**Likelihood**: Medium
**Impact**: Medium

**Description**: Cloudflare Workers cold starts can add 50-200ms latency.

**Mitigation**:
- Keep worker code bundle small (<1MB)
- Use lazy loading for dependencies
- Implement warming strategy for critical routes
- Set up monitoring for P95/P99 latency

#### Risk 4: Cost Explosion at Scale

**Likelihood**: Medium
**Impact**: Medium

**Description**: Per-request pricing can become expensive at high traffic.

**Mitigation**:
- Implement aggressive caching strategy
- Set up cost alerts in Cloudflare dashboard
- Optimize query efficiency to reduce Convex costs
- Consider reserved capacity when available

#### Risk 5: Third-Party Service Outages

**Likelihood**: Low
**Impact**: High

**Description**: Clerk or Convex downtime = full application downtime.

**Mitigation**:
- Monitor third-party status pages
- Implement graceful degradation where possible
- Communicate SLAs to users
- Consider multi-provider strategy for critical paths

### Medium Risks

#### Risk 6: No Multi-Region Database

**Description**: Convex likely single-region, adds latency for global users.

**Mitigation**:
- Choose region closest to majority users
- Use edge workers to minimize server roundtrips
- Implement optimistic UI updates
- Cache frequently accessed data at edge

#### Risk 7: Limited Database Querying

**Description**: Convex not as flexible as SQL for complex queries.

**Mitigation**:
- Design schema with query patterns in mind
- Use indexes effectively
- Pre-compute aggregations in mutations
- Consider denormalization for read performance

## 13. Future Considerations

### Short-Term (0-6 months)

1. **Error Tracking**
   - Integrate Sentry or similar
   - Track frontend and backend errors
   - Set up alerting for critical errors

2. **Performance Monitoring**
   - Add Web Vitals tracking
   - Monitor Convex function performance
   - Set up dashboards for key metrics

3. **Rate Limiting**
   - Implement per-user rate limits
   - Protect against abuse
   - Use Cloudflare Rate Limiting

4. **Testing Strategy**
   - Unit tests for critical paths
   - Integration tests for Convex functions
   - E2E tests for user flows

### Medium-Term (6-12 months)

1. **Caching Layer**
   - Implement Cloudflare KV for edge caching
   - Cache user sessions and feature flags
   - Reduce Convex query load

2. **Background Jobs**
   - Use Cloudflare Queues for async processing
   - Email sending, data exports, batch operations
   - Offload long-running tasks

3. **Multi-Tenancy**
   - Add organization/workspace concept
   - Team collaboration features
   - Tenant isolation at database level

4. **API Versioning**
   - Implement versioned API endpoints
   - Plan migration strategy for breaking changes
   - Maintain backward compatibility

### Long-Term (12+ months)

1. **Database Sharding**
   - If Convex becomes bottleneck
   - Shard by user ID or tenant
   - Consider multi-region setup

2. **Microservices Extraction**
   - Extract heavy features to separate services
   - Use Cloudflare Workers + Durable Objects
   - Keep core monolith for simplicity

3. **Advanced Real-Time Features**
   - Collaborative editing
   - Live cursors and presence
   - Conflict-free replicated data types (CRDTs)

4. **Migration Path**
   - Document migration from Convex → PostgreSQL
   - Plan for gradual database transition
   - Abstract database layer further

## 14. Operational Considerations

### Deployment Process

**Current**:
- Manual deployment via `bun deploy:prod`
- No automated CI/CD
- No blue/green or canary deployments

**Recommended**:
- Set up GitHub Actions for CI/CD
- Automated testing before deploy
- Staging environment for validation
- Rollback strategy

### Monitoring & Alerting

**Current**:
- Manual log tailing (`wrangler tail`)
- Cloudflare basic analytics
- No custom metrics

**Recommended**:
- Set up error rate alerts
- Monitor latency P95/P99
- Track business metrics (signups, active users)
- Database size and query performance

### Backup & Disaster Recovery

**Current**:
- Convex handles backups automatically
- No manual backup process
- No documented recovery procedure

**Recommended**:
- Regular data exports from Convex
- Test restoration process
- Document disaster recovery runbook
- RTO/RPO definitions

### Team Expertise Requirements

**Required Skills**:
- TypeScript (advanced level)
- React (modern features, hooks, SSR)
- Serverless/edge computing concepts
- Real-time data synchronization
- Authentication/authorization patterns

**Learning Curve**:
- Convex: Medium (new paradigm vs. SQL)
- Cloudflare Workers: Medium (edge constraints)
- React Router 7: Low (if familiar with React Router)
- Clerk: Low (well-documented)

## 15. Conclusion

This architecture represents a modern, edge-first approach optimized for:

- **Global low-latency**: Edge deployment + real-time sync
- **Developer velocity**: Managed services, strong typing, hot reload
- **Scalability**: Serverless auto-scaling, pay-per-use
- **Real-time UX**: WebSocket subscriptions, optimistic updates

**Best suited for**:
- SaaS applications with global users
- Real-time collaborative tools
- Rapid prototyping and iteration
- Small to medium teams (1-10 engineers)

**Not ideal for**:
- CPU-intensive computations
- Complex SQL analytics
- High compliance environments (HIPAA, PCI-DSS requiring on-prem)
- Organizations requiring full infrastructure control

**Overall Assessment**: Solid architecture for modern web applications prioritizing speed, simplicity, and user experience. The trade-offs favor velocity and UX over control and customization, which is appropriate for early-stage products.

---

**Document Maintenance**:
- Review quarterly or on major architectural changes
- Update ADRs when significant decisions are made
- Keep technology stack section in sync with `package.json`
