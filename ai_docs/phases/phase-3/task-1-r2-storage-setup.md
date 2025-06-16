# Task 1: R2 Storage Setup and Configuration

## Objective
Set up Cloudflare R2 storage infrastructure for photo uploads and configure the project to use R2 bindings.

## Requirements
- Create R2 bucket for photo storage
- Configure wrangler.jsonc with R2 bucket bindings
- Set up environment variables for R2 access
- Configure CORS settings for direct uploads
- Test R2 connectivity

## Technical Details

### R2 Bucket Setup
- Bucket name: `photo-gallery-storage`
- Region: Auto (Cloudflare chooses optimal)
- Public access: Custom (controlled via signed URLs)

### Wrangler Configuration
Update `wrangler.jsonc` to include:
```json
"r2_buckets": [
  {
    "binding": "PHOTO_STORAGE",
    "bucket_name": "photo-gallery-storage",
    "preview_bucket_name": "photo-gallery-storage-dev"
  }
]
```

### Environment Variables
- `R2_BUCKET_NAME`: Bucket name for the environment
- `R2_ACCESS_KEY_ID`: R2 API token access key
- `R2_SECRET_ACCESS_KEY`: R2 API token secret
- `R2_ACCOUNT_ID`: Cloudflare account ID

### CORS Configuration
Configure bucket CORS for:
- Origins: Development and production domains
- Methods: GET, PUT, POST, DELETE
- Headers: Content-Type, Content-Length, Authorization

## Implementation Steps

1. **Create R2 Bucket**
   - Use Cloudflare dashboard or Wrangler CLI
   - Set up both production and preview buckets

2. **Generate API Tokens**
   - Create R2 API token with appropriate permissions
   - Store credentials securely

3. **Update Wrangler Config**
   - Add R2 bucket bindings to wrangler.jsonc
   - Configure environment-specific buckets

4. **Set Environment Variables**
   - Add to `.env` files
   - Configure in Cloudflare Workers settings

5. **Configure CORS**
   - Set appropriate CORS rules for web uploads
   - Test CORS functionality

6. **Test Connection**
   - Create basic upload/download test
   - Verify bucket access from worker

## Files to Modify
- `wrangler.jsonc`
- `.env.example`
- `.env` (local)

## Files to Create
- `workers/lib/r2.ts` - R2 client utilities
- `workers/lib/storage.ts` - Storage abstraction layer

## Acceptance Criteria
- [ ] R2 bucket created and accessible
- [ ] wrangler.jsonc configured with R2 bindings
- [ ] Environment variables properly set
- [ ] CORS configured for web uploads
- [ ] Basic upload/download functionality working
- [ ] Error handling for R2 operations

## Dependencies
- Cloudflare account with R2 access
- Wrangler CLI configured

## Estimated Time
**1 day**

## Notes
- Use different buckets for development and production
- Implement proper error handling for R2 operations
- Consider bucket lifecycle policies for cleanup