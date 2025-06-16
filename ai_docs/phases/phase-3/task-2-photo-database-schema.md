# Task 2: Photo Database Schema and API Setup

## Objective
Create database schema for photo submissions and implement tRPC API endpoints for photo management.

## Requirements
- Update photo submissions table schema in Drizzle
- Generate database migrations automatically
- Implement tRPC photo procedures
- Add photo validation logic
- Set up submission limits enforcement

## Database Schema Updates

### Photos Table (Drizzle Schema)
Update the existing photos table in `api/database/schema.ts` to include:

**New Fields:**
- `competitionId` - foreign key to competitions table
- `mimeType` - file MIME type (image/jpeg, image/png)
- Expanded camera info fields: `cameraMake`, `cameraModel`, `lens`, `focalLength`, `aperture`, `shutterSpeed`, `iso`
- Add "deleted" to status enum for soft delete

**Indexes:**
- userId, competitionId, categoryId, status, createdAt for performance
- Unique constraint on (userId, competitionId, categoryId, title) where status != 'deleted'

**Field Requirements:**
- File types: JPEG, PNG only  
- File size: Max 10MB
- Image dimensions: Minimum 800x600
- Title: 3-100 characters, required
- Description: 20-500 characters, required
- Date taken: Valid date, not in future
- Location: 2-100 characters, required

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

1. **Update Drizzle Schema**
   - Modify photos table in `api/database/schema.ts`
   - Add missing fields and proper constraints
   - Add indexes for performance

2. **Generate Migration**
   - Run `bun db:gen` to generate migration
   - Apply with `bun db:update`

3. **Implement tRPC Procedures**
   - Create photo router with CRUD operations
   - Create upload router for file handling
   - Add proper authorization and validation

4. **Add Validation Layer**
   - Create Zod schemas for photo validation
   - Implement file validation utilities
   - Add submission limit checking

5. **Create Service Layer**
   - Photo service for complex operations
   - Upload service for file handling
   - Validation service for rules

## Files to Create
- `api/trpc/routers/photos.ts`
- `api/trpc/routers/upload.ts`
- `api/services/photo-service.ts`
- `api/services/upload-service.ts`
- `api/lib/validation.ts`

## Files to Modify
- `api/database/schema.ts` - Update photos table schema
- `api/trpc/index.ts` - Add photo and upload routers

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