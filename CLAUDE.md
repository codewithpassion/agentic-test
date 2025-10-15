# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ MANDATORY REQUIREMENTS - READ FIRST

1. **NO `any` TYPES IN TYPESCRIPT** - This project uses strict TypeScript with Biome. Using `any` will break the build.
2. **RUN `bun check` BEFORE PRESENTING CODE** - Verify all type checking passes
3. **USE PROPER TYPES** - Import from libraries, define interfaces, or use `unknown` with type guards

# React Router Cloudflare TODO app

A modern, production-ready CRM application using React Router 7 deployed to Cloudflare with authentication, server-side rendering, and database integration.

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

### 🚨 CRITICAL TypeScript Rules - MUST FOLLOW

**ABSOLUTELY NO `any` TYPES ALLOWED - THIS IS NON-NEGOTIABLE**

- The codebase uses TypeScript in strict mode with Biome linting
- Using `any` type will cause build failures and require rework
- **Before writing ANY TypeScript code:**
  1. Understand the existing types being used
  2. Import proper types from libraries
  3. Define explicit interfaces/types when needed
  4. Use `unknown` and type guards if type is truly unknown
  5. Use generic types `<T>` for flexible but type-safe code

**Instead of `any`, use:**

- `unknown` - for truly unknown types (requires type guards)
- `Record<string, unknown>` - for objects with unknown structure
- Specific types like `string`, `number`, `boolean`
- Union types like `string | number`
- Imported types from libraries (e.g., `import type { User } from "@clerk/nextjs/server"`)
- Defined interfaces or type aliases
- Generic constraints like `<T extends object>`

### Formatting Rules

- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **Imports**: Auto-organized by Biome
- **Linting**: Always run `bun check` after changes

### Naming Conventions

- React components: `PascalCase`
- Files: `kebab-case`
- Variables/functions: `camelCase`
- Database tables: `snake_case`

### Common Type Patterns in This Codebase

```typescript
// Convex types - ALWAYS import from generated files
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { api } from "../../convex/_generated/api";

// Clerk types - import from Clerk packages
import type { User } from "@clerk/nextjs/server";

// React Router types
import type { Route } from "./+types/route-name";

// Component props - define explicit interfaces
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

// API responses - use proper typing
interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Form data - define interfaces
interface FormData {
  email: string;
  password: string;
}

// NEVER DO THIS:
// const user: any = getData();  ❌
// const props: any = { ... };   ❌
// function process(data: any)   ❌
```

## Convex Data Layer

### Schema Location

- Database schema: `/convex/schema.ts`
- Functions: `/convex/` directory

### Data Access Patterns

1. **Convex Functions**: Define queries, mutations, and actions in `/convex/`
2. **Frontend Hooks**: Use Convex React hooks (`useQuery`, `useMutation`)
3. **Real-time Updates**: Automatic reactivity with Convex subscriptions
4. **Error Handling**: Always handle loading and error states in components

## Authentication & Authorization System

### User Roles

- `user` - Default role for all users (basic access)
- `admin` - Administrative access (can view/manage users, access admin dashboard)
- `superadmin` - Full system access (all permissions including role management)

### Clerk Authentication

- Authentication is handled by Clerk (external service)
- User roles stored in Clerk's publicMetadata
- Sign in/up via Clerk's prebuilt components
- Session management handled by Clerk

### Permission System

The application uses a granular permission system defined in two places:

#### 1. Worker-level Permissions (`workers/types.ts`)

Used for server-side authorization in Cloudflare Workers:

```typescript
export const PERMISSIONS = {
  // Admin permissions
  ADMIN_ACCESS: "admin_access",
  VIEW_USERS: "view_users",

  // SuperAdmin permissions
  MANAGE_USERS: "manage_users",
  ASSIGN_ROLES: "assign_roles",
  SYSTEM_CONFIG: "system_config",
} as const;

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [],
  admin: [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.VIEW_USERS],
  superadmin: [
    /* all permissions */
  ],
};
```

#### 2. Client-level Permissions (`app/lib/permissions.ts`)

Used for frontend authorization and UI permission checks:

```typescript
export const PERMISSIONS = {
  // User management
  "users.view": "View user list and details",
  "users.create": "Create new users",
  "users.edit": "Edit user information",
  "users.delete": "Delete users",
  "users.manage_roles": "Manage user roles",

  // Admin permissions
  "admin.access": "Access admin dashboard",
  "admin.view_stats": "View system statistics",

  // System permissions
  "system.manage_api": "Manage API keys and webhooks",
  "system.manage_security": "Manage security settings",
  // ... more permissions
};
```

**Helper Functions Available:**

- `rolesHavePermission(roles, permission)` - Check if roles have a specific permission
- `getPermissionsForRoles(roles)` - Get all permissions for a set of roles
- `canAssignRole(assignerRoles, roleToAssign)` - Check if user can assign a role
- `canManageUser(actorRoles, targetRoles)` - Check if user can manage another user
- `PermissionChecker` class - For React components

**Usage in Components:**

```typescript
import { useAuth } from "~/hooks/use-auth";

function MyComponent() {
  const { hasPermission, hasRole } = useAuth();

  if (hasPermission("users.edit")) {
    // Show edit UI
  }

  if (hasRole("admin")) {
    // Show admin features
  }
}
```

### Protected Routes

- Routes under `_auth.*` require authentication
- Admin routes check for admin/superadmin roles
- Use Convex auth helpers for protected functions

## Environment Variables

### Configuration Files

- `wrangler.jsonc` - Public variables in `vars` section
- `.env` - Local development secrets
- `.env.example` - Documentation of required secrets

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

### Type Errors - MUST FIX IMMEDIATELY

**If you encounter type errors, DO NOT use `any` to bypass them:**

- Run `bun check` to see all type errors
- Check that `bun cf-typegen` was run after env changes
- **Common fixes for type errors:**
  - Import the correct type from the library
  - Check existing code for how similar types are handled
  - Define a proper interface or type alias
  - Use `unknown` with type narrowing if type is dynamic
  - Look for existing type definitions in the codebase
- **NEVER commit or present code with `any` types**

### Database Errors

- Check Convex function arguments and return types
- Verify schema definitions match usage
- Use Convex dashboard for debugging

### Authentication Issues

- Check magic link expiration (15 minutes)
- Verify email service configuration
- Check user roles in database
