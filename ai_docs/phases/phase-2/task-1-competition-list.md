# Task 1: Competition List Interface

## Overview
Replace the placeholder competition management page with a fully functional competition list interface that allows admins to view, filter, and manage competitions.

## Goals
- Display all competitions in a clean, organized interface
- Implement filtering by status (active, draft, completed, inactive)
- Add search functionality by competition title
- Provide quick actions for common operations
- Include pagination for large competition lists

## Files to Create/Modify

### Routes
- **Modify**: `app/routes/_auth.admin.competitions._index.tsx`
  - Replace placeholder content with real competition list
  - Add filtering and search state management
  - Implement pagination logic
  - Connect to tRPC queries

### Components
- **Create**: `app/components/admin/competition-list.tsx`
  - Main competition list component
  - Table/grid layout with competition details
  - Status badges and action buttons
  - Loading and error states

## Implementation Details

### Competition List Component
```typescript
// Key features to implement:
- Competition cards/table rows with:
  - Title and description preview
  - Start/end dates with formatting
  - Status badge (active, draft, completed, inactive)
  - Quick action dropdown (edit, activate/deactivate, delete)
  - Photo count and category count (if available)
  
- Filtering controls:
  - Status filter dropdown
  - Search input for title
  - Date range picker (optional)
  
- Pagination:
  - Page size selector (10, 20, 50)
  - Navigation buttons
  - Total count display
```

### Status Badge Styling
- **Active**: Green badge with "Active" text
- **Draft**: Gray badge with "Draft" text  
- **Completed**: Blue badge with "Completed" text
- **Inactive**: Orange badge with "Inactive" text

### Quick Actions
- Edit competition (navigate to edit page)
- Activate/Deactivate (with confirmation)
- Delete competition (with confirmation dialog)
- View details (navigate to competition detail page)

## tRPC Integration
- Use `trpc.competitions.list.useQuery()` with proper filtering
- Implement proper loading states and error handling
- Add optimistic updates for quick actions
- Use React Query invalidation for data freshness

## UI/UX Requirements
- Responsive design (mobile-friendly)
- Loading skeletons while data loads
- Empty state when no competitions exist
- Error state with retry functionality
- Confirmation dialogs for destructive actions

## Validation & Business Rules
- Only show activate button if no other active competition exists
- Disable delete for active competitions
- Show warning for competitions with existing submissions
- Validate user permissions for each action

## Success Criteria
- [ ] Competition list displays correctly with real data
- [ ] Filtering by status works properly
- [ ] Search functionality filters by title
- [ ] Pagination works with proper page navigation
- [ ] Status badges display correctly
- [ ] Quick actions work without errors
- [ ] Loading and error states are handled
- [ ] Interface is responsive on mobile devices
- [ ] User can create new competition from this page