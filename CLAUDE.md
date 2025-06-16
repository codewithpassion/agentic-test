# React Router Cloudflare Boilerplate

This is a modern React application deployed to Cloudflare with authentication, server-side rendering, and database integration.

## Key References
- @README.md - Project overview and basic setup
- @package.json - Available commands and dependencies
- ai_docs/Rules.md - Detailed code style guidelines and commands

## Quick Commands
- Development: `bun dev`
- Linting/Type check: `bun check`
- Build: `bun build`
- Deploy: `bun deploy`
- Database migrations: `bun db:update` (local), `bun db:apply --remote` (production)

## Project Structure
- `/app` - Frontend React code
- `/api` - Backend API code
- `/workers` - Cloudflare Workers
- `/packages` - Shared packages including authentication

## Technologies
- React 19 with React Router 7
- TypeScript with strict typing
- Cloudflare hosting with D1 and KV storage
- Tailwind for styling with ShadCN components
- Biome for linting and formatting
- tRPC for type-safe API calls
- Drizzle ORM with SQLite (D1) database
- Better-auth for authentication
- React Query for caching and data fetching

## Database Schema Notes
- User table field is `roles` (not `role`) - single text field with enum values
- Timestamp fields return Date objects but may be nullable - always check before using
- Use proper query building with `and()` for multiple WHERE conditions

## Authentication
- User roles: "user", "admin", "superadmin" 
- Admin procedures require authentication and role checking
- TRPCProvider is configured at root level in app/root.tsx

## Development Patterns
- Services pattern: Create service classes in `/api/services/` for complex database operations
- tRPC routers in `/api/trpc/routers/` with proper input validation using Zod
- Custom hooks in `/app/hooks/` for tRPC queries with caching
- Always handle loading and error states in components