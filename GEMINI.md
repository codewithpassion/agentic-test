# Project Overview

This project is a full-stack React application built with React Router and deployed on Cloudflare. It's a todo application that includes features like user authentication, todo management, and an admin dashboard.

## Key Technologies

- **Framework:** React with React Router
- **Bundler:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS with ShadCN components
- **Linting & Formatting:** Biome
- **Database:** Cloudflare D1 with Drizzle ORM
- **Authentication:** better-auth
- **Deployment:** Cloudflare Workers

## Commands

- **`bun install`**: Installs all necessary dependencies for the project.
- **`bun dev`**: Starts the local development server with Hot Module Replacement (HMR). The application will be available at `http://localhost:5173`.
- **`bun check`**: Runs the linter and type checker to ensure code quality.
- **`bun build`**: Creates a production-ready build of the application.
- **`bun deploy`**: Deploys the application to Cloudflare.
- **`bun run db:update`**: Generates and applies database migrations locally.
- **`bun run db:deploy:prod`**: Generates and applies database migrations to the production database.

## Code Style and Linting

This project uses Biome for linting and formatting. The configuration can be found in the `biome.json` file. Please run `bun check` before committing any changes to ensure that the code adheres to the project's style guidelines.

## Database

The database is managed using Drizzle ORM and Cloudflare D1. Migrations are generated with `drizzle-kit` and applied with `wrangler`.

- To update the local database, run `bun run db:update`.
- To deploy database changes to production, run `bun run db:deploy:prod`.

## Deployment

The application is deployed to Cloudflare Workers.

- To deploy to production, run `bun run deploy:prod`.
- To deploy to staging, run `bun run deploy:staging`.