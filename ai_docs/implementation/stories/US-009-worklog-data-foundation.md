# User Story: Establish Worklog Data Structure and User Hour Policies

**ID**: US-009
**Epic**: EPIC-004 (Data Foundation & Seeding)
**Status**: Backlog
**Priority**: Critical (Must complete first)
**Estimate**: 1 day

## User Story

**As a** developer
**I want to** establish the database schema for worklogs and extend users with hour policies
**So that** the application can store, query, and manage worklog data efficiently

## Acceptance Criteria

1. **Given** the Convex schema file
   **When** I extend the users table
   **Then** it includes `dailyMinHours` and `dailyMaxHours` fields (both numbers)

2. **Given** the Convex schema file
   **When** I create the worklogs table
   **Then** it includes all required fields:
   - userId (reference to users)
   - date (string, "YYYY-MM-DD" format)
   - workedHours (number, allows decimals)
   - taskId (optional string)
   - description (optional string)
   - createdAt (number timestamp)
   - updatedAt (number timestamp)

3. **Given** the worklogs table schema
   **When** I define indexes
   **Then** the following indexes exist:
   - `by_user_date`: [userId, date]
   - `by_date_user`: [date, userId]
   - `by_user_createdAt`: [userId, createdAt]

4. **Given** I deploy the schema to Convex
   **When** the deployment completes
   **Then** no errors occur
   **And** the schema is active in the Convex dashboard

5. **Given** I create a seed script
   **When** I run the seed function
   **Then** test users are created with varying min/max hours
   **And** 30 days of worklog data is generated for each user
   **And** the data includes OT, UT, and normal cases

6. **Given** the seed data is complete
   **When** I query the database
   **Then** queries return results in < 500ms (performance baseline)

## Business Rules

- dailyMinHours and dailyMaxHours default to 8 if not specified
- Both hour values must be > 0
- Worklogs cannot be created without a valid userId
- Date must be in "YYYY-MM-DD" format
- workedHours can be decimal (e.g., 7.5)
- Seed data should span 30 days from today backward
- Seed should create at least 3 test users with different hour policies

## Full-Stack Implementation Notes

### Database Layer (Convex)

#### Step 1: Update Schema
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    clerkId: v.string(),
    imageUrl: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    dailyMinHours: v.number(), // NEW
    dailyMaxHours: v.number(), // NEW
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_clerkId", ["clerkId"]),

  worklogs: defineTable({
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
    workedHours: v.number(),
    taskId: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_date_user", ["date", "userId"])
    .index("by_user_createdAt", ["userId", "createdAt"]),

  // ... existing todos table
});
```

#### Step 2: Create Seed Script
```typescript
// convex/seed.ts
import { internalMutation } from "./_generated/server";

export const seedWorklogData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingWorklogs = await ctx.db.query("worklogs").first();
    if (existingWorklogs) {
      return { message: "Already seeded" };
    }

    // Create test users
    const testUsers = [
      {
        clerkId: "user_test1",
        email: "user1@example.com",
        name: "Test User 1",
        dailyMinHours: 3,
        dailyMaxHours: 5,
        roles: ["user"],
      },
      {
        clerkId: "user_test2",
        email: "user2@example.com",
        name: "Test User 2",
        dailyMinHours: 7,
        dailyMaxHours: 9,
        roles: ["user"],
      },
      {
        clerkId: "admin_test",
        email: "admin@example.com",
        name: "Admin User",
        dailyMinHours: 8,
        dailyMaxHours: 8,
        roles: ["admin"],
      },
    ];

    const userIds = [];
    for (const userData of testUsers) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", userData.clerkId))
        .unique();

      if (!existing) {
        const userId = await ctx.db.insert("users", {
          ...userData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        userIds.push({ id: userId, ...userData });
      } else {
        userIds.push({ id: existing._id, ...userData });
      }
    }

    // Generate 30 days of worklogs
    const today = new Date();
    let totalWorklogs = 0;

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      for (const user of userIds) {
        // 0-4 entries per day (mostly 2-3)
        const numEntries = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < numEntries; i++) {
          // Generate hours that create OT/UT/normal mix
          let hours: number;
          const rand = Math.random();

          if (rand < 0.2) {
            // 20% undertime
            hours = user.dailyMinHours * (0.5 + Math.random() * 0.4);
          } else if (rand < 0.4) {
            // 20% overtime
            hours = user.dailyMaxHours * (1.1 + Math.random() * 0.4);
          } else {
            // 60% normal
            hours = user.dailyMinHours + Math.random() * (user.dailyMaxHours - user.dailyMinHours);
          }

          const entryHours = hours / numEntries;

          await ctx.db.insert("worklogs", {
            userId: user.id,
            date: dateStr,
            workedHours: Math.round(entryHours * 10) / 10,
            taskId: Math.random() > 0.5 ? `TASK-${Math.floor(Math.random() * 1000)}` : undefined,
            description: Math.random() > 0.3 ? `Work on project ${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}` : undefined,
            createdAt: date.getTime(),
            updatedAt: date.getTime(),
          });

          totalWorklogs++;
        }
      }
    }

    return {
      message: "Seed completed",
      usersCreated: userIds.length,
      worklogsCreated: totalWorklogs,
    };
  },
});
```

#### Step 3: Migration for Existing Users
```typescript
// convex/migrations.ts (create if doesn't exist)
import { internalMutation } from "./_generated/server";

export const addDefaultHoursToUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    for (const user of allUsers) {
      if (user.dailyMinHours === undefined || user.dailyMaxHours === undefined) {
        await ctx.db.patch(user._id, {
          dailyMinHours: 8,
          dailyMaxHours: 8,
          updatedAt: Date.now(),
        });
      }
    }

    return { updated: allUsers.length };
  },
});
```

### Deployment Steps

1. Update schema in `convex/schema.ts`
2. Run `bun convex:dev` to deploy schema to dev environment
3. Run migration for existing users (via Convex dashboard)
4. Run seed script (via Convex dashboard or CLI)
5. Verify data in Convex dashboard
6. Test query performance

## Technical Notes

- Schema changes auto-deploy when using `convex dev`
- Existing data migration needed if users table has existing records
- Seed script is idempotent (checks if already seeded)
- Use internalMutation for seed/migration (not callable from client)
- Date format "YYYY-MM-DD" enables efficient string comparison/sorting
- Indexes critical for query performance with large datasets

## Testing Checklist

- [ ] Schema deploys without errors
- [ ] Users table has dailyMinHours and dailyMaxHours fields
- [ ] Worklogs table created with all fields
- [ ] All indexes created successfully
- [ ] Migration adds default hours to existing users
- [ ] Seed script creates 3 test users
- [ ] Seed script creates 30 days of data per user
- [ ] Seed data includes OT days (hours > max)
- [ ] Seed data includes UT days (hours < min)
- [ ] Seed data includes normal days
- [ ] Queries with indexes return in < 500ms
- [ ] `bun check` passes (no TypeScript errors)

## Dependencies

- None (foundational story)

## Definition of Done

- [ ] Schema updated in convex/schema.ts
- [ ] Schema deployed to Convex successfully
- [ ] Seed script created (convex/seed.ts)
- [ ] Migration script created (if needed)
- [ ] Seed data generated and verified
- [ ] All indexes created
- [ ] Query performance validated (< 500ms)
- [ ] All acceptance criteria passing
- [ ] No errors in Convex dashboard
- [ ] Documentation updated (if needed)
- [ ] Code reviewed
