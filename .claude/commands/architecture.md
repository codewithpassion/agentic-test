---
description: Create, analyze, update, or view system architecture specifications with critical analysis and ADR tracking
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
argument-hint: [create|analyze|update|show|list] [architecture-description]
---

# Architecture Management

Manage system architecture with the system-architect agent for critical analysis, technology decisions, and architectural patterns.

## Command Modes

```bash
# Create new architecture (interactive or with description)
/architecture create
/architecture create "event-driven microservices with PostgreSQL and Redis"

# Critically analyze a proposed architecture
/architecture analyze "monolith with shared database"

# Update existing architecture
/architecture update

# Show current architecture
/architecture show
/architecture list
/architecture
```

---

## Mode 1: Create Architecture

**Use the system-architect agent** to create a comprehensive architecture specification.

### If No Architecture Description Provided

Ask the system-architect agent to gather requirements through critical questions:

1. **System Overview**:
   - What does the system do?
   - Who are the primary users?
   - What's the core value proposition?

2. **Scale & Performance**:
   - How many users? (current and 1-3 year projection)
   - Requests per second? (peak vs average)
   - Data volume? (GB, TB, PB)
   - Latency requirements? (p50, p95, p99)
   - Geographic distribution?

3. **Security & Compliance**:
   - What's the threat model?
   - Compliance requirements? (GDPR, HIPAA, SOC2, PCI-DSS)
   - Data sensitivity level?
   - Authentication/authorization complexity?

4. **Team & Operations**:
   - Team size and expertise level?
   - Development velocity priority?
   - On-call burden acceptable?
   - Deployment frequency target?

5. **Cost & Business**:
   - Infrastructure budget constraints?
   - Time-to-market constraints?
   - Revenue model (impacts scaling)?

6. **Data & Integration**:
   - Data consistency needs? (strong vs eventual)
   - Third-party integrations required?
   - Legacy system constraints?
   - Real-time vs batch processing?

### Architectural Analysis Process

The system-architect agent should:

1. **Propose 2-3 Architectural Options**:

   For each option, provide:
   - **Overview**: High-level description
   - **Components**: Key system components
   - **Data Flow**: How data moves through system
   - **Technology Stack**: Recommended technologies
   - **Pros**: Advantages for this context
   - **Cons**: Disadvantages and trade-offs
   - **Best For**: When this architecture fits
   - **Risks**: What could go wrong
   - **Cost**: Rough infrastructure and team cost

2. **Critical Analysis**:
   - What are the scalability bottlenecks?
   - What are single points of failure?
   - What's the operational complexity?
   - What's overly complex vs appropriately complex?
   - What are the security considerations?

3. **Recommendation**:
   - Which option is best for the given constraints?
   - Why this recommendation?
   - What are the key trade-offs?
   - What should be monitored as the system grows?

### Create Architecture Artifacts

Once an architecture is selected, create:

#### 1. Architecture Specification
**File**: `ai_docs/architecture/specification.md`

Use the template from the system-architect agent including:
- System overview and purpose
- Architectural style and pattern
- System components and responsibilities
- Data architecture and flow
- API design approach
- Security architecture
- Deployment architecture
- Scalability strategy
- Technology stack summary
- Constraints and trade-offs
- Future considerations

#### 2. Technology Stack Document
**File**: `ai_docs/techstack.md`

```markdown
# Technology Stack

**Last Updated**: [Date]

## Frontend
- **Framework**: [React, Vue, Svelte, etc.]
  - **Why**: [Rationale]
  - **Version**: [Version]
- **State Management**: [Redux, Zustand, etc.]
- **Styling**: [Tailwind, CSS-in-JS, etc.]
- **Build Tool**: [Vite, Webpack, etc.]

## Backend
- **Runtime**: [Bun, Node.js, etc.]
  - **Why**: [Rationale]
  - **Version**: [Version]
- **Framework**: [Express, Fastify, Hono, etc.]
- **API Style**: [REST, GraphQL, gRPC]

## Database
- **Primary Database**: [PostgreSQL, MySQL, MongoDB, etc.]
  - **Why**: [Rationale]
  - **Version**: [Version]
- **Caching**: [Redis, Memcached]
- **Search**: [Elasticsearch, Algolia, etc.]

## Infrastructure
- **Hosting**: [AWS, GCP, Azure, Vercel, etc.]
- **Container Orchestration**: [Kubernetes, ECS, Docker Compose]
- **CI/CD**: [GitHub Actions, GitLab CI, etc.]
- **Monitoring**: [DataDog, New Relic, Prometheus, etc.]

## Third-Party Services
- **Authentication**: [Auth0, Clerk, custom]
- **Email**: [SendGrid, AWS SES, etc.]
- **Payment**: [Stripe, PayPal, etc.]
- **Analytics**: [Mixpanel, Amplitude, etc.]

## Development Tools
- **Version Control**: Git
- **Package Manager**: [Bun, npm, pnpm, yarn]
- **Code Quality**: [ESLint, Prettier, TypeScript]
- **Testing**: [bun:test, Jest, Vitest, Playwright]
```

#### 3. Initial Architecture Decision Records (ADRs)

Create ADRs for major decisions in `ai_docs/architecture/adrs/`:

- **ADR-001**: Choice of architectural pattern (monolith vs microservices vs etc.)
- **ADR-002**: Database selection (PostgreSQL vs MongoDB vs etc.)
- **ADR-003**: API design approach (REST vs GraphQL vs gRPC)
- **ADR-004**: Deployment platform (AWS vs GCP vs Azure)
- **ADR-005**: Authentication strategy (OAuth2, JWT, etc.)

Each ADR uses this format:
```markdown
# ADR-XXX: [Decision Title]

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: YYYY-MM-DD
**Deciders**: System Architect, [Team Members]

## Context

[What situation requires this decision? What problem are we solving?]

## Decision

[What did we decide? Be specific.]

## Rationale

[Why this decision? List key factors:]
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

## Alternatives Considered

### Alternative 1: [Name]
- **Pros**: [Advantages]
- **Cons**: [Disadvantages]
- **Why Rejected**: [Reason]

### Alternative 2: [Name]
- **Pros**: [Advantages]
- **Cons**: [Disadvantages]
- **Why Rejected**: [Reason]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Trade-off 1]
- [Trade-off 2]

### Risks
- [Risk 1]: Mitigation: [Strategy]
- [Risk 2]: Mitigation: [Strategy]

## Implementation Notes

[How should this be implemented? Key patterns to follow?]

## Related Decisions

- ADR-XXX: [Related decision]

## Review Date

[When should this decision be reviewed? e.g., 6 months, next major version]
```

#### 4. System Diagrams
**Directory**: `ai_docs/architecture/diagrams/`

Create initial diagrams (ASCII art or Mermaid format):

**system-overview.md** - High-level system architecture
**data-flow.md** - How data moves through the system
**deployment.md** - Deployment architecture

### Confirmation Output

```
✅ Architecture Created!

Files created:
- ai_docs/architecture/specification.md
- ai_docs/architecture/technology-stack.md
- ai_docs/architecture/patterns.md
- ai_docs/architecture/adrs/ADR-001-[title].md
- ai_docs/architecture/adrs/ADR-002-[title].md
- ... (additional ADRs)
- ai_docs/architecture/diagrams/system-overview.md

Next steps:
1. Review: cat ai_docs/architecture/specification.md
2. Share with team for feedback
3. Reference in PRD: ai_docs/backlog/prds/
4. Create user stories that align with architecture

Architecture decisions will now guide:
- Developer implementations
- Code reviews
- Infrastructure setup
- Technical story creation
```

---

## Mode 2: Analyze Proposed Architecture

**Use the system-architect agent** to critically analyze a proposed architecture.

### If Architecture Description Provided

```bash
/architecture analyze "microservices with shared MongoDB database"
```

### If No Description

Ask the user to describe the proposed architecture or provide a file path to analyze.

### Critical Analysis Process

The system-architect agent provides:

#### 1. Understanding
Restate the proposed architecture to confirm understanding

#### 2. Strengths ✅
What's good about this approach?
- [Strength 1 with explanation]
- [Strength 2 with explanation]

#### 3. Concerns ⚠️
What are the potential issues?
- [Concern 1]
  - Risk Level: Critical | High | Medium | Low
  - Impact: [Description]
  - Recommendation: [How to address]

#### 4. Risks 🚨
What could go wrong?
- [Risk 1]
  - Likelihood: High | Medium | Low
  - Impact: High | Medium | Low
  - Mitigation: [Strategy]

#### 5. Anti-Patterns Detected
Any architectural anti-patterns?
- Distributed monolith
- Premature optimization
- Over-engineering
- No clear boundaries
- Single point of failure
- Vendor lock-in

#### 6. Alternative Approaches
Suggest 2-3 alternative architectures:
- [Alternative 1]: [Description, pros, cons, when to use]
- [Alternative 2]: [Description, pros, cons, when to use]

#### 7. Recommendation
- **Accept**: Good to go as-is
- **Modify**: Accept with specific changes
- **Reject**: Significant flaws, use alternative instead

**Rationale**: [Detailed explanation]

#### 8. Questions to Answer
- [ ] [Unanswered question 1]
- [ ] [Unanswered question 2]

### Save Analysis

Offer to save the analysis to:
`ai_docs/architecture/analyses/analysis-[date].md`

Or if user wants to proceed with a recommendation:
- Create architecture from the recommended approach
- Follow "Create Architecture" flow above

---

## Mode 3: Update Existing Architecture

**Use the system-architect agent** to update the existing architecture.

### Check for Existing Architecture

1. Look for `ai_docs/architecture/specification.md`
2. If not found: "No architecture found. Use `/architecture create` first."
3. If found: Load current architecture

### Display Current Architecture Summary

```
📐 Current Architecture

Pattern: [Microservices | Monolith | Event-Driven | etc.]
Database: [PostgreSQL | MongoDB | etc.]
Hosting: [AWS | GCP | Azure | etc.]
Last Updated: [Date]

ADRs: [Count] decisions recorded
- ADR-001: [Title]
- ADR-002: [Title]
```

### Ask What to Update

```
What would you like to update?

1. Architectural pattern (e.g., migrate from monolith to microservices)
2. Technology stack (e.g., change database, add caching layer)
3. Scalability approach (e.g., add sharding, read replicas)
4. Security architecture (e.g., add OAuth2, encryption)
5. Deployment architecture (e.g., switch cloud providers)
6. API design (e.g., REST to GraphQL)
7. Add new component/service
8. Deprecate component/service
9. Other (describe)

Or describe the change:
```

### Analysis of Proposed Change

The system-architect agent should:

1. **Understand Current State**:
   - What's the current architecture?
   - Why was it chosen? (check existing ADRs)

2. **Analyze Proposed Change**:
   - Why is this change needed?
   - What problem does it solve?
   - What are the trade-offs?

3. **Impact Analysis**:
   - What components are affected?
   - What's the migration path?
   - What's the rollback strategy?
   - Estimated effort?
   - Risk assessment?

4. **Recommend Approach**:
   - Should we make this change?
   - If yes, how? (phased approach, big bang, etc.)
   - If no, what instead?

### Update Architecture Artifacts

If change is approved:

1. **Update specification.md**:
   - Update relevant sections
   - Update "Last Updated" date
   - Add entry to version history

2. **Create New ADR**:
   - ADR-XXX: [Change decision]
   - Document why change was made
   - Document alternatives considered
   - Document migration approach

3. **Update technology-stack.md** (if applicable)

4. **Update diagrams** (if applicable)

5. **Create migration plan** (if significant change):
   - `ai_docs/architecture/migrations/migration-[name].md`

### Confirmation

```
✅ Architecture Updated!

Changes:
- [Change summary]

Files updated:
- ai_docs/architecture/specification.md (updated)
- ai_docs/architecture/adrs/ADR-XXX-[title].md (created)
- ai_docs/architecture/technology-stack.md (updated)

Migration plan created:
- ai_docs/architecture/migrations/migration-[name].md

Next steps:
1. Review changes: cat ai_docs/architecture/specification.md
2. Share with team
3. Update stories/epics to reflect new architecture
4. Plan migration if needed
```

---

## Mode 4: Show/List Architecture

Display current architecture summary.

### Check for Architecture

1. Look for `ai_docs/architecture/specification.md`
2. If not found: "No architecture defined. Use `/architecture create` to get started."

### Display Summary

```
📐 System Architecture

**Pattern**: [Microservices | Monolith | Event-Driven | etc.]
**Status**: [Draft | Active | Deprecated]
**Last Updated**: [Date]

## Technology Stack
- **Frontend**: [React, Vue, etc.]
- **Backend**: [Bun, Node.js, etc.]
- **Database**: [PostgreSQL, MongoDB, etc.]
- **Hosting**: [AWS, GCP, Azure, etc.]

## Key Quality Attributes
- **Scalability**: [Target users/requests]
- **Performance**: [Latency targets]
- **Availability**: [Uptime target]
- **Security**: [Compliance level]

## Architecture Decisions (ADRs)
[Count] decisions recorded:
- ADR-001: [Title] - [Status]
- ADR-002: [Title] - [Status]
- ADR-003: [Title] - [Status]

## Components
[Count] main components:
- [Component 1]: [Brief description]
- [Component 2]: [Brief description]

## Files
- Specification: ai_docs/architecture/specification.md
- Tech Stack: ai_docs/architecture/technology-stack.md
- Patterns: ai_docs/architecture/patterns.md
- ADRs: ai_docs/architecture/adrs/ ([count] files)
- Diagrams: ai_docs/architecture/diagrams/ ([count] files)

View full spec: cat ai_docs/architecture/specification.md
Update architecture: /architecture update
```

---

## Integration with Workflow

### Architecture-First Development

Recommended workflow:

```bash
# 1. Create personas (understand users)
/personas create

# 2. Create architecture (technical foundation)
/architecture create

# 3. Create PRD (product requirements respecting arch constraints)
# Edit ai_docs/backlog/prds/my-product.md

# 4. Break down PRD (stories align with architecture)
/breakdown-prd ai_docs/backlog/prds/my-product.md

# 5. Sprint planning
/sprint-plan

# 6. Development (follows architecture patterns)
# Implementation

# 7. Architecture review in feature completion
/feature-complete [feature]
```

### When to Update Architecture

Update when:
- Scaling beyond current design
- New compliance requirements
- Performance issues that require architectural change
- Technology becomes obsolete
- Team capabilities change significantly
- Business model shifts (e.g., B2C to B2B)

### Architecture Review Cadence

- **Every sprint**: Check if stories violate architecture
- **Quarterly**: Review architecture fitness
- **Annually**: Major architecture review and planning
- **As needed**: When significant changes proposed

---

## Best Practices

### Do:
- Create architecture BEFORE writing PRD
- Document every significant decision in ADRs
- Review architecture with team before finalizing
- Update architecture when reality diverges from spec
- Reference architecture in code reviews
- Keep diagrams current

### Don't:
- Create architecture in isolation (involve team)
- Over-engineer for imaginary future needs
- Ignore team capabilities
- Make changes without ADRs
- Let architecture docs get stale
- Choose tech for resume-building

---

## Tips

- **Start simple**: Monolith → Modular Monolith → Microservices (if needed)
- **Challenge assumptions**: Ask "why" 5 times
- **Consider team**: Best architecture is one team can maintain
- **Document trade-offs**: Future you will thank current you
- **Review regularly**: Architecture should evolve with system
- **Be pragmatic**: Perfect is the enemy of good

---

Remember: The system-architect agent is **constructively critical**. It will challenge assumptions and identify risks - that's the goal! Better to find issues during planning than in production.
