# Task 2: Photo Database Schema and API Setup

## Objective
Create database schema for photo submissions and implement tRPC API endpoints for photo management.

## Requirements
- Design photo submissions table schema
- Create database migrations
- Implement tRPC photo procedures
- Add photo validation logic
- Set up submission limits enforcement

## Database Schema

### Photos Table
```sql
CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competition_id TEXT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  -- File information
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Photo metadata
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date_taken DATE,
  location TEXT NOT NULL,
  
  -- Optional camera info
  camera_make TEXT,
  camera_model TEXT,
  lens TEXT,
  focal_length TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso TEXT,
  
  -- Status and timestamps
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_competition_id ON photos(competition_id);
CREATE INDEX idx_photos_category_id ON photos(category_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_created_at ON photos(created_at);

-- Unique constraint to prevent duplicate submissions
CREATE UNIQUE INDEX idx_photos_user_competition_category_title 
ON photos(user_id, competition_id, category_id, title) 
WHERE status != 'deleted';
```

## tRPC API Endpoints

### Photo Procedures
```typescript
// Photo submission and management
photos.submit        // Submit new photo
photos.update        // Update photo metadata
photos.delete        // Delete user's photo
photos.getUserSubmissions  // Get user's submissions
photos.getByCategory       // Get photos by category
photos.getByCompetition    // Get photos by competition
photos.getById            // Get single photo details

// Upload procedures
upload.getSignedUrl       // Get presigned URL for R2 upload
upload.confirmUpload      // Confirm successful upload
upload.deleteFile         // Delete file from R2
```

## Validation Rules

### Photo Validation
- **File types**: JPEG, PNG only
- **File size**: Max 10MB
- **Image dimensions**: Minimum 800x600
- **Title**: 3-100 characters, required
- **Description**: 20-500 characters, required
- **Date taken**: Valid date, not in future
- **Location**: 2-100 characters, required

### Submission Limits
- Check existing submissions per category per user
- Enforce `maxPhotosPerUser` from category settings
- Clear error messages when limits exceeded

## Implementation Steps

1. **Create Database Migration**
   - Add photos table with all fields
   - Create appropriate indexes
   - Add foreign key constraints

2. **Update Schema Types**
   - Add Photo type to database schema
   - Update TypeScript types

3. **Implement tRPC Procedures**
   - Create photo router
   - Implement all CRUD operations
   - Add proper authorization

4. **Add Validation Layer**
   - Create Zod schemas for photo validation
   - Implement file validation utilities
   - Add submission limit checking

5. **Create Service Layer**
   - Photo service for complex operations
   - Upload service for file handling
   - Validation service for rules

## Files to Create
- `api/database/migrations/003_photos.sql`
- `api/trpc/routers/photos.ts`
- `api/trpc/routers/upload.ts`
- `api/services/photo-service.ts`
- `api/services/upload-service.ts`
- `api/lib/validation.ts`

## Files to Modify
- `api/database/schema.ts` - Add Photo type
- `api/trpc/root.ts` - Add photo and upload routers

## Acceptance Criteria
- [ ] Photos table created with proper schema
- [ ] All tRPC procedures implemented and tested
- [ ] Photo validation working correctly
- [ ] Submission limits enforced properly
- [ ] File upload validation implemented
- [ ] Proper error handling for all edge cases
- [ ] Authorization checks in place

## Dependencies
- Task 1: R2 Storage Setup
- Phase 2: Competition Management (categories)

## Estimated Time
**1.5 days**

## Notes
- Use UUIDs for photo IDs
- Implement soft delete for photos
- Add proper indexes for performance
- Consider adding photo approval workflow