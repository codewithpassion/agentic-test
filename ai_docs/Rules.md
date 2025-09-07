# Bash Commands
- `bun dev`: Start development server with HMR
- `bun check`: Run typechecking and linting
- `bun biome:check`: Run Biome linter and formatter
- `bun build`: Build for production
- `bun deploy`: Build and deploy to Cloudflare
- `bun preview`: Preview production build locally
- `bun convex:dev`: Start Convex dev server
- `bun convex:deploy`: Deploy to production

# Style Guide

## Code Formatting
- Use Biome for linting and formatting
- Tab indentation (not spaces)
- Double quotes for strings
- Imports are auto-organized by Biome
- NEVER USE `any` as a type. We need strict Typescript typing

## Naming Conventions
- React components use PascalCase
- Files use kebab-case
- Variables use camelCase

## Project Structure
- Paths: Use `~/*` for app imports, `~~/*` for worker imports
- TypeScript: Use strict mode with explicit typing

## Frontend
- Use TailwindCSS for styling
- Utilize ShadCN components from `app/components/ui`
- Authentication through Clerk (external service)


## Backend
- Always use `bun` as the package manager
- Use `hono` for backend functionality
- Database: Convex real-time database with schemas in `/convex/schema.ts`
- Data storage: Convex with automatic real-time sync
- Use Convex functions for data access

## Environment Variables & Types
- **Never directly edit** `worker-configuration.d.ts` (auto-generated file)
- Add environment variables to `wrangler.jsonc` (`vars` section)
- Add secrets to `.env` for local development and `.env.example` for documentation
- Run `bun cf-typegen` to regenerate TypeScript types after changes
- Use `wrangler secret put VARIABLE_NAME` for production secrets

# MCP:
- make sure you check context7 for up to date library specifications

# Linting
After every change, run `bun check` to make sure the linter is happy