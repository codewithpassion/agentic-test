# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# React Router Cloudflare Todo App

A modern, production-ready React application using React Router 7 deployed to Cloudflare with authentication, server-side rendering, and database integration.

## Essential Commands

### Development
```bash
bun dev              # Start dev server at http://localhost:5173
bun check            # Run all checks (types, linting, formatting)
bun biome:check      # Run Biome linter and formatter only
```

### Convex Database
```bash
bun convex:dev       # Start Convex dev server
bun convex:deploy    # Deploy to production
```

### Build & Deploy
```bash
bun build            # Build for production
bun preview          # Preview production build locally
bun deploy           # Build and deploy to Cloudflare
bun deploy:staging   # Deploy to staging environment
bun deploy:prod      # Deploy to production environment
```

### Debugging
```bash
bun tail:prod        # Stream production logs
bun tail:staging     # Stream staging logs
wrangler secret put VARIABLE_NAME # Add production secrets
```

## Architecture Overview

### Project Structure
- `/app` - Frontend React code (routes, components, hooks)
- `/convex` - Convex backend functions and schema
- `/workers` - Cloudflare Workers entry points

### Key Technologies
- **Frontend**: React 19, React Router 7, TypeScript, TailwindCSS, ShadCN UI
- **Backend**: Cloudflare Workers, Hono, Convex
- **Database**: Convex real-time database
- **Auth**: Clerk authentication (external service)
- **Tooling**: Bun, Biome, Wrangler

### Path Aliases
- `~/*` - Maps to `/app/*` (frontend imports)
- `~~/*` - Maps to root-level packages (worker imports)

## Code Style & Conventions

### Formatting Rules
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **TypeScript**: Strict mode - NEVER use `any` type
- **Imports**: Auto-organized by Biome
- **Linting**: Always run `bun check` after changes

### Naming Conventions
- React components: `PascalCase`
- Files: `kebab-case`
- Variables/functions: `camelCase`
- Database tables: `snake_case`

## Convex Data Layer

### Schema Location
- Database schema: `/convex/schema.ts`
- Functions: `/convex/` directory

### Data Access Patterns
1. **Convex Functions**: Define queries, mutations, and actions in `/convex/`
2. **Frontend Hooks**: Use Convex React hooks (`useQuery`, `useMutation`)
3. **Real-time Updates**: Automatic reactivity with Convex subscriptions
4. **Error Handling**: Always handle loading and error states in components

## Authentication System

### User Roles
- `user` - Default role for all users
- `admin` - Administrative access  
- `superadmin` - Full system access

### Clerk Authentication
- Authentication is handled by Clerk (external service)
- User roles stored in Clerk's publicMetadata
- Sign in/up via Clerk's prebuilt components
- Session management handled by Clerk

### Protected Routes
- Routes under `_auth.*` require authentication
- Admin routes check for admin/superadmin roles
- Use Convex auth helpers for protected functions

## Environment Variables

### Configuration Files
- `wrangler.jsonc` - Public variables in `vars` section
- `.dev.vars` - Local development secrets
- `.dev.vars.example` - Documentation of required secrets

### Type Generation
After modifying environment variables:
1. Update `wrangler.jsonc`
2. Run `bun cf-typegen` to regenerate types
3. Types appear in `worker-configuration.d.ts` (auto-generated)

### Required Secrets
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (client-side)
- `CLERK_SECRET_KEY` - Clerk secret key (server-side)

## Component Development

### ShadCN Components
```bash
bunx --bun shadcn@latest add button  # Add new component
```
Components are installed to `/app/components/ui/`

### Component Patterns
- Use `PublicLayout` wrapper for pages with navigation/footer
- Handle loading states with `LoadingSpinner` component
- Show errors with proper error boundaries
- Use `toast` for user notifications

## Deployment Environments

### Development
- URL: http://localhost:5173
- Database: Local Convex instance
- Email: Mock email service (logs to console)

### Staging
- Build: `bun build:staging`
- Deploy: `bun deploy:staging`
- Logs: `bun tail:staging`

### Production
- Database: Production Convex deployment
- Deploy: `bun deploy:prod`
- Logs: `bun tail:prod`

## Common Development Tasks

### Adding a New API Endpoint
1. Create Convex function in `/convex/` directory
2. Define schema if needed in `/convex/schema.ts`
3. Use Convex hooks in React components

### Adding a New Page
1. Create route file in `/app/routes/`
2. Use `_auth.` prefix for protected routes
3. Add `meta` export for SEO
4. Wrap in `PublicLayout` if needed

### Modifying Database Schema
1. Edit `/convex/schema.ts`
2. Update Convex functions as needed
3. Test with `bun convex:dev`
4. Deploy with `bun convex:deploy`

## Troubleshooting

### Type Errors
- Run `bun check` to see all type errors
- Check that `bun cf-typegen` was run after env changes
- Ensure no `any` types are used

### Database Errors
- Check Convex function arguments and return types
- Verify schema definitions match usage
- Use Convex dashboard for debugging

### Authentication Issues
- Check magic link expiration (15 minutes)
- Verify email service configuration
- Check user roles in database