# User Story: Filter Personal Worklogs by Overtime/Undertime Status

**ID**: US-003
**Epic**: EPIC-001 (Worklog Entry & Personal Tracking)
**Status**: Backlog
**Priority**: Medium
**Estimate**: 2 days

## User Story

**As a** registered employee
**I want to** filter my worklog history by overtime, undertime, or normal days
**So that** I can quickly identify days where I worked outside my expected hours

## Acceptance Criteria

1. **Given** I am viewing my worklog list
   **When** I see the filter buttons (All, Overtime, Undertime, Normal)
   **Then** the "All" filter is selected by default

2. **Given** I click the "Overtime" filter button
   **When** the filter is applied
   **Then** I only see days where total hours > dailyMaxHours
   **And** the "Overtime" button appears selected

3. **Given** I click the "Undertime" filter button
   **When** the filter is applied
   **Then** I only see days where total hours < dailyMinHours
   **And** the "Undertime" button appears selected

4. **Given** I click the "Normal" filter button
   **When** the filter is applied
   **Then** I only see days where dailyMinHours ≤ total hours ≤ dailyMaxHours
   **And** the "Normal" button appears selected

5. **Given** I have a filter applied
   **When** I click the "All" button
   **Then** I see all days regardless of status
   **And** the "All" button appears selected

6. **Given** I apply a filter that results in no matching days
   **When** the filtered list is empty
   **Then** I see a message explaining no days match the filter
   **And** I see a button to clear the filter

## Business Rules

- Filter applies to day totals, not individual entries
- Pagination resets to page 1 when filter changes
- Filter state is client-side only (not persisted)
- Real-time updates respect current filter
- Filter buttons show count of matching days (optional enhancement)

## Full-Stack Implementation Notes

### Database Layer (Convex)
```typescript
// Update existing getUserWorklogs query
export const getUserWorklogs = query({
  args: {
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
    // ... existing grouping logic ...

    // Apply filter
    let filteredDays = Array.from(groupedByDate.values());

    if (args.filter && args.filter !== "all") {
      filteredDays = filteredDays.filter(day => day.status === args.filter);
    }

    // ... rest of pagination logic ...
  },
});
```

### Frontend Layer (React)
```typescript
// Update app/components/features/worklogs/worklog-list.tsx
// Add filter state:
const [filter, setFilter] = useState<"all" | "overtime" | "undertime" | "normal">("all");
const [page, setPage] = useState(0);

// Update query call:
const data = useQuery(api.worklogs.getUserWorklogs, {
  filter,
  limit: 10,
  offset: page * 10,
});

// Handle filter change:
const handleFilterChange = (newFilter: string) => {
  setFilter(newFilter);
  setPage(0); // Reset to first page
};

// Filter button group:
<div className="flex gap-2 mb-4">
  <Button
    variant={filter === "all" ? "default" : "outline"}
    onClick={() => handleFilterChange("all")}
  >
    All Days
  </Button>
  <Button
    variant={filter === "overtime" ? "default" : "outline"}
    onClick={() => handleFilterChange("overtime")}
  >
    Overtime
  </Button>
  <Button
    variant={filter === "undertime" ? "default" : "outline"}
    onClick={() => handleFilterChange("undertime")}
  >
    Undertime
  </Button>
  <Button
    variant={filter === "normal" ? "default" : "outline"}
    onClick={() => handleFilterChange("normal")}
  >
    Normal
  </Button>
</div>

// Empty state for filtered results:
{data?.days.length === 0 && filter !== "all" && (
  <div className="text-center py-8">
    <p className="text-gray-600 mb-4">
      No {filter} days found
    </p>
    <Button onClick={() => setFilter("all")}>
      Show All Days
    </Button>
  </div>
)}
```

## Technical Notes

- Filter state managed in React component
- Pagination offset resets to 0 when filter changes
- Button variant: "default" for selected, "outline" for unselected
- Empty state specific to filtered results (different from no worklogs at all)
- Query automatically re-runs when filter changes

## Testing Checklist

- [ ] "All" filter is selected by default
- [ ] Clicking "Overtime" shows only OT days
- [ ] Clicking "Undertime" shows only UT days
- [ ] Clicking "Normal" shows only normal days
- [ ] Active filter button is visually highlighted
- [ ] Pagination resets when filter changes
- [ ] Empty state shows when no days match filter
- [ ] "Clear filter" button returns to "All" view
- [ ] Filter works correctly with real-time updates
- [ ] Filter works correctly after creating new entry

## Dependencies

- US-002 completed (worklog list with OT/UT indicators)
- Existing getUserWorklogs query
- shadcn/ui Button component

## Definition of Done

- [ ] Convex query updated with filter parameter
- [ ] Filter buttons added to WorklogList component
- [ ] Filter state management implemented
- [ ] Pagination reset logic working
- [ ] Empty state for filtered results
- [ ] All acceptance criteria passing
- [ ] No TypeScript errors (`bun check` passes)
- [ ] Visual feedback for selected filter clear
- [ ] Code reviewed
