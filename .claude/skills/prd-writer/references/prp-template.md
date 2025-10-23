# PRP Template

This is a complete template for a Product Requirements Prompt. Use this structure when generating PRPs for features.

---

# [Feature Name] - PRP

**Generated**: [Date]  
**Author**: AI Assistant  
**Status**: Draft/Review/Approved

## Executive Summary

[1-2 paragraph overview of what this feature does and why it matters. Include key technical decisions and constraints.]

## Context

### Project Background
- **Tech Stack**: [e.g., TypeScript, Cloudflare Workers, Hono, React, D1]
- **Current State**: [What exists now related to this feature]
- **Dependencies**: [Other systems or features this relies on]
- **Target Users**: [Who will use this feature]

### Technical Constraints
- [Constraint 1: e.g., Must run in edge runtime with no Node.js APIs]
- [Constraint 2: e.g., Response time must be under 200ms]
- [Constraint 3: e.g., Must work offline with service workers]

### Common Pitfalls
- [Pitfall 1: What commonly goes wrong with this type of feature]
- [Pitfall 2: Edge cases often missed]
- [Pitfall 3: Performance bottlenecks to watch for]

## Requirements

### Functional Requirements
1. [Requirement 1: User must be able to...]
2. [Requirement 2: System must...]
3. [Requirement 3: Feature should...]

### Non-Functional Requirements
- **Performance**: [Specific benchmarks]
- **Security**: [Auth requirements, data protection]
- **Scalability**: [Expected load, growth considerations]
- **Accessibility**: [WCAG compliance level if applicable]

## Implementation Plan

### Phase 1: Foundation
**Goal**: [What this phase achieves]

**Steps**:
1. Set up database schema
   - Create migration file
   - Define TypeScript types
   - Add indexes for performance
   
   **Validation**: Run migration, verify schema with `wrangler d1 migrations list`

2. Create API endpoints
   - Implement Hono routes
   - Add middleware for auth
   - Set up error handling
   
   **Validation**: Test with `curl` commands, verify 200 responses

3. [Additional steps...]

**Code Patterns to Follow**:
- Reference: `examples/database/schema.sql` for schema patterns
- Reference: `examples/api/hono-server.ts` for API structure
- Reference: `examples/middleware/auth.ts` for authentication

**Anti-Patterns to Avoid**:
- Don't use blocking operations in Workers
- Don't store large data in KV (use D1 instead)
- Don't skip input validation

### Phase 2: Core Features
**Goal**: [What this phase achieves]

**Steps**:
1. [Step 1]
   **Validation**: [How to verify]

2. [Step 2]
   **Validation**: [How to verify]

**Code Patterns to Follow**:
- [References]

### Phase 3: Integration & Testing
**Goal**: Complete integration with existing systems and comprehensive testing

**Steps**:
1. Integrate with frontend
   - Create React components
   - Set up state management
   - Add error boundaries
   
   **Validation**: `bun run build` succeeds, no TypeScript errors

2. Write tests
   - Unit tests for business logic
   - Integration tests for API
   - E2E tests for critical flows
   
   **Validation**: `bun test` shows 100% pass rate

3. Performance optimization
   - Add caching where appropriate
   - Optimize database queries
   - Minimize cold start time
   
   **Validation**: Measure with `wrangler dev` and production metrics

## Code Examples

### Database Schema Example, using drizzle
```typescript
export const users = sqliteTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: text("clerk_id").notNull().unique(),
	email: text("email").notNull().unique(),
	name: text("name"),
	imageUrl: text("image_url"),
	roles: text("roles").array().default(["user"]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### API Endpoint Example
```typescript
// Follow this pattern from examples/api/hono-server.ts

import { Hono } from 'hono'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first()
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
```

### Frontend Component Example
```typescript
// Follow this pattern from examples/frontend/component.tsx

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

export function UserProfile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json())
  })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div className="profile">
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </div>
  )
}
```

## Error Handling Strategy

### Edge Cases to Handle
1. **Network failures**: Implement retry with exponential backoff
2. **Rate limiting**: Return 429 with Retry-After header
3. **Invalid input**: Validate and return 400 with specific error messages
4. **Database errors**: Log for debugging, return generic 500 to users
5. **Timeout**: Set reasonable timeouts, handle gracefully

### Error Response Format
```typescript
interface ErrorResponse {
  error: string
  code: string
  details?: Record<string, string>
  retryAfter?: number
}
```

## Testing Strategy

### Unit Tests
```bash
bun run test:unit
```
- Test pure functions and business logic
- Mock external dependencies
- Target: 90%+ coverage

### Integration Tests
```bash
bun run test:integration
```
- Test API endpoints
- Use test database
- Verify error handling

### E2E Tests
```bash
bun run test:e2e
```
- Test critical user flows
- Use Playwright or similar
- Run against staging environment

## Success Criteria

### Must Have (P0)
- [ ] All API endpoints return correct status codes
- [ ] Database queries use indexes efficiently
- [ ] Error handling covers all failure modes
- [ ] TypeScript compiles without errors
- [ ] All tests pass

### Should Have (P1)
- [ ] API response time < 200ms (p95)
- [ ] Frontend loads in < 2s on 3G
- [ ] Proper loading states in UI
- [ ] Helpful error messages for users

### Nice to Have (P2)
- [ ] Analytics tracking for feature usage
- [ ] Admin dashboard for monitoring
- [ ] Automated alerts for errors

## Validation Commands

Run these commands to verify implementation:

```bash
# TypeScript compilation
bun run build

# Run all tests
bun test

# Check types
bun run type-check

# Lint code
bun run lint

# Test locally
wrangler dev

# Deploy to staging
wrangler deploy --env staging

# Smoke test endpoints
curl https://staging.example.com/api/health
```

## Rollback Plan

If issues arise in production:

1. **Immediate**: Revert to previous deployment
   ```bash
   wrangler rollback
   ```

2. **Database**: Migrations are backwards compatible, no rollback needed

3. **Monitoring**: Check logs for errors
   ```bash
   wrangler tail --env production
   ```

## Documentation Updates Needed

- [ ] Update API documentation with new endpoints
- [ ] Add examples to README
- [ ] Document environment variables
- [ ] Update deployment guide
- [ ] Add troubleshooting section

## Future Enhancements

Potential improvements for future iterations:

1. **Performance**: Add Redis caching layer
2. **Features**: Support bulk operations
3. **UX**: Add real-time notifications
4. **Analytics**: Track user engagement metrics

---

## Appendix

### Related Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [React Query](https://tanstack.com/query/latest)

### Dependencies
```json
{
  "hono": "^4.0.0",
  "drizzle-orm": "^0.29.0",
  "@tanstack/react-query": "^5.0.0"
}
```

### Environment Variables
```bash
# Required
DATABASE_URL=your_d1_database
API_KEY=your_api_key

# Optional
LOG_LEVEL=debug
RATE_LIMIT=100
```
