# ADR-001: Edge-First Architecture with Cloudflare Workers

**Status**: Accepted
**Date**: 2025-10-23
**Deciders**: Engineering Team
**Technical Story**: Foundation architecture decision

## Context

We need to choose a deployment model for our full-stack web application. The application needs to:
- Serve global users with low latency
- Handle both static and dynamic content
- Support server-side rendering for SEO
- Scale automatically without manual configuration
- Minimize operational overhead
- Keep infrastructure costs predictable and low

### Options Considered

1. **Traditional Cloud (AWS EC2 / Google Compute Engine)**
2. **Serverless Regional (AWS Lambda + API Gateway)**
3. **Container Orchestration (Kubernetes on GKE/EKS)**
4. **Serverless Edge (Cloudflare Workers)**
5. **Platform-as-a-Service (Vercel, Netlify)**

## Decision

We will use **Cloudflare Workers** as our primary compute platform with an **edge-first architecture**.

## Rationale

### Why Edge-First?

**Global Latency Requirements**:
- Users are distributed globally
- Edge deployment reduces latency from ~200ms (regional) to ~50ms (edge)
- SSR benefits significantly from edge proximity

**Automatic Scaling**:
- No server provisioning or scaling configuration
- Handles traffic spikes automatically
- Scales to zero (pay-per-use)

**Operational Simplicity**:
- No servers to manage or patch
- No load balancer configuration
- No auto-scaling rules to tune

### Why Cloudflare Workers Specifically?

**Performance**:
- V8 isolates (faster cold starts than containers)
- ~50ms cold start vs. ~500ms+ for Lambda
- Runs in 300+ locations worldwide
- Built-in DDoS protection

**Developer Experience**:
- TypeScript/JavaScript native
- Excellent local development (Wrangler)
- Fast deployment (~30 seconds)
- Great documentation and ecosystem

**Cost Structure**:
- Free tier: 100,000 requests/day
- Paid: $5/month + $0.50 per million requests
- More predictable than Lambda pricing
- No data transfer fees within Cloudflare

**Ecosystem Integration**:
- Cloudflare Pages for static assets
- Cloudflare KV for edge storage (future)
- Cloudflare R2 for object storage (future)
- Cloudflare Queues for background jobs (future)

## Consequences

### Positive

**Low Global Latency**:
- Users experience fast page loads regardless of location
- SSR benefits from edge proximity to CDN

**Simplified Operations**:
- No server management
- Automatic scaling
- Built-in monitoring and logging

**Cost-Effective at Small Scale**:
- Generous free tier
- Pay-per-use pricing
- No minimum costs

**Fast Iteration**:
- Quick deployments
- Instant rollback capability
- Multiple environments easy to manage

### Negative

**Runtime Limitations**:
- 50ms-125ms CPU time limit per request
- Cannot run long computations on edge
- Limited to Web APIs (no Node.js APIs)
- 128MB memory limit

**Vendor Lock-in**:
- Code is portable but deployment is Cloudflare-specific
- Migration to other platforms requires infrastructure changes
- Tight coupling with Cloudflare ecosystem

**Cold Start Latency**:
- Initial requests may see ~50ms overhead
- Affects infrequently accessed routes
- Mitigated by keeping bundle size small

**Debugging Complexity**:
- Distributed system harder to debug
- Cannot attach debugger to production
- Must rely on logging and tracing

**Cost at High Scale**:
- $0.50 per million requests adds up at scale
- Reserved capacity not available (yet)
- May become expensive beyond 100M requests/month

**Limited Database Options**:
- Cannot run database on edge workers
- Must use external database services
- Adds network latency for data access

## Alternatives Considered

### 1. AWS Lambda (Regional Serverless)

**Pros**:
- Mature ecosystem
- More flexible runtime (15 min timeout)
- Can run heavier workloads
- Better database integration (RDS Proxy)

**Cons**:
- Regional deployment (higher latency globally)
- Slower cold starts (~500ms+)
- More complex pricing
- VPC configuration complexity

**Why Rejected**: Higher latency for global users, slower cold starts

### 2. Vercel Edge Functions

**Pros**:
- Similar edge deployment model
- Excellent Next.js integration
- Great developer experience

**Cons**:
- More expensive ($20/month baseline)
- Vercel-specific (stronger vendor lock-in)
- Less control over infrastructure
- Fewer edge locations than Cloudflare

**Why Rejected**: Higher cost, stronger vendor lock-in

### 3. Kubernetes on GKE/EKS

**Pros**:
- Full control over infrastructure
- Can run any workload
- No runtime limitations
- Portable across clouds

**Cons**:
- High operational complexity
- Requires DevOps expertise
- Expensive (minimum ~$150/month)
- Manual scaling configuration
- Slower deployment

**Why Rejected**: Too much operational overhead for team size

### 4. Traditional EC2/Compute Engine

**Pros**:
- Full control
- No runtime limitations
- Can run databases on same machine
- Familiar deployment model

**Cons**:
- Manual server management
- Single region (high latency globally)
- No auto-scaling out of box
- More expensive
- Requires security patching

**Why Rejected**: Too much operational overhead, poor global performance

## Mitigation Strategies

### For Runtime Limitations:
- Offload heavy computation to Convex actions
- Use background jobs for long-running tasks
- Keep bundle size small (<1MB)

### For Vendor Lock-in:
- Abstract deployment logic
- Use standard Web APIs where possible
- Document migration paths
- Keep business logic portable

### For Cold Starts:
- Optimize bundle size
- Use lazy loading for dependencies
- Monitor P95/P99 latency
- Consider warming strategy for critical routes

### For High-Scale Costs:
- Implement aggressive caching
- Use Cloudflare KV for edge caching
- Set up cost alerts
- Monitor and optimize request patterns

### For Debugging:
- Implement comprehensive logging
- Use distributed tracing (future)
- Set up error tracking (Sentry)
- Create staging environment for testing

## Validation

### Metrics to Monitor

**Performance**:
- P50/P95/P99 latency
- Cold start frequency
- TTFB (Time to First Byte)

**Cost**:
- Monthly request volume
- Cost per request
- Total infrastructure cost

**Reliability**:
- Error rate
- Timeout rate
- Availability (SLA: 99.9%)

### Success Criteria

- P95 latency < 200ms globally
- Cold start overhead < 100ms
- Monthly cost < $100 for first 10M requests
- 99.9% availability

## Related Decisions

- **ADR-002**: Convex as Real-Time Database (complements edge architecture)
- **ADR-004**: React Router 7 (provides SSR for edge deployment)
- **ADR-005**: Hono as Backend Framework (optimized for edge runtimes)

## References

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [V8 Isolates vs Containers](https://blog.cloudflare.com/cloud-computing-without-containers/)
- [Edge Computing Explained](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/)

## Notes

- This decision can be revisited if:
  - Application requires heavy CPU computation
  - Cost exceeds acceptable thresholds at scale
  - Runtime limitations become blocking issues
  - Team expertise shifts to different platform

- Alternative platforms to reconsider:
  - Deno Deploy (if ecosystem matures)
  - AWS Lambda@Edge (if cold starts improve)
  - Fly.io (if edge deployment improves)

---

**Last Updated**: 2025-10-23
**Next Review**: 2026-04-23 (or when reaching 10M requests/month)
