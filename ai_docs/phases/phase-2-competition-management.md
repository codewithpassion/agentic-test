# Phase 2: Competition Management

## Overview
Build the administrative interface for creating and managing photo competitions, including competition lifecycle management and category setup.

## Goals
- Create competition CRUD operations
- Implement category management system
- Build competition administration interface
- Establish competition lifecycle controls

## Core Features

### Competition Creation
- Competition form with validation
- Required fields: title, description, start_date, end_date
- Status management (active/inactive)
- Only one active competition at a time constraint

### Competition Management
- List all competitions with status indicators
- Edit existing competitions
- Archive/deactivate competitions
- Competition details view

### Category Management
- Default categories: "Urban", "Landscape"
- Create custom categories per competition
- Set photo submission limits per category
- Edit/delete categories (with safety checks)

### Competition Lifecycle
- Draft → Active → Completed workflow
- Automatic status transitions based on dates
- Admin override capabilities
- Competition scheduling

## Technical Implementation

### API Endpoints (tRPC)
```typescript
// Competition procedures
competitions.create
competitions.update
competitions.delete
competitions.list
competitions.getById
competitions.activate
competitions.deactivate

// Category procedures
categories.create
categories.update
categories.delete
categories.listByCompetition
```

### Database Operations
- Competition CRUD with validation
- Category management with competition association
- Status change logging
- Constraint enforcement (single active competition)

### Admin Interface Components

#### Competition Management Page
- Competition list with filters (active, past, draft)
- Quick actions (activate, edit, view)
- Create new competition button
- Status indicators and date displays

#### Competition Form
- Title and description fields
- Date pickers for start/end dates
- Status selector
- Form validation and error handling
- Save draft functionality

#### Category Management
- Category list per competition
- Add/edit category modal
- Photo limit settings per category
- Default category creation on new competition

### Validation Rules

#### Competition Validation
- Title: 3-100 characters, required
- Description: 10-2000 characters, required
- Start date: Must be future date (for new competitions)
- End date: Must be after start date
- Only one active competition allowed

#### Category Validation
- Name: 2-50 characters, required, unique per competition
- Max photos per user: 1-20, default 5
- Cannot delete category with existing photo submissions

## User Interface

### Competition List View
- Table/card layout with competition info
- Status badges (Draft, Active, Completed)
- Quick actions dropdown
- Search and filter capabilities
- Pagination for large lists

### Competition Detail View
- Competition information display
- Associated categories list
- Submission statistics (when available)
- Edit and manage actions

### Forms and Modals
- Competition creation/edit form
- Category management modals
- Confirmation dialogs for destructive actions
- Success/error notifications

## Key Components to Create

### Admin Pages
- `app/routes/admin.competitions._index.tsx` - Competition list
- `app/routes/admin.competitions.new.tsx` - Create competition
- `app/routes/admin.competitions.$id.tsx` - Edit competition
- `app/routes/admin.competitions.$id.categories.tsx` - Manage categories

### Components
- `app/components/admin/competition-list.tsx`
- `app/components/admin/competition-form.tsx`
- `app/components/admin/category-manager.tsx`
- `app/components/ui/status-badge.tsx`

### API
- `api/routes/competitions.ts` - tRPC procedures
- `api/routes/categories.ts` - tRPC procedures
- Validation schemas using Zod

## Success Criteria
- [ ] Admins can create new competitions
- [ ] Competition list displays correctly
- [ ] Edit existing competitions
- [ ] Category management works
- [ ] Only one active competition constraint enforced
- [ ] Form validation prevents invalid data
- [ ] Competition status transitions work
- [ ] UI is responsive and user-friendly

## Dependencies
- Phase 1: Foundation & Authentication
- tRPC setup
- Form handling libraries
- Date picker components

## Estimated Timeline
**4-5 days**

## Next Phase
Phase 3: Photo Submissions - Enable users to submit photos to active competitions.