# ADR-004: React Router 7 for Frontend Framework

**Status**: Accepted
**Date**: 2025-10-23
**Deciders**: Engineering Team
**Technical Story**: Frontend framework and routing selection

## Context

We need a frontend framework that can:
- Provide client-side and server-side rendering (SSR)
- Work with Cloudflare Workers (edge runtime)
- Offer file-based routing for developer ergonomics
- Support type-safe routing with TypeScript
- Integrate with our real-time database (Convex)
- Provide excellent developer experience with fast HMR
- Scale from prototype to production
- Support SEO requirements

### Requirements

**Functional Requirements**:
- Client-side navigation (SPA behavior)
- Server-side rendering for initial load
- File-based routing
- Nested layouts
- Data loading before rendering (loaders)
- Form handling with mutations (actions)
- Protected route patterns
- Code splitting and lazy loading

**Non-Functional Requirements**:
- Fast build times (<30 seconds)
- Hot module replacement <100ms
- Bundle size <200KB (initial load)
- Works with edge runtimes
- Type-safe routing

**Team Constraints**:
- Team knows React well
- Want to avoid framework lock-in
- Need to ship quickly
- Prefer convention over configuration

## Decision

We will use **React Router 7** as our frontend framework and routing solution.

## Rationale

### What is React Router 7?

React Router 7 is the evolution of Remix (merged into React Router):
- Full-stack framework built on React
- File-based routing
- SSR + client-side hydration
- Data loading pattern (loaders/actions)
- Edge runtime support
- TypeScript-first

### Core Value Propositions

**1. File-Based Routing**:
```
routes/
  _index.tsx              → /
  login.tsx               → /login
  _auth.tsx               → Protected layout
  _auth.todos.tsx         → /todos (protected)
  _auth.admin._index.tsx  → /admin (protected, nested)
```

No routing configuration needed. File structure = route structure.

**2. Type-Safe Routing**:
```typescript
import type { Route } from "./+types/todos";

export function loader({ params }: Route.LoaderArgs) {
  // params are typed automatically!
}
```

Auto-generated types from file structure.

**3. Edge Runtime Support**:
```typescript
// Works seamlessly with Cloudflare Workers
export default {
  fetch: app.fetch,
} satisfies ExportedHandler<CloudflareEnvironment>;
```

Built for edge from the ground up.

**4. SSR + Hydration**:
- Server renders initial HTML (fast first paint)
- Client hydrates for interactivity
- Subsequent navigation is client-side (SPA)
- Best of both worlds

**5. Data Loading Pattern**:
```typescript
// Loader runs on server
export async function loader({ request }: Route.LoaderArgs) {
  const { userId } = await getAuth({ request });
  return { userId };
}

// Component receives typed data
export default function Todos({ loaderData }: Route.ComponentProps) {
  const { userId } = loaderData; // Typed!
  return <div>{userId}</div>;
}
```

Data fetched before component renders (no loading spinners for SSR).

**6. React Ecosystem Compatibility**:
- Works with all React libraries
- Not a proprietary framework
- Can use any React component library
- Easy migration path

### Comparison to Alternatives

| Feature | React Router 7 | Next.js 15 | SvelteKit | Solid Start |
|---------|----------------|------------|-----------|-------------|
| **Edge Support** | ✅ Native | ✅ Yes | ✅ Yes | ✅ Yes |
| **File Routing** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Type Safety** | ✅ Generated | ⚠️ Manual | ✅ Generated | ✅ Generated |
| **SSR** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **React Ecosystem** | ✅ Full | ✅ Full | ❌ Svelte | ❌ Solid |
| **Vendor Lock-in** | ❌ Low | ⚠️ Vercel-ish | ⚠️ Medium | ⚠️ Medium |
| **Learning Curve** | Low | Medium | High | High |
| **Maturity** | High | Very High | High | Medium |
| **Bundle Size** | Small | Medium | Small | Small |
| **Build Speed** | Fast (Vite) | Medium | Fast | Fast |

## Consequences

### Positive Consequences

**Excellent Developer Experience**:
- File-based routing (intuitive)
- Auto-generated types
- Fast HMR via Vite
- Minimal boilerplate
- Great error messages

**Performance**:
- Small bundle size (~100KB framework)
- Fast builds (<10 seconds)
- Efficient code splitting
- Edge-optimized

**SEO-Friendly**:
- Server-rendered HTML
- Meta tags per route
- Proper status codes (404, etc.)
- Sitemap generation (can add)

**Flexibility**:
- Not opinionated about styling
- Works with any state management
- Can opt-out of features
- Gradual adoption possible

**Type Safety**:
- Loader data typed automatically
- Route params typed
- Form actions typed
- Reduced runtime errors

**Edge-First Design**:
- Runs on Cloudflare Workers
- Low latency globally
- Streaming SSR
- Progressive enhancement

**React Compatibility**:
- Use any React library
- Familiar patterns
- Large talent pool
- Extensive ecosystem

**Migration-Friendly**:
- Can migrate from standard React app
- Can migrate to other frameworks
- Not locked into proprietary patterns
- Standard Web APIs

### Negative Consequences

**Framework Churn Risk**:
- React Router 7 is relatively new (2024)
- Merged from Remix (potential instability)
- Breaking changes possible in major versions
- Community still consolidating

**Less Mature Than Next.js**:
- Smaller community
- Fewer learning resources
- Less third-party integrations
- Fewer examples and templates

**SSR Complexity**:
- More complex than pure SPA
- Hydration mismatches can occur
- Harder to debug
- Need to think about server vs client

**Build Configuration**:
- Vite configuration can be complex
- Edge runtime limitations
- Some libraries don't work on edge
- Need to be careful with Node.js APIs

**No Built-In Features**:
- No image optimization (like Next.js Image)
- No built-in API routes (use Hono)
- No built-in i18n
- Need to bring your own solutions

**Learning Curve for Loaders/Actions**:
- Different mental model than React Query
- Need to learn loader/action patterns
- Server-side thinking required
- Can be confusing initially

**Limited Static Site Generation**:
- Primarily for dynamic apps
- Static generation possible but not primary focus
- Not ideal for purely static sites
- Better options for JAMstack blogs

## Mitigation Strategies

### For Framework Churn:

**1. Stay on Stable Versions**:
- Use LTS versions when available
- Test major upgrades in staging
- Don't chase bleeding edge
- Pin dependencies

**2. Abstract Framework Logic**:
```typescript
// Keep business logic separate from framework
// Business logic (framework-agnostic)
export class TodoService {
  async getTodos(userId: string) { ... }
}

// Framework adapter (can swap)
export async function loader({ params }: Route.LoaderArgs) {
  const service = new TodoService();
  return service.getTodos(params.userId);
}
```

**3. Monitor Framework Health**:
- Track GitHub activity
- Follow maintainer communications
- Participate in community
- Have migration plan ready

### For SSR Complexity:

**1. Clear Server/Client Boundaries**:
```typescript
// Server-only code
export async function loader() {
  const secret = process.env.SECRET; // OK on server
}

// Client code
export default function Component() {
  const [state, setState] = useState(); // OK on client
  useEffect(() => { ... }); // Runs on client only
}
```

**2. Use Hydration Best Practices**:
- Don't use random values in SSR
- Serialize data properly
- Match server and client render
- Test hydration mismatches

**3. Progressive Enhancement**:
- App works without JavaScript
- Enhance with client-side features
- Graceful degradation

### For Community Size:

**1. Leverage React Community**:
- Use React libraries (work with RR7)
- Share knowledge from React ecosystem
- Contribute to React Router community

**2. Document Internal Patterns**:
- Create team documentation
- Build example code
- Share learnings

**3. Training**:
- Onboard developers thoroughly
- Create runbooks
- Pair programming

### For Missing Features:

**1. Image Optimization**:
- Use Cloudflare Images
- Or integrate library like `@unpic/react`

**2. API Routes**:
- Use Hono for API routes (already decided)
- Keep API logic in Convex

**3. Internationalization**:
- Use `react-i18next` or similar
- Implement when needed

## Validation

### Success Criteria

**Performance**:
- First Contentful Paint < 1 second
- Time to Interactive < 2 seconds
- Lighthouse score > 90

**Developer Experience**:
- Build time < 30 seconds
- HMR < 100ms
- Team satisfaction with DX

**Stability**:
- Zero framework-related bugs in production
- No breaking changes without major version bump
- Clear upgrade path

### Failure Conditions (Triggers for Re-evaluation)

- Framework abandoned or unmaintained
- Breaking changes too frequent
- Performance significantly degrades
- Better alternative emerges
- Team unable to be productive

## Alternatives Considered

### 1. Next.js 15

**Pros**:
- Very mature
- Huge community
- Excellent documentation
- Many features built-in
- Great for SEO
- Vercel support

**Cons**:
- Vercel-centric (vendor preference)
- More opinionated
- Heavier framework
- App Router complexity
- Less ideal for non-Vercel deploy

**Why Rejected**: Vercel lock-in concerns, heavier than needed, we're on Cloudflare.

### 2. Vite + React (SPA Only)

**Pros**:
- Simplest setup
- Fastest development
- Most flexible
- Smallest bundle

**Cons**:
- No SSR (bad for SEO)
- Slower initial load
- No file-based routing
- More configuration needed

**Why Rejected**: SEO is important, want faster initial load.

### 3. Astro

**Pros**:
- Excellent for static sites
- Partial hydration
- Multi-framework support
- Great performance

**Cons**:
- Different paradigm (islands)
- Less suitable for highly dynamic apps
- Smaller community
- Learning curve

**Why Rejected**: Our app is highly dynamic (real-time), not primarily static.

### 4. SvelteKit

**Pros**:
- Excellent performance
- Great DX
- Modern framework
- File-based routing

**Cons**:
- Team doesn't know Svelte
- Smaller ecosystem than React
- Harder hiring
- Component libraries limited

**Why Rejected**: Team knows React, larger ecosystem, easier hiring.

### 5. Solid Start

**Pros**:
- Fastest performance
- Fine-grained reactivity
- Modern design

**Cons**:
- Very small community
- Immature ecosystem
- Limited libraries
- Harder hiring

**Why Rejected**: Too risky, too new, hiring concerns.

## Migration Path (If Needed)

If we need to migrate away from React Router 7:

**Option 1: To Next.js**

**Phase 1: Preparation** (1-2 weeks)
- Set up Next.js project
- Configure edge runtime
- Set up routing structure

**Phase 2: Migration** (2-4 weeks)
- Migrate routes (mostly 1:1)
- Convert loaders to `getServerSideProps`
- Update imports
- Test thoroughly

**Estimated Effort**: 3-6 weeks, 1-2 engineers
**Risk**: Low (similar patterns)

**Option 2: To Pure React SPA**

**Phase 1: Remove SSR** (1 week)
- Convert to client-only rendering
- Remove loaders (use React Query)
- Simplify build

**Estimated Effort**: 1-2 weeks, 1 engineer
**Risk**: Low (simpler architecture)
**Trade-off**: Lose SSR benefits

## Integration Details

### React Router 7 + Cloudflare Workers

```typescript
// workers/app.ts
import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

// Hono handles routing to React Router
app.use(async (c) => {
  return requestHandler(c.req.raw, {
    cloudflare: {
      env: c.env,
      ctx: c.executionCtx
    }
  });
});
```

### File-Based Routing Example

```
routes/
  _index.tsx                    # / (home)
  login.tsx                     # /login
  _auth.tsx                     # Layout (protected)
    _auth._index.tsx            # /
    _auth.todos.tsx             # /todos
    _auth.admin.tsx             # Layout (admin)
      _auth.admin._index.tsx    # /admin
      _auth.admin.users._index.tsx  # /admin/users
```

### Type Generation

```typescript
// Auto-generated from routes
import type { Route } from "./+types/todos";

export async function loader({ request }: Route.LoaderArgs) {
  // request is typed
}

export default function Todos({ loaderData }: Route.ComponentProps) {
  // loaderData is typed based on loader return
}
```

## Related Decisions

- **ADR-001**: Edge-First Architecture (React Router 7 works on edge)
- **ADR-005**: Hono as Backend Framework (handles API routes)

## References

- [React Router Documentation](https://reactrouter.com)
- [React Router 7 Release Notes](https://reactrouter.com/v7)
- [Remix → React Router Migration](https://remix.run/docs/en/main/start/future-flags)
- [React Router + Cloudflare](https://reactrouter.com/how-to/cloudflare)

## Review Schedule

- **Annual Review**: Assess framework health and alternatives
- **Trigger Events**:
  - Major breaking changes
  - Framework maintenance concerns
  - Performance issues
  - Better alternative emerges

---

**Last Updated**: 2025-10-23
**Next Review**: 2026-10-23 (Annual)
**Risk Level**: Low-Medium (new but backed by strong team)
**Mitigation Priority**: Low (monitor framework health)
