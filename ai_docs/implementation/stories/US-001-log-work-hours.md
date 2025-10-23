# User Story: Log Work Hours for a Day

**ID**: US-001
**Epic**: EPIC-001 (Worklog Entry & Personal Tracking)
**Status**: Backlog
**Priority**: High
**Estimate**: 3 days

## User Story

**As a** registered employee
**I want to** log my work hours for any day with task details
**So that** I can accurately track my time and have a record of what I worked on

## Acceptance Criteria

1. **Given** I am logged in as a registered user
   **When** I navigate to the worklogs page
   **Then** I see a form to create a new worklog entry

2. **Given** I am on the worklog creation form
   **When** I enter a date, hours worked (decimal allowed), optional task ID, and optional description
   **And** I submit the form
   **Then** the worklog is saved and appears in my worklog list immediately

3. **Given** I try to submit a worklog with invalid data (negative hours, missing date)
   **When** I click submit
   **Then** I see clear validation error messages
   **And** the form is not submitted

4. **Given** I successfully create a worklog entry
   **When** the entry is saved
   **Then** I see a success notification
   **And** the form is cleared for the next entry

5. **Given** multiple entries exist for the same day
   **When** I view my worklog list
   **Then** all entries for that day are displayed together

## Business Rules

- Worked hours must be > 0
- Worked hours can be decimal (e.g., 7.5 hours)
- Date is required (default: today)
- Task ID and description are optional
- Multiple entries allowed per day
- User can only create worklogs for themselves

## Full-Stack Implementation Notes

### Database Layer (Convex)
```typescript
// convex/schema.ts - Add worklogs table
worklogs: defineTable({
  userId: v.id("users"),
  date: v.string(), // "YYYY-MM-DD" format
  workedHours: v.number(),
  taskId: v.optional(v.string()),
  description: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user_date", ["userId", "date"])
  .index("by_user_createdAt", ["userId", "createdAt"])

// convex/worklogs.ts - Create mutation
export const create = mutation({
  args: {
    date: v.string(),
    workedHours: v.number(),
    taskId: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

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
```

### Frontend Layer (React)
```typescript
// app/components/features/worklogs/worklog-form.tsx
// - Date picker (shadcn/ui DatePicker component)
// - Hours input (number field with step="0.1")
// - Optional task ID input (text field)
// - Optional description textarea
// - Submit button with loading state
// - Form validation using Zod or React Hook Form
// - useMutation(api.worklogs.create) for submission
// - Toast notification on success/error
// - Form reset after successful submission
```

### Route Layer
```typescript
// app/routes/_auth.worklogs.tsx
// - Protected route (requires authentication)
// - Import and render WorklogForm component
// - Import and render WorklogList component
// - Use PublicLayout wrapper
// - Add meta tags for SEO
```

## Technical Notes

- Use shadcn/ui DatePicker for date selection
- Validate hours with `zod`: `z.number().positive()`
- Date format: Use `toISOString().split('T')[0]` for "YYYY-MM-DD"
- Real-time update: WorklogList will auto-update via Convex subscription
- NO `any` types - use proper TypeScript types throughout

## Testing Checklist

- [ ] Can create worklog with valid data
- [ ] Form validation prevents negative hours
- [ ] Form validation requires date
- [ ] Decimal hours are accepted (e.g., 7.5)
- [ ] Optional fields can be left empty
- [ ] Success toast appears on successful creation
- [ ] Form clears after successful submission
- [ ] Error toast appears on failure
- [ ] New worklog appears in list immediately
- [ ] Multiple entries for same day display correctly

## Dependencies

- US-009 must be completed first (database schema)
- Convex authentication helpers (already exist)
- shadcn/ui components (date-picker, form, input, textarea)

## Definition of Done

- [ ] Schema changes deployed to Convex
- [ ] Convex mutation function created and tested
- [ ] React form component created with validation
- [ ] Form integrated into worklogs route
- [ ] All acceptance criteria passing
- [ ] No TypeScript errors (`bun check` passes)
- [ ] No linting errors (`bun biome:check` passes)
- [ ] Manual testing completed
- [ ] Code reviewed
