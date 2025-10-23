---
name: prp-writer
description: Generate Product Requirements Prompts (PRPs) for AI coding assistants using context engineering methodology. Use when building features end-to-end with comprehensive context including implementation plans, code patterns, validation criteria, and documentation. Handles Cloudflare Workers, TypeScript, React, AI agents, and full-stack applications.
---

# PRP Writer

This skill helps generate comprehensive Product Requirements Prompts (PRPs) that give AI coding assistants everything needed to build features end-to-end using context engineering principles.

## When to Use This Skill

Use this skill when:
- Building features that require comprehensive context and implementation guidance
- Working with Cloudflare Workers, TypeScript, React, D1, Durable Objects
- Implementing AI agent systems with proper coordination patterns
- Creating full-stack applications with multiple integration points
- Ensuring consistent code patterns and quality across implementations

## Core Concept

Context Engineering > Prompt Engineering > Vibe Coding

Most AI failures aren't model failures - they're context failures. PRPs provide structured, comprehensive context including rules, examples, documentation, and validation criteria.

## Project Structure Required

The user's project should have:

```
project/
├── .claude/
│   ├── commands/
│   │   ├── generate-prp.md
│   │   └── execute-prp.md
│   └── settings.local.json
├── ai_docs
|   |
│   └── [generated PRP]
|
├── CLAUDE.md             # Global rules
└── README.md
```

## Generating a PRP

### Step 1: Review Feature Request

The user provides a feature request (usually mentioned in the prompt) with:
- **FEATURE**: Detailed description of what to build
- **DOCUMENTATION**: Links to relevant docs and APIs
- **OTHER CONSIDERATIONS**: Gotchas and common pitfalls

### Step 2: Research Context

Before writing the PRP, gather:

1. **Code Patterns**: Read referenced files in examples/ folder
2. **Project Rules**: Review CLAUDE.md for project-wide conventions
3. **Documentation**: Search for relevant technical docs, like architecture docs in `ai_docs/architecture/*`
4. **Similar Implementations**: Look for existing patterns in the codebase

### Step 3: Generate Comprehensive PRP

Create a PRP document with these sections:

#### Context Section
- Project background and tech stack
- Relevant documentation links
- Code patterns from examples/
- Technical constraints and requirements
- Common pitfalls for this type of feature

#### Implementation Plan
- Step-by-step breakdown with dependencies
- Opt for 'full stack' features (database -> services -> api -> UI) instead of just building the API in one step, the UI in the next
- Validation checkpoints after each step
- Error handling strategies
- Testing requirements at each stage

#### Code Examples
- Specific patterns to follow (from examples/)
- Anti-patterns to avoid
- Integration points with existing code
- Performance and security considerations

#### Success Criteria
- Functional requirements (what must work)
- Performance benchmarks (if applicable)
- Test coverage requirements
- Code quality standards

#### Validation Commands
- Commands to run after implementation
- Expected outputs
- How to verify success

## PRP Quality Checklist

A good PRP includes:

**Context Richness**
- [ ] Referenced at least 3 relevant example files
- [ ] Included links to official documentation
- [ ] Documented common pitfalls and gotchas
- [ ] Specified technical constraints clearly

**Implementation Clarity**
- [ ] Broken down into 5-10 clear steps
- [ ] Each step has validation criteria
- [ ] Dependencies between steps are explicit
- [ ] Error handling is addressed

**Code Guidance**
- [ ] Specific patterns to follow
- [ ] Anti-patterns explicitly called out
- [ ] Integration points identified
- [ ] Security considerations included

**Validation**
- [ ] Test commands provided
- [ ] Expected outputs specified
- [ ] Success criteria measurable
- [ ] Rollback strategy if needed

## Tech Stack Specific Guidance

Check `ai_docs/techstack.md` if it exists, otherwise analyse the existing codebase.

### Cloudflare Workers + TypeScript

Generally, if nothing is specified assume that we want to run on:
- Proper TypeScript configuration (wrangler types)
- Edge runtime limitations (no Node.js APIs)
- Database: D1 using Drizzle, KV
- Binding configurations (D1, KV, Durable Objects)
- CORS handling patterns

### AI Agents

Always include:
- Tool definition schemas with TypeScript
- Agent communication protocols
- State management approaches
- Error boundary patterns
- Health monitoring and fallback mechanisms

### Full-Stack Apps

Always include:
- Frontend/backend integration patterns
- Authentication and authorization flows
- Database schema and migration strategy
- Real-time communication patterns (if applicable)
- Deployment and environment configuration

## Writing Effective Feature Requests

Help users improve vague requests by asking:

**For unclear requirements:**
- "What specific functionality should this include?"
- "What are the key user interactions?"
- "What should happen in error cases?"

**For missing context:**
- "Which examples in your examples/ folder should I reference?"
- "Are there specific patterns or conventions to follow?"
- "What are common pitfalls with this type of feature?"

**For validation:**
- "How will we know this works correctly?"
- "What tests should pass?"
- "What are the performance requirements?"

## Common Anti-Patterns to Avoid

**Vague Requirements**
❌ "Build a dashboard"
✅ "Build a real-time analytics dashboard using React, Hono API, D1 database with WebSocket updates via Durable Objects"

**Missing Examples**
❌ No code patterns referenced
✅ "Follow examples/api/hono-server.ts for API structure and examples/frontend/dashboard.tsx for component patterns"

**Incomplete Validation**
❌ "Make sure it works"
✅ "Run `npm test`, verify API returns 200 status, check WebSocket connection establishes within 2 seconds"

**No Error Handling**
❌ Silent on error cases
✅ "Handle rate limiting with exponential backoff, show user-friendly errors, log failures to D1 for debugging"

## Example PRP Outline

For reference, see references/prp-template.md for a complete PRP template with all sections filled out.

## Tips for Success

1. **More Examples = Better Results**: Rich code examples in the examples/ folder dramatically improve implementation quality

2. **Be Specific**: "Build user auth with Cloudflare Access, JWT tokens, protected routes, and D1 storage" beats "Build user system"

3. **Include Gotchas**: Document edge cases, performance bottlenecks, and common mistakes upfront

4. **Validate Everything**: Every step should have clear validation criteria

5. **Think End-to-End**: Consider the full lifecycle from development to deployment

## Next Steps After PRP Generation

Once a PRP is generated:
1. Review it with the user for completeness
2. Collect feedback on what worked and what didn't
3. Update examples/ folder with successful patterns
4. Refine CLAUDE.md rules based on learnings
