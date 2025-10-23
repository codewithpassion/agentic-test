# ADR-003: Clerk for Authentication

**Status**: Accepted
**Date**: 2025-10-23
**Deciders**: Engineering Team
**Technical Story**: Authentication and user management selection

## Context

We need an authentication solution that can:
- Provide secure user authentication (sign up, sign in, sign out)
- Support multiple authentication providers (email, Google, GitHub, etc.)
- Manage user sessions across devices
- Integrate with Convex database for user data
- Work with Cloudflare Workers (edge runtime)
- Provide pre-built UI components for auth flows
- Handle role-based access control (RBAC)
- Offer webhooks for user lifecycle events
- Minimize development time and security risks

### Requirements

**Functional Requirements**:
- Email + password authentication
- Social login (Google, GitHub)
- Magic link authentication (optional)
- Password reset flow
- Email verification
- User profile management
- Role-based permissions (user, admin, superadmin)
- Session management
- Multi-factor authentication (future)

**Non-Functional Requirements**:
- 99.9% uptime
- <500ms authentication latency
- GDPR compliant
- SOC 2 Type II certified
- Works with edge runtimes
- Easy migration path if needed

**Team Constraints**:
- No security experts on team
- Want to avoid building custom auth
- Need to ship quickly
- Limited time for auth maintenance

## Decision

We will use **Clerk** as our authentication provider.

## Rationale

### Core Value Propositions

**1. Pre-Built UI Components**:
```typescript
import { SignIn, SignUp, UserButton } from "@clerk/react-router";

// Drop-in components with full UI
<SignIn />
<SignUp />
<UserButton />
```

Building custom auth UI is time-consuming. Clerk provides production-ready components.

**2. Convex Integration**:
```typescript
// Clerk issues JWT, Convex validates automatically
const identity = await ctx.auth.getUserIdentity();
// Works seamlessly with Convex's auth system
```

Official Clerk + Convex integration maintained by both companies.

**3. Edge Runtime Compatible**:
- Works with Cloudflare Workers
- SSR support for React Router
- No server-side session storage needed
- JWT-based (stateless)

**4. Comprehensive Feature Set**:
- Multiple auth providers out-of-box
- User management dashboard
- Session management across devices
- Webhooks for user events
- Custom metadata (roles, preferences)
- Organization/team support (future)

**5. Security by Default**:
- SOC 2 Type II certified
- GDPR/CCPA compliant
- Security headers configured
- Brute force protection
- Anomaly detection
- Regular security audits

**6. Developer Experience**:
- Excellent documentation
- TypeScript support
- React hooks provided
- Dashboard for user management
- Testing environments

### Comparison to Alternatives

| Feature | Clerk | Auth0 | Supabase Auth | NextAuth | Custom |
|---------|-------|-------|---------------|----------|--------|
| **Pre-built UI** | ✅ Best | ✅ Good | ⚠️ Basic | ❌ DIY | ❌ DIY |
| **Pricing** | Free 10k MAU | $$$ | Free | Free | Time |
| **Edge Compatible** | ✅ Yes | ✅ Yes | ⚠️ Limited | ⚠️ Limited | ✅ Yes |
| **Convex Integration** | ✅ Official | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| **Setup Time** | 30 min | 2 hours | 1 hour | 4 hours | Weeks |
| **Maintenance** | Zero | Low | Low | Medium | High |
| **Security** | SOC 2 | SOC 2 | Growing | DIY | DIY |
| **User Management UI** | ✅ Excellent | ✅ Good | ✅ Good | ❌ None | ❌ DIY |
| **MFA Support** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ DIY |
| **Organizations** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ DIY |

## Consequences

### Positive Consequences

**Rapid Development**:
- Auth implemented in <1 day
- No custom auth code to write
- Pre-built sign-in/sign-up flows
- User management dashboard included

**Security Confidence**:
- Professional security team maintaining it
- SOC 2 certified
- Regular security audits
- Compliance handled (GDPR, CCPA)
- No risk of homegrown auth vulnerabilities

**Feature Richness**:
- Social login ready (Google, GitHub, etc.)
- Magic link authentication
- Email verification built-in
- Password reset flows
- Session management across devices
- Webhooks for user events

**User Experience**:
- Professional auth UI
- Responsive design
- Accessibility built-in
- Customizable branding
- Smooth user flows

**Integration Benefits**:
- Works seamlessly with Convex
- JWT-based (stateless)
- Edge-compatible
- React Router SSR support
- Type-safe APIs

**Operational Benefits**:
- Zero maintenance burden
- 99.9% uptime SLA
- 24/7 support (on paid plans)
- User management dashboard
- Analytics included

### Negative Consequences

**Vendor Lock-In (High Risk)**:
- All users managed by Clerk
- Migration requires re-authentication of all users
- Cannot self-host
- Dependent on Clerk's business continuity
- User data stored externally

**Cost at Scale**:
- Free tier: 10,000 MAU (Monthly Active Users)
- Pro: $25/month + $0.02 per MAU above 10k
- At 100k MAU: $25 + ($0.02 × 90k) = $1,825/month
- At 1M MAU: $25 + ($0.02 × 990k) = $19,825/month
- Can become expensive as user base grows

**Limited Customization**:
- UI customization limited to branding
- Cannot fully customize auth flows
- Some auth logic is black-boxed
- Cannot add custom auth methods easily

**External Dependency**:
- If Clerk has outage, users cannot sign in
- No fallback authentication mechanism
- Complete dependency on third-party service
- Potential latency for auth requests

**Data Privacy Concerns**:
- User PII stored with third party
- Subject to Clerk's data policies
- Compliance requirements may conflict
- Limited control over data residency

**Learning Curve**:
- Team must learn Clerk's APIs
- Different patterns than traditional auth
- JWT claim management
- Webhook handling

**Migration Complexity**:
- Moving away from Clerk is difficult
- Need to export all users
- Re-authentication required
- Potential user churn during migration

## Mitigation Strategies

### For Vendor Lock-In:

**1. Export User Data Regularly**:
```typescript
// Regular automated user exports
export const exportUsers = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    // Store in S3/R2 with encryption
  }
});
```

**2. Document Migration Path**:
- Clerk → Self-hosted auth migration guide
- Estimated timeline and effort
- User re-authentication strategy
- Data export procedures

**3. Abstract Auth Logic**:
```typescript
// Abstraction layer (future)
interface AuthProvider {
  signIn(credentials: Credentials): Promise<User>;
  signOut(): Promise<void>;
  getUser(): Promise<User | null>;
}

// Clerk implementation
class ClerkAuthProvider implements AuthProvider {
  // Clerk-specific implementation
}
```

### For Cost at Scale:

**1. Cost Monitoring**:
- Set up billing alerts at $100, $500, $1000/month
- Track MAU growth monthly
- Calculate cost per user
- Project future costs

**2. Optimization Strategies**:
- Implement session cleanup (delete inactive users)
- Consider tiered authentication (free tier = basic auth)
- Negotiate volume discounts
- Evaluate alternatives at scale milestones

**3. Breakeven Analysis**:
- Calculate cost of self-hosted auth
- Factor in engineering time and maintenance
- Compare to Clerk pricing at various scales
- Make data-driven decision

### For Service Outages:

**1. Graceful Degradation**:
```typescript
// Handle Clerk downtime gracefully
if (!isClerkAvailable) {
  return <MaintenanceMode />;
}
```

**2. Status Monitoring**:
- Monitor Clerk status page
- Set up alerts for outages
- Communicate proactively to users

**3. Fallback Strategy** (Future):
- Implement read-only mode during outages
- Cache user sessions for limited time
- Emergency admin access bypass

### For Data Privacy:

**1. Compliance Documentation**:
- Review Clerk's DPA (Data Processing Agreement)
- Understand data residency options
- Document compliance posture
- Regular privacy reviews

**2. Minimal Data Storage**:
- Only store necessary user metadata in Clerk
- Keep sensitive business data in Convex
- Encrypt custom metadata

**3. User Data Control**:
- Implement data export for users
- Document data deletion procedures
- GDPR compliance checklist

## Validation

### Success Criteria

**Functionality**:
- Users can sign up/sign in within 30 seconds
- Password reset works reliably
- Social login success rate > 95%
- Zero security incidents in first year

**Performance**:
- Authentication latency < 500ms (P95)
- 99.9% uptime
- Session refresh seamless

**Cost**:
- Stay within free tier for first 10k users
- Cost per user < $0.05/month
- Total auth cost < 10% of infrastructure budget

**Developer Experience**:
- Auth implementation completed in < 2 days
- Zero auth-related bugs in first 3 months
- Team satisfaction with DX

### Failure Conditions (Triggers for Re-evaluation)

- Cost exceeds $2,000/month
- Multiple outages (>3 per year)
- Missing critical feature blocking product
- Compliance issues arise
- Clerk business stability concerns
- User experience significantly degraded

## Alternatives Considered

### 1. Auth0

**Pros**:
- Enterprise-grade
- Extensive features
- Great documentation
- SOC 2 certified
- Long track record

**Cons**:
- More expensive ($25/month + $0.035/MAU)
- More complex setup
- Heavier SDK
- Okta acquisition concerns

**Why Rejected**: Higher cost, more complex than needed, acquisition uncertainty.

### 2. Supabase Auth

**Pros**:
- Free tier generous
- Open source (can self-host)
- PostgreSQL-backed
- Good documentation

**Cons**:
- Less polished UI components
- Weaker edge runtime support
- Not as feature-rich as Clerk
- Tighter coupling to Supabase ecosystem

**Why Rejected**: Weaker edge support, less mature UI, ecosystem lock-in to Supabase.

### 3. NextAuth (Auth.js)

**Pros**:
- Free and open source
- Flexible and customizable
- No vendor lock-in
- Active community

**Cons**:
- Self-hosted (more maintenance)
- Need to build UI ourselves
- Session storage required (not ideal for edge)
- Security is our responsibility
- More development time

**Why Rejected**: Too much development time, security responsibility, not edge-optimized.

### 4. Firebase Authentication

**Pros**:
- Mature platform
- Good mobile SDKs
- Generous free tier
- Easy setup

**Cons**:
- Google ecosystem lock-in
- Weaker TypeScript support
- Not optimized for edge
- Less developer-friendly than Clerk

**Why Rejected**: Google dependency, weaker DX for web apps.

### 5. Custom Authentication (DIY)

**Pros**:
- Full control
- No vendor lock-in
- No recurring costs
- Custom features possible

**Cons**:
- 4-8 weeks development time
- Security risks (easy to get wrong)
- Ongoing maintenance burden
- Need to build all features
- Compliance is our responsibility

**Why Rejected**: Too risky, too slow, not core to product.

## Migration Path (If Needed)

If we need to migrate away from Clerk:

**Option 1: Self-Hosted Auth (NextAuth)**

**Phase 1: Preparation** (1 month)
1. Set up NextAuth with database adapter
2. Build custom UI components
3. Implement user migration script
4. Test in staging environment

**Phase 2: Migration** (1 month)
5. Export all users from Clerk
6. Import users to new system
7. Force password reset for all users (or use magic links)
8. Gradual rollout (10% → 50% → 100%)

**Phase 3: Cleanup** (2 weeks)
9. Monitor for issues
10. Decommission Clerk
11. Update documentation

**Estimated Cost**: $40,000 - $60,000 (engineering time)
**User Impact**: Moderate (forced re-authentication)

**Option 2: Another Auth Provider (Auth0)**

- Lower engineering cost (~$20,000)
- Less user disruption
- Still vendor dependency
- Higher recurring cost

## Integration Details

### Clerk + Convex Flow

```typescript
// 1. User signs in with Clerk
<SignIn />

// 2. Clerk issues JWT token with claims
{
  "sub": "user_123",
  "email": "user@example.com",
  "roles": ["user"]
}

// 3. ConvexProviderWithAuth passes token to Convex
<ConvexProviderWithAuth client={convex} useAuth={useAuth}>
  <App />
</ConvexProviderWithAuth>

// 4. Convex validates JWT and makes identity available
export const query = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    // identity.subject = "user_123"
  }
});

// 5. Sync user to Convex database
const user = await ctx.db.query("users")
  .withIndex("by_clerkId", q => q.eq("clerkId", identity.subject))
  .unique();
```

### Role Management

**Roles stored in two places**:
1. **Clerk** (`publicMetadata.roles`)
   - Source of truth
   - Included in JWT claims
   - Managed via Clerk dashboard or API

2. **Convex** (`users.roles`)
   - Cached copy for querying
   - Synced via webhook or client-side sync
   - Used for permission checks in queries

## Related Decisions

- **ADR-001**: Edge-First Architecture (Clerk is edge-compatible)
- **ADR-002**: Convex Database (official integration with Clerk)

## References

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk + Convex Integration](https://clerk.com/docs/integrations/databases/convex)
- [Clerk Pricing](https://clerk.com/pricing)
- [Clerk Security](https://clerk.com/security)
- [Clerk vs Auth0](https://clerk.com/blog/clerk-vs-auth0)

## Review Schedule

- **Quarterly Review**: Assess cost, uptime, feature needs
- **Annual Re-evaluation**: Consider alternatives if cost or features become issues
- **Trigger Events**:
  - Cost > $1,500/month
  - Multiple outages per year
  - Critical feature gap emerges
  - Compliance requirements change

---

**Last Updated**: 2025-10-23
**Next Review**: 2026-01-23 (Quarterly)
**Risk Level**: Medium (vendor lock-in offset by rapid development)
**Mitigation Priority**: Medium (monitor cost and export users regularly)
