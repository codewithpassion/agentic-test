# Task 4: Photo Submission Flow and Metadata Form

## Objective
Create the complete photo submission flow with competition/category selection, metadata capture, and submission confirmation.

## Requirements
- Competition selection interface
- Category selection with limits display
- Photo metadata form with validation
- Submission preview and confirmation
- Auto-save draft functionality

## User Flow Pages

### 1. Competition Selection Page
**Route:** `app/routes/_auth.submit._index.tsx`

**Features:**
- List active competitions
- Show competition details and deadlines
- Category count per competition
- User's existing submissions count
- Direct links to submit to each competition

**UI Elements:**
- Competition cards with key information
- Status badges (days remaining, etc.)
- Quick stats (categories, submissions)
- "Submit Photos" call-to-action buttons

### 2. Category Selection Page
**Route:** `app/routes/_auth.submit.$competitionId.tsx`

**Features:**
- Display competition details
- List all categories for the competition
- Show photo limits per category
- Display user's current submissions per category
- Category descriptions and requirements

**UI Elements:**
- Competition header with timeline
- Category cards with submission limits
- Progress indicators for submission counts
- Category descriptions
- "Upload Photos" buttons

### 3. Photo Upload and Submission Page
**Route:** `app/routes/_auth.submit.$competitionId.$categoryId.tsx`

**Features:**
- File upload zone (from Task 3)
- Photo metadata form
- Submission preview
- Draft saving functionality
- Final submission confirmation

## Photo Metadata Form

### Form Fields
```typescript
interface PhotoMetadata {
  title: string;           // 3-100 chars, required
  description: string;     // 20-500 chars, required
  dateTaken: Date;        // Valid date, not future, required
  location: string;       // 2-100 chars, required
  
  // Optional camera information
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
}
```

### Form Component
```typescript
// app/components/photo/metadata-form.tsx
interface MetadataFormProps {
  initialData?: PhotoMetadata;
  onSubmit: (data: PhotoMetadata) => void;
  onSaveDraft: (data: PhotoMetadata) => void;
  isSubmitting?: boolean;
}
```

**Features:**
- React Hook Form with Zod validation
- Real-time character counters
- Date picker for photo date
- Location autocomplete (future enhancement)
- Camera info fields (collapsible section)
- Auto-save to localStorage
- Validation error display

### Form Validation
- Title: Required, 3-100 characters
- Description: Required, 20-500 characters
- Date taken: Required, valid date, not in future
- Location: Required, 2-100 characters
- Camera fields: Optional, reasonable length limits

## Submission Preview

### Preview Component
```typescript
// app/components/photo/submission-preview.tsx
interface SubmissionPreviewProps {
  photo: File;
  metadata: PhotoMetadata;
  category: Category;
  competition: Competition;
  onEdit: () => void;
  onConfirm: () => void;
}
```

**Features:**
- Large photo preview
- Metadata summary display
- Competition and category context
- Edit and confirm actions
- Terms and conditions acceptance

## Draft Management

### Auto-Save Functionality
- Save form data to localStorage on every change
- Restore drafts when user returns
- Clear drafts after successful submission
- Handle multiple drafts per category

### Draft Storage Key Pattern
```typescript
const draftKey = `photo-draft-${competitionId}-${categoryId}`;
```

## Submission Limits Enforcement

### Limit Checking
- Check current submission count vs. category limit
- Display remaining slots clearly
- Prevent submission when limit reached
- Handle concurrent submissions

### UI Feedback
- Progress bars for submission counts
- Clear messaging about limits
- Disable upload when limit reached
- Success messages after submission

## Implementation Steps

1. **Create Competition Selection Page**
   - Fetch active competitions
   - Display competition cards
   - Add navigation to categories

2. **Create Category Selection Page**
   - Show competition context
   - List categories with limits
   - Display user's current submissions
   - Add navigation to upload

3. **Build Photo Upload Page**
   - Integrate upload components (Task 3)
   - Add metadata form
   - Implement submission preview
   - Connect to submission API

4. **Implement Metadata Form**
   - Create form with validation
   - Add auto-save functionality
   - Implement character counters
   - Style form elements

5. **Add Submission Preview**
   - Create preview component
   - Show photo and metadata
   - Add confirmation flow
   - Handle submission process

6. **Implement Draft Management**
   - Auto-save form data
   - Restore drafts on page load
   - Clear drafts after submission
   - Handle draft conflicts

## Files to Create
- `app/routes/_auth.submit._index.tsx`
- `app/routes/_auth.submit.$competitionId.tsx`
- `app/routes/_auth.submit.$competitionId.$categoryId.tsx`
- `app/components/photo/metadata-form.tsx`
- `app/components/photo/submission-preview.tsx`
- `app/components/photo/competition-selector.tsx`
- `app/components/photo/category-selector.tsx`
- `app/hooks/use-submission-draft.ts`

## Styling Requirements
- Responsive design for all screen sizes
- Clear visual hierarchy
- Accessible form controls
- Progress indicators
- Mobile-optimized upload experience

## Acceptance Criteria
- [ ] Competition selection page functional
- [ ] Category selection with limits display
- [ ] Photo upload page working end-to-end
- [ ] Metadata form with proper validation
- [ ] Submission preview accurate
- [ ] Draft functionality saves and restores
- [ ] Submission limits enforced correctly
- [ ] Error handling comprehensive
- [ ] Mobile experience optimized
- [ ] Success/failure feedback clear

## Dependencies
- Task 2: Photo Database Schema (for submission API)
- Task 3: Upload Components
- Phase 2: Competition Management (categories data)

## Estimated Time
**2 days**

## Notes
- Test submission flow thoroughly on mobile
- Implement proper loading states
- Consider adding photo editing capabilities
- Handle network failures gracefully