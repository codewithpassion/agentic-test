# Product Requirements Prompt: Worklog Tracking System

## Overview

Build a comprehensive worklog tracking system that enables employees to log their daily work hours, with automatic overtime/undertime detection, admin oversight capabilities, and support for 10K users with 10 years of historical data migration.

## Tech Stack

This project uses the following technologies (already configured):

- **Frontend**: React 19, React Router 7, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Cloudflare Workers, Convex (real-time database)
- **Authentication**: Clerk
- **Tooling**: Bun, Biome (strict TypeScript, NO `any` types)

## Documentation References

- [Convex Docs](https://docs.convex.dev/)
- [Convex Schema Documentation](https://docs.convex.dev/database/schemas)
- [Convex Queries & Mutations](https://docs.convex.dev/functions/query-functions)
- [React Router 7 Docs](https://reactrouter.com/dev)
- [Clerk Auth Docs](https://clerk.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## Core Requirements

### User Roles & Access Control

**Anonymous Users**
- Can only view login page and help page (use lorem ipsum for help content)

**Registered Users (role: "user")**
- Log in using Clerk authentication
- Create multiple worklogs per day
- View their own worklogs with the following features:
  - Data grouped by day
  - Total hours displayed for each day
  - OT (overtime) indicator if worked > dailyMaxHours
  - UT (undertime) indicator if worked < dailyMinHours
  - Filter by OT or UT status
  - Pagination support
  - Default sorting: most recent day first

**Admin Users (role: "admin")**
- All regular user capabilities
- View all users' worklogs with:
  - User name displayed alongside worklog data
  - Sorting: first by day (most recent), then by user name
  - Same filtering and pagination as user view
- Manage user min/max daily hours (edit interface)
- List all users in the system

### Data Model

**Users Table** (extend existing `users` schema in `convex/schema.ts`)
- `name`: string
- `email`: string
- `clerkId`: string (already exists)
- `roles`: array of strings (already exists)
- `dailyMinHours`: number (NEW - default: 8)
- `dailyMaxHours`: number (NEW - default: 8)
- `imageUrl`: optional string (already exists)
- `createdAt`: number (already exists)
- `updatedAt`: number (already exists)

**Worklogs Table** (NEW table to create)
- `userId`: Id<"users"> (reference to users table)
- `date`: string (format: "YYYY-MM-DD" for easy grouping)
- `workedHours`: number (decimal, e.g., 7.5)
- `taskId`: optional string
- `description`: optional string
- `createdAt`: number (timestamp)
- `updatedAt`: number (timestamp)

**Indexes to create:**
- `by_user_date`: [userId, date] (for efficient user worklog queries)
- `by_date_user`: [date, userId] (for admin queries sorted by date then user)
- `by_user_createdAt`: [userId, createdAt] (for chronological sorting)

### Database Seeding

Create seed data in `convex/seed.ts` (new file):

**Users:**
- user1@example.com: min=3h, max=5h, role=["user"]
- user2@example.com: min=7h, max=9h, role=["user"]
- admin@example.com: min=8h, max=8h, role=["admin"]

**Worklogs:**
- Generate realistic data for the past 30 days for each user
- 0-N entries per user per day (mostly 2-3 entries)
- Ensure some days have:
  - Total hours < dailyMinHours (undertime cases)
  - Total hours > dailyMaxHours (overtime cases)
  - Total hours within range (normal cases)

### UI/UX Requirements

**Navigation Structure**
- Public routes:
  - `/` - Landing page with login CTA
  - `/login` - Clerk sign-in
  - `/help` - Help page with lorem ipsum content
- Protected routes (prefix: `_auth.`):
  - `/_auth.worklogs` - User's worklog list/create
  - `/_auth.admin.worklogs` - Admin view all worklogs
  - `/_auth.admin.users` - Admin user management (list + edit min/max hours)

**Worklog Entry Form**
- Date picker (default: today)
- Hours worked input (number, decimal allowed)
- Optional task ID (text input)
- Optional description (textarea)
- Submit button
- Clear validation feedback

**Worklog List View**
- Grouped by day with date headers
- Each day shows:
  - Date (formatted: "Monday, Jan 15, 2024")
  - Total hours for the day
  - OT/UT badge if applicable
  - Individual worklog entries with edit/delete actions
- Filters:
  - "All Days" (default)
  - "Overtime Days"
  - "Undertime Days"
  - "Normal Days"
- Pagination: 10 days per page
- Loading states with skeleton screens
- Empty states with helpful messages

**Admin User Management**
- User list table with columns:
  - Name
  - Email
  - Daily Min Hours
  - Daily Max Hours
  - Actions (edit button)
- Edit modal for min/max hours:
  - Validation: max must be >= min
  - Save/Cancel buttons
  - Success/error toast notifications

## Implementation Plan

### Phase 1: Database Schema & Migrations

**Step 1.1: Update Users Schema**
1. Open `convex/schema.ts`
2. Add `dailyMinHours` and `dailyMaxHours` fields to users table
3. Run `bun convex:dev` to apply schema changes

**Validation:**
- Schema deployed successfully
- No type errors in generated types

**Step 1.2: Create Worklogs Schema**
1. Add `worklogs` table definition to `convex/schema.ts`
2. Include all required fields with proper types
3. Add indexes: `by_user_date`, `by_date_user`, `by_user_createdAt`

**Validation:**
- Run `bun check` - no TypeScript errors
- Schema validates in Convex dashboard

**Code Example (convex/schema.ts):**
```typescript
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
    date: v.string(), // Format: "YYYY-MM-DD"
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

### Phase 2: Convex Backend Functions

**Step 2.1: Create Worklog Mutations**

Create `convex/worklogs.ts` with the following functions:

**2.1.1: createWorklog mutation**
- Args: `date` (string), `workedHours` (number), optional `taskId`, optional `description`
- Validate: workedHours > 0
- Get authenticated user via `requireAuth(ctx)`
- Insert worklog with userId, timestamps
- Return created worklog

**2.1.2: updateWorklog mutation**
- Args: `id` (worklog ID), `workedHours`, optional `taskId`, optional `description`
- Get authenticated user
- Verify ownership (worklog.userId === user._id)
- Update worklog with new values + updatedAt timestamp
- Return updated worklog

**2.1.3: deleteWorklog mutation**
- Args: `id` (worklog ID)
- Get authenticated user
- Verify ownership
- Delete worklog
- Return success

**Code Pattern (follow convex/todos.ts):**
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

export const create = mutation({
  args: {
    date: v.string(),
    workedHours: v.number(),
    taskId: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Validate
    if (args.workedHours <= 0) {
      throw new Error("Worked hours must be greater than 0");
    }

    const worklogId = await ctx.db.insert("worklogs", {
      userId: user._id,
      date: args.date,
      workedHours: args.workedHours,
      taskId: args.taskId,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(worklogId);
  },
});

// Similar pattern for update and delete...
```

**Validation:**
- Run `bun check` - no TypeScript errors
- Test in Convex dashboard with sample data
- Verify error handling (invalid hours, unauthorized access)

**Step 2.2: Create Worklog Queries**

**2.2.1: getUserWorklogs query**
- Args: `userId` (optional - for admin use), `filter` (optional: "all" | "overtime" | "undertime" | "normal"), `limit`, `offset`
- Get authenticated user
- If userId provided and user is not admin, throw unauthorized error
- Query worklogs for target user
- Group by date, calculate daily totals
- Apply OT/UT filter based on user's min/max hours
- Sort by date descending
- Apply pagination
- Return grouped data with hasMore flag

**2.2.2: getWorklogsByDate query**
- Args: `date` (string "YYYY-MM-DD")
- For admin use
- Require admin role
- Query all worklogs for specific date
- Include user information (name, email)
- Sort by user name
- Return worklog entries with user data

**Code Pattern:**
```typescript
export const getUserWorklogs = query({
  args: {
    userId: v.optional(v.id("users")),
    filter: v.optional(v.union(
      v.literal("all"),
      v.literal("overtime"),
      v.literal("undertime"),
      v.literal("normal")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);
    const limit = args.limit || 10;
    const offset = args.offset || 0;

    // Determine target user
    const targetUserId = args.userId || currentUser._id;

    // Authorization check
    if (targetUserId !== currentUser._id) {
      if (!currentUser.roles?.includes("admin")) {
        throw new Error("Unauthorized");
      }
    }

    // Get target user for min/max hours
    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Query worklogs
    const worklogs = await ctx.db
      .query("worklogs")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", targetUserId))
      .order("desc")
      .collect();

    // Group by date and calculate totals
    const groupedByDate = new Map<string, {
      date: string;
      entries: typeof worklogs;
      totalHours: number;
      status: "normal" | "overtime" | "undertime";
    }>();

    for (const worklog of worklogs) {
      const existing = groupedByDate.get(worklog.date);
      if (existing) {
        existing.entries.push(worklog);
        existing.totalHours += worklog.workedHours;
      } else {
        groupedByDate.set(worklog.date, {
          date: worklog.date,
          entries: [worklog],
          totalHours: worklog.workedHours,
          status: "normal", // Will be calculated below
        });
      }
    }

    // Calculate status for each day
    for (const day of groupedByDate.values()) {
      if (day.totalHours > targetUser.dailyMaxHours) {
        day.status = "overtime";
      } else if (day.totalHours < targetUser.dailyMinHours) {
        day.status = "undertime";
      }
    }

    // Apply filter
    let filteredDays = Array.from(groupedByDate.values());
    if (args.filter && args.filter !== "all") {
      filteredDays = filteredDays.filter(day => day.status === args.filter);
    }

    // Sort by date descending
    filteredDays.sort((a, b) => b.date.localeCompare(a.date));

    // Apply pagination
    const totalCount = filteredDays.length;
    const paginatedDays = filteredDays.slice(offset, offset + limit);

    return {
      days: paginatedDays,
      totalCount,
      hasMore: offset + limit < totalCount,
      userMinHours: targetUser.dailyMinHours,
      userMaxHours: targetUser.dailyMaxHours,
    };
  },
});
```

**Validation:**
- Test with various filters
- Verify pagination works correctly
- Check OT/UT calculation logic
- Test admin access to other users' logs

**Step 2.3: Create User Management Functions**

Update `convex/users.ts`:

**2.3.1: updateUserHours mutation**
- Args: `userId` (clerkId), `dailyMinHours`, `dailyMaxHours`
- Require admin role
- Validate: max >= min, both > 0
- Update user record
- Return updated user

**Code Pattern:**
```typescript
export const updateUserHours = mutation({
  args: {
    userId: v.string(), // clerkId
    dailyMinHours: v.number(),
    dailyMaxHours: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    // Check admin role
    if (!currentUser.roles?.includes("admin")) {
      throw new ConvexError("Unauthorized: Admin access required");
    }

    // Validate
    if (args.dailyMinHours <= 0 || args.dailyMaxHours <= 0) {
      throw new ConvexError("Hours must be greater than 0");
    }
    if (args.dailyMaxHours < args.dailyMinHours) {
      throw new ConvexError("Max hours must be >= min hours");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update
    await ctx.db.patch(user._id, {
      dailyMinHours: args.dailyMinHours,
      dailyMaxHours: args.dailyMaxHours,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});
```

**Validation:**
- Test with valid and invalid inputs
- Verify admin-only access
- Check error messages are user-friendly

### Phase 3: Seed Data Generation

**Step 3.1: Create Seed Script**

Create `convex/seed.ts`:

```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedWorklogData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingWorklogs = await ctx.db.query("worklogs").first();
    if (existingWorklogs) {
      console.log("Database already seeded");
      return { message: "Already seeded" };
    }

    // Create test users (if not exist)
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

    // Generate worklogs for past 30 days
    const today = new Date();
    const worklogCount = { total: 0 };

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0]; // "YYYY-MM-DD"

      for (const user of userIds) {
        // Random number of entries per day (0-4, mostly 2-3)
        const numEntries = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < numEntries; i++) {
          // Generate hours that sometimes exceed min/max
          let hours: number;
          const rand = Math.random();

          if (rand < 0.2) {
            // 20% chance: undertime
            hours = user.dailyMinHours * (0.5 + Math.random() * 0.4); // 50-90% of min
          } else if (rand < 0.4) {
            // 20% chance: overtime
            hours = user.dailyMaxHours * (1.1 + Math.random() * 0.4); // 110-150% of max
          } else {
            // 60% chance: normal range
            hours = user.dailyMinHours + Math.random() * (user.dailyMaxHours - user.dailyMinHours);
          }

          // Divide into entries for this day
          const entryHours = hours / numEntries;

          await ctx.db.insert("worklogs", {
            userId: user.id,
            date: dateStr,
            workedHours: Math.round(entryHours * 10) / 10, // Round to 1 decimal
            taskId: Math.random() > 0.5 ? `TASK-${Math.floor(Math.random() * 1000)}` : undefined,
            description: Math.random() > 0.3 ? `Work on project ${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}` : undefined,
            createdAt: date.getTime(),
            updatedAt: date.getTime(),
          });

          worklogCount.total++;
        }
      }
    }

    return {
      message: "Seed completed",
      usersCreated: userIds.length,
      worklogsCreated: worklogCount.total,
    };
  },
});
```

**Step 3.2: Run Seed**

Create a script to run the seed:
```bash
# In terminal or create a script file
# This requires calling the internal mutation via Convex dashboard or CLI
```

**Validation:**
- Verify users created with correct min/max hours
- Check worklogs span 30 days
- Confirm mix of OT/UT/normal days
- Run `bun check` for type errors

### Phase 4: Frontend Components

**Step 4.1: Create Worklog Components**

Create directory: `app/components/features/worklogs/`

**4.1.1: worklog-form.tsx**
- Form component using shadcn form components
- Fields: date picker, hours input, optional task ID, description
- Validation: hours > 0, date required
- Call `useMutation(api.worklogs.create)`
- Show toast on success/error
- Reset form after successful submission

**Component Pattern:**
```typescript
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { DatePicker } from "~/components/ui/date-picker";
import { toast } from "sonner";

export function WorklogForm({ onSuccess }: { onSuccess?: () => void }) {
  const createWorklog = useMutation(api.worklogs.create);
  const [date, setDate] = useState<Date>(new Date());
  const [hours, setHours] = useState("");
  const [taskId, setTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast.error("Please enter valid hours");
      return;
    }

    setIsSubmitting(true);
    try {
      await createWorklog({
        date: date.toISOString().split('T')[0],
        workedHours: hoursNum,
        taskId: taskId || undefined,
        description: description || undefined,
      });

      toast.success("Worklog created successfully");

      // Reset form
      setHours("");
      setTaskId("");
      setDescription("");
      setDate(new Date());

      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create worklog");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields implementation */}
    </form>
  );
}
```

**4.1.2: worklog-list.tsx**
- Display grouped worklogs by date
- Show total hours per day with OT/UT badges
- Filter buttons (All/OT/UT/Normal)
- Pagination controls
- Empty state
- Loading skeleton

**Component Pattern:**
```typescript
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

export function WorklogList({ userId }: { userId?: string }) {
  const [filter, setFilter] = useState<"all" | "overtime" | "undertime" | "normal">("all");
  const [page, setPage] = useState(0);
  const limit = 10;

  const data = useQuery(api.worklogs.getUserWorklogs, {
    userId,
    filter,
    limit,
    offset: page * limit,
  });

  if (!data) {
    return <LoadingSpinner />;
  }

  if (data.days.length === 0) {
    return <div>No worklogs found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Days
        </Button>
        <Button
          variant={filter === "overtime" ? "default" : "outline"}
          onClick={() => setFilter("overtime")}
        >
          Overtime
        </Button>
        <Button
          variant={filter === "undertime" ? "default" : "outline"}
          onClick={() => setFilter("undertime")}
        >
          Undertime
        </Button>
        <Button
          variant={filter === "normal" ? "default" : "outline"}
          onClick={() => setFilter("normal")}
        >
          Normal
        </Button>
      </div>

      {/* Worklog days */}
      {data.days.map((day) => (
        <Card key={day.date} className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">
              {new Date(day.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-medium">{day.totalHours.toFixed(1)}h</span>
              {day.status === "overtime" && (
                <Badge variant="destructive">OT</Badge>
              )}
              {day.status === "undertime" && (
                <Badge variant="secondary">UT</Badge>
              )}
            </div>
          </div>

          {/* Individual entries */}
          <div className="space-y-2">
            {day.entries.map((entry) => (
              <div key={entry._id} className="text-sm border-l-2 pl-3">
                <div className="flex justify-between">
                  <span>{entry.workedHours}h</span>
                  {entry.taskId && <span className="text-gray-600">{entry.taskId}</span>}
                </div>
                {entry.description && (
                  <p className="text-gray-600 mt-1">{entry.description}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {data.hasMore && (
        <Button onClick={() => setPage(p => p + 1)}>Load More</Button>
      )}
    </div>
  );
}
```

**Validation:**
- Test form submission
- Verify validation works
- Check list renders correctly
- Test filtering and pagination

**Step 4.2: Create Admin Components**

Create `app/components/features/admin/` directory:

**4.2.1: user-hours-edit-modal.tsx**
- Modal component for editing user min/max hours
- Validate: max >= min, both > 0
- Call `useMutation(api.users.updateUserHours)`
- Show success toast

**4.2.2: admin-worklog-list.tsx**
- Similar to worklog-list but includes user names
- Sort by date then user name
- Admin-only view

**Validation:**
- Test admin authorization
- Verify sorting works correctly
- Check user names display

### Phase 5: Route Pages

**Step 5.1: Create User Routes**

**5.1.1: app/routes/_auth.worklogs.tsx**
- Protected route (requires auth)
- Import WorklogForm and WorklogList components
- Use PublicLayout wrapper
- Add meta for SEO

**Route Pattern:**
```typescript
import type { MetaFunction } from "react-router";
import { PublicLayout } from "~/components/layouts/public-layout";
import { WorklogForm } from "~/components/features/worklogs/worklog-form";
import { WorklogList } from "~/components/features/worklogs/worklog-list";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const meta: MetaFunction = () => {
  return [
    { title: "My Worklogs - Worklog Tracker" },
    { name: "description", content: "Track your daily work hours" },
  ];
};

export default function WorklogsPage() {
  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-200px)] bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">My Worklogs</h1>

          {/* Create Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Log Work Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <WorklogForm />
            </CardContent>
          </Card>

          {/* List */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Work History</h2>
            <WorklogList />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
```

**5.1.2: app/routes/help.tsx**
- Public route (no auth required)
- Display lorem ipsum help content
- Use PublicLayout

**Validation:**
- Test route navigation
- Verify auth protection works
- Check meta tags render

**Step 5.2: Create Admin Routes**

**5.2.1: app/routes/_auth.admin.worklogs.tsx**
- Protected route with admin check
- Use AdminWorklogList component
- Filter/search UI

**5.2.2: app/routes/_auth.admin.users._index.tsx**
- List all users with min/max hours
- Edit button opens modal
- Use existing patterns from current admin routes

**Authorization Pattern:**
```typescript
import { useAuth } from "~/hooks/use-auth";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function AdminWorklogsPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !hasRole("admin")) {
      navigate("/unauthorized");
    }
  }, [user, hasRole, navigate]);

  if (!hasRole("admin")) {
    return null;
  }

  // Admin content here
}
```

**Validation:**
- Test admin-only access
- Verify non-admins redirected
- Check all CRUD operations work

### Phase 6: Update Navigation & Permissions

**Step 6.1: Update Navigation Menu**

Edit `app/components/shared/navigation-header.tsx`:
- Add "Worklogs" link for authenticated users
- Add "Admin Worklogs" link for admins only

**Step 6.2: Update Permission System**

Edit `app/lib/permissions.ts`:
- Add worklog-related permissions:
  - `"worklogs.view_own"`
  - `"worklogs.create_own"`
  - `"worklogs.edit_own"`
  - `"worklogs.delete_own"`
  - `"worklogs.view_all"` (admin)
  - `"worklogs.edit_users_hours"` (admin)

**Validation:**
- Test navigation links appear correctly
- Verify permission checks work
- Test role-based UI rendering

### Phase 7: Testing & Polish

**Step 7.1: End-to-End Testing**
1. Test user flow:
   - Sign up → create worklog → view list → filter → paginate
2. Test admin flow:
   - View all worklogs → edit user hours → view updated stats
3. Test edge cases:
   - Multiple entries same day
   - Zero hours validation
   - Past/future dates
   - Max >= min validation

**Step 7.2: UI Polish**
- Add loading skeletons for all lists
- Add empty states with helpful CTAs
- Ensure responsive design (mobile/tablet/desktop)
- Add proper error boundaries
- Toast notifications for all actions

**Step 7.3: Performance Check**
- Test with 10K+ records
- Verify pagination works efficiently
- Check Convex query performance in dashboard
- Optimize indexes if needed

**Validation Commands:**
```bash
bun check              # All type checks pass
bun biome:check        # Linting passes
bun dev                # Start dev server
bun convex:dev         # Convex running
```

**Expected Results:**
- No TypeScript errors (strict mode, no `any` types)
- All queries return in < 500ms
- UI responsive on mobile/desktop
- Proper error handling throughout

## Common Pitfalls & Solutions

### Pitfall 1: Using `any` Types
**Problem:** Strict TypeScript will break the build
**Solution:** Always import types from Convex generated files:
```typescript
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { api } from "../../convex/_generated/api";
```

### Pitfall 2: Date Formatting Inconsistencies
**Problem:** Date comparisons fail due to timezone issues
**Solution:** Always use "YYYY-MM-DD" string format for dates, convert in backend:
```typescript
const dateStr = new Date().toISOString().split('T')[0];
```

### Pitfall 3: Missing Indexes
**Problem:** Slow queries with large datasets
**Solution:** Create compound indexes for common query patterns:
```typescript
.index("by_user_date", ["userId", "date"])
```

### Pitfall 4: Authorization Bypass
**Problem:** Client-side checks can be bypassed
**Solution:** Always validate authorization in Convex functions:
```typescript
const user = await requireAuth(ctx);
if (!user.roles?.includes("admin")) {
  throw new Error("Unauthorized");
}
```

### Pitfall 5: Pagination State Management
**Problem:** Pagination breaks when filter changes
**Solution:** Reset page to 0 when filter changes:
```typescript
const handleFilterChange = (newFilter: string) => {
  setFilter(newFilter);
  setPage(0); // Reset pagination
};
```

## Success Criteria

### Functional Requirements ✅
- [ ] Users can create, edit, delete their worklogs
- [ ] Worklogs display grouped by day with totals
- [ ] OT/UT indicators show correctly
- [ ] Filtering works (All/OT/UT/Normal)
- [ ] Pagination works smoothly
- [ ] Admins can view all users' worklogs
- [ ] Admins can edit user min/max hours
- [ ] Anonymous users only see login/help pages

### Technical Requirements ✅
- [ ] Zero TypeScript `any` types
- [ ] `bun check` passes with no errors
- [ ] All Convex functions use proper auth
- [ ] Proper indexes for efficient queries
- [ ] Mobile-responsive design
- [ ] Loading states for all async operations
- [ ] Error handling with user-friendly messages

### Performance Requirements ✅
- [ ] Queries return in < 500ms with 10K records
- [ ] Pagination loads instantly
- [ ] UI remains responsive during data fetching
- [ ] Convex dashboard shows no slow queries

### Security Requirements ✅
- [ ] All protected routes require authentication
- [ ] Admin routes check roles on backend
- [ ] User can only modify their own worklogs
- [ ] Admin cannot be bypassed from client

## Post-Implementation Checklist

1. **Code Quality**
   - [ ] Run `bun check` - zero errors
   - [ ] Run `bun biome:check` - zero issues
   - [ ] No `any` types in codebase
   - [ ] All functions have proper type annotations

2. **Testing**
   - [ ] Test all user flows manually
   - [ ] Test all admin flows manually
   - [ ] Test edge cases (0 hours, invalid dates, etc.)
   - [ ] Test with seed data (30 days, multiple users)

3. **Documentation**
   - [ ] Update navigation docs if needed
   - [ ] Add comments for complex logic
   - [ ] Document any new permissions added

4. **Deployment**
   - [ ] Run `bun convex:deploy` to deploy schema
   - [ ] Verify seed data in production (optional)
   - [ ] Test production deployment

## Next Steps & Future Enhancements

**Phase 8 (Future):**
- Export worklogs to CSV/PDF
- Bulk import from spreadsheets
- Worklog approval workflow
- Analytics dashboard with charts
- Mobile app using same Convex backend
- Email notifications for OT/UT days
- Integration with time tracking tools

---

## Quick Reference

### Key Files to Create/Modify

**Create:**
- `convex/worklogs.ts` - Worklog queries/mutations
- `convex/seed.ts` - Database seeding
- `app/components/features/worklogs/worklog-form.tsx`
- `app/components/features/worklogs/worklog-list.tsx`
- `app/components/features/admin/user-hours-edit-modal.tsx`
- `app/components/features/admin/admin-worklog-list.tsx`
- `app/routes/_auth.worklogs.tsx`
- `app/routes/help.tsx`
- `app/routes/_auth.admin.worklogs.tsx`

**Modify:**
- `convex/schema.ts` - Add worklogs table, update users table
- `convex/users.ts` - Add updateUserHours mutation
- `app/lib/permissions.ts` - Add worklog permissions
- `app/components/shared/navigation-header.tsx` - Add nav links

### Essential Commands

```bash
bun dev                # Start development server
bun convex:dev         # Start Convex dev server
bun check              # Type check (MUST PASS)
bun biome:check        # Lint and format
bun convex:deploy      # Deploy schema to production
```

### Common Convex Patterns

```typescript
// Query pattern
export const myQuery = query({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    // Query logic
  },
});

// Mutation pattern
export const myMutation = mutation({
  args: { field: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    // Mutation logic
  },
});

// Using in React
import { useQuery, useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";

const data = useQuery(api.myFile.myQuery, { id });
const myMutation = useMutation(api.myFile.myMutation);
```
