# Phase 1: Foundation & Authentication

## Overview
Establish the core infrastructure for the photo competition platform by extending the existing authentication system and setting up the database schema.

## Goals
- Set up role-based access control (SuperAdmin, Admin, User)
- Create database schema for all competition entities
- Implement basic admin infrastructure
- Establish route protection and middleware

## Database Schema Updates

### New Tables

#### competitions
```sql
- id (primary key)
- title (string, required)
- description (text, required)
- start_date (datetime)
- end_date (datetime)
- status (enum: active, inactive)
- created_at (datetime)
- updated_at (datetime)
```

#### categories
```sql
- id (primary key)
- name (string, required)
- competition_id (foreign key)
- max_photos_per_user (integer, default: 5)
- created_at (datetime)
- updated_at (datetime)
```

#### photos
```sql
- id (primary key)
- user_id (foreign key)
- category_id (foreign key)
- title (string, required)
- description (text, 20-500 chars, required)
- date_taken (datetime, required)
- location (string, required)
- camera_info (string, optional)
- settings (string, optional)
- file_path (string, required)
- status (enum: pending, approved, rejected)
- created_at (datetime)
- updated_at (datetime)
```

#### votes
```sql
- id (primary key)
- user_id (foreign key)
- photo_id (foreign key)
- created_at (datetime)
- unique constraint on (user_id, photo_id)
```

#### reports
```sql
- id (primary key)
- user_id (foreign key)
- photo_id (foreign key)
- reason (string, required)
- status (enum: pending, reviewed, resolved)
- created_at (datetime)
- updated_at (datetime)
```

#### winners
```sql
- id (primary key)
- photo_id (foreign key)
- category_id (foreign key)
- place (enum: first, second, third)
- created_at (datetime)
- unique constraint on (category_id, place)
```

## Authentication Extensions

### User Roles
Extend existing better-auth user schema:
- Add `role` field (enum: user, admin, superadmin)
- Default role: "user"
- Migration for existing users

### Role-based Middleware
- Create middleware to check user roles
- Protect admin routes
- Implement role-based UI rendering

### Route Protection
- Admin-only routes: `/admin/*`
- SuperAdmin-only routes: `/admin/users/*`
- User authentication required: `/submit/*`, `/vote/*`

## Admin Infrastructure

### Admin Layout
- Create admin navigation sidebar
- Admin header with user info and logout
- Breadcrumb navigation
- Role-based menu items

### Admin Dashboard
- Basic stats overview (placeholder for later phases)
- Quick access to key admin functions
- System status indicators

## Key Components to Create

### Database
- `api/database/schema.ts` - Add new table definitions
- Migration files for new schema
- Database connection utilities

### Authentication
- `packages/better-auth/types.ts` - Extend user types
- Role-based route guards
- Permission checking utilities

### Admin Components
- `app/components/admin-layout.tsx` - Admin shell
- `app/components/admin-sidebar.tsx` - Navigation
- Basic admin dashboard page

### Routes
- `/admin` - Admin dashboard
- `/admin/competitions` - Competition management (placeholder)
- `/admin/photos` - Photo moderation (placeholder)

## Success Criteria
- [ ] Database schema deployed with all tables
- [ ] User roles system functional
- [ ] Admin routes protected by authentication
- [ ] Admin layout renders correctly
- [ ] Role-based navigation works
- [ ] Existing authentication still functional

## Dependencies
- Existing better-auth system
- Drizzle ORM setup
- Current database connection

## Estimated Timeline
**3-4 days**

## Next Phase
Phase 2: Competition Management - Build on this foundation to create competition CRUD operations.