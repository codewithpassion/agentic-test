# User Story: View All Employees' Worklogs as Admin

**ID**: US-005
**Epic**: EPIC-002 (Admin Worklog Oversight)
**Status**: Backlog
**Priority**: High
**Estimate**: 3 days

## User Story

**As an** administrator
**I want to** view all employees' worklogs with their names displayed
**So that** I can monitor work patterns across the organization

## Acceptance Criteria

1. **Given** I am logged in as an admin
   **When** I navigate to the admin worklogs page
   **Then** I see worklogs from all users
   **And** each entry displays the employee's name

2. **Given** I am viewing the admin worklog list
   **When** worklogs are displayed
   **Then** they are grouped by day (most recent first)
   **And** within each day, sorted alphabetically by user name

3. **Given** worklogs from multiple users exist for the same day
   **When** I view that day
   **Then** I see each user's entries grouped under their name
   **And** I see each user's total hours for that day
   **And** I see OT/UT indicators per user

4. **Given** I try to access the admin worklogs page as a regular user
   **When** the authorization check runs
   **Then** I am redirected to an unauthorized page

5. **Given** there are thousands of worklog entries
   **When** the page loads
   **Then** I see the first page of results (20 days)
   **And** I can paginate to see more days

6. **Given** I am viewing admin worklogs
   **When** a new worklog is created by any user
   **Then** the list updates automatically in real-time

## Business Rules

- Admin role required (enforced server-side)
- Display user name with each entry
- Sort order: Date (desc) → User name (asc)
- Each user's daily total calculated separately
- OT/UT indicators based on individual user's min/max hours
- Pagination: 20 days per page (admin needs more context)
- Read-only view (admins cannot edit user worklogs from this view)

## Full-Stack Implementation Notes

### Database Layer (Convex)
```typescript
// convex/worklogs.ts - Admin query
export const getAllWorklogs = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    // Check admin role
    if (!currentUser.roles?.includes("admin")) {
      throw new ConvexError("Unauthorized: Admin access required");
    }

    const limit = args.limit || 20;
    const offset = args.offset || 0;

    // Query all worklogs
    const allWorklogs = await ctx.db
      .query("worklogs")
      .order("desc")
      .collect();

    // Get all users (for min/max hours and names)
    const allUsers = await ctx.db.query("users").collect();
    const usersMap = new Map(allUsers.map(u => [u._id, u]));

    // Group by date, then by user
    type DayUserGroup = {
      date: string;
      users: Map<string, {
        userId: string;
        userName: string;
        entries: typeof allWorklogs;
        totalHours: number;
        status: "normal" | "overtime" | "undertime";
        minHours: number;
        maxHours: number;
      }>;
    };

    const groupedByDate = new Map<string, DayUserGroup>();

    for (const worklog of allWorklogs) {
      const user = usersMap.get(worklog.userId);
      if (!user) continue;

      if (!groupedByDate.has(worklog.date)) {
        groupedByDate.set(worklog.date, {
          date: worklog.date,
          users: new Map(),
        });
      }

      const dayGroup = groupedByDate.get(worklog.date)!;

      if (!dayGroup.users.has(worklog.userId)) {
        dayGroup.users.set(worklog.userId, {
          userId: worklog.userId,
          userName: user.name || user.email,
          entries: [],
          totalHours: 0,
          status: "normal",
          minHours: user.dailyMinHours,
          maxHours: user.dailyMaxHours,
        });
      }

      const userGroup = dayGroup.users.get(worklog.userId)!;
      userGroup.entries.push(worklog);
      userGroup.totalHours += worklog.workedHours;
    }

    // Calculate status for each user-day
    for (const dayGroup of groupedByDate.values()) {
      for (const userGroup of dayGroup.users.values()) {
        if (userGroup.totalHours > userGroup.maxHours) {
          userGroup.status = "overtime";
        } else if (userGroup.totalHours < userGroup.minHours) {
          userGroup.status = "undertime";
        }
      }

      // Sort users alphabetically within each day
      dayGroup.users = new Map(
        Array.from(dayGroup.users.entries()).sort((a, b) =>
          a[1].userName.localeCompare(b[1].userName)
        )
      );
    }

    // Sort days descending
    const days = Array.from(groupedByDate.values())
      .sort((a, b) => b.date.localeCompare(a.date));

    // Apply pagination
    const totalCount = days.length;
    const paginatedDays = days.slice(offset, offset + limit);

    return {
      days: paginatedDays,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  },
});
```

### Frontend Layer (React)
```typescript
// app/routes/_auth.admin.worklogs.tsx
// - Protected route with admin authorization
// - useAuth hook to check admin role
// - Redirect to /unauthorized if not admin

// app/components/features/admin/admin-worklog-list.tsx
// - useQuery(api.worklogs.getAllWorklogs)
// - Display days in reverse chronological order
// - Within each day, display users alphabetically
// - Show user name prominently
// - Show each user's total hours and OT/UT badge
// - Pagination controls
// - Loading skeleton
// - Empty state

// Layout structure:
<div>
  <DayCard date="2024-01-15">
    <UserSection
      userName="Alice Smith"
      totalHours={9.5}
      status="overtime"
      minHours={8}
      maxHours={8}
    >
      <Entry hours={5} taskId="TASK-123" />
      <Entry hours={4.5} taskId="TASK-456" />
    </UserSection>
    <UserSection
      userName="Bob Johnson"
      totalHours={7.5}
      status="normal"
      minHours={8}
      maxHours={8}
    >
      <Entry hours={7.5} />
    </UserSection>
  </DayCard>
</div>
```

### Authorization Pattern
```typescript
// In route component
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

  return <AdminWorklogList />;
}
```

## Technical Notes

- Server-side authorization in Convex query (security boundary)
- Client-side route guard for UX (prevents flash of unauthorized content)
- Nested grouping: Date → Users (sorted) → Entries
- Use Map for efficient lookups during grouping
- Real-time updates via Convex subscription
- Pagination increased to 20 days for admin context

## Testing Checklist

- [ ] Admin can access admin worklogs page
- [ ] Regular user redirected to unauthorized
- [ ] Worklogs from all users displayed
- [ ] User names displayed with entries
- [ ] Days sorted most recent first
- [ ] Users sorted alphabetically within day
- [ ] Each user's total hours calculated correctly
- [ ] OT/UT badges based on individual user's min/max
- [ ] Pagination works (20 days per page)
- [ ] Loading state displays
- [ ] Empty state displays if no worklogs
- [ ] Real-time updates work
- [ ] Performance acceptable with 10K users, 10 years data

## Dependencies

- US-001 completed (worklog data exists)
- US-009 completed (user min/max hours in schema)
- Admin authorization system (already exists)
- shadcn/ui components (Card, Badge)

## Definition of Done

- [ ] getAllWorklogs query created in Convex
- [ ] Admin authorization enforced server-side
- [ ] Admin route created with client-side guard
- [ ] AdminWorklogList component created
- [ ] Nested grouping (date → user) working
- [ ] Sorting correct (date desc, user asc)
- [ ] Pagination implemented
- [ ] All acceptance criteria passing
- [ ] No TypeScript errors (`bun check` passes)
- [ ] Performance tested with large dataset
- [ ] Code reviewed
