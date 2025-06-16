# Task 3: Photo Upload Components and Infrastructure

## Objective
Create reusable photo upload components with drag-and-drop support, image preview, and progress tracking.

## Requirements
- Drag-and-drop upload zone
- File browser fallback
- Image preview thumbnails
- Upload progress indicators
- File validation on client side
- Error handling and retry logic

## Components to Create

### UploadZone Component
```typescript
// app/components/photo/upload-zone.tsx
interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number;
  disabled?: boolean;
}
```

**Features:**
- Drag-and-drop area with visual feedback
- Click to browse file fallback
- Multiple file selection support
- Visual file type and size validation
- Responsive design for mobile

### ImagePreview Component
```typescript
// app/components/photo/image-preview.tsx
interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  uploadProgress?: number;
  error?: string;
}
```

**Features:**
- Thumbnail generation from File object
- Remove button overlay
- Upload progress bar
- Error state display
- Loading states

### FileUploadManager Hook
```typescript
// app/hooks/use-file-upload.ts
interface UseFileUploadProps {
  onUploadComplete: (uploadedFiles: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}
```

**Features:**
- Manage multiple file uploads
- Track upload progress per file
- Handle upload errors and retries
- Coordinate with R2 signed URLs

## Upload Flow Implementation

### Client-Side Upload Process
1. **File Selection**
   - Validate file type and size
   - Generate preview thumbnails
   - Show file list with previews

2. **Pre-Upload Validation**
   - Check file dimensions
   - Validate MIME types
   - Verify file integrity

3. **Get Signed URLs**
   - Request signed URLs from tRPC
   - Handle batch URL requests
   - Manage URL expiration

4. **Direct R2 Upload**
   - Upload directly to R2 using signed URLs
   - Track upload progress per file
   - Handle upload failures

5. **Confirm Upload**
   - Notify server of successful uploads
   - Update UI with success/failure states
   - Clean up temporary data

## File Validation

### Client-Side Validation
```typescript
// app/lib/file-validation.ts
interface FileValidationRules {
  maxSize: number;
  allowedTypes: string[];
  minDimensions: { width: number; height: number };
}

const validateFile = (file: File, rules: FileValidationRules)
```

**Validation Checks:**
- File type verification (MIME type + extension)
- File size limits
- Image dimension requirements
- File integrity checks

### Image Processing
```typescript
// app/lib/image-utils.ts
const generateThumbnail = (file: File, maxSize: number)
const getImageDimensions = (file: File)
const compressImage = (file: File, quality: number)
```

## Upload Infrastructure

### Upload Service (Client)
```typescript
// app/lib/upload.client.ts
class UploadService {
  async uploadFile(file: File, signedUrl: string): Promise<UploadResult>
  async getSignedUrl(fileName: string, fileType: string): Promise<string>
  async confirmUpload(fileKey: string): Promise<void>
}
```

### Progress Tracking
- Individual file progress
- Overall upload progress
- Upload speed estimation
- Time remaining calculation

## Error Handling

### Upload Error Types
- Network errors (retry-able)
- File validation errors (not retry-able)
- Server errors (retry-able)
- Permission errors (not retry-able)

### Error Recovery
- Automatic retry for network issues
- Manual retry buttons for failed uploads
- Clear error messages with solutions
- Fallback upload methods

## Implementation Steps

1. **Create Base Upload Zone**
   - Implement drag-and-drop functionality
   - Add file browser fallback
   - Style with proper visual feedback

2. **Add Image Preview**
   - Generate thumbnails from File objects
   - Show file details and validation status
   - Add remove functionality

3. **Implement Upload Logic**
   - Create upload service class
   - Add progress tracking
   - Handle signed URL workflow

4. **Add Validation Layer**
   - Client-side file validation
   - Image dimension checking
   - Error handling and messaging

5. **Create Upload Hook**
   - Coordinate upload flow
   - Manage upload state
   - Provide clean API for components

6. **Add Error Handling**
   - Retry logic for failed uploads
   - User-friendly error messages
   - Recovery options

## Files to Create
- `app/components/photo/upload-zone.tsx`
- `app/components/photo/image-preview.tsx`
- `app/components/photo/upload-progress.tsx`
- `app/hooks/use-file-upload.ts`
- `app/lib/upload.client.ts`
- `app/lib/file-validation.ts`
- `app/lib/image-utils.ts`

## Styling Requirements
- Responsive design for mobile/desktop
- Accessible drag-and-drop interactions
- Clear visual feedback for all states
- Progress indicators and loading states
- Error state styling

## Acceptance Criteria
- [ ] Drag-and-drop upload working
- [ ] File browser fallback functional
- [ ] Image previews generated correctly
- [ ] Upload progress tracked accurately
- [ ] File validation prevents invalid files
- [ ] Error handling provides clear feedback
- [ ] Mobile upload experience smooth
- [ ] Multiple file uploads supported
- [ ] Retry functionality works correctly

## Dependencies
- Task 1: R2 Storage Setup
- Task 2: Photo Database Schema (for upload endpoints)

## Estimated Time
**2 days**

## Notes
- Use HTML5 File API for client-side processing
- Implement proper accessibility for drag-and-drop
- Consider adding image compression for large files
- Test thoroughly on mobile devices