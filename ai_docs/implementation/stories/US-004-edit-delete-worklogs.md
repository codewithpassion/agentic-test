# User Story: Edit and Delete Personal Worklog Entries

**ID**: US-004
**Epic**: EPIC-001 (Worklog Entry & Personal Tracking)
**Status**: Backlog
**Priority**: Medium
**Estimate**: 2 days

## User Story

**As a** registered employee
**I want to** edit or delete my worklog entries
**So that** I can correct mistakes or remove entries I no longer need

## Acceptance Criteria

1. **Given** I am viewing my worklog list
   **When** I see an individual entry
   **Then** I see edit and delete action buttons for that entry

2. **Given** I click the edit button on an entry
   **When** the edit interface appears
   **Then** I see the current values pre-filled in the form
   **And** I can modify hours, task ID, and description
   **And** I cannot change the date or owning user

3. **Given** I edit an entry and click save
   **When** the update is successful
   **Then** the entry updates immediately in the list
   **And** I see a success notification
   **And** the day's total hours recalculates
   **And** the OT/UT status updates if affected

4. **Given** I click the delete button on an entry
   **When** a confirmation dialog appears
   **Then** I must confirm before deletion proceeds

5. **Given** I confirm deletion
   **When** the entry is deleted
   **Then** it disappears from the list immediately
   **And** I see a success notification
   **And** the day's total hours recalculates
   **And** if no entries remain for that day, the day card is removed

6. **Given** I try to edit or delete another user's worklog
   **When** the request reaches the server
   **Then** I receive an unauthorized error
   **And** the operation fails

## Business Rules

- Users can only edit/delete their own worklogs
- Date cannot be changed (must delete and recreate to change date)
- Edited entry's updatedAt timestamp is updated
- Deletion requires confirmation (prevent accidental deletion)
- Authorization enforced at database level (server-side)
- Real-time updates propagate immediately

## Full-Stack Implementation Notes

### Database Layer (Convex)
```typescript
// convex/worklogs.ts - Update mutation
export const update = mutation({
  args: {
    id: v.id("worklogs"),
    workedHours: v.number(),
    taskId: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify ownership
    const worklog = await ctx.db.get(args.id);
    if (!worklog) {
      throw new Error("Worklog not found");
    }
    if (worklog.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Validate
    if (args.workedHours <= 0) {
      throw new Error("Worked hours must be greater than 0");
    }

    await ctx.db.patch(args.id, {
      workedHours: args.workedHours,
      taskId: args.taskId,
      description: args.description,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// convex/worklogs.ts - Delete mutation
export const remove = mutation({
  args: {
    id: v.id("worklogs"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify ownership
    const worklog = await ctx.db.get(args.id);
    if (!worklog) {
      throw new Error("Worklog not found");
    }
    if (worklog.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
```

### Frontend Layer (React)
```typescript
// app/components/features/worklogs/worklog-entry.tsx
// - Component to display single entry
// - Edit button opens inline edit form or modal
// - Delete button triggers confirmation dialog
// - useMutation(api.worklogs.update) for edits
// - useMutation(api.worklogs.remove) for deletion
// - Optimistic updates for better UX
// - Toast notifications for success/error

// Edit interface options:
// Option 1: Inline editing (form replaces view)
// Option 2: Modal dialog with form
// Recommend: Inline editing for simplicity

// Delete confirmation:
// - Use shadcn AlertDialog component
// - Clear messaging: "Are you sure? This cannot be undone."
// - Confirm/Cancel buttons
```

### UI Components
```typescript
// Edit inline form:
<div className="space-y-2">
  <Input
    type="number"
    step="0.1"
    value={hours}
    onChange={(e) => setHours(e.target.value)}
  />
  <Input
    placeholder="Task ID (optional)"
    value={taskId}
    onChange={(e) => setTaskId(e.target.value)}
  />
  <Textarea
    placeholder="Description (optional)"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
  <div className="flex gap-2">
    <Button onClick={handleSave}>Save</Button>
    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
  </div>
</div>

// Delete confirmation dialog:
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete worklog entry?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete this entry. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Technical Notes

- Use shadcn AlertDialog for delete confirmation
- Edit mode: Toggle between view/edit states per entry
- Optimistic updates improve perceived performance
- Real-time sync ensures all changes propagate
- Authorization checked on server (security boundary)
- Cannot edit userId or date (immutable fields)

## Testing Checklist

- [ ] Edit button displays on each entry
- [ ] Delete button displays on each entry
- [ ] Clicking edit shows form with pre-filled values
- [ ] Can modify hours, task ID, description
- [ ] Cannot modify date or user
- [ ] Saving edits updates entry immediately
- [ ] Day total recalculates after edit
- [ ] OT/UT badge updates if hours change affects status
- [ ] Delete requires confirmation
- [ ] Confirming delete removes entry immediately
- [ ] Day total recalculates after deletion
- [ ] Day card removed if last entry deleted
- [ ] Unauthorized error when editing others' entries
- [ ] Success toast on edit
- [ ] Success toast on delete
- [ ] Error toast on failures

## Dependencies

- US-002 completed (worklog list displaying)
- shadcn/ui components (AlertDialog, Button, Input, Textarea)
- Convex mutations (update and remove)

## Definition of Done

- [ ] Update mutation created in Convex
- [ ] Delete mutation created in Convex
- [ ] Edit interface added to entry component
- [ ] Delete confirmation dialog implemented
- [ ] Authorization checks in place
- [ ] Real-time updates working
- [ ] All acceptance criteria passing
- [ ] No TypeScript errors (`bun check` passes)
- [ ] User cannot edit/delete others' entries
- [ ] Code reviewed
