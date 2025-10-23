# User Story: View User List with Work Hour Policies

**ID**: US-007
**Epic**: EPIC-002 (Admin Worklog Oversight)
**Status**: Backlog
**Priority**: Medium
**Estimate**: 2 days

## User Story

**As an** administrator
**I want to** view a list of all users in the system with their work hour policies
**So that** I can see at a glance who has which hour requirements

## Acceptance Criteria

1. **Given** I am logged in as an admin
   **When** I navigate to the users management page
   **Then** I see a table/list of all users in the system

2. **Given** I am viewing the user list
   **When** the list renders
   **Then** each user shows:
   - Name
   - Email
   - Daily minimum hours
   - Daily maximum hours
   - Role(s)

3. **Given** there are more than 20 users
   **When** I scroll to the bottom
   **Then** I see pagination controls
   **And** I can navigate to the next page of users

4. **Given** I want to find a specific user
   **When** I use the search box
   **Then** the list filters to show only users matching my search term (by name or email)

5. **Given** I am a regular user
   **When** I try to access the user list page
   **Then** I am redirected to an unauthorized page

## Business Rules

- Admin role required
- Display 20 users per page
- Search filters by name and email (case-insensitive)
- Sort alphabetically by name (default)
- Real-time updates when user data changes
- Empty state when no users match search

## Full-Stack Implementation Notes

### Database Layer (Convex)
```typescript
// Use existing listUsers query from convex/users.ts
// Already implements pagination, search, and role filtering
// Ensure it returns dailyMinHours and dailyMaxHours

// Example query (already exists, may need to extend):
export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || !currentUser.roles?.includes("admin")) {
      throw new ConvexError("Unauthorized: Admin access required");
    }

    const limit = args.limit || 20;
    const offset = args.offset || 0;

    let users = await ctx.db.query("users").collect();

    // Apply filters...
    // Return with dailyMinHours and dailyMaxHours
  },
});
```

### Frontend Layer (React)
```typescript
// app/routes/_auth.admin.users._index.tsx
// - Protected admin route
// - useQuery(api.users.listUsers)
// - Table display with columns:
//   - Name
//   - Email
//   - Min Hours
//   - Max Hours
//   - Roles
//   - Actions (placeholder for US-006)
// - Search input (debounced)
// - Pagination controls
// - Loading skeleton
// - Empty state

// Component structure:
export default function AdminUsersPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Redirect if not admin
  useEffect(() => {
    if (!hasRole("admin")) {
      navigate("/unauthorized");
    }
  }, [hasRole, navigate]);

  const data = useQuery(api.users.listUsers, {
    search,
    limit,
    offset: page * limit,
  });

  if (!hasRole("admin")) return null;

  return (
    <PublicLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0); // Reset pagination
            }}
          />
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Min Hours</TableHead>
                <TableHead>Max Hours</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.dailyMinHours ?? 8}h</TableCell>
                  <TableCell>{user.dailyMaxHours ?? 8}h</TableCell>
                  <TableCell>
                    <Badge>{user.roles}</Badge>
                  </TableCell>
                  <TableCell>
                    {/* Edit button added in US-006 */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between p-4">
            <Button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <span>Page {page + 1}</span>
            <Button
              disabled={!data?.hasMore}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </Card>
      </div>
    </PublicLayout>
  );
}
```

## Technical Notes

- Reuse existing `listUsers` query (may need to extend)
- Ensure query returns dailyMinHours and dailyMaxHours
- Debounce search input to avoid excessive queries
- shadcn Table component for data display
- Real-time updates via Convex subscription
- Empty state when search returns no results

## Testing Checklist

- [ ] User list displays all users
- [ ] Name, email, min/max hours, role displayed
- [ ] Search filters by name
- [ ] Search filters by email
- [ ] Search is case-insensitive
- [ ] Pagination works (20 users per page)
- [ ] Previous button disabled on page 1
- [ ] Next button disabled on last page
- [ ] Page resets to 1 when search changes
- [ ] Loading state displays while fetching
- [ ] Empty state when no users match search
- [ ] Regular user redirected to unauthorized
- [ ] Admin authorization enforced server-side
- [ ] Real-time updates work when user data changes

## Dependencies

- US-009 completed (schema with dailyMinHours/dailyMaxHours)
- Existing listUsers query (convex/users.ts)
- Admin authorization system (already exists)
- shadcn/ui components (Table, Input, Card, Badge, Button)

## Definition of Done

- [ ] Extend listUsers query if needed (ensure min/max hours returned)
- [ ] Admin users route created
- [ ] User table component created
- [ ] Search functionality implemented
- [ ] Pagination implemented
- [ ] All acceptance criteria passing
- [ ] No TypeScript errors (`bun check` passes)
- [ ] Loading and empty states working
- [ ] Responsive design
- [ ] Code reviewed
