# Architecture Documentation

Welcome to the comprehensive architecture documentation for this application. This documentation provides a complete view of the system architecture, design decisions, and patterns used throughout the codebase.

## Documentation Structure

This architecture documentation is organized into the following sections:

### Core Documents

1. **[Architecture Specification](./specification.md)** - The primary architecture document
   - System overview and architectural pattern
   - Component breakdown
   - Data architecture
   - API design
   - Security architecture
   - Deployment architecture
   - Scalability strategy
   - Constraints and trade-offs
   - Risks and mitigation

2. **[Technology Stack](./technology-stack.md)** - Complete technology breakdown
   - Frontend framework & UI
   - Backend & edge computing
   - Database & data layer
   - Authentication & authorization
   - Development tools & build system
   - Styling & design system
   - Technology decision matrix
   - Version update strategy

3. **[Patterns](./patterns.md)** - Architectural patterns and best practices
   - Code organization patterns
   - Data access patterns
   - Authentication & authorization patterns
   - Error handling patterns
   - Performance patterns
   - Security patterns
   - Testing patterns
   - Anti-patterns to avoid

### Architecture Decision Records (ADRs)

Located in `/adrs/`, these documents capture significant architectural decisions:

- **[ADR-001: Edge-First Architecture](./adrs/ADR-001-edge-first-architecture.md)**
  - Why Cloudflare Workers for compute
  - Trade-offs of edge deployment
  - Alternatives considered

- **[ADR-002: Convex as Real-Time Database](./adrs/ADR-002-convex-database.md)**
  - Why Convex for data layer
  - Real-time capabilities
  - Vendor lock-in considerations
  - Migration path

- **[ADR-003: Clerk for Authentication](./adrs/ADR-003-clerk-authentication.md)**
  - Why Clerk for auth
  - Integration with Convex
  - Cost considerations
  - Migration strategy

- **[ADR-004: React Router 7](./adrs/ADR-004-react-router-7.md)**
  - Frontend framework choice
  - SSR and file-based routing
  - Comparison to Next.js

- **[ADR-005: Hono Framework](./adrs/ADR-005-hono-framework.md)**
  - Edge web framework selection
  - Integration with React Router
  - Lightweight and performant

### Diagrams

Located in `/diagrams/`, visual representations of the system:

- **[System Overview](./diagrams/system-overview.md)**
  - High-level architecture
  - Component interaction
  - Layer breakdown
  - Technology stack map
  - Deployment topology

- **[Data Flow](./diagrams/data-flow.md)**
  - User authentication flow
  - Todo creation flow
  - Real-time update flow
  - User sync flow
  - Protected route access
  - Role-based authorization

- **[Deployment](./diagrams/deployment.md)**
  - Infrastructure overview
  - Deployment environments
  - Build and deployment pipeline
  - Network architecture
  - Monitoring and observability

- **[Authentication Flow](./diagrams/authentication-flow.md)**
  - Complete authentication flow
  - JWT token flow
  - User sync mechanisms
  - Session management
  - Authorization patterns
  - Security boundaries

## Quick Start Guide

### For New Developers

1. **Start Here**: Read the [Architecture Specification](./specification.md) to understand the overall system
2. **Understand Decisions**: Review the [ADRs](./adrs/) to understand why key technologies were chosen
3. **Learn Patterns**: Study the [Patterns](./patterns.md) document for coding conventions
4. **Visual Overview**: Check the [System Overview Diagram](./diagrams/system-overview.md) for visual representation

### For Architects

1. **Review Decisions**: Start with the [ADRs](./adrs/) to understand the decision-making process
2. **Assess Risks**: Read the risks section in [Specification](./specification.md)
3. **Evaluate Trade-offs**: Understand constraints and trade-offs made
4. **Consider Alternatives**: Review alternatives considered in each ADR

### For Product/Business

1. **Understand Constraints**: Read the constraints section in [Specification](./specification.md)
2. **Cost Implications**: Review scalability and cost sections in [ADRs](./adrs/)
3. **Timeline Impact**: Understand how architecture affects development velocity
4. **Risk Assessment**: Review identified risks and mitigation strategies

## Architectural Overview

### Pattern Classification

This application implements an **Edge-First Architecture** with the following characteristics:

```
Pattern: JAMstack + Edge Computing + BaaS + Real-Time
├─ JAMstack: Static assets + APIs + JavaScript
├─ Edge Computing: Cloudflare Workers (global deployment)
├─ Backend-as-a-Service: Convex (database), Clerk (auth)
└─ Real-Time: WebSocket subscriptions for live updates
```

### Key Architectural Principles

1. **Edge-First**: Deploy computation close to users globally
2. **Serverless**: No servers to manage, auto-scaling
3. **Real-Time**: Live data synchronization built-in
4. **Type-Safe**: End-to-end TypeScript with generated types
5. **Developer Velocity**: Fast iteration, minimal boilerplate

### Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, React Router 7 | UI and routing |
| **Styling** | TailwindCSS 4, ShadCN UI | Design system |
| **Backend** | Cloudflare Workers, Hono | Edge compute |
| **Database** | Convex | Real-time database |
| **Auth** | Clerk | Authentication |
| **Build** | Vite, Bun | Build tools |
| **Quality** | TypeScript, Biome | Type safety, linting |

## Key Architectural Decisions

### 1. Why Edge-First?

**Decision**: Deploy to Cloudflare Workers (300+ global locations)

**Rationale**:
- Low latency worldwide (~50ms vs ~200ms regional)
- Automatic scaling, zero ops
- Pay-per-use pricing
- Built-in DDoS protection

**Trade-off**: Runtime limitations (125ms CPU time, no Node.js APIs)

**See**: [ADR-001](./adrs/ADR-001-edge-first-architecture.md)

### 2. Why Convex?

**Decision**: Use Convex for database and data layer

**Rationale**:
- Real-time subscriptions out-of-box
- Type-safe queries (auto-generated)
- Zero ops burden
- ACID transactions

**Trade-off**: Vendor lock-in, newer platform (less proven at scale)

**See**: [ADR-002](./adrs/ADR-002-convex-database.md)

### 3. Why Clerk?

**Decision**: Use Clerk for authentication

**Rationale**:
- Pre-built UI components
- Seamless Convex integration
- Security handled by experts
- Fast implementation (<1 day)

**Trade-off**: Cost at scale ($0.02/MAU), vendor dependency

**See**: [ADR-003](./adrs/ADR-003-clerk-authentication.md)

## System Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                     User (Global)                           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/WSS
                     ↓
┌─────────────────────────────────────────────────────────────┐
│         Cloudflare Edge Network (300+ locations)            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Workers (Hono + React Router SSR)                    │  │
│  │  Pages (Static Assets)                                │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ API Calls
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
│  ┌──────────────────────┐    ┌─────────────────────────┐   │
│  │  Clerk Auth          │    │  Convex Database        │   │
│  │  - Users             │    │  - Real-time sync       │   │
│  │  - JWT tokens        │    │  - ACID transactions    │   │
│  │  - Sessions          │    │  - Type-safe queries    │   │
│  └──────────────────────┘    └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Key Metrics and Targets

### Performance Targets

- **TTFB** (Time to First Byte): < 200ms (P95)
- **FCP** (First Contentful Paint): < 1s
- **TTI** (Time to Interactive): < 2s
- **Lighthouse Score**: > 90

### Scalability Targets

- **Users**: 0-10k (current), 10k-100k (6-12 months), 100k+ (future)
- **Requests**: ~1M requests/month → 100M requests/month
- **Database**: 1GB → 100GB
- **Availability**: 99.9% (current), 99.95% (future)

### Cost Targets

- **$0-100/month**: 0-10k users
- **$100-500/month**: 10k-50k users
- **$500-2000/month**: 50k-100k users

## Critical Risks

| Risk | Severity | Mitigation | Status |
|------|----------|-----------|--------|
| Vendor Lock-in (Convex) | High | Abstraction layer, data exports | Monitoring |
| Vendor Lock-in (Clerk) | High | User exports, documented migration | Monitoring |
| Cost at Scale | Medium | Cost monitoring, caching strategy | Monitoring |
| Convex Scaling Limits | Medium | Monitor metrics, migration plan | Documented |
| Cold Start Latency | Low | Bundle optimization, monitoring | Acceptable |

## Future Considerations

### Short-Term (0-6 months)

- [ ] Implement error tracking (Sentry)
- [ ] Set up performance monitoring
- [ ] Add rate limiting
- [ ] Implement comprehensive testing
- [ ] Set up CI/CD pipeline

### Medium-Term (6-12 months)

- [ ] Implement caching layer (Cloudflare KV)
- [ ] Add background job processing
- [ ] Separate staging Convex deployment
- [ ] Implement API versioning
- [ ] Add multi-tenancy support

### Long-Term (12+ months)

- [ ] Evaluate database sharding
- [ ] Consider multi-region setup
- [ ] Implement advanced real-time features
- [ ] Build abstraction layer for database
- [ ] Document migration paths

## Contributing to Architecture Docs

When making architectural changes:

1. **Create an ADR** for significant decisions
2. **Update the specification** for structural changes
3. **Update diagrams** if data flow changes
4. **Document trade-offs** honestly
5. **Review with team** before implementation

### ADR Template

See existing ADRs for format. Key sections:
- Context (why decision needed)
- Decision (what was decided)
- Rationale (why this choice)
- Alternatives (what else considered)
- Consequences (positive and negative)

## Maintenance Schedule

- **Quarterly Review**: Assess architecture health, update metrics
- **Annual Re-evaluation**: Consider new technologies, revisit decisions
- **Continuous**: Update as significant changes occur

### Review Checklist

- [ ] Are ADRs up to date?
- [ ] Is specification accurate?
- [ ] Are diagrams reflecting current state?
- [ ] Have new risks emerged?
- [ ] Are mitigation strategies working?
- [ ] Technology stack current?
- [ ] Performance targets being met?

## Related Documentation

- **[Project Documentation](../README.md)**: Overall project docs
- **[Development Guide](../CLAUDE.md)**: Developer onboarding
- **[Convex Setup](../../CONVEX_SETUP.md)**: Database setup guide
- **[Rules](../Rules.md)**: Development rules and conventions

## Glossary

- **ADR**: Architecture Decision Record
- **BaaS**: Backend-as-a-Service
- **CDN**: Content Delivery Network
- **Edge**: Computing close to end users (vs centralized)
- **JAMstack**: JavaScript, APIs, Markup architecture
- **JWT**: JSON Web Token (authentication)
- **MAU**: Monthly Active Users
- **SSR**: Server-Side Rendering
- **TTFB**: Time to First Byte

## Questions?

For questions about the architecture:

1. **Check ADRs**: Decision rationale documented
2. **Review Diagrams**: Visual explanations
3. **Read Patterns**: Implementation guidance
4. **Ask Team**: Architectural discussions welcome

---

**Document Ownership**: Engineering Team
**Last Updated**: 2025-10-23
**Next Review**: 2026-01-23 (Quarterly)

**Version**: 1.0
**Status**: Active
