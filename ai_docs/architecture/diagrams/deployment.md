# Deployment Architecture Diagram

This document details the deployment architecture, infrastructure components, and deployment processes.

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Deployment Environments](#deployment-environments)
3. [Build and Deployment Pipeline](#build-and-deployment-pipeline)
4. [Network Architecture](#network-architecture)
5. [Monitoring and Observability](#monitoring-and-observability)

---

## Infrastructure Overview

### Cloud Providers and Services

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE (Primary Infrastructure)          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Cloudflare Workers (Compute)                              │  │
│  │  - V8 Isolate Runtime                                      │  │
│  │  - Global deployment (300+ locations)                      │  │
│  │  - Auto-scaling                                            │  │
│  │  - CPU: 50ms (free) / 125ms (paid) per request             │  │
│  │  - Memory: 128MB per worker                                │  │
│  │  ───────────────────────────────────────────────────────   │  │
│  │  Deployed Code:                                            │  │
│  │  - workers/app.ts (entry point)                            │  │
│  │  - Hono web framework                                      │  │
│  │  - React Router SSR handler                                │  │
│  │  - Environment variables                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Cloudflare Pages (Static Hosting)                         │  │
│  │  - React build output                                      │  │
│  │  - JavaScript bundles                                      │  │
│  │  - CSS files                                               │  │
│  │  - Source maps (production)                                │  │
│  │  - Global CDN distribution                                 │  │
│  │  - Cache TTL: 1 hour (configurable)                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Cloudflare Secrets (Environment Variables)                │  │
│  │  - CLERK_SECRET_KEY (server-side only)                     │  │
│  │  - Other sensitive config                                  │  │
│  │  - Not accessible from client                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Cloudflare Security                                       │  │
│  │  - DDoS protection (automatic)                             │  │
│  │  - WAF (Web Application Firewall)                          │  │
│  │  - Rate limiting (configurable)                            │  │
│  │  - TLS 1.3 termination                                     │  │
│  │  - Bot management                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     CONVEX (Database Platform)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Convex Deployment                                         │  │
│  │  - Region: Auto-selected (typically us-east or eu-west)    │  │
│  │  - Functions: /convex/**/*.ts                              │  │
│  │  - Schema: /convex/schema.ts                               │  │
│  │  - HTTP endpoints: /convex/http.ts                         │  │
│  │  ───────────────────────────────────────────────────────   │  │
│  │  Database:                                                 │  │
│  │  - ACID transactions                                       │  │
│  │  - Real-time subscriptions (WebSocket)                     │  │
│  │  - Automatic backups                                       │  │
│  │  - Point-in-time recovery                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Convex Environment Variables                              │  │
│  │  - CLERK_JWT_ISSUER_DOMAIN                                 │  │
│  │  - Set via Convex dashboard                                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     CLERK (Authentication Service)                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Clerk Application                                         │  │
│  │  - User database                                           │  │
│  │  - Authentication logic                                    │  │
│  │  - JWT token issuance                                      │  │
│  │  - Session management                                      │  │
│  │  - Hosted auth pages                                       │  │
│  │  - Webhooks                                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Clerk Configuration                                       │  │
│  │  - Allowed origins (CORS)                                  │  │
│  │  - JWT templates                                           │  │
│  │  - Social providers (Google, GitHub)                       │  │
│  │  - User metadata schema                                    │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Deployment Environments

### Environment Comparison Matrix

| Aspect | Development | Staging | Production |
|--------|------------|---------|------------|
| **URL** | `localhost:5173` | `template-app-staging.pages.dev` | `template-app-prod.pages.dev` |
| **Workers** | Local (Wrangler) | `template-app-staging` | `template-app-prod` |
| **Convex** | Dev instance | Prod instance* | Prod instance |
| **Clerk** | Dev app | Prod app | Prod app |
| **Secrets** | `.env` file | Wrangler secrets | Wrangler secrets |
| **Build** | Dev mode | Production build | Production build |
| **Source Maps** | Inline | External | External |
| **Minification** | No | Yes | Yes |
| **Debug Logs** | Enabled | Enabled | Disabled |

*Note: Staging and production share same Convex deployment (consider separating for true isolation)

### Environment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LOCAL DEVELOPMENT ENVIRONMENT                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Developer Machine                                    │  │
│  │  ─────────────────                                    │  │
│  │  Processes:                                           │  │
│  │  - Vite dev server (port 5173)                        │  │
│  │  - Wrangler local worker (port 8787)                  │  │
│  │  - Convex dev (npx convex dev)                        │  │
│  │  ───────────────────────────────────────────────────  │  │
│  │  Environment:                                         │  │
│  │  - .env file (gitignored)                             │  │
│  │  - Hot module replacement (HMR)                       │  │
│  │  - Source maps inline                                 │  │
│  │  - React DevTools enabled                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  External Services:                                         │
│  - Convex Dev instance                                      │
│  - Clerk Dev application                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  STAGING ENVIRONMENT                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Cloudflare Workers                                   │  │
│  │  - Name: template-app-staging                         │  │
│  │  - Environment: staging (wrangler.jsonc)              │  │
│  │  - Vars: DEV_MODE=false                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  External Services:                                         │
│  - Convex Production instance (shared with prod)            │
│  - Clerk Production app                                     │
│                                                              │
│  Access:                                                    │
│  - Public URL (testing only)                                │
│  - Basic auth (optional)                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION ENVIRONMENT                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Cloudflare Workers                                   │  │
│  │  - Name: template-app-prod                            │  │
│  │  - Environment: production (wrangler.jsonc)           │  │
│  │  - Vars: DEV_MODE=false                               │  │
│  │  - Secrets: CLERK_SECRET_KEY, etc.                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  External Services:                                         │
│  - Convex Production instance                               │
│  - Clerk Production app                                     │
│                                                              │
│  Access:                                                    │
│  - Public URL (live users)                                  │
│  - Custom domain (optional)                                 │
│  - Analytics enabled                                        │
│  - Error tracking (future)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Build and Deployment Pipeline

### Manual Deployment Flow (Current)

```
┌──────────────┐
│  Developer   │
└──────┬───────┘
       │
       │ 1. Make code changes
       ↓
┌─────────────────────────────┐
│  Git Commit & Push          │
│  git add .                  │
│  git commit -m "..."        │
│  git push origin main       │
└──────┬──────────────────────┘
       │
       │ 2. Run checks locally
       ↓
┌─────────────────────────────┐
│  bun check                  │
│  - Type checking (tsc)      │
│  - Linting (Biome)          │
│  - Formatting (Biome)       │
└──────┬──────────────────────┘
       │
       │ 3. Build for production
       ↓
┌─────────────────────────────┐
│  bun build:prod             │
│  ───────────────            │
│  - React Router build       │
│  - Vite optimization        │
│  - Bundle minification      │
│  - Source map generation    │
│  - Output: build/ directory │
└──────┬──────────────────────┘
       │
       │ 4. Deploy Convex (if schema/functions changed)
       ↓
┌─────────────────────────────┐
│  bun convex:deploy          │
│  ───────────────            │
│  - Upload functions         │
│  - Apply schema migrations  │
│  - Generate types           │
│  - Deploy to production     │
└──────┬──────────────────────┘
       │
       │ 5. Deploy to Cloudflare
       ↓
┌─────────────────────────────┐
│  wrangler deploy            │
│  ────────────────           │
│  - Upload worker code       │
│  - Upload static assets     │
│  - Update environment vars  │
│  - Deploy to 300+ locations │
└──────┬──────────────────────┘
       │
       │ 6. Deployment complete (~30 seconds)
       ↓
┌─────────────────────────────┐
│  Live on Cloudflare Edge    │
│  - New code active globally │
│  - Previous version purged  │
└─────────────────────────────┘
```

### Recommended CI/CD Pipeline (Future)

```
┌──────────────┐
│  Git Push    │
│  to main     │
└──────┬───────┘
       │
       │ Trigger: GitHub Actions
       ↓
┌─────────────────────────────────────────┐
│  CI Pipeline (GitHub Actions)           │
│  ─────────────────────────────────────  │
│  Job: Build & Test                      │
│  ├─ Checkout code                       │
│  ├─ Setup Bun                           │
│  ├─ Install dependencies                │
│  ├─ bun check (type & lint)             │
│  ├─ bun test (if tests exist)           │
│  ├─ bun build:prod                      │
│  └─ Upload artifacts                    │
└──────┬──────────────────────────────────┘
       │
       │ If main branch & all checks pass
       ↓
┌─────────────────────────────────────────┐
│  CD Pipeline (GitHub Actions)           │
│  ─────────────────────────────────────  │
│  Job: Deploy                            │
│  ├─ Download build artifacts            │
│  ├─ Deploy Convex (if changed)          │
│  │   convex deploy --cmd 'bun ...'      │
│  ├─ Deploy to Staging                   │
│  │   wrangler deploy -e staging         │
│  ├─ Run smoke tests on staging          │
│  ├─ Wait for approval (manual gate)     │
│  └─ Deploy to Production                │
│      wrangler deploy -e production      │
└──────┬──────────────────────────────────┘
       │
       │ Deployment complete
       ↓
┌─────────────────────────────────────────┐
│  Post-Deployment                        │
│  ├─ Notify Slack/Discord                │
│  ├─ Create deployment record            │
│  └─ Tag release in Git                  │
└─────────────────────────────────────────┘
```

### Rollback Strategy

```
┌──────────────────────────────────────────────────────────┐
│  Rollback Methods                                        │
│  ────────────────                                        │
│                                                          │
│  1. Cloudflare Workers Rollback                         │
│     wrangler rollback                                   │
│     - Reverts to previous deployment                    │
│     - Takes effect in <30 seconds                       │
│     - Previous version is cached for 7 days             │
│                                                          │
│  2. Git Revert + Redeploy                               │
│     git revert HEAD                                     │
│     git push                                            │
│     bun deploy:prod                                     │
│     - More controlled                                   │
│     - Creates audit trail                               │
│                                                          │
│  3. Convex Rollback                                     │
│     - No built-in rollback                              │
│     - Must deploy previous version                      │
│     - Schema changes cannot be rolled back easily       │
│     - Plan schema changes carefully!                    │
│                                                          │
│  4. Feature Flags (Future)                              │
│     - Toggle features without deployment                │
│     - Gradual rollout                                   │
│     - A/B testing                                       │
└──────────────────────────────────────────────────────────┘
```

---

## Network Architecture

### Request Flow Through Infrastructure

```
┌────────────┐
│   User     │
│  (Global)  │
└─────┬──────┘
      │
      │ HTTPS Request
      │ https://app.example.com/todos
      ↓
┌─────────────────────────────────────────────────────────┐
│  Cloudflare DNS                                         │
│  - Resolve domain to Cloudflare IP                      │
│  - Anycast routing to nearest edge location             │
└─────┬───────────────────────────────────────────────────┘
      │
      ↓
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Edge Location (Nearest to User)            │
│  - 300+ locations worldwide                             │
│  - Singapore, London, New York, Sydney, etc.            │
└─────┬───────────────────────────────────────────────────┘
      │
      │ TLS Termination
      ↓
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Security Layer                              │
│  ├─ DDoS Protection                                     │
│  ├─ WAF (Web Application Firewall)                      │
│  ├─ Bot Detection                                       │
│  ├─ Rate Limiting                                       │
│  └─ Cache Check (for static assets)                     │
└─────┬───────────────────────────────────────────────────┘
      │
      ↓ Dynamic request (not cached)
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Workers (Edge Compute)                      │
│  ├─ Hono router                                         │
│  ├─ Check route                                         │
│  │   /api/* → API handler                               │
│  │   /*     → React Router SSR                          │
│  └─ Execute worker code                                 │
└─────┬───────────────────────────────────────────────────┘
      │
      ↓ If SSR needed
┌─────────────────────────────────────────────────────────┐
│  React Router SSR                                       │
│  ├─ Run loader functions                                │
│  ├─ Check auth (call Clerk API)  ────────────────────┐  │
│  ├─ Render React to HTML                             │  │
│  └─ Return HTML + hydration data                     │  │
└─────┬─────────────────────────────────────────────────┘  │
      │                                                     │
      ↓                                                     ↓
┌─────────────────────────┐                    ┌──────────────────┐
│  Return to User         │                    │  Clerk API       │
│  - HTML (server-rendered│                    │  - Validate auth │
│  - JavaScript bundles   │                    │  - Return user   │
│  - CSS files            │                    └──────────────────┘
└─────┬───────────────────┘
      │
      ↓ Browser processes
┌─────────────────────────────────────────────────────────┐
│  User Browser                                           │
│  ├─ Parse HTML (instant display)                        │
│  ├─ Download JS (from Cloudflare Pages CDN)             │
│  ├─ Hydrate React app                                   │
│  └─ Establish WebSocket to Convex ──────────────────┐   │
└─────────────────────────────────────────────────────┘   │
                                                          │
                                                          ↓
                                              ┌─────────────────────┐
                                              │  Convex Database    │
                                              │  - Real-time sync   │
                                              │  - Query execution  │
                                              └─────────────────────┘
```

### Geographic Distribution

```
┌──────────────────────────────────────────────────────────┐
│  CLOUDFLARE GLOBAL NETWORK                               │
│  ──────────────────────────                              │
│                                                          │
│  North America:                                          │
│  - Los Angeles, San Francisco, Seattle                   │
│  - Denver, Chicago, Atlanta                              │
│  - New York, Toronto, Mexico City                        │
│                                                          │
│  Europe:                                                 │
│  - London, Paris, Frankfurt                              │
│  - Amsterdam, Stockholm, Madrid                          │
│  - Milan, Warsaw, Moscow                                 │
│                                                          │
│  Asia Pacific:                                           │
│  - Singapore, Tokyo, Hong Kong                           │
│  - Sydney, Mumbai, Seoul                                 │
│  - Bangkok, Jakarta, Taipei                              │
│                                                          │
│  Latin America:                                          │
│  - São Paulo, Buenos Aires, Santiago                     │
│                                                          │
│  Africa & Middle East:                                   │
│  - Johannesburg, Dubai, Tel Aviv                         │
│                                                          │
│  Total: 300+ locations worldwide                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  CONVEX DATABASE                                         │
│  ───────────────                                         │
│                                                          │
│  Primary Region: us-east-1 (or eu-west-1)                │
│  - Single region deployment (current)                    │
│  - ACID transactions                                     │
│  - Automatic replication within region                   │
│                                                          │
│  Future: Multi-region (when available)                   │
│  - Primary + read replicas                               │
│  - Global distribution                                   │
│  - Eventual consistency for reads                        │
└──────────────────────────────────────────────────────────┘
```

---

## Monitoring and Observability

### Logging Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Cloudflare Workers Logs                                 │
│  ─────────────────────────                               │
│  Real-time:                                              │
│    wrangler tail -e production                           │
│                                                          │
│  Logs Include:                                           │
│  - console.log() outputs                                 │
│  - Uncaught exceptions                                   │
│  - Request metadata (URL, method, headers)               │
│  - Response status codes                                 │
│  - Execution duration                                    │
│                                                          │
│  Retention: Last 1,000 requests (7 days on paid plan)    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Convex Logs                                             │
│  ───────────                                             │
│  Dashboard:                                              │
│    https://dashboard.convex.dev                          │
│                                                          │
│  Logs Include:                                           │
│  - Function execution traces                             │
│  - Query/mutation durations                              │
│  - Errors and stack traces                               │
│  - Database operations                                   │
│                                                          │
│  Features:                                               │
│  - Time-travel debugging                                 │
│  - Function performance metrics                          │
│  - Query inspector                                       │
│                                                          │
│  Retention: 30 days                                      │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Clerk Logs                                              │
│  ──────────                                              │
│  Dashboard:                                              │
│    https://dashboard.clerk.com                           │
│                                                          │
│  Logs Include:                                           │
│  - Authentication events                                 │
│  - User sign-ups/sign-ins                                │
│  - Failed login attempts                                 │
│  - API key usage                                         │
│  - Webhook deliveries                                    │
│                                                          │
│  Retention: 30 days                                      │
└──────────────────────────────────────────────────────────┘
```

### Metrics and Analytics

```
┌──────────────────────────────────────────────────────────┐
│  Cloudflare Analytics                                    │
│  ────────────────────                                    │
│  Available Metrics:                                      │
│  - Request volume (requests/sec)                         │
│  - Bandwidth usage (GB transferred)                      │
│  - Error rate (4xx, 5xx)                                 │
│  - Cache hit ratio                                       │
│  - P50/P95/P99 latency                                   │
│  - Geographic distribution                               │
│  - Top URLs accessed                                     │
│                                                          │
│  Dashboards:                                             │
│  - Real-time overview                                    │
│  - Historical trends (30 days)                           │
│  - Security events                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Convex Metrics                                          │
│  ──────────────                                          │
│  Available Metrics:                                      │
│  - Function execution count                              │
│  - Query/mutation duration                               │
│  - Database size                                         │
│  - Bandwidth usage                                       │
│  - Active subscriptions (WebSocket connections)          │
│  - Error rate                                            │
│                                                          │
│  Performance Tracking:                                   │
│  - Slowest functions                                     │
│  - Most called functions                                 │
│  - Table scan warnings                                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Clerk Analytics                                         │
│  ───────────────                                         │
│  Available Metrics:                                      │
│  - Monthly Active Users (MAU)                            │
│  - Sign-up conversion rate                               │
│  - Authentication method breakdown                       │
│  - Session duration                                      │
│  - Geographic distribution                               │
└──────────────────────────────────────────────────────────┘
```

### Alerting Strategy (Recommended)

```
┌──────────────────────────────────────────────────────────┐
│  Critical Alerts                                         │
│  ───────────────                                         │
│  - Error rate > 5% (5 minutes)                           │
│    → Notify: Slack/PagerDuty                             │
│                                                          │
│  - P95 latency > 2 seconds (5 minutes)                   │
│    → Notify: Slack                                       │
│                                                          │
│  - Cloudflare Workers CPU exhaustion                     │
│    → Notify: Slack/Email                                 │
│                                                          │
│  - Convex database size > 80% of tier limit              │
│    → Notify: Email                                       │
│                                                          │
│  - Clerk MAU > 80% of tier limit                         │
│    → Notify: Email                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Warning Alerts                                          │
│  ──────────────                                          │
│  - Error rate > 1% (15 minutes)                          │
│    → Notify: Slack                                       │
│                                                          │
│  - Bandwidth usage increasing rapidly                    │
│    → Notify: Email (daily summary)                       │
│                                                          │
│  - Slow Convex functions (> 500ms)                       │
│    → Notify: Email (weekly report)                       │
└──────────────────────────────────────────────────────────┘
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run `bun check` (type checking + linting)
- [ ] Run tests (when implemented)
- [ ] Review code changes
- [ ] Update CHANGELOG (if using)
- [ ] Verify environment variables up to date
- [ ] Check Convex schema changes (if any)
- [ ] Review security implications

### Deployment

- [ ] Deploy Convex (if schema/functions changed)
  ```bash
  bun convex:deploy
  ```
- [ ] Build production bundle
  ```bash
  bun build:prod
  ```
- [ ] Deploy to staging first (if exists)
  ```bash
  wrangler deploy -e staging
  ```
- [ ] Test staging deployment
- [ ] Deploy to production
  ```bash
  wrangler deploy -e production
  ```

### Post-Deployment

- [ ] Verify deployment successful (check URL)
- [ ] Monitor error rates (first 15 minutes)
- [ ] Check Cloudflare analytics
- [ ] Test critical user flows
- [ ] Notify team of deployment
- [ ] Tag release in Git (if using semantic versioning)

### Rollback (If Issues)

- [ ] Assess severity of issue
- [ ] Rollback Cloudflare Workers
  ```bash
  wrangler rollback
  ```
- [ ] If Convex changes, deploy previous version
- [ ] Notify users if necessary
- [ ] Post-mortem analysis

---

**Last Updated**: 2025-10-23
**Diagram Type**: Deployment Architecture
**Use Case**: Understanding infrastructure, deployment, and operations
