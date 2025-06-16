# Task 5: User Submissions Dashboard

## Objective
Create a comprehensive dashboard for users to view, edit, and manage their photo submissions across all competitions.

## Requirements
- Display user's submissions across all competitions
- Edit photo metadata (not the photo file itself)
- Delete own submissions
- Submission status tracking
- Category organization and filtering
- Submission statistics

## Dashboard Features

### Submissions Overview
- Grid view of user's photos
- Competition and category grouping
- Submission status indicators
- Quick statistics summary
- Search and filter capabilities

### Submission Management Actions
- Edit photo metadata
- Delete submissions
- View submission details
- Download original photos
- Track approval status

## Page Structure

### Main Dashboard Page
**Route:** `app/routes/_auth.my-submissions.tsx`

**Layout Sections:**
1. Statistics summary
2. Filter and search controls
3. Submissions grid
4. Pagination controls

### Edit Submission Page
**Route:** `app/routes/_auth.my-submissions.$photoId.edit.tsx`

**Features:**
- Current photo display (read-only)
- Editable metadata form
- Competition/category context
- Save/cancel actions

## Components to Create

### SubmissionCard Component
```typescript
// app/components/photo/submission-card.tsx
interface SubmissionCardProps {
  photo: Photo & {
    competition: Competition;
    category: Category;
  };
  onEdit: (photoId: string) => void;
  onDelete: (photoId: string) => void;
  onView: (photoId: string) => void;
}
```

**Features:**
- Photo thumbnail
- Title and basic info
- Status badge
- Competition/category context
- Quick action buttons (edit, delete, view)
- Upload date and status

### SubmissionsGrid Component
```typescript
// app/components/photo/submissions-grid.tsx
interface SubmissionsGridProps {
  photos: PhotoWithRelations[];
  loading?: boolean;
  onEdit: (photoId: string) => void;
  onDelete: (photoId: string) => void;
  onView: (photoId: string) => void;
}
```

**Features:**
- Responsive grid layout
- Loading states
- Empty state messaging
- Infinite scroll or pagination
- Grouping by competition

### SubmissionStats Component
```typescript
// app/components/photo/submission-stats.tsx
interface SubmissionStatsProps {
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  competitionsEntered: number;
}
```

**Features:**
- Key metrics display
- Visual progress indicators
- Comparison with limits
- Success rate statistics

### SubmissionFilters Component
```typescript
// app/components/photo/submission-filters.tsx
interface SubmissionFiltersProps {
  competitions: Competition[];
  categories: Category[];
  selectedFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}
```

**Features:**
- Competition filter dropdown
- Category filter (based on selected competition)
- Status filter (pending, approved, rejected)
- Date range filter
- Search by title/description

## Submission Status System

### Status Types
```typescript
type PhotoStatus = 'pending' | 'approved' | 'rejected' | 'deleted';
```

### Status Display
- **Pending**: Orange badge, "Under Review"
- **Approved**: Green badge, "Approved"
- **Rejected**: Red badge, "Rejected" + reason
- **Deleted**: Gray badge, "Deleted" (soft delete)

### Status Transitions
- New submissions start as "pending"
- Admins can approve or reject
- Users can delete their own submissions
- Deleted submissions are soft-deleted

## Edit Functionality

### Metadata Editing
- Reuse metadata form from submission flow
- Prevent editing of file-related fields
- Validate changes before saving
- Show success/error feedback

### Edit Restrictions
- Cannot change photo file
- Cannot change competition/category
- Cannot edit after competition ends
- Cannot edit rejected submissions

## Delete Functionality

### Delete Confirmation
- Clear confirmation dialog
- Explain consequences (permanent action)
- Show submission details
- Require explicit confirmation

### Soft Delete Implementation
- Mark as deleted in database
- Remove from user's view
- Keep for audit purposes
- Clean up files asynchronously

## Statistics and Analytics

### User Statistics
- Total submissions across all competitions
- Approval rate percentage
- Most active categories
- Submission timeline
- Competition participation history

### Dashboard Widgets
- Quick stats cards
- Recent activity feed
- Upcoming deadlines
- Submission progress charts

## Implementation Steps

1. **Create Main Dashboard Page**
   - Set up route and layout
   - Implement basic grid display
   - Add loading and error states

2. **Build Submission Card Component**
   - Display photo thumbnail
   - Show metadata and status
   - Add action buttons

3. **Implement Filtering System**
   - Create filter components
   - Add search functionality
   - Implement filter logic

4. **Add Statistics Dashboard**
   - Calculate user statistics
   - Create visual components
   - Display key metrics

5. **Create Edit Functionality**
   - Build edit page
   - Reuse metadata form
   - Implement save logic

6. **Implement Delete Feature**
   - Add confirmation dialog
   - Implement soft delete
   - Update UI after deletion

7. **Add Advanced Features**
   - Pagination or infinite scroll
   - Sorting options
   - Export functionality

## Files to Create
- `app/routes/_auth.my-submissions.tsx`
- `app/routes/_auth.my-submissions.$photoId.edit.tsx`
- `app/components/photo/submission-card.tsx`
- `app/components/photo/submissions-grid.tsx`
- `app/components/photo/submission-stats.tsx`
- `app/components/photo/submission-filters.tsx`
- `app/hooks/use-user-submissions.ts`

## API Endpoints Required
- `photos.getUserSubmissions` - Get user's submissions with filters
- `photos.getSubmissionStats` - Get user's submission statistics
- `photos.update` - Update photo metadata
- `photos.delete` - Soft delete submission

## Styling Requirements
- Responsive grid layout
- Clear status indicators
- Accessible action buttons
- Mobile-optimized interface
- Consistent with overall design

## Acceptance Criteria
- [ ] Dashboard displays all user submissions
- [ ] Filtering and search working correctly
- [ ] Edit functionality saves changes properly
- [ ] Delete functionality works with confirmation
- [ ] Statistics display accurate information
- [ ] Status indicators are clear and correct
- [ ] Mobile experience is smooth
- [ ] Loading states provide good feedback
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable with many submissions

## Dependencies
- Task 2: Photo Database Schema
- Task 4: Submission Flow (for metadata form reuse)

## Estimated Time
**1.5 days**

## Notes
- Consider adding bulk actions (select multiple)
- Implement caching for better performance
- Add submission history/audit trail
- Consider adding download functionality for photos