# Convex + Clerk Setup Instructions

## Prerequisites
- Clerk account with an application created
- Node.js/Bun installed

## Setup Steps

### 1. Initialize Convex
```bash
npx convex init
```
This will:
- Create a new Convex project
- Generate the `convex/_generated` directory
- Provide your `VITE_CONVEX_URL`

### 2. Configure Environment Variables

Add to `.env.local`:
```env
# From Convex dashboard after running convex init
VITE_CONVEX_URL=https://your-app.convex.cloud

# From Clerk Dashboard -> API Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# From Clerk Dashboard -> API Keys -> JWT Templates
# Create a "Convex" template with the issuer URL
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
```

### 3. Configure Clerk JWT Template

In Clerk Dashboard:
1. Go to **API Keys** -> **JWT Templates**
2. Create a new template called "Convex"
3. Set the following claims:
   ```json
   {
     "sub": "{{user.id}}",
     "email": "{{user.email_addresses[0].email_address}}",
     "name": "{{user.full_name}}",
     "given_name": "{{user.first_name}}",
     "family_name": "{{user.last_name}}",
     "nickname": "{{user.username}}",
     "picture": "{{user.image_url}}"
   }
   ```
4. Copy the **Issuer** URL to `CLERK_JWT_ISSUER_DOMAIN`

### 4. Set Convex Environment Variables

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://your-app.clerk.accounts.dev"
```

### 5. Deploy Convex Functions

```bash
npx convex dev
# or for production
npx convex deploy
```

### 6. (Optional) Setup Clerk Webhook

For better user sync, set up a webhook in Clerk:
1. Go to **Webhooks** in Clerk Dashboard
2. Add endpoint: `https://your-app.convex.site/clerk-webhook`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`

## How It Works

1. **Authentication Flow**:
   - User signs in via Clerk
   - Clerk issues a JWT token
   - ConvexProviderWithAuth passes the token to Convex
   - Convex verifies the JWT using Clerk's public key

2. **User Sync**:
   - On first login, the user is automatically created in Convex
   - User data is synced from Clerk JWT claims
   - Optional webhook keeps user data in sync

3. **Authorization**:
   - Each Convex function uses `requireAuth()` to verify authentication
   - User data is fetched from Convex database using Clerk ID
   - Functions have access to full user object

## Troubleshooting

### User not found error
- Ensure the user is synced to Convex (check `useClerkConvexSync` hook)
- Verify JWT claims are configured correctly in Clerk

### Authentication errors
- Check `CLERK_JWT_ISSUER_DOMAIN` matches Clerk's issuer URL
- Ensure environment variables are set in both `.env.local` and Convex
- Verify JWT template is active in Clerk

### CORS errors
- Convex handles CORS automatically
- Ensure you're using the correct Convex URL