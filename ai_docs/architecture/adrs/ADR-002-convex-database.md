# ADR-002: Convex as Real-Time Database

**Status**: Accepted
**Date**: 2025-10-23
**Deciders**: Engineering Team
**Technical Story**: Database and data layer selection

## Context

We need a database solution that can:
- Support real-time data synchronization for live updates
- Provide strong consistency guarantees
- Work seamlessly with edge-first architecture (Cloudflare Workers)
- Offer type-safe queries with TypeScript
- Scale automatically without manual configuration
- Minimize operational overhead
- Support both simple CRUD and complex queries

### Requirements

**Functional Requirements**:
- Real-time subscriptions (live UI updates)
- ACID transactions
- Complex queries with indexes
- Full-text search (future)
- User-owned data model (multi-tenancy)

**Non-Functional Requirements**:
- <100ms query latency (P95)
- 99.9% availability
- Automatic backups
- Zero-downtime migrations
- Type safety end-to-end

**Team Constraints**:
- Small team (1-3 engineers)
- Limited database administration experience
- Need to move fast (startup velocity)
- Minimal ops burden

## Decision

We will use **Convex** as our primary database and data layer.

## Rationale

### Core Value Propositions

**1. Real-Time Subscriptions Built-In**:
```typescript
// One line of code for live updates
const todos = useQuery(api.todos.list);
// UI automatically re-renders when data changes
```

Traditional databases require custom WebSocket infrastructure, cache invalidation, and event systems. Convex provides this out-of-box.

**2. End-to-End Type Safety**:
```typescript
// Schema definition generates TypeScript types
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { api } from "../convex/_generated/api";
```

No manual type definitions. Schema changes automatically propagate to client code.

**3. Zero Ops Burden**:
- No server provisioning
- Automatic scaling
- Managed backups
- No migration scripts to write
- No index optimization tuning

**4. Serverless-First Design**:
- Built for serverless environments
- No connection pooling needed
- Works with edge functions
- HTTP-based queries (REST/WebSocket)

**5. Strong Consistency with ACID**:
- Serializable isolation level
- Transactional mutations
- No eventual consistency gotchas
- Predictable behavior

**6. Developer Experience**:
- TypeScript-first
- Excellent error messages
- Dashboard for data inspection
- Time-travel debugging
- Function performance metrics

### Comparison to Alternatives

| Feature | Convex | PostgreSQL | Firebase | Supabase |
|---------|--------|------------|----------|----------|
| **Real-time** | Built-in | Need custom | Built-in | Built-in |
| **Type Safety** | Generated | Manual types | Weak | Generated |
| **ACID** | ✅ Full | ✅ Full | ❌ Limited | ✅ Full |
| **Schema Migrations** | Automatic | Manual SQL | No schema | Manual SQL |
| **Ops Burden** | Zero | High | Low | Medium |
| **Query Language** | TypeScript | SQL | NoSQL | SQL |
| **Edge Compatible** | ✅ Yes | ⚠️ Needs proxy | ✅ Yes | ⚠️ Needs proxy |
| **Cost at Small Scale** | Free tier | $20-50/mo | Free tier | Free tier |
| **Maturity** | New (2021) | Mature (1996) | Mature (2011) | Medium (2020) |

## Consequences

### Positive Consequences

**Velocity Multiplier**:
- No cache invalidation logic needed
- No WebSocket infrastructure to build
- No database migrations to write
- Faster feature development

**Reduced Complexity**:
- One fewer system to manage
- No Redis/cache layer initially needed
- No database schema migration strategy
- No connection pool management

**Better User Experience**:
- Instant UI updates (optimistic + real-time)
- Collaborative features easier to build
- Consistent state across tabs/devices
- Offline support (future roadmap)

**Type Safety Benefits**:
- Catch errors at compile time
- Better autocomplete in IDE
- Safer refactoring
- Living documentation (types = schema)

**Cost-Effective at Small Scale**:
- Free tier: 1GB storage, 1GB bandwidth/month
- No minimum monthly fee
- Only pay for what you use

### Negative Consequences

**Vendor Lock-In (Critical Risk)**:
- Proprietary query language (TypeScript functions, not SQL)
- Migration to another database requires full rewrite
- Cannot export and run locally
- Dependent on Convex's business continuity

**Ecosystem Immaturity**:
- Smaller community vs. PostgreSQL/MySQL
- Fewer learning resources
- Limited third-party integrations
- Newer platform (potential stability issues)

**Query Limitations**:
- Not as powerful as SQL for complex joins
- Limited aggregation functions
- No native full-text search yet
- Cannot run arbitrary SQL

**Scaling Uncertainty**:
- Unclear how it scales to millions of users
- Write throughput limits unclear (~100 writes/sec documented)
- No public performance benchmarks at scale
- Regional deployment (not multi-region yet)

**Cost at High Scale**:
- Usage-based pricing can be unpredictable
- $25/month for 8GB storage (vs. $10-15 for equivalent PostgreSQL)
- Bandwidth costs for large datasets
- No reserved capacity pricing

**Migration Complexity**:
- If we outgrow Convex, migration is expensive
- Need to rewrite all queries and mutations
- Real-time functionality would need rebuilding
- Significant development effort

**Database Feature Gaps**:
- No stored procedures
- Limited analytical queries
- No database views
- No triggers (use Convex reactivity instead)

## Mitigation Strategies

### For Vendor Lock-In:

**1. Abstraction Layer** (Future):
```typescript
// Abstract database access behind repository pattern
interface TodoRepository {
  list(userId: string): Promise<Todo[]>;
  create(todo: CreateTodoInput): Promise<Todo>;
}

// Convex implementation
class ConvexTodoRepository implements TodoRepository {
  async list(userId: string) {
    return await convex.query(api.todos.list, { userId });
  }
}
```

**2. Data Export Strategy**:
- Weekly automated exports to S3/R2
- Export functions in Convex
- Documented restore procedures
- Test restoration quarterly

**3. Migration Documentation**:
- Document Convex → PostgreSQL migration path
- Estimate effort and timeline
- Identify breaking points early
- Plan for gradual migration if needed

### For Scaling Concerns:

**1. Monitoring**:
- Set up alerts for query latency > 100ms
- Monitor write throughput
- Track database size and growth rate
- Dashboard for key metrics

**2. Optimization Strategy**:
- Add indexes proactively
- Denormalize data when beneficial
- Pre-compute aggregations
- Implement caching layer if needed

**3. Sharding Plan** (Future):
- Shard by user ID if single DB bottleneck
- Use multiple Convex projects if needed
- Document sharding strategy

### For Cost Management:

**1. Cost Monitoring**:
- Set up billing alerts
- Track cost per user
- Optimize query efficiency
- Cache frequently accessed data

**2. Cost Optimization**:
- Implement pagination
- Reduce unnecessary queries
- Use indexes effectively
- Cache static data at edge (KV)

### For Query Limitations:

**1. Denormalization**:
- Duplicate data for read performance
- Pre-compute aggregations in mutations
- Accept some data redundancy

**2. Read Replicas** (When Available):
- Separate read and write workloads
- Offload analytics to replica
- Reduce load on primary

**3. External Analytics**:
- Export data to data warehouse (BigQuery/Snowflake)
- Run complex analytics externally
- Keep Convex for operational data only

## Validation

### Success Criteria

**Performance**:
- P95 query latency < 100ms
- Real-time update latency < 500ms
- 99.9% availability

**Scalability**:
- Support 10,000 concurrent users
- Handle 1,000 writes/second
- 100GB database size

**Developer Experience**:
- New features ship 2x faster vs. traditional DB
- Zero database-related incidents in first 6 months
- Team satisfaction with DX

### Failure Conditions (Triggers for Re-evaluation)

- Query latency consistently > 200ms (P95)
- Cost exceeds $500/month for <100k users
- Hit documented scaling limits
- Missing critical database features blocking development
- Convex business stability concerns

## Alternatives Considered

### 1. PostgreSQL (Neon/PlanetScale)

**Pros**:
- SQL is well-known
- Mature ecosystem
- Powerful querying
- Better for analytics
- More control

**Cons**:
- No real-time subscriptions built-in
- Need to build WebSocket layer
- Manual migrations
- Connection pooling complexity with edge
- Higher ops burden

**Why Rejected**: Real-time is core to UX. Building custom WebSocket infrastructure is time-consuming and error-prone.

### 2. Firebase Firestore

**Pros**:
- Real-time subscriptions
- Good mobile SDKs
- Mature platform
- Generous free tier

**Cons**:
- Weak TypeScript support
- NoSQL limitations
- Google ecosystem lock-in
- Limited querying capabilities
- Eventual consistency issues

**Why Rejected**: Weaker type safety, eventual consistency gotchas, Google dependency.

### 3. Supabase

**Pros**:
- PostgreSQL under the hood (familiar SQL)
- Real-time subscriptions (via PostgREST)
- Good TypeScript support (generated)
- Open source (self-hostable)

**Cons**:
- Connection pooling complexity with edge
- Real-time layer less mature than Convex
- More complex setup
- Manual migration management

**Why Rejected**: Edge compatibility concerns, real-time is add-on (not core design).

### 4. DynamoDB

**Pros**:
- Massive scale capabilities
- AWS ecosystem
- Predictable performance

**Cons**:
- No real-time (would need DynamoDB Streams + Lambda)
- Weak consistency model
- Complex query patterns
- Expensive at small scale
- Poor developer experience

**Why Rejected**: Overkill for current scale, poor DX, no real-time.

### 5. MongoDB Atlas

**Pros**:
- Flexible schema
- Good for rapid iteration
- Change streams for real-time
- Mature platform

**Cons**:
- Manual type definitions
- Need to build real-time layer on top
- Connection pooling for edge
- Eventually consistent reads
- More expensive

**Why Rejected**: No built-in real-time, weaker type safety.

## Migration Path (If Needed)

If we need to migrate away from Convex:

**Phase 1: Preparation** (1-2 months)
1. Implement repository pattern abstraction
2. Export all data to PostgreSQL
3. Set up dual-write (Convex + PostgreSQL)
4. Validate data consistency

**Phase 2: Read Migration** (1 month)
5. Migrate read queries to PostgreSQL
6. Implement caching layer
7. Build real-time layer (WebSockets or polling)
8. Test thoroughly

**Phase 3: Write Migration** (1 month)
9. Migrate write operations to PostgreSQL
10. Stop dual-write
11. Decommission Convex
12. Migrate remaining dependencies

**Estimated Effort**: 3-4 months, 2 engineers
**Estimated Cost**: $50,000 - $100,000 in engineering time
**Risk**: High (potential for data loss, downtime)

## Related Decisions

- **ADR-001**: Edge-First Architecture (Convex works well with edge)
- **ADR-003**: Clerk for Authentication (integrates with Convex JWT auth)

## References

- [Convex Documentation](https://docs.convex.dev)
- [Convex vs Firebase](https://www.convex.dev/compare/firebase)
- [Convex vs Supabase](https://www.convex.dev/compare/supabase)
- [Convex Pricing](https://www.convex.dev/pricing)
- [Convex Production Checklist](https://docs.convex.dev/production/best-practices)

## Review Schedule

- **Quarterly Review**: Assess scaling, cost, and feature gaps
- **Annual Re-evaluation**: Consider alternatives if significant issues
- **Trigger Events**:
  - Reaching 100k MAU
  - Monthly cost > $500
  - Critical feature gap emerges
  - Convex business concerns

---

**Last Updated**: 2025-10-23
**Next Review**: 2026-01-23 (Quarterly)
**Risk Level**: Medium-High (due to vendor lock-in)
**Mitigation Priority**: High (implement abstraction layer in 6 months)
