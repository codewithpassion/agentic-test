# User Story: View Personal Worklog History with OT/UT Indicators

**ID**: US-002
**Epic**: EPIC-001 (Worklog Entry & Personal Tracking)
**Status**: Backlog
**Priority**: High
**Estimate**: 3 days

## User Story

**As a** registered employee
**I want to** view my worklog history grouped by day with overtime/undertime indicators
**So that** I can see my work patterns and identify when I've worked too much or too little

## Acceptance Criteria

1. **Given** I am logged in and have worklog entries
   **When** I navigate to my worklogs page
   **Then** I see my worklogs grouped by day in reverse chronological order (most recent first)

2. **Given** a day's worklog entries are displayed
   **When** I view a specific day
   **Then** I see:
   - The date formatted as "Monday, Jan 15, 2024"
   - Total hours worked for that day
   - All individual entries for that day
   - Each entry shows: hours, optional task ID, optional description

3. **Given** my total hours for a day exceed my dailyMaxHours
   **When** I view that day's summary
   **Then** I see an "OT" (overtime) badge displayed prominently

4. **Given** my total hours for a day are below my dailyMinHours
   **When** I view that day's summary
   **Then** I see a "UT" (undertime) badge displayed prominently

5. **Given** my total hours for a day are within my min/max range
   **When** I view that day's summary
   **Then** no OT/UT badge is displayed

6. **Given** I have more than 10 days of worklogs
   **When** I scroll to the bottom of the list
   **Then** I see pagination controls to load more days

## Business Rules

- Days are grouped by date (all entries for same day together)
- Total hours = sum of all entries for that day
- OT indicator: totalHours > user.dailyMaxHours
- UT indicator: totalHours < user.dailyMinHours
- Default display: 10 days per page
- Sorting: Most recent day first
- Real-time updates: List updates automatically when new entries added

## Full-Stack Implementation Notes

### Database Layer (Convex)
```typescript
// convex/worklogs.ts - Query for user worklogs
export const getUserWorklogs = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);
    const limit = args.limit || 10;
    const offset = args.offset || 0;

    // Query all worklogs for user
    const worklogs = await ctx.db
      .query("worklogs")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", currentUser._id))
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
          status: "normal",
        });
      }
    }

    // Calculate status for each day
    for (const day of groupedByDate.values()) {
      if (day.totalHours > currentUser.dailyMaxHours) {
        day.status = "overtime";
      } else if (day.totalHours < currentUser.dailyMinHours) {
        day.status = "undertime";
      }
    }

    // Sort by date descending
    let filteredDays = Array.from(groupedByDate.values());
    filteredDays.sort((a, b) => b.date.localeCompare(a.date));

    // Apply pagination
    const totalCount = filteredDays.length;
    const paginatedDays = filteredDays.slice(offset, offset + limit);

    return {
      days: paginatedDays,
      totalCount,
      hasMore: offset + limit < totalCount,
      userMinHours: currentUser.dailyMinHours,
      userMaxHours: currentUser.dailyMaxHours,
    };
  },
});
```

### Frontend Layer (React)
```typescript
// app/components/features/worklogs/worklog-list.tsx
// - useQuery(api.worklogs.getUserWorklogs) for data
// - Map over days to render day cards
// - Each day card shows:
//   - Formatted date header
//   - Total hours with OT/UT badge (using shadcn Badge component)
//   - List of individual entries
//   - Edit/delete actions per entry
// - Pagination: "Load More" button at bottom
// - Loading state: Skeleton loader (shadcn Skeleton)
// - Empty state: Friendly message with CTA to create first entry
```

### UI Components
```typescript
// Day Card Component
// - Card component from shadcn
// - Badge component for OT/UT indicators:
//   - OT: variant="destructive" (red)
//   - UT: variant="secondary" (gray/yellow)
// - Format date: new Date(dateStr).toLocaleDateString('en-US', options)
```

## Technical Notes

- Use Convex real-time subscriptions (useQuery automatically subscribes)
- List updates automatically when mutations occur
- Badge variants: OT = "destructive", UT = "secondary"
- Date formatting: `Intl.DateTimeFormat` for localized dates
- Pagination state managed in React (page number)
- Loading skeleton improves perceived performance

## Testing Checklist

- [ ] Worklogs display grouped by day
- [ ] Days sorted most recent first
- [ ] Date formatted correctly (weekday, month, day, year)
- [ ] Total hours calculated correctly per day
- [ ] OT badge shows when hours > dailyMaxHours
- [ ] UT badge shows when hours < dailyMinHours
- [ ] No badge shows when hours within range
- [ ] All entries for a day are visible
- [ ] Entry details display correctly (hours, task ID, description)
- [ ] Pagination works (loads next 10 days)
- [ ] Loading state displays while fetching
- [ ] Empty state displays when no worklogs
- [ ] Real-time update works (new entry appears immediately)

## Dependencies

- US-001 completed (worklog creation working)
- US-009 completed (database schema with dailyMinHours/dailyMaxHours)
- shadcn/ui components (Card, Badge, Skeleton)

## Definition of Done

- [ ] Convex query function created and tested
- [ ] WorklogList component created
- [ ] Day grouping logic working correctly
- [ ] OT/UT calculation accurate
- [ ] Pagination implemented
- [ ] Loading and empty states implemented
- [ ] All acceptance criteria passing
- [ ] No TypeScript errors (`bun check` passes)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Code reviewed
