# Task 5: UI Components & Utilities

## Overview
Create essential UI components and utilities needed for the competition management interface, including status badges, date pickers, form components, and validation utilities.

## Goals
- Build reusable UI components for competition management
- Create consistent styling and behavior
- Implement accessible form components
- Add validation utilities and error handling
- Ensure mobile responsiveness

## Files to Create

### UI Components
- **Create**: `app/components/ui/status-badge.tsx`
  - Competition status indicators
  - Customizable colors and styles
  - Responsive design
  
- **Create**: `app/components/ui/date-picker.tsx`
  - Date selection component
  - Validation and error states
  - Accessibility features

- **Create**: `app/components/ui/form.tsx`
  - Form wrapper components
  - Field validation display
  - Error handling utilities

- **Create**: `app/components/ui/confirmation-dialog.tsx`
  - Reusable confirmation dialogs
  - Customizable content and actions
  - Proper focus management

- **Create**: `app/components/ui/loading-skeleton.tsx`
  - Loading state skeletons
  - Various layout patterns
  - Smooth animations

### Utility Files
- **Create**: `app/lib/form-validation.ts`
  - Form validation helpers
  - Error message formatting
  - Field-specific validators

- **Create**: `app/lib/date-utils.ts`
  - Date formatting utilities
  - Timezone handling
  - Date validation helpers

## Implementation Details

### Status Badge Component
```typescript
// StatusBadge.tsx features:
interface StatusBadgeProps {
  status: 'active' | 'draft' | 'completed' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// Visual styling:
- Active: Green background, white text, check icon
- Draft: Gray background, dark text, edit icon  
- Completed: Blue background, white text, trophy icon
- Inactive: Orange background, white text, pause icon
```

### Date Picker Component
```typescript
// DatePicker.tsx features:
interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}

// Functionality:
- Native date input with custom styling
- Proper date formatting for display
- Validation integration
- Accessibility support
- Mobile-friendly interface
```

### Form Components
```typescript
// Form.tsx wrapper components:
- FormField: Label, input, and error message wrapper
- FormError: Consistent error message display
- FormDescription: Help text for form fields
- FormSection: Grouped form elements
- FormActions: Button container with proper spacing

// Features:
- Automatic error state styling
- Consistent spacing and layout
- Accessibility attributes
- Responsive design
```

### Confirmation Dialog
```typescript
// ConfirmationDialog.tsx features:
interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  loading?: boolean;
}

// Styling variants:
- Default: Standard confirmation
- Destructive: Red colors for dangerous actions
- Loading states during async operations
- Proper focus management
```

### Loading Skeleton
```typescript
// LoadingSkeleton.tsx patterns:
- CompetitionListSkeleton: For competition list rows
- CompetitionFormSkeleton: For form loading
- CompetitionDetailSkeleton: For detail page
- CategoryListSkeleton: For category management

// Features:
- Smooth shimmer animations
- Proper aspect ratios
- Responsive layouts
- Accessible loading announcements
```

## Utility Functions

### Form Validation Utilities
```typescript
// form-validation.ts helpers:
export const validateCompetitionTitle = (title: string) => {
  // 3-100 characters, no special characters
};

export const validateDateRange = (startDate?: Date, endDate?: Date) => {
  // End date after start date validation
};

export const formatValidationError = (error: ZodError) => {
  // Convert Zod errors to user-friendly messages
};

export const getFieldError = (errors: Record<string, string>, field: string) => {
  // Extract field-specific error messages
};
```

### Date Utilities
```typescript
// date-utils.ts helpers:
export const formatCompetitionDate = (date: Date) => {
  // Format dates for competition display
};

export const getDateDifference = (startDate: Date, endDate: Date) => {
  // Calculate duration in human-readable format
};

export const isDateInFuture = (date: Date) => {
  // Check if date is in the future
};

export const formatDateForInput = (date: Date) => {
  // Format date for HTML date inputs
};
```

## Styling Guidelines

### Color Palette
- **Active**: `bg-green-100 text-green-800 border-green-200`
- **Draft**: `bg-gray-100 text-gray-800 border-gray-200`
- **Completed**: `bg-blue-100 text-blue-800 border-blue-200`
- **Inactive**: `bg-orange-100 text-orange-800 border-orange-200`

### Typography
- Consistent font sizes and weights
- Proper line heights for readability
- Responsive text sizing
- Accessibility contrast ratios

### Spacing
- Consistent margin/padding scale
- Proper component spacing
- Responsive adjustments
- Visual hierarchy

## Accessibility Requirements
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance
- Alternative text for icons

## Testing Considerations
- Component unit tests
- Visual regression tests
- Accessibility audits
- Mobile device testing
- Cross-browser compatibility

## Success Criteria
- [ ] Status badges display correctly for all states
- [ ] Date picker handles edge cases properly
- [ ] Form components provide consistent experience
- [ ] Confirmation dialogs work reliably
- [ ] Loading skeletons match actual content layout
- [ ] Validation utilities catch all error cases
- [ ] Date utilities handle timezones correctly
- [ ] Components are fully accessible
- [ ] Mobile experience is smooth
- [ ] All components follow design system guidelines

## Integration Points
- Use with existing Tailwind classes
- Compatible with shadcn/ui components
- Work with React Hook Form
- Support TypeScript strictly
- Integrate with tRPC error handling