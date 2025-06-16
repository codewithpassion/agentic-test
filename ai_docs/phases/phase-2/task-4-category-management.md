# Task 4: Category Management Interface

## Overview
Build a comprehensive category management interface that allows admins to create, edit, and manage categories for competitions, including photo submission limits and validation rules.

## Goals
- Create intuitive category management interface
- Implement full CRUD operations for categories
- Add photo limit configuration per category
- Handle validation and safety checks
- Provide seamless user experience

## Files to Create/Modify

### Routes
- **Create**: `app/routes/_auth.admin.competitions.$id.categories.tsx`
  - Category management page for specific competition
  - Handle category operations
  - Modal/dialog management for forms

### Components
- **Create**: `app/components/admin/category-manager.tsx`
  - Main category management component
  - Category list with inline editing
  - Add/edit category forms
  - Delete confirmation dialogs

- **Create**: `app/components/admin/category-form.tsx`
  - Reusable category form component
  - Field validation and error handling
  - Photo limit slider/input

## Implementation Details

### Category Management Layout
```typescript
// Key sections:
1. Page Header
   - Competition title and breadcrumbs
   - Add new category button
   - Back to competition detail link

2. Category List
   - Existing categories with inline actions
   - Photo limit indicators
   - Usage statistics (when available)
   - Drag-and-drop ordering (optional)

3. Category Forms
   - Modal/inline forms for add/edit
   - Real-time validation
   - Auto-save functionality
```

### Category Operations

#### Create Category
- Modal form with name and photo limit fields
- Real-time validation for duplicate names
- Default photo limit (5 photos)
- Immediate UI update on success

#### Edit Category
- Inline editing or modal form
- Pre-populate existing values
- Handle name conflicts
- Prevent editing if category has submissions

#### Delete Category
- Confirmation dialog with safety checks
- Prevent deletion if category has photos
- Show impact information
- Cascade delete warnings

### Form Fields
```typescript
interface CategoryFormData {
  name: string;              // 2-50 characters, unique per competition
  maxPhotosPerUser: number;  // 1-20, default 5
  description?: string;      // Optional category description
}
```

### Validation Rules
- **Name**: Required, 2-50 characters, unique within competition
- **Max Photos**: Required, 1-20 range, integer only
- **Description**: Optional, max 200 characters
- **Business Rules**: Cannot delete category with existing submissions

### User Experience Features

#### Smart Defaults
- Auto-focus name field in forms
- Suggest category names based on common patterns
- Remember last used photo limit setting
- Auto-save form data

#### Visual Feedback
- Real-time name availability checking
- Photo limit visual indicators (bars, numbers)
- Success animations for operations
- Loading states for async operations

#### Batch Operations
- Select multiple categories for bulk actions
- Bulk photo limit updates
- Bulk delete with safety checks
- Import/export category templates

### Category Display
```typescript
// Category list item features:
- Category name with edit-in-place
- Photo limit with visual indicator
- Current submission count (when available)
- Action buttons (edit, delete)
- Status indicators (active, full, empty)
```

## Safety Features

### Deletion Protection
- Check for existing photo submissions
- Show impact warnings before deletion
- Require confirmation for destructive actions
- Provide alternative actions (archive, disable)

### Conflict Resolution
- Handle concurrent edits by multiple admins
- Optimistic updates with rollback
- Clear error messages for conflicts
- Suggest alternative names for duplicates

### Data Integrity
- Validate photo limits against existing submissions
- Prevent reducing limits below current usage
- Handle edge cases gracefully
- Maintain referential integrity

## Integration Points

### tRPC Operations
- Use `categories.create`, `categories.update`, `categories.delete`
- Implement optimistic updates
- Handle error states gracefully
- Invalidate related queries on changes

### Dashboard Integration
- Update competition statistics after changes
- Refresh category counts
- Trigger dashboard data refresh
- Maintain cache consistency

## Responsive Design
- Mobile-friendly category list
- Touch-friendly action buttons
- Responsive modal forms
- Collapsible sections for small screens

## Accessibility
- Keyboard navigation for all operations
- Screen reader support for form fields
- ARIA labels for complex interactions
- Focus management in modals

## Success Criteria
- [ ] Category list displays accurately
- [ ] Add category form works with validation
- [ ] Edit category preserves data correctly
- [ ] Delete category shows appropriate warnings
- [ ] Photo limits can be configured properly
- [ ] Duplicate name validation prevents conflicts
- [ ] Safety checks prevent data loss
- [ ] Mobile interface is fully functional
- [ ] All operations provide proper feedback
- [ ] Form validation is comprehensive and clear

## Future Enhancements
- Category templates for quick setup
- Bulk import/export functionality
- Category usage analytics
- Advanced photo limit rules (time-based, user-tier based)
- Category ordering and organization