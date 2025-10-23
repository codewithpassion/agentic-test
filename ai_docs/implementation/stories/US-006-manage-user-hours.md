# User Story: Manage Employee Daily Hour Requirements

**ID**: US-006
**Epic**: EPIC-002 (Admin Worklog Oversight)
**Status**: Backlog
**Priority**: High
**Estimate**: 2 days

## User Story

**As an** administrator
**I want to** set and modify each employee's daily minimum and maximum work hour requirements
**So that** I can customize overtime/undertime thresholds based on individual employment agreements

## Acceptance Criteria

1. **Given** I am logged in as an admin
   **When** I view the user list
   **Then** I see each user's current dailyMinHours and dailyMaxHours displayed

2. **Given** I am viewing a user's hour settings
   **When** I click the "Edit Hours" button
   **Then** a modal/form appears with the current min/max hours pre-filled

3. **Given** I am editing a user's hours
   **When** I enter new values for min and max hours
   **And** I submit the form
   **Then** the user's hour requirements are updated immediately
   **And** I see a success notification

4. **Given** I try to set invalid hours (max < min, or negative values)
   **When** I submit the form
   **Then** I see validation errors
   **And** the form is not submitted

5. **Given** I update a user's hour requirements
   **When** the update is complete
   **Then** all future OT/UT calculations for that user use the new values
   **And** the user list reflects the updated values

6. **Given** I am a regular user
   **When** I try to access the user management page
   **Then** I am redirected to an unauthorized page

## Business Rules

- Admin role required (enforced server-side)
- dailyMaxHours must be >= dailyMinHours
- Both values must be > 0
- Values can be decimals (e.g., 7.5 hours)
- Changes take effect immediately
- Historical worklogs are not recalculated (OT/UT status is computed on read)
- No bulk edit feature (edit one user at a time)

## Full-Stack Implementation Notes

### Database Layer (Convex)
```typescript
// convex/users.ts - Update user hours mutation
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

    // Get user by clerkId
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

### Frontend Layer (React)
```typescript
// app/components/features/admin/user-hours-edit-modal.tsx
// - Modal component using shadcn Dialog
// - Form fields: min hours, max hours (number inputs with step="0.1")
// - Validation: max >= min, both > 0
// - useMutation(api.users.updateUserHours)
// - Success/error toast notifications
// - Close modal on success

// Props interface:
interface UserHoursEditModalProps {
  user: {
    id: string; // clerkId
    name: string;
    email: string;
    dailyMinHours: number;
    dailyMaxHours: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Form validation with Zod:
const schema = z.object({
  dailyMinHours: z.number().positive("Must be greater than 0"),
  dailyMaxHours: z.number().positive("Must be greater than 0"),
}).refine(data => data.dailyMaxHours >= data.dailyMinHours, {
  message: "Max hours must be >= min hours",
  path: ["dailyMaxHours"],
});

// Modal UI:
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Work Hours - {user.name}</DialogTitle>
      <DialogDescription>
        Set daily minimum and maximum work hours for {user.email}
      </DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label>Daily Minimum Hours</Label>
          <Input
            type="number"
            step="0.1"
            value={minHours}
            onChange={(e) => setMinHours(e.target.value)}
          />
        </div>
        <div>
          <Label>Daily Maximum Hours</Label>
          <Input
            type="number"
            step="0.1"
            value={maxHours}
            onChange={(e) => setMaxHours(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Update User List Component
```typescript
// Modify existing user list to show hours and edit button
// app/routes/_auth.admin.users._index.tsx or similar
// Add columns for dailyMinHours and dailyMaxHours
// Add "Edit Hours" button that opens modal
// Pass user data to modal

// Table structure:
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Min Hours</TableHead>
      <TableHead>Max Hours</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map(user => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.dailyMinHours}h</TableCell>
        <TableCell>{user.dailyMaxHours}h</TableCell>
        <TableCell>
          <Button
            size="sm"
            onClick={() => openEditModal(user)}
          >
            Edit Hours
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Technical Notes

- Use shadcn Dialog component for modal
- Form validation with Zod or React Hook Form
- Number inputs with step="0.1" for decimal hours
- Real-time update: User list refreshes via Convex subscription
- Server-side validation prevents invalid data
- Toast notifications for UX feedback

## Testing Checklist

- [ ] User list displays min/max hours for each user
- [ ] Edit button opens modal with pre-filled values
- [ ] Can modify min and max hours
- [ ] Validation prevents max < min
- [ ] Validation prevents negative or zero values
- [ ] Validation prevents non-numeric input
- [ ] Decimal hours accepted (e.g., 7.5)
- [ ] Success toast on successful update
- [ ] Error toast on validation failure
- [ ] Modal closes after successful update
- [ ] User list updates immediately after save
- [ ] Regular user cannot access user management
- [ ] Admin authorization enforced server-side

## Dependencies

- US-009 completed (schema with dailyMinHours/dailyMaxHours)
- US-007 (user list page exists)
- Admin authorization system (already exists)
- shadcn/ui components (Dialog, Form, Input, Button)

## Definition of Done

- [ ] updateUserHours mutation created in Convex
- [ ] Admin authorization enforced
- [ ] UserHoursEditModal component created
- [ ] Form validation implemented
- [ ] User list updated to show hours and edit button
- [ ] Modal integration working
- [ ] All acceptance criteria passing
- [ ] No TypeScript errors (`bun check` passes)
- [ ] Success/error notifications working
- [ ] Code reviewed
