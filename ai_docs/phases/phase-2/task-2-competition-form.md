# Task 2: Competition Form Implementation

## Overview
Create comprehensive competition creation and editing forms with proper validation, date handling, and business rule enforcement.

## Goals
- Build reusable competition form component
- Implement create and edit routes
- Add comprehensive form validation
- Handle date selection with proper UX
- Implement draft saving functionality

## Files to Create/Modify

### Routes
- **Create**: `app/routes/_auth.admin.competitions.new.tsx`
  - New competition creation page
  - Form submission handling
  - Success/error state management
  
- **Create**: `app/routes/_auth.admin.competitions.$id.edit.tsx`
  - Edit existing competition page
  - Load competition data
  - Handle update operations

### Components
- **Create**: `app/components/admin/competition-form.tsx`
  - Shared form component for create/edit
  - Form validation and error display
  - Date picker integration
  - Status selection handling

- **Create**: `app/components/ui/date-picker.tsx`
  - Custom date picker component
  - Proper date formatting
  - Validation for date ranges

## Implementation Details

### Form Fields
```typescript
interface CompetitionFormData {
  title: string;           // 3-100 characters, required
  description: string;     // 10-2000 characters, required  
  startDate?: Date;        // Optional, must be future for new competitions
  endDate?: Date;          // Optional, must be after startDate
  status: 'draft' | 'active' | 'inactive' | 'completed';
}
```

### Validation Rules
- **Title**: Required, 3-100 characters, no special characters
- **Description**: Required, 10-2000 characters, rich text support
- **Start Date**: Optional, must be future date for new competitions
- **End Date**: Optional, must be after start date if both provided
- **Status**: Required, with business rule validation for 'active' status

### Business Logic
- Only one active competition allowed at a time
- Show warning when activating if another active competition exists
- Automatically create default categories (Urban, Landscape) on creation
- Validate dates against current time and each other
- Handle timezone considerations

### Form Behavior
- **Create Mode**: 
  - Default status to 'draft'
  - Show all fields
  - Create button creates competition + default categories
  
- **Edit Mode**:
  - Pre-populate all fields
  - Show update button
  - Allow status changes with validation
  - Prevent editing of dates if competition has submissions

### Draft Saving
- Auto-save form data to localStorage every 30 seconds
- Restore draft data when form loads
- Clear draft after successful submission
- Show indicator when draft is saved/restored

## Form Components

### Date Picker Requirements
- Use native date input with fallback
- Proper date formatting (locale-aware)
- Clear validation error messages
- Min/max date constraints
- Accessibility compliance

### Status Selector
- Radio buttons or select dropdown
- Clear descriptions for each status
- Disabled options based on business rules
- Visual indicators for current status

### Rich Text Editor (Simple)
- Basic formatting for description
- Character count with validation
- Preview mode
- Accessible markup

## Error Handling
- Field-level validation with real-time feedback
- Form-level validation on submit
- Server error handling with user-friendly messages
- Network error retry functionality
- Optimistic updates where appropriate

## Success States
- Clear success messages after creation/update
- Redirect to competition list or detail page
- Option to create another competition
- Update admin dashboard metrics

## Accessibility
- Proper form labels and descriptions
- Keyboard navigation support
- Screen reader compatible
- Error announcements
- Focus management

## Success Criteria
- [ ] Competition creation form works end-to-end
- [ ] Competition editing preserves all data correctly
- [ ] Form validation prevents invalid submissions
- [ ] Date picker handles edge cases properly
- [ ] Business rules are enforced (single active competition)
- [ ] Draft saving/restoring works reliably
- [ ] Error messages are clear and actionable
- [ ] Success flows redirect appropriately
- [ ] Form is fully accessible
- [ ] Mobile experience is smooth