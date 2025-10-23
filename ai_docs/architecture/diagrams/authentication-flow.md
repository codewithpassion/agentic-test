# Authentication Flow Diagram

This document provides detailed diagrams of authentication and authorization flows throughout the application.

## Table of Contents

1. [Complete Authentication Flow](#complete-authentication-flow)
2. [JWT Token Flow](#jwt-token-flow)
3. [User Sync Mechanisms](#user-sync-mechanisms)
4. [Session Management](#session-management)
5. [Authorization Patterns](#authorization-patterns)
6. [Security Boundaries](#security-boundaries)

---

## Complete Authentication Flow

### End-to-End Authentication (Sign-Up to Protected Resource Access)

```
┌──────────────────────────────────────────────────────────────┐
│  PHASE 1: User Sign-Up                                       │
└──────────────────────────────────────────────────────────────┘

1. User → Browser: Navigate to /sign-up

2. Browser → Cloudflare Workers (Edge)
   GET /sign-up

3. Cloudflare Workers → React Router SSR
   - Render sign-up page
   - Include Clerk <SignUp /> component

4. Browser ← SSR
   HTML with Clerk sign-up UI

5. User → Clerk Component
   - Email: user@example.com
   - Password: ********
   - Click "Sign Up"

6. Browser → Clerk API
   POST https://api.clerk.com/v1/sign-ups
   { email, password }

7. Clerk API:
   - Validate email format
   - Check password strength
   - Check email not already registered
   - Hash password (bcrypt)
   - Create user record
   - Send verification email

8. Clerk API → Browser
   { userId: "user_abc123", verificationRequired: true }

9. User checks email, clicks verification link

10. Email Link → Clerk
    GET https://clerk.com/verify?token=...

11. Clerk:
    - Verify token
    - Mark email as verified
    - Create session

12. Clerk → Browser
    - Set session cookie (HTTP-only, Secure)
    - Redirect to application

┌──────────────────────────────────────────────────────────────┐
│  PHASE 2: Session Establishment                              │
└──────────────────────────────────────────────────────────────┘

13. Browser → App (/)
    Cookie: __session=<encrypted_clerk_session>

14. Clerk (Client SDK):
    - Read session cookie
    - Fetch user info from Clerk API
    - Issue JWT token

15. JWT Token Generated:
    Header:
      { "alg": "RS256", "typ": "JWT" }

    Payload:
      {
        "sub": "user_abc123",                    // Clerk user ID
        "iss": "https://app.clerk.accounts.dev", // Issuer
        "iat": 1729670000,                       // Issued at
        "exp": 1729673600,                       // Expires (1 hour)
        "email": "user@example.com",
        "name": "John Doe",
        "roles": ["user"]                        // From publicMetadata
      }

    Signature:
      RSASHA256(base64(header) + "." + base64(payload), clerk_private_key)

16. Browser → ConvexProviderWithAuth
    - Initialize Convex client
    - Pass JWT token to Convex

┌──────────────────────────────────────────────────────────────┐
│  PHASE 3: User Synchronization to Convex                     │
└──────────────────────────────────────────────────────────────┘

17. ConvexProviderWithAuth → Convex Server
    WebSocket Connection
    Headers: { Authorization: "Bearer <jwt_token>" }

18. Convex Server:
    - Extract JWT from headers
    - Verify JWT signature using Clerk's public key
    - Validate issuer matches CLERK_JWT_ISSUER_DOMAIN
    - Validate expiration
    - Extract user claims (sub, email, roles)
    - Make identity available in ctx.auth.getUserIdentity()

19. App Component → useClerkConvexSync()
    - Detects new Clerk user
    - Calls Convex mutation to sync user

20. Browser → Convex
    convex.mutation(api.users.syncUser, {
      clerkId: "user_abc123",
      email: "user@example.com",
      name: "John Doe",
      imageUrl: "https://...",
      roles: ["user"]
    })

21. Convex syncUser Mutation:
    - Check if user exists in database
    - If new: Insert user record
    - If exists: Update user data
    - Return user ID

22. Convex Database:
    users table:
    {
      _id: "convex_user_123",
      clerkId: "user_abc123",
      email: "user@example.com",
      name: "John Doe",
      imageUrl: "https://...",
      roles: ["user"],
      createdAt: 1729670000000,
      updatedAt: 1729670000000
    }

┌──────────────────────────────────────────────────────────────┐
│  PHASE 4: Accessing Protected Resources                      │
└──────────────────────────────────────────────────────────────┘

23. User → App: Navigate to /todos (protected route)

24. Browser → Cloudflare Workers
    GET /todos
    Cookie: __session=<clerk_session>

25. React Router Loader (_auth.tsx):
    const { userId } = await getAuth(args);
    if (!userId) return redirect("/login");

26. Loader → Clerk SSR API
    - Validate session cookie
    - Return user ID if valid

27. Clerk SSR → Loader
    { userId: "user_abc123" }

28. Loader:
    - User authenticated ✓
    - Return null (proceed to child route)

29. React Router:
    - Render todos route
    - Return HTML to browser

30. Browser:
    - Display HTML (SSR)
    - Hydrate React
    - Initialize Convex client

31. Convex Client → Convex Server
    WebSocket + JWT token

32. Component → useQuery(api.todos.list)

33. Convex Query Function:
    const user = await requireAuth(ctx);
    // user is from database (synced earlier)
    return await ctx.db.query("todos")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();

34. Convex → Browser
    [{ _id: "...", text: "Buy milk", completed: false }]

35. Browser:
    - Render todos
    - Real-time subscription active
    - User can interact with app
```

---

## JWT Token Flow

### Token Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│  1. Token Issuance (Clerk)                                 │
└────────────────────────────────────────────────────────────┘

┌─────────────┐
│ Clerk       │
│ Auth Server │
└──────┬──────┘
       │
       │ User authenticates
       ↓
┌──────────────────────────────────────┐
│  Generate JWT Token                  │
│  ─────────────────                   │
│  1. Create payload with claims:      │
│     - sub (user ID)                  │
│     - email                          │
│     - roles (from publicMetadata)    │
│     - exp (1 hour from now)          │
│                                      │
│  2. Sign with Clerk private key:     │
│     RSASHA256(payload, private_key)  │
│                                      │
│  3. Encode as JWT string:            │
│     header.payload.signature         │
└──────┬───────────────────────────────┘
       │
       │ Return JWT to client
       ↓
┌─────────────┐
│  Browser    │
│  - Store in │
│    memory   │
│  - Not in   │
│    localStorage│
└─────────────┘

┌────────────────────────────────────────────────────────────┐
│  2. Token Usage (Every Convex Request)                     │
└────────────────────────────────────────────────────────────┘

┌─────────────┐
│  Browser    │
└──────┬──────┘
       │
       │ WebSocket message
       │ { query: "todos.list", auth: "<jwt_token>" }
       ↓
┌──────────────────────────────────────┐
│  Convex Server                       │
│  ────────────                        │
│  1. Extract JWT from request         │
│                                      │
│  2. Parse JWT structure:             │
│     [header].[payload].[signature]   │
│                                      │
│  3. Decode header and payload        │
│     (base64 decode)                  │
│                                      │
│  4. Fetch Clerk's public key:        │
│     GET /.well-known/jwks.json       │
│     from CLERK_JWT_ISSUER_DOMAIN     │
│                                      │
│  5. Verify signature:                │
│     verify(signature, payload,       │
│             clerk_public_key)        │
│                                      │
│  6. Validate claims:                 │
│     - iss === CLERK_JWT_ISSUER_DOMAIN│
│     - exp > now (not expired)        │
│     - nbf <= now (not before)        │
│                                      │
│  7. If all valid:                    │
│     ctx.auth.getUserIdentity() =     │
│       { subject: "user_abc123",      │
│         email: "user@...", ... }     │
│                                      │
│  8. If invalid:                      │
│     return 401 Unauthorized          │
└──────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  3. Token Refresh (Clerk Automatic)                        │
└────────────────────────────────────────────────────────────┘

┌─────────────┐
│  Clerk SDK  │
│  (Browser)  │
└──────┬──────┘
       │
       │ Check token expiration periodically
       ↓
┌──────────────────────────────────────┐
│  If token expiring soon (<5 min):    │
│                                      │
│  1. Check session cookie validity    │
│     (HTTP-only cookie still valid)   │
│                                      │
│  2. If session valid:                │
│     Request new JWT from Clerk API   │
│                                      │
│  3. Clerk issues new JWT             │
│     (new exp time, same sub)         │
│                                      │
│  4. Update JWT in memory             │
│                                      │
│  5. Convex client uses new JWT       │
│     for subsequent requests          │
│                                      │
│  6. Old JWT becomes invalid          │
│     (still works until exp)          │
└──────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  4. Token Expiration / Revocation                          │
└────────────────────────────────────────────────────────────┘

Scenario A: Token Expired
  Browser → Convex (with expired JWT)
  Convex validates JWT:
    - exp < now → Token expired
    - Return 401 Unauthorized
  Browser:
    - Clerk SDK detects 401
    - Checks session cookie
    - If session valid: Get new JWT
    - If session invalid: Redirect to login

Scenario B: User Signs Out
  User clicks "Sign Out"
  → Clerk SDK:
    - Clear session cookie
    - Clear JWT from memory
    - Revoke session on Clerk server
  → Convex client:
    - Lose authentication
    - Queries fail with 401
  → App redirects to login

Scenario C: Admin Revokes User
  Admin → Clerk Dashboard: Disable user
  → Clerk:
    - Invalidate all sessions
    - Add user to revocation list
  → Next JWT validation:
    - Convex checks revocation (via Clerk API)
    - Reject token even if not expired
  → User logged out
```

### JWT Structure Breakdown

```
┌────────────────────────────────────────────────────────────┐
│  JWT Token Anatomy                                         │
└────────────────────────────────────────────────────────────┘

Full JWT (base64 encoded):
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2FiYzEyMyIsImlzcyI6Imh0dHBzOi8vYXBwLmNsZXJrLmFjY291bnRzLmRldiIsImlhdCI6MTcyOTY3MDAwMCwiZXhwIjoxNzI5NjczNjAwLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJuYW1lIjoiSm9obiBEb2UiLCJyb2xlcyI6WyJ1c2VyIl19.signature_here

Decoded:

┌──────────────────────────────────────┐
│  HEADER                              │
│  {                                   │
│    "alg": "RS256",  ← Algorithm      │
│    "typ": "JWT"     ← Type           │
│  }                                   │
└──────────────────────────────────────┘
             .
┌──────────────────────────────────────┐
│  PAYLOAD (Claims)                    │
│  {                                   │
│    "sub": "user_abc123",             │
│           ↑ Subject (User ID)        │
│                                      │
│    "iss": "https://app.clerk...",    │
│           ↑ Issuer (Clerk domain)    │
│                                      │
│    "iat": 1729670000,                │
│           ↑ Issued At (timestamp)    │
│                                      │
│    "exp": 1729673600,                │
│           ↑ Expiration (1hr later)   │
│                                      │
│    "email": "user@example.com",      │
│    "name": "John Doe",               │
│    "roles": ["user"]                 │
│            ↑ Custom claims           │
│  }                                   │
└──────────────────────────────────────┘
             .
┌──────────────────────────────────────┐
│  SIGNATURE                           │
│  RSASHA256(                          │
│    base64UrlEncode(header) + "." +   │
│    base64UrlEncode(payload),         │
│    clerk_private_key                 │
│  )                                   │
└──────────────────────────────────────┘
```

---

## User Sync Mechanisms

### Method 1: Client-Side Sync (Current)

```
┌──────────────────────────────────────────────────────────┐
│  useClerkConvexSync Hook                                 │
└──────────────────────────────────────────────────────────┘

1. App Component mounts
   ↓
2. useClerkConvexSync() hook runs
   ↓
3. Get Clerk user data
   const { user, isLoaded } = useUser();
   ↓
4. Get Convex user data
   const convexUser = useQuery(api.users.getMe);
   ↓
5. Compare:
   - Clerk user exists
   - Convex user does NOT exist
   ↓
6. Trigger sync
   const syncUser = useMutation(api.users.syncUser);

   await syncUser({
     clerkId: user.id,
     email: user.primaryEmailAddress.emailAddress,
     name: user.fullName,
     imageUrl: user.imageUrl,
     roles: user.publicMetadata.roles || ["user"]
   });
   ↓
7. Convex mutation:
   - Check if user exists (by clerkId)
   - If new: Insert
   - If exists: Update
   ↓
8. User synced!

Runs:
  - On first login
  - When user data changes (email, name, etc.)

Pros:
  - Simple to implement
  - No webhook setup needed
  - Works immediately

Cons:
  - Requires user to be signed in to sync
  - Multiple tabs might trigger multiple syncs
  - Not triggered for admin-initiated changes
```

### Method 2: Webhook Sync (Recommended for Production)

```
┌──────────────────────────────────────────────────────────┐
│  Clerk Webhook → Convex HTTP Endpoint                   │
└──────────────────────────────────────────────────────────┘

1. User event in Clerk (created, updated, deleted)
   ↓
2. Clerk sends webhook
   POST https://our-app.convex.site/clerk-webhook

   Headers:
     svix-id: msg_123abc
     svix-timestamp: 1729670000
     svix-signature: v1,signature_here

   Body:
   {
     "type": "user.created",
     "data": {
       "id": "user_abc123",
       "email_addresses": [{
         "email_address": "user@example.com"
       }],
       "first_name": "John",
       "last_name": "Doe",
       "image_url": "https://...",
       "public_metadata": {
         "roles": ["user"]
       }
     }
   }
   ↓
3. Convex HTTP endpoint receives webhook
   /convex/http.ts
   ↓
4. Verify webhook signature (security!)
   - Use Clerk webhook secret
   - Verify svix-signature header
   - Ensure request is from Clerk
   ↓
5. If signature valid:
   - Parse event type
   - Extract user data
   ↓
6. Call internal mutation
   ctx.runMutation(internal.users.syncUserInternal, {
     clerkId: data.id,
     email: data.email_addresses[0].email_address,
     name: `${data.first_name} ${data.last_name}`,
     imageUrl: data.image_url,
     roles: data.public_metadata.roles
   });
   ↓
7. Internal mutation:
   - Upsert user in database
   - Update roles if changed
   ↓
8. Return 200 OK to Clerk

Events handled:
  - user.created → Insert user
  - user.updated → Update user
  - user.deleted → Delete user (cleanup)

Pros:
  - More reliable (server-to-server)
  - Handles admin-initiated changes
  - Single sync (not per-client)
  - User data always up-to-date

Cons:
  - Requires webhook setup
  - More complex configuration
  - Need to handle webhook security
```

---

## Session Management

### Session Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│  Session Creation                                          │
└────────────────────────────────────────────────────────────┘

User signs in
  ↓
Clerk creates session
  ↓
Set HTTP-only cookie
  __session=<encrypted_session_data>
  ↓
Cookie properties:
  - HttpOnly: true  (JS cannot access)
  - Secure: true    (HTTPS only)
  - SameSite: Lax   (CSRF protection)
  - Domain: .app.example.com
  - Path: /
  - Max-Age: 604800 (7 days)

┌────────────────────────────────────────────────────────────┐
│  Session Validation                                        │
└────────────────────────────────────────────────────────────┘

Every request:
  ↓
Browser sends cookie
  Cookie: __session=<encrypted_session_data>
  ↓
Server-side (React Router loader):
  const { userId } = await getAuth(args);
  ↓
Clerk SSR validates:
  1. Decrypt session cookie
  2. Check expiration
  3. Verify session exists on Clerk server
  4. Return user ID if valid

┌────────────────────────────────────────────────────────────┐
│  Session Refresh                                           │
└────────────────────────────────────────────────────────────┘

Automatic (Clerk handles):
  - Before session expires
  - Refresh session on Clerk server
  - Issue new session cookie
  - Update cookie in browser

Manual (user action):
  - User clicks "Stay logged in"
  - Extend session by 7 days

┌────────────────────────────────────────────────────────────┐
│  Session Termination                                       │
└────────────────────────────────────────────────────────────┘

User clicks "Sign Out":
  ↓
Clerk SDK:
  1. Call Clerk API to revoke session
  2. Clear session cookie
  3. Clear JWT from memory
  ↓
Clerk Server:
  - Invalidate session
  - Add to revocation list
  ↓
Next request:
  - No valid session
  - Redirect to login

Session expires:
  ↓
Next request:
  - Clerk validates cookie
  - Session expired
  - Return 401
  ↓
Clerk SDK:
  - Redirect to login
```

---

## Authorization Patterns

### Role Hierarchy

```
┌────────────────────────────────────────────────────────────┐
│  Role Hierarchy                                            │
└────────────────────────────────────────────────────────────┘

                    superadmin
                        ↑
                        │ (has all permissions of admin + more)
                        │
                      admin
                        ↑
                        │ (has all permissions of user + more)
                        │
                      user

Permissions:

user:
  - todos.view_own
  - todos.create_own
  - todos.edit_own
  - todos.delete_own

admin (inherits user +):
  - admin.access
  - admin.view_stats
  - users.view
  - users.create
  - users.edit
  - todos.view_all
  - todos.edit_all
  - todos.delete_all

superadmin (inherits admin +):
  - users.delete
  - users.manage_roles
  - system.manage_api
  - system.manage_database
  - system.manage_security
  - system.impersonate
```

### Permission Check Flow

```
┌────────────────────────────────────────────────────────────┐
│  Client-Side Permission Check (UX Only)                    │
└────────────────────────────────────────────────────────────┘

Component renders
  ↓
const { hasPermission, hasRole } = useAuth();
  ↓
if (!hasPermission("users.edit")) {
  return <div>Permission denied</div>;
}
  ↓
Render UI element

⚠️ WARNING: This is for UX only!
   Real security check must be on server (Convex)

┌────────────────────────────────────────────────────────────┐
│  Server-Side Permission Check (Security Boundary)          │
└────────────────────────────────────────────────────────────┘

Convex function called
  ↓
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    ↓
    1. Authenticate user
    const currentUser = await requireAuth(ctx);
    // Throws if not authenticated
    ↓
    2. Check permission
    if (!currentUser.roles?.includes("superadmin")) {
      throw new ConvexError("Unauthorized: superadmin required");
    }
    ↓
    3. Get target user
    const targetUser = await ctx.db.get(userId);
    ↓
    4. Check hierarchy (can't delete higher role)
    if (isRoleHigher(targetUser.role, currentUser.role)) {
      throw new ConvexError("Cannot delete user with higher role");
    }
    ↓
    5. Perform action
    await ctx.db.delete(userId);
    ↓
    6. Return success
    return { success: true };
  }
});
```

---

## Security Boundaries

### Defense in Depth

```
┌────────────────────────────────────────────────────────────┐
│  Layer 1: Network Security                                │
└────────────────────────────────────────────────────────────┘
  Cloudflare:
    - DDoS protection
    - WAF rules
    - Rate limiting
    - TLS 1.3 only
    - HTTPS enforcement

┌────────────────────────────────────────────────────────────┐
│  Layer 2: Authentication                                   │
└────────────────────────────────────────────────────────────┘
  Clerk:
    - Password hashing (bcrypt)
    - Email verification
    - Brute force protection
    - Session management
    - JWT signature verification

┌────────────────────────────────────────────────────────────┐
│  Layer 3: Edge Worker Security                             │
└────────────────────────────────────────────────────────────┘
  Cloudflare Workers:
    - V8 isolate sandboxing
    - No file system access
    - Limited CPU time (DOS protection)
    - Environment variable encryption
    - Secrets management

┌────────────────────────────────────────────────────────────┐
│  Layer 4: Application Security                             │
└────────────────────────────────────────────────────────────┘
  React Router:
    - SSR auth checks (getAuth)
    - Protected route layouts
    - CSP headers (future)
    - XSS prevention (React escaping)

┌────────────────────────────────────────────────────────────┐
│  Layer 5: Data Access Security                             │
└────────────────────────────────────────────────────────────┘
  Convex:
    - JWT validation
    - Role-based access control
    - Query-level authorization
    - Input validation (v.string(), etc.)
    - SQL injection not possible (NoSQL)

┌────────────────────────────────────────────────────────────┐
│  Layer 6: Data Security                                    │
└────────────────────────────────────────────────────────────┘
  Storage:
    - Encryption at rest (Convex, Clerk)
    - Encryption in transit (TLS)
    - Automatic backups
    - Access logs
```

### Trust Boundaries

```
┌────────────────────────────────────────────────────────────┐
│  UNTRUSTED                                                 │
│  ──────────                                                │
│  - User browser                                            │
│  - Client-side JavaScript                                  │
│  - Local storage / session storage                         │
│  - Any data from client                                    │
│  ───────────────────────────────────────────────────────   │
│  ⚠️ Never trust client for security decisions              │
│  ⚠️ Always validate on server                              │
└────────────────────────────────────────────────────────────┘
                     │
                     │ JWT Token (signed)
                     ↓
┌────────────────────────────────────────────────────────────┐
│  TRUST BOUNDARY: JWT Signature Verification               │
│  ────────────────────────────────────────────              │
│  - Clerk signs JWT with private key                        │
│  - Convex verifies with public key                         │
│  - If valid: Trust claims in JWT                           │
│  - If invalid: Reject request                              │
└────────────────────────────────────────────────────────────┘
                     │
                     │ Authenticated Request
                     ↓
┌────────────────────────────────────────────────────────────┐
│  TRUSTED                                                   │
│  ───────                                                   │
│  - Cloudflare Workers (our code)                           │
│  - Convex functions (our code)                             │
│  - Database (managed, encrypted)                           │
│  - Server-side secrets                                     │
│  ───────────────────────────────────────────────────────   │
│  ✅ Security decisions made here                           │
│  ✅ Authorization enforced here                            │
└────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: 2025-10-23
**Diagram Type**: Authentication & Authorization Flows
**Use Case**: Understanding security architecture and auth patterns
