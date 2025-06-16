# Task 3: Competition Detail View

## Overview
Create a comprehensive competition detail page that serves as the central hub for managing individual competitions, displaying key information, categories, and providing quick management actions.

## Goals
- Display complete competition information in a clear layout
- Show associated categories and their settings
- Provide quick management actions (activate, edit, etc.)
- Display competition statistics and metrics
- Serve as navigation hub to related management pages

## Files to Create/Modify

### Routes
- **Create**: `app/routes/_auth.admin.competitions.$id._index.tsx`
  - Competition detail page with ID parameter
  - Load competition and category data
  - Handle quick actions (activate/deactivate)
  - Error handling for non-existent competitions

### Components
- **Create**: `app/components/admin/competition-detail.tsx`
  - Main detail view component
  - Information display sections
  - Action buttons and controls
  - Statistics dashboard

## Implementation Details

### Page Layout
```typescript
// Key sections to implement:
1. Competition Header
   - Title, description, and status badge
   - Quick action buttons (Edit, Activate/Deactivate, Delete)
   - Competition dates and duration

2. Statistics Overview
   - Total categories
   - Photo submissions count (when available)
   - Active participants count
   - Competition timeline visualization

3. Categories Section
   - List of categories with photo limits
   - Add new category button
   - Edit/delete category actions
   - Category usage statistics

4. Management Actions
   - Edit competition details
   - Manage categories
   - View submissions (future phase)
   - Generate reports (future phase)
```

### Competition Information Display
- **Header Section**:
  - Large competition title
  - Status badge with proper styling
  - Competition description (formatted text)
  - Created/updated timestamps
  
- **Timeline Section**:
  - Visual timeline showing start date, current date, end date
  - Days remaining indicator
  - Duration calculation
  - Phase indicators (upcoming, active, completed)

- **Settings Section**:
  - Competition configuration details
  - Category count and limits
  - Submission rules summary

### Quick Actions
- **Primary Actions**:
  - Edit Competition (navigate to edit form)
  - Manage Categories (navigate to category management)
  
- **Status Actions**:
  - Activate Competition (with single-active validation)
  - Deactivate Competition
  - Mark as Completed
  - Archive Competition

- **Danger Actions**:
  - Delete Competition (with confirmation)
  - Reset Submissions (future phase)

### Categories Display
```typescript
// Category list features:
- Category name and description
- Max photos per user setting
- Current submission count (when available)
- Quick edit button
- Delete button (with safety checks)
- Add new category button
```

### Statistics Integration
- Use dashboard service data where possible
- Real-time statistics updates
- Loading states for async data
- Error handling for failed statistics

## Business Logic

### Status Management
- Show appropriate actions based on current status
- Validate single active competition rule
- Handle status transition confirmations
- Update related UI elements after status changes

### Category Safety
- Prevent deletion of categories with submissions
- Show warnings for destructive actions
- Confirm bulk operations

### Permissions
- Ensure user has admin privileges
- Hide actions based on competition state
- Show read-only view for insufficient permissions

## User Experience

### Loading States
- Skeleton loading for competition data
- Progressive loading of statistics
- Smooth transitions between states

### Error Handling
- 404 page for non-existent competitions
- Graceful degradation for failed statistics
- Retry mechanisms for transient failures

### Success Feedback
- Toast notifications for successful actions
- Visual confirmation of status changes
- Smooth navigation transitions

### Responsive Design
- Mobile-friendly layout
- Collapsible sections on small screens
- Touch-friendly action buttons
- Readable typography at all sizes

## Navigation Integration
- Breadcrumb navigation
- Back to competitions list
- Links to related management pages
- Deep linking support

## Data Requirements
- Competition details from tRPC
- Category list with metadata
- Statistics from dashboard service
- User permissions context

## Success Criteria
- [ ] Competition information displays correctly
- [ ] All quick actions work without errors
- [ ] Status changes are properly validated
- [ ] Categories section shows accurate data
- [ ] Statistics load and display properly
- [ ] Page handles non-existent competitions gracefully
- [ ] Mobile layout is fully functional
- [ ] Navigation works from all entry points
- [ ] Loading states provide good UX
- [ ] Error states are informative and actionable