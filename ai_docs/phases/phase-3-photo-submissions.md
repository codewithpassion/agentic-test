# Phase 3: Photo Submissions

## Overview
Implement the core photo submission functionality for authenticated users, including file upload, metadata capture, validation, and basic gallery display.

## Goals
- Enable users to submit photos to active competitions
- Implement file upload with validation
- Create photo metadata capture forms
- Build basic photo gallery display
- Allow users to manage their own submissions

## Core Features

### Photo Upload System
- File upload with drag-and-drop support
- Image preview before submission
- File validation (JPEG, PNG, max size)
- Progress indicators during upload
- Multiple file selection capability

### Photo Metadata Form
- Required fields: title, description, date taken, location
- Optional fields: camera/lens info, camera settings
- Field validation and character limits
- Auto-save draft capability
- Rich text description editor (optional)

### Submission Management
- View user's own submissions
- Edit photo metadata (not file)
- Delete own submissions
- Submission status tracking
- Photo limit enforcement per category

### Basic Gallery Display
- Public gallery view for all approved photos
- Category-based filtering
- Search functionality
- Responsive image grid
- Photo detail modal view

## Technical Implementation

### File Upload Infrastructure
- Cloudflare R2 integration for photo storage (AWS S3 compatible)
- Update wrangler.toml to configure R2 bucket bindings
- Image processing and optimization
- Thumbnail generation
- Secure upload endpoints
- File cleanup on deletion

### API Endpoints (tRPC)
```typescript
// Photo procedures
photos.submit
photos.update
photos.delete
photos.getUserSubmissions
photos.getByCategory
photos.getByCompetition
photos.getById

// Upload procedures
upload.getSignedUrl
upload.confirmUpload
upload.deleteFile
```

### Photo Validation Rules
- File types: JPEG, PNG only
- Max file size: 10MB
- Image dimensions: minimum 800x600
- Title: 3-100 characters, required
- Description: 20-500 characters, required
- Date taken: valid date, not future
- Location: 2-100 characters, required

### Submission Limits
- Check user's existing submissions per category
- Enforce max photos per category per user
- Clear error messages when limits exceeded
- Admin override capability (future)

## User Interface

### Submission Flow
1. Select active competition
2. Choose category
3. Upload photo(s)
4. Fill metadata form
5. Preview submission
6. Confirm and submit

### Photo Upload Component
- Drag-and-drop zone
- File browser fallback
- Image preview thumbnails
- Upload progress bars
- Error handling and retry

### Metadata Form
- Clean, intuitive form layout
- Date picker for photo date
- Location autocomplete (optional)
- Character counters
- Real-time validation feedback

### User Submissions Dashboard
- Grid view of user's photos
- Submission status indicators
- Quick edit/delete actions
- Submission statistics
- Category organization

### Public Gallery
- Responsive image grid
- Category filter tabs
- Search bar
- Photo modal with full details
- Social sharing buttons (future)

## Key Components to Create

### User Pages
- `app/routes/_auth.submit._index.tsx` - Competition selection
- `app/routes/_auth.submit.$competitionId.tsx` - Category selection
- `app/routes/_auth.submit.$competitionId.$categoryId.tsx` - Photo upload
- `app/routes/_auth.my-submissions.tsx` - User's submissions
- `app/routes/gallery._index.tsx` - Public gallery
- `app/routes/gallery.$competitionId.tsx` - Competition gallery

### Components
- `app/components/photo/upload-zone.tsx`
- `app/components/photo/metadata-form.tsx`
- `app/components/photo/photo-grid.tsx`
- `app/components/photo/photo-modal.tsx`
- `app/components/photo/submission-card.tsx`

### Upload Utilities
- `app/lib/upload.client.ts` - Client-side upload logic
- `workers/services/upload.ts` - Server-side upload handling
- Image processing utilities
- File validation helpers

## File Storage Structure (Cloudflare R2)
```
/competitions/{competition-id}/
  /originals/{photo-id}.{ext}
  /thumbnails/{photo-id}_thumb.jpg
  /medium/{photo-id}_medium.jpg
```

### R2 Setup Requirements
- Create R2 bucket for photo storage
- Configure wrangler.jsonc with R2 bucket bindings
- Set up environment variables for R2 access
- Configure CORS settings for direct uploads

## Success Criteria
- [ ] Users can upload photos successfully
- [ ] All required metadata is captured
- [ ] File validation prevents invalid uploads
- [ ] Submission limits are enforced
- [ ] Users can view/edit their submissions
- [ ] Public gallery displays approved photos
- [ ] Image optimization works correctly
- [ ] Mobile upload experience is smooth
- [ ] Error handling is comprehensive

## Security Considerations
- File type validation (not just extension)
- Malware scanning (future enhancement)
- Rate limiting on uploads
- User authentication required
- Secure file storage with access controls

## Performance Considerations
- Image optimization and compression
- Lazy loading in galleries
- Efficient thumbnail generation
- CDN integration for fast delivery
- Progressive image loading

## Dependencies
- Phase 1: Foundation & Authentication
- Phase 2: Competition Management
- Cloudflare R2 storage setup with bucket creation
- Update wrangler.toml to enable R2 bindings
- Image processing libraries
- File upload components

## Estimated Timeline
**5-6 days**

## Next Phase
Phase 4: Voting System - Allow users to vote on submitted photos.