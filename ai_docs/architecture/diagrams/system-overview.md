# System Overview Diagram

This document contains visual representations of the system architecture at various levels of abstraction.

## High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           END USERS                                   │
│                    (Global - Browser/Mobile)                          │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS/WSS
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE GLOBAL NETWORK                          │
│                    (300+ Edge Locations)                              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  CLOUDFLARE PAGES (Static Assets)                              │  │
│  │  - React build artifacts                                       │  │
│  │  - JavaScript bundles                                          │  │
│  │  - CSS files                                                   │  │
│  │  - CDN cached globally                                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  CLOUDFLARE WORKERS (Edge Compute)                             │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  Hono Web Framework                                      │  │  │
│  │  │  - API Routes (/api/*)                                   │  │  │
│  │  │  - CORS middleware                                       │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  React Router 7 SSR                                      │  │  │
│  │  │  - Server-side rendering                                 │  │  │
│  │  │  - Initial HTML generation                               │  │  │
│  │  │  - Route handling                                        │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ API Calls
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                │
│  ┌─────────────────────────┐    ┌──────────────────────────────────┐│
│  │   CLERK AUTH SERVICE    │    │   CONVEX DATABASE SERVICE        ││
│  │  ─────────────────────  │    │  ──────────────────────────────  ││
│  │  - User authentication  │    │  - Real-time database            ││
│  │  - JWT token issuance   │    │  - WebSocket subscriptions       ││
│  │  - Session management   │    │  - ACID transactions             ││
│  │  - User metadata        │    │  - Type-safe queries             ││
│  │  - Social login         │    │  - Business logic functions      ││
│  │  - Webhooks             │    │  - Schema & indexes              ││
│  └─────────────────────────┘    └──────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Initial Request (GET /)
       ↓
┌──────────────────────────────────────────┐
│   Cloudflare Workers (Edge)              │
│  ┌────────────────────────────────────┐  │
│  │   Hono Router                      │  │
│  │   - Matches route                  │  │
│  └────────┬───────────────────────────┘  │
│           │                                │
│           │ 2. Delegate to React Router   │
│           ↓                                │
│  ┌────────────────────────────────────┐  │
│  │   React Router SSR                 │  │
│  │   - Run loader functions           │  │
│  │   - Render components to HTML      │  │
│  │   - Inject hydration script        │  │
│  └────────┬───────────────────────────┘  │
└───────────┼────────────────────────────────┘
            │
            │ 3. Return HTML + JS
            ↓
┌─────────────────────────┐
│   Browser               │
│   - Receives HTML       │
│   - Downloads JS        │
│   - Hydrates React app  │
└──────┬──────────────────┘
       │
       │ 4. WebSocket Connection
       ↓
┌──────────────────────────────────────────┐
│   Convex Database                        │
│   - Establish WebSocket                  │
│   - Subscribe to data changes            │
│   - Send mutations                       │
└──────┬───────────────────────────────────┘
       │
       │ 5. Real-time Updates
       ↓
┌─────────────────────────┐
│   Browser               │
│   - UI automatically    │
│     updates on changes  │
└─────────────────────────┘
```

## Layer Breakdown

### 1. Presentation Layer (Browser)

**Components**:
- React 19 application
- React Router 7 client-side routing
- TailwindCSS styling
- ShadCN UI components
- Convex React hooks
- Clerk authentication components

**Responsibilities**:
- User interface rendering
- Client-side navigation
- Form validation
- Optimistic UI updates
- Real-time data subscriptions

**Technologies**:
- TypeScript (strict mode)
- React 19
- React Router 7
- TailwindCSS 4
- Convex client (`useQuery`, `useMutation`)
- Clerk client (`useAuth`, `useUser`)

### 2. Edge Compute Layer (Cloudflare Workers)

**Components**:
- Hono web framework
- React Router SSR handler
- API route handlers
- CORS middleware
- Environment variable injection

**Responsibilities**:
- Server-side rendering
- API endpoint handling
- Request routing
- CORS configuration
- Initial HTML generation

**Technologies**:
- Hono (web framework)
- React Router SSR
- Cloudflare Workers runtime
- TypeScript

**Constraints**:
- 50-125ms CPU time limit
- 128MB memory limit
- No file system access
- V8 isolate runtime

### 3. Authentication Layer (Clerk)

**Components**:
- User authentication service
- JWT token issuance
- Session management
- User metadata storage

**Responsibilities**:
- User sign-up/sign-in
- Password management
- Social login (Google, GitHub)
- JWT token generation
- User role management
- Webhooks for user events

**Integration Points**:
- Issues JWT tokens with user claims
- Tokens validated by Convex
- User data synced to Convex database
- SSR auth checks in React Router loaders

### 4. Data Layer (Convex)

**Components**:
- Real-time database
- Query functions
- Mutation functions
- Action functions (external APIs)
- HTTP endpoints (webhooks)
- Schema definitions

**Responsibilities**:
- Data persistence
- Real-time subscriptions
- Business logic execution
- Data validation
- Access control
- Transaction management

**Data Flow**:
```
Client → WebSocket → Convex → Database
Client ← WebSocket ← Convex ← Real-time Update
```

## Technology Stack Map

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND STACK                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  React 19          - UI library                        │  │
│  │  React Router 7    - Routing & SSR                     │  │
│  │  TypeScript 5.7    - Type safety                       │  │
│  │  TailwindCSS 4     - Styling                           │  │
│  │  ShadCN UI         - Component library                 │  │
│  │  Convex Client     - Data hooks                        │  │
│  │  Clerk Client      - Auth hooks                        │  │
│  │  Framer Motion     - Animations                        │  │
│  │  React Hook Form   - Form management                   │  │
│  │  Zod               - Schema validation                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     BACKEND STACK                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Cloudflare Workers - Edge runtime                     │  │
│  │  Hono               - Web framework                    │  │
│  │  React Router SSR   - Server rendering                 │  │
│  │  Wrangler           - CLI & deployment                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     DATA STACK                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Convex             - Real-time database               │  │
│  │  Convex Functions   - Backend logic                    │  │
│  │  Type Generation    - Auto-generated types             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     AUTH STACK                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Clerk              - Authentication service           │  │
│  │  JWT                - Token format                     │  │
│  │  RBAC               - Role-based access control        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     DEV TOOLS STACK                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Bun                - Package manager & runtime        │  │
│  │  Vite               - Build tool & dev server          │  │
│  │  Biome              - Linter & formatter               │  │
│  │  TypeScript         - Type checking                    │  │
│  │  Husky              - Git hooks                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Deployment Topology

```
┌──────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT ENVIRONMENT                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Local Machine                                         │  │
│  │  - localhost:5173 (Vite dev server)                    │  │
│  │  - Convex Dev instance                                 │  │
│  │  - Clerk Dev environment                               │  │
│  │  - .env file for secrets                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   STAGING ENVIRONMENT                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Cloudflare Workers                                    │  │
│  │  - template-app-staging (worker)                       │  │
│  │  - Cloudflare Pages (static assets)                    │  │
│  │  ───────────────────────────────────────────────────   │  │
│  │  Convex Production                                     │  │
│  │  - Shared with production*                             │  │
│  │  ───────────────────────────────────────────────────   │  │
│  │  Clerk Production                                      │  │
│  │  - Production environment                              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   PRODUCTION ENVIRONMENT                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Cloudflare Workers                                    │  │
│  │  - template-app-prod (worker)                          │  │
│  │  - Cloudflare Pages (static assets)                    │  │
│  │  - 300+ edge locations globally                        │  │
│  │  ───────────────────────────────────────────────────   │  │
│  │  Convex Production                                     │  │
│  │  - Production database                                 │  │
│  │  - Functions deployed                                  │  │
│  │  ───────────────────────────────────────────────────   │  │
│  │  Clerk Production                                      │  │
│  │  - Production users                                    │  │
│  │  - Live authentication                                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

* Note: Consider separate Convex deployment for staging
```

## Request Processing Flow

### SSR Request (Initial Page Load)

```
1. User → https://app.example.com/todos
   ↓
2. Cloudflare Edge (nearest location)
   ↓
3. Cloudflare Workers (edge compute)
   ↓
4. Hono Router
   - Matches route
   - Applies middleware (CORS if API)
   ↓
5. React Router SSR Handler
   - Runs loader function
   - Checks auth (Clerk SSR)
   ↓
6. Clerk API (if auth check needed)
   - Validates session token
   - Returns user info
   ↓
7. React Router
   - Renders component tree to HTML
   - Injects hydration script
   - Includes serialized loader data
   ↓
8. Response to Browser
   - HTML (for instant display)
   - JavaScript (for hydration)
   - CSS (for styling)
   ↓
9. Browser
   - Displays HTML immediately
   - Downloads JS bundles
   - Hydrates React app
   ↓
10. Convex WebSocket Connection
    - Establish real-time connection
    - Subscribe to user's todos
```

### API Request (After Hydration)

```
1. User clicks "Add Todo"
   ↓
2. React Component
   - useMutation(api.todos.create)
   ↓
3. Convex Client (Browser)
   - Optimistic update (instant UI)
   - Send mutation via WebSocket
   ↓
4. Convex Server
   - Validate auth (JWT from Clerk)
   - Run mutation function
   - Validate input
   - Insert into database
   ↓
5. Database Transaction
   - ACID transaction
   - Insert todo record
   - Return ID
   ↓
6. Convex Real-time Engine
   - Notify all subscribed clients
   - Send updated data via WebSocket
   ↓
7. All Connected Browsers
   - Receive real-time update
   - React components re-render
   - UI updates automatically
```

## System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  SYSTEM BOUNDARY: Our Control                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Application Code                                     │  │
│  │  - React components (/app)                            │  │
│  │  - Convex functions (/convex)                         │  │
│  │  - Workers code (/workers)                            │  │
│  │  - Configuration files                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL BOUNDARY: Third-Party Services                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cloudflare (Infrastructure)                          │  │
│  │  - Workers runtime                                    │  │
│  │  - Pages hosting                                      │  │
│  │  - CDN network                                        │  │
│  │  ───────────────────────────────────────────────────  │  │
│  │  Convex (Database)                                    │  │
│  │  - Database storage                                   │  │
│  │  - Function execution                                 │  │
│  │  - Real-time infrastructure                           │  │
│  │  ───────────────────────────────────────────────────  │  │
│  │  Clerk (Authentication)                               │  │
│  │  - User management                                    │  │
│  │  - Authentication                                     │  │
│  │  - Session management                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Scaling Dimensions

### Horizontal Scaling (Auto)
- **Cloudflare Workers**: Automatic across 300+ locations
- **Convex**: Automatic (managed service)
- **Clerk**: Automatic (managed service)

### Vertical Scaling (Tier-Based)
- **Convex**: Upgrade plan for more storage/bandwidth
- **Clerk**: Upgrade plan for more MAU
- **Cloudflare**: Upgrade for higher CPU limits

### Data Scaling
- **Database size**: Convex tiers (1GB → 8GB → unlimited)
- **Request volume**: Pay-per-use pricing
- **WebSocket connections**: Managed by Convex

---

**Last Updated**: 2025-10-23
**Diagram Type**: System Architecture Overview
**Abstraction Level**: High-level to mid-level
