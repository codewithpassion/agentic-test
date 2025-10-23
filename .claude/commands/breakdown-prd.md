---
description: Break down a Product Requirements Document (PRD) into epics and full-stack user stories
allowed-tools: Read, Write, Grep, Glob
argument-hint: [path-to-prd-file]
---

# Break Down PRD: $ARGUMENTS

Break down a Product Requirements Document into epics and full-stack user stories.

## Step 1: Check Architecture Specification (CRITICAL)

**BEFORE** breaking down PRD:

1. **Check if architecture exists**: Look for `ai_docs/architecture/specification.md`

2. **If architecture does NOT exist**:
   - ⚠️ **WARN the user**: "No architecture specification found. It's recommended to create architecture first."
   - Suggest: "Run `/architecture create` before breaking down the PRD"
   - Ask if they want to proceed anyway or create architecture first

3. **If architecture exists**:
   - **Read** `ai_docs/architecture/specification.md`
   - Note key architectural constraints:
     - Technology stack (frontend/backend/database)
     - Architectural pattern (monolith/microservices/etc.)
     - API design style (REST/GraphQL/gRPC)
     - Authentication method
     - Performance characteristics
     - Scalability approach

## Step 2: Read and Analyze PRD

**Read the PRD file**: `$ARGUMENTS`

If no file path provided, ask the user to either:
- Provide the file path
- Paste the PRD content directly

## Step 3: Use Product Owner Agent for Analysis

**Use the product-owner agent** to:

1. **Analyze the PRD** and identify:
   - Main product goals and objectives
   - Target users and personas
   - Key features and capabilities
   - Success metrics
   - Constraints and dependencies
   - **Architecture specification constraints** (from Step 1)

2. **Validate Against Architecture**:
   - Check if PRD requirements are feasible with current architecture
   - Identify features that may need architectural changes
   - **Flag requirements that conflict with architecture**
   - Note which ADRs are relevant to this PRD

3. **Flag Architectural Gaps** (if any):
   - If PRD requires features not supported by architecture:
     - Document what architectural changes are needed
     - Suggest consulting system-architect agent
     - Create list of architectural decisions needed

4. **Create Epic Structure**:
   - Group related features into epics (large feature areas)
   - Each epic should represent a coherent set of user value
   - Epics should be organized by user journey or feature area
   - **Epics respect architectural boundaries**

5. **Break Down into User Stories**:
   - For each epic, create full-stack user stories
   - **CRITICAL**: Stories MUST be user-facing and self-contained
   - Each story should be completable in < 7 days (cycle time target)
   - Follow the full-stack story principles (no technical layer splitting)
   - **Include architectural constraints in technical notes**

## Step 4: Generate Epics

For each epic identified, create an epic document in `ai_docs/implementation/epics/`:

### Epic File Format

```markdown
# Epic: [Epic Name]

**ID**: EPIC-XXX
**Status**: Backlog
**Priority**: [High/Medium/Low]
**Target Release**: [Version/Quarter]

## Description

[Clear description of what this epic achieves]

## User Value

[Why this epic matters to users and business]

## User Stories

This epic contains the following stories:
- US-XXX: [Story title]
- US-XXX: [Story title]
- US-XXX: [Story title]

## Success Metrics

- [Metric 1]: [Target]
- [Metric 2]: [Target]

## Dependencies

- [Any dependencies on other epics or external factors]

## Timeline

- Estimated duration: [X weeks based on throughput]
- Target completion: [Date/Week]
```

## Step 5: Generate User Stories

For each user story, create a story file in `ai_docs/implementation/stories/`:

**CRITICAL REQUIREMENTS**:

✅ **Full-Stack Stories**:
- Each story must deliver complete end-to-end user value
- Include ALL layers needed: UI, API, Database, integrations
- NO stories like "Create database schema" or "Build API endpoint"
- Stories describe what users can DO, not technical tasks

✅ **Self-Contained**:
- Story can be developed, tested, and deployed independently
- No "Part 1" and "Part 2" stories
- No splitting by technical layer

✅ **User-Facing**:
- Focuses on user actions and outcomes
- Written from user perspective
- Delivers visible value

### Story ID Assignment

1. Check existing stories in `ai_docs/implementation/stories/`
2. Find highest US-XXX number
3. Assign sequential IDs starting from the next number
4. Use zero-padded 3 digits: US-001, US-002, etc.

### Story File Format

Use the standard user story format (see /user-story command), ensuring:
- Clear user value statement
- Testable acceptance criteria
- All technical layers documented in "Full-Stack Implementation Notes"
- Epic reference included

## Step 6: Create Summary Document

Create a breakdown summary at `ai_docs/implementation/prd-breakdown-[name].md`:

```markdown
# PRD Breakdown: [Product Name]

**Source PRD**: $ARGUMENTS
**Date**: [Current date]
**Breakdown By**: Product Owner Agent

## Summary

[Brief summary of the product and breakdown]

## Epics Created

### EPIC-001: [Epic Name]
- **Priority**: High
- **Stories**: 5 stories (US-001 to US-005)
- **Estimated**: 3 weeks
- **Description**: [Brief description]

### EPIC-002: [Epic Name]
- **Priority**: Medium
- **Stories**: 3 stories (US-006 to US-008)
- **Estimated**: 2 weeks
- **Description**: [Brief description]

## Total Breakdown

- **Epics**: 3
- **User Stories**: 15
- **Estimated Duration**: 8 weeks (based on avg throughput of ~2 items/week)
- **Recommended WIP**: Pull 1-2 stories at a time (respect WIP limits)

## Prioritization Recommendation

**Week 1-2**: EPIC-001 (Core functionality)
**Week 3-4**: EPIC-002 (Key features)
**Week 5+**: EPIC-003 (Enhancements)

## Dependencies & Risks

[List any cross-epic dependencies or risks]

## Next Steps

1. Review and refine stories
2. Ensure stories meet Definition of Ready
3. Start implementation
```

## Validation Checklist

Before completing, verify:

- [ ] All stories are user-facing (not technical tasks)
- [ ] Each story is full-stack (includes all layers needed)
- [ ] Stories are self-contained and independently deployable
- [ ] Acceptance criteria are testable from user perspective
- [ ] Epic groupings make sense
- [ ] No "Part 1/Part 2" story splits
- [ ] No stories like "Build database" or "Create API"
- [ ] Each story has clear business value
- [ ] Story IDs are sequential and properly formatted

## Example Bad vs Good Stories

❌ **BAD** (from a commenting feature PRD):
- US-001: Create comments database table
- US-002: Build comments API endpoints
- US-003: Create comment UI components

✅ **GOOD** (from same PRD):
- US-001: As a user, I want to add comments on posts
- US-002: As a user, I want to edit my own comments
- US-003: As a user, I want to delete my own comments
- US-004: As a moderator, I want to delete any comment

Each "good" story is full-stack and delivers user value independently.

## Output

After breakdown is complete, report:

```
✅ PRD Breakdown Complete!

Created:
- 3 Epics in ai_docs/implementation/epics/
- 15 User Stories in ai_docs/implementation/stories/
- Summary document: ai_docs/implementation/prd-breakdown-[name].md

Next steps:
1. Review the breakdown: cat ai_docs/implementation/prd-breakdown-[name].md
2. Refine stories if needed
3. Move refined stories to Ready queue when they meet Definition of Ready
4. Start pulling work: /pull-work
```

## Tips for Product Owner Agent

When breaking down the PRD:

1. **Think user journeys**: Group by what users want to accomplish
2. **Think incrementally**: Can this be delivered in phases?
3. **Think value**: Each story should deliver something users can use
4. **Think full-stack**: Don't split technical layers
5. **Think testable**: Each story should have clear done criteria

Remember: The goal is to create a backlog of deployable, user-facing stories that can be independently developed and released.
