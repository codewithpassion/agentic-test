# Technology Stack Documentation

**Version**: 1.0
**Date**: 2025-10-23
**Status**: Active

## Overview

This document provides a comprehensive breakdown of all technologies used in the application, including version information, rationale for selection, and integration patterns.

## Technology Categories

1. [Frontend Framework & UI](#frontend-framework--ui)
2. [Backend & Edge Computing](#backend--edge-computing)
3. [Database & Data Layer](#database--data-layer)
4. [Authentication & Authorization](#authentication--authorization)
5. [Development Tools & Build System](#development-tools--build-system)
6. [Styling & Design System](#styling--design-system)
7. [Deployment & Infrastructure](#deployment--infrastructure)
8. [Type Safety & Code Quality](#type-safety--code-quality)

---

## Frontend Framework & UI

### React 19
- **Version**: `19.0.0`
- **Role**: Core UI library
- **Why Chosen**:
  - Latest stable version with improved performance
  - Server components support (future-ready)
  - Automatic batching and concurrent features
  - Industry standard with massive ecosystem
- **Alternatives Considered**:
  - Vue 3: Less TypeScript-first
  - Svelte: Smaller ecosystem, less mature SSR
  - Solid.js: Smaller community
- **Learning Resources**:
  - [React Docs](https://react.dev)
  - [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)

### React Router 7
- **Version**: `7.3.0` (react-router), `7.6.1` (@react-router/dev)
- **Role**: Routing, SSR framework, file-based routing
- **Why Chosen**:
  - File-based routing (developer ergonomics)
  - Built-in SSR support for edge runtimes
  - Type-safe route parameters
  - Loader/action pattern for data fetching
  - Migration path from Remix
- **Alternatives Considered**:
  - Next.js: Too opinionated, Vercel-centric
  - Remix: React Router 7 is evolution of Remix
  - TanStack Router: Less mature SSR story
- **Key Features Used**:
  - File-based routing (`/app/routes/`)
  - Loaders for SSR data fetching
  - Protected route layouts (`_auth.tsx`)
  - Type generation for routes (`+types`)
- **Learning Resources**:
  - [React Router Docs](https://reactrouter.com)

### TailwindCSS 4
- **Version**: `4.0.0`
- **Role**: Utility-first CSS framework
- **Why Chosen**:
  - Rapid UI development
  - Excellent DX with autocomplete
  - Tree-shaking for small bundles
  - Version 4: Oxide engine (faster builds)
- **Configuration**:
  - Vite plugin for instant HMR
  - Custom theme via `tailwind.config.ts`
  - Typography plugin for rich content
- **Alternatives Considered**:
  - CSS Modules: More boilerplate
  - Styled Components: Runtime cost, SSR complexity
  - Vanilla CSS: Slower development
- **Learning Resources**:
  - [Tailwind Docs](https://tailwindcss.com)

### ShadCN UI
- **Version**: Latest (component library, no version)
- **Role**: Pre-built accessible components
- **Why Chosen**:
  - Copy-paste components (no npm bloat)
  - Built on Radix UI (accessibility)
  - Full customization control
  - TypeScript-first
- **Components Used**:
  - Button, Dialog, Dropdown, Select, Separator
  - Avatar, Checkbox, Tooltip, ScrollArea
- **Installation**:
  ```bash
  bunx --bun shadcn@latest add button
  ```
- **Alternatives Considered**:
  - Material UI: Heavier, harder to customize
  - Ant Design: Opinionated styling
  - Chakra UI: Different design philosophy
- **Learning Resources**:
  - [ShadCN UI Docs](https://ui.shadcn.com)

### Radix UI Primitives
- **Version**: Various (see package.json)
- **Role**: Headless accessible components
- **Why Chosen**:
  - ARIA-compliant out of the box
  - Unstyled (full design control)
  - Battle-tested by Vercel, GitHub
- **Primitives Used**:
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-select`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-tooltip`
- **Learning Resources**:
  - [Radix UI Docs](https://www.radix-ui.com)

---

## Backend & Edge Computing

### Cloudflare Workers
- **Version**: Latest (platform, not versioned)
- **Role**: Edge compute runtime (serverless)
- **Why Chosen**:
  - Global edge deployment (300+ locations)
  - V8 isolates (faster than containers)
  - Low latency worldwide (~50ms)
  - Tight integration with Cloudflare services
  - Generous free tier
- **Characteristics**:
  - Runtime: V8 JavaScript/TypeScript
  - CPU Limit: 50ms (free) / 125ms (paid)
  - Memory: 128MB
  - Cold Start: ~50ms typical
- **Alternatives Considered**:
  - AWS Lambda@Edge: Slower cold starts
  - Vercel Edge Functions: Vendor lock-in
  - Deno Deploy: Smaller ecosystem
- **Learning Resources**:
  - [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

### Hono
- **Version**: `4.7.5`
- **Role**: Web framework for edge runtimes
- **Why Chosen**:
  - Ultra-lightweight (~12KB)
  - Edge-first design (works on Workers, Deno, Bun)
  - Express-like API (familiar DX)
  - Built-in TypeScript support
  - Fast routing (~100x faster than Express)
- **Usage**:
  - API route handling (`/api/*`)
  - CORS middleware
  - SSR handler integration
- **Alternatives Considered**:
  - Itty Router: Less features
  - Express: Doesn't work on edge
  - Fastify: Node.js-specific
- **Key Features**:
  ```typescript
  const app = new Hono<AppType>();
  app.get("/api/health", (c) => c.json({ status: "ok" }));
  ```
- **Learning Resources**:
  - [Hono Docs](https://hono.dev)

### Wrangler
- **Version**: `4.34.0`
- **Role**: Cloudflare CLI for dev & deployment
- **Why Chosen**:
  - Official Cloudflare tool
  - Local dev server with hot reload
  - Secrets management
  - Tailing logs (`wrangler tail`)
- **Key Commands**:
  ```bash
  wrangler dev          # Local development
  wrangler deploy       # Deploy to production
  wrangler tail         # Stream logs
  wrangler secret put   # Add secrets
  ```
- **Learning Resources**:
  - [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)

---

## Database & Data Layer

### Convex
- **Version**: `1.17.4`
- **Role**: Real-time database platform
- **Why Chosen**:
  - Real-time subscriptions out-of-box
  - ACID transactions with strong consistency
  - Type-safe queries (generated types)
  - Built-in authentication integration
  - Schema migrations handled automatically
  - WebSocket-based sync
- **Architecture**:
  - NoSQL with relational features
  - Serverless (no server management)
  - Global deployment
- **Data Access Patterns**:
  ```typescript
  // Real-time query
  const todos = useQuery(api.todos.list);

  // Mutation
  const createTodo = useMutation(api.todos.create);
  ```
- **Alternatives Considered**:
  - Supabase: More traditional (PostgreSQL), no built-in real-time types
  - Firebase: Less type-safe, Google ecosystem lock-in
  - PlanetScale: MySQL, no real-time, more traditional
  - Neon: PostgreSQL, no real-time subscriptions
- **Pricing**:
  - Free: 1GB storage, 1GB bandwidth/month
  - Pro: $25/month for 8GB storage
- **Learning Resources**:
  - [Convex Docs](https://docs.convex.dev)
  - [Convex Tutorial](https://docs.convex.dev/tutorial)

### Convex Type Generation
- **Feature**: Auto-generated TypeScript types
- **Generated Files**:
  - `convex/_generated/api.d.ts` - API type definitions
  - `convex/_generated/dataModel.d.ts` - Schema types
  - `convex/_generated/server.d.ts` - Server utilities
- **Usage**:
  ```typescript
  import type { Doc, Id } from "../../convex/_generated/dataModel";
  import type { api } from "../../convex/_generated/api";
  ```
- **Benefits**:
  - End-to-end type safety
  - Autocomplete in IDE
  - Compile-time error detection

---

## Authentication & Authorization

### Clerk
- **Version**: `1.9.8` (@clerk/react-router)
- **Role**: Authentication as a Service
- **Why Chosen**:
  - Pre-built UI components (sign-in, sign-up)
  - Multi-provider auth (Google, GitHub, email)
  - Session management handled
  - JWT token issuance for Convex
  - User metadata and roles
  - Webhooks for user events
- **Integration Pattern**:
  1. User signs in via Clerk UI
  2. Clerk issues JWT token
  3. Token passed to Convex via ConvexProviderWithAuth
  4. Convex validates JWT with Clerk's public key
  5. User data synced to Convex database
- **Features Used**:
  - Sign-in/sign-up components
  - Session management
  - JWT templates (custom claims)
  - User metadata (roles)
  - SSR integration (`getAuth`)
- **Alternatives Considered**:
  - Auth0: More expensive, complex setup
  - Supabase Auth: Locked to Supabase ecosystem
  - NextAuth: Self-hosted, more maintenance
  - Custom auth: High development cost, security risk
- **Pricing**:
  - Free: 10,000 MAU
  - Pro: $25/month base + per-user pricing
- **Learning Resources**:
  - [Clerk Docs](https://clerk.com/docs)
  - [Clerk + Convex Guide](https://clerk.com/docs/integrations/databases/convex)

### JWT (JSON Web Tokens)
- **Role**: Authentication token format
- **Flow**:
  - Clerk issues JWT on sign-in
  - Token contains user claims (id, email, roles)
  - Token sent with every Convex request
  - Convex verifies signature with Clerk's public key
- **Claims Structure**:
  ```json
  {
    "sub": "user_abc123",           // Clerk user ID
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["user", "admin"]
  }
  ```
- **Security**:
  - HTTPS-only transmission
  - Short expiration (1 hour typical)
  - Signature verification

---

## Development Tools & Build System

### Bun
- **Version**: Latest (1.2.x)
- **Role**: Package manager, runtime, test runner
- **Why Chosen**:
  - 10-100x faster than npm/yarn
  - Drop-in replacement for Node.js
  - Built-in TypeScript support
  - Fast test runner
  - All-in-one tool (runtime + package manager)
- **Usage**:
  ```bash
  bun install           # Install dependencies
  bun dev               # Run dev server
  bun check             # Type checking & linting
  bunx shadcn add button # Run CLI tools
  ```
- **Alternatives Considered**:
  - npm: Slower install times
  - pnpm: Fast but less comprehensive
  - Yarn: Slower than Bun
- **Learning Resources**:
  - [Bun Docs](https://bun.sh/docs)

### Vite
- **Version**: `6.3.5`
- **Role**: Build tool and dev server
- **Why Chosen**:
  - Lightning-fast HMR (Hot Module Replacement)
  - Native ESM support
  - React Router 7 uses Vite under the hood
  - Rich plugin ecosystem
- **Plugins Used**:
  - `@cloudflare/vite-plugin` - Cloudflare Workers integration
  - `@tailwindcss/vite` - TailwindCSS v4 integration
  - `vite-tsconfig-paths` - TypeScript path aliases
- **Configuration**: `vite.config.ts`
- **Learning Resources**:
  - [Vite Docs](https://vite.dev)

### TypeScript
- **Version**: `5.7.2`
- **Role**: Type-safe JavaScript
- **Why Chosen**:
  - Catch bugs at compile time
  - Better IDE autocomplete
  - Self-documenting code
  - Industry standard
- **Configuration**:
  - Strict mode enabled
  - **NO `any` TYPES ALLOWED** (enforced by Biome)
  - Path aliases (`~/*` for app, `~~/*` for workers)
- **Type Generation**:
  - Convex: Auto-generated from schema
  - React Router: Auto-generated route types
  - Cloudflare: Generated from wrangler.jsonc (`bun cf-typegen`)
- **Learning Resources**:
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Type Safety & Code Quality

### Biome
- **Version**: `1.9.4`
- **Role**: Linter and formatter (Rust-based)
- **Why Chosen**:
  - 100x faster than ESLint + Prettier
  - Single tool (linter + formatter)
  - Zero config for most projects
  - Strict rules enforced
  - **Enforces NO `any` TYPES**
- **Configuration**: `biome.json`
- **Commands**:
  ```bash
  bun biome:check     # Lint + format with auto-fix
  bun check           # Full check (types + lint)
  ```
- **Rules Enforced**:
  - Tab indentation (not spaces)
  - Double quotes
  - No `any` types
  - Import organization
- **Alternatives Considered**:
  - ESLint + Prettier: Slower, two tools
  - Oxlint: Less mature
- **Learning Resources**:
  - [Biome Docs](https://biomejs.dev)

### Zod
- **Version**: `3.25.62`
- **Role**: Schema validation and type inference
- **Why Chosen**:
  - TypeScript-first design
  - Runtime validation from types
  - Inferred types from schemas
  - Great error messages
- **Usage**:
  ```typescript
  const TodoSchema = z.object({
    text: z.string().min(1),
    completed: z.boolean()
  });

  type Todo = z.infer<typeof TodoSchema>;
  ```
- **Integration**:
  - React Hook Form validation
  - Form input validation
  - API request validation
- **Learning Resources**:
  - [Zod Docs](https://zod.dev)

### Husky
- **Version**: `9.1.7`
- **Role**: Git hooks for pre-commit checks
- **Why Chosen**:
  - Enforce code quality before commit
  - Prevent bad code from entering repo
  - Team consistency
- **Hooks Configured**:
  - Pre-commit: Run `bun check` (types + lint)
- **Learning Resources**:
  - [Husky Docs](https://typicode.github.io/husky/)

---

## Styling & Design System

### Class Variance Authority (CVA)
- **Version**: `0.7.1`
- **Role**: Type-safe component variants
- **Why Chosen**:
  - Type-safe variant props
  - Works seamlessly with Tailwind
  - Used by ShadCN components
- **Usage**:
  ```typescript
  const buttonVariants = cva("base-classes", {
    variants: {
      variant: {
        primary: "bg-blue-500",
        secondary: "bg-gray-500"
      }
    }
  });
  ```
- **Learning Resources**:
  - [CVA GitHub](https://github.com/joe-bell/cva)

### Tailwind Merge & clsx
- **Versions**: `tailwind-merge@3.1.0`, `clsx@2.1.1`
- **Role**: Conditional class merging
- **Why Chosen**:
  - Avoid className conflicts
  - Conditional class application
  - Used by ShadCN
- **Usage**:
  ```typescript
  import { cn } from "~/lib/utils";

  <div className={cn("base", isActive && "active")} />
  ```

### Lucide React
- **Version**: `0.486.0`
- **Role**: Icon library
- **Why Chosen**:
  - Modern, consistent icons
  - Tree-shakable (import only used icons)
  - TypeScript support
  - Regular updates
- **Usage**:
  ```typescript
  import { Check, X, User } from "lucide-react";
  ```
- **Alternatives Considered**:
  - Heroicons: Less variety
  - React Icons: Larger bundle
  - Font Awesome: Not tree-shakable
- **Learning Resources**:
  - [Lucide Icons](https://lucide.dev)

### Framer Motion
- **Version**: `12.6.3`
- **Role**: Animation library
- **Why Chosen**:
  - Declarative animations
  - Spring physics
  - Gesture support
  - Performance optimized
- **Usage**:
  - Page transitions
  - Component animations
  - Interactive elements
- **Learning Resources**:
  - [Framer Motion Docs](https://www.framer.com/motion/)

### Sonner
- **Version**: `2.0.5`
- **Role**: Toast notifications
- **Why Chosen**:
  - Beautiful default styling
  - Accessible
  - Easy to use
  - Works with React
- **Usage**:
  ```typescript
  import { toast } from "sonner";

  toast.success("Todo created!");
  ```
- **Learning Resources**:
  - [Sonner GitHub](https://github.com/emilkowalski/sonner)

---

## Deployment & Infrastructure

### Cloudflare Pages
- **Version**: Platform (not versioned)
- **Role**: Static asset hosting + edge deployment
- **Why Chosen**:
  - Free tier with unlimited bandwidth
  - Global CDN
  - Instant cache purge
  - Integrates with Workers
- **Deployment**:
  - Automatic on git push (can configure)
  - Manual via `wrangler deploy`
- **Learning Resources**:
  - [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)

### Environment Variables

**Development**:
- File: `.env` (gitignored)
- Loaded by Vite

**Production**:
- Public vars: `wrangler.jsonc` (`vars` section)
- Secrets: `wrangler secret put VARIABLE_NAME`
- Auto-typed via `bun cf-typegen` → `worker-configuration.d.ts`

**Required Variables**:
```env
# Clerk (Auth)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex (Database)
VITE_CONVEX_URL=https://your-app.convex.cloud
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
```

---

## Utility Libraries

### React Hook Form
- **Version**: `7.58.0`
- **Role**: Form state management
- **Why Chosen**:
  - Minimal re-renders
  - Built-in validation
  - Zod integration
  - Great DX
- **Integration**:
  - `@hookform/resolvers` for Zod validation
- **Learning Resources**:
  - [React Hook Form Docs](https://react-hook-form.com)

### TanStack React Query
- **Version**: `5.80.7`
- **Role**: Server state management (optional layer)
- **Why Chosen**:
  - Caching and deduplication
  - Automatic background refetch
  - Optimistic updates
  - DevTools for debugging
- **Usage**: Minimal (Convex handles most server state)
- **Learning Resources**:
  - [TanStack Query Docs](https://tanstack.com/query)

### SuperJSON
- **Version**: `2.2.2`
- **Role**: Enhanced JSON serialization
- **Why Chosen**:
  - Serialize Dates, Maps, Sets
  - Preserve types across network
  - Used by React Router loaders
- **Learning Resources**:
  - [SuperJSON GitHub](https://github.com/blitz-js/superjson)

---

## Technology Decision Matrix

| Category | Selected | Alternatives | Reason |
|----------|----------|--------------|--------|
| **Frontend Framework** | React 19 | Vue, Svelte | Industry standard, largest ecosystem |
| **Routing & SSR** | React Router 7 | Next.js, Remix | Edge-first, file-based routing, type-safe |
| **Styling** | TailwindCSS 4 | CSS-in-JS, CSS Modules | Fastest development, smallest runtime |
| **Component Library** | ShadCN UI | Material UI, Chakra | Full control, copy-paste, TypeScript-first |
| **Backend Runtime** | Cloudflare Workers | Lambda, Deno Deploy | Global edge, lowest latency |
| **Web Framework** | Hono | Itty Router, Express | Lightweight, edge-compatible, familiar API |
| **Database** | Convex | Supabase, Firebase, Postgres | Real-time built-in, type-safe, ACID |
| **Auth** | Clerk | Auth0, NextAuth, Supabase | Best DX, pre-built UI, reasonable pricing |
| **Package Manager** | Bun | npm, pnpm, Yarn | Fastest, all-in-one tool |
| **Build Tool** | Vite | Webpack, Turbopack | Fast HMR, great DX, ecosystem |
| **Linter/Formatter** | Biome | ESLint+Prettier | 100x faster, single tool, strict rules |
| **Type Safety** | TypeScript | JavaScript | Catch bugs early, better DX |
| **Form Library** | React Hook Form | Formik | Better performance, less re-renders |
| **Validation** | Zod | Yup, Joi | Type inference, TypeScript-first |
| **Icons** | Lucide React | Heroicons, Font Awesome | Modern, tree-shakable, consistent |
| **Animations** | Framer Motion | React Spring | Declarative, spring physics |
| **Notifications** | Sonner | React Hot Toast | Beautiful, accessible, simple |

---

## Version Update Strategy

### Major Version Updates
- Evaluate breaking changes
- Test in staging environment
- Update documentation
- Communicate to team

### Minor/Patch Updates
- Use `bun update` regularly
- Review changelogs for significant changes
- Run `bun check` after updates

### Dependency Monitoring
- **Renovate Bot** (recommended): Auto PR for updates
- **Dependabot**: GitHub-native option
- Manual review monthly

---

## Learning Path for New Developers

**Week 1: Fundamentals**
1. TypeScript basics
2. React fundamentals
3. Tailwind CSS

**Week 2: Framework-Specific**
4. React Router 7 (routing, loaders, SSR)
5. Convex (queries, mutations, schema)
6. Clerk (authentication flow)

**Week 3: Advanced**
7. Cloudflare Workers (edge concepts)
8. Hono (backend routing)
9. Form handling (React Hook Form + Zod)

**Week 4: Deployment & Operations**
10. Wrangler CLI
11. Environment management
12. Debugging and monitoring

---

## Document Maintenance

- **Review Frequency**: Quarterly or on major dependency updates
- **Update Triggers**:
  - New dependency added
  - Major version upgrade
  - Technology replacement
  - New alternative discovered
- **Owner**: Engineering Lead / Tech Lead
