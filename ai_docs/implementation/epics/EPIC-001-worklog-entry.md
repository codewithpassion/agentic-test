# Epic: Worklog Entry & Personal Tracking

**ID**: EPIC-001
**Status**: Backlog
**Priority**: High
**Target Release**: v1.0

## Description

Enable employees to log their daily work hours with multiple entries per day, and view their own worklog history with overtime/undertime indicators. This epic delivers the core functionality that allows individual employees to track their time.

## User Value

- Employees can accurately record their work hours throughout the day
- Visibility into overtime and undertime patterns
- Self-service time tracking without admin intervention
- Historical view of personal work patterns

## User Stories

This epic contains the following stories:
- US-001: Log work hours for a day
- US-002: View personal worklog history with OT/UT indicators
- US-003: Filter personal worklogs by overtime/undertime status
- US-004: Edit and delete personal worklog entries

## Success Metrics

- Users can create worklog entries in < 30 seconds
- 95% of users successfully view their worklog history
- OT/UT calculations are accurate 100% of time
- Page load time for worklog list < 2 seconds

## Dependencies

- Database schema (users table with dailyMinHours/dailyMaxHours, worklogs table)
- User authentication (Clerk integration already exists)
- Convex backend setup (already exists)

## Architectural Constraints

- **Database**: Convex real-time database (NoSQL with relational features)
- **Frontend**: React 19 with React Router 7, shadcn/ui components
- **Authentication**: Clerk (JWT-based, roles in metadata)
- **Real-time**: Convex subscriptions for automatic UI updates
- **TypeScript**: Strict mode, NO `any` types allowed

## Timeline

- Estimated duration: 2 weeks
- Target completion: Week 2
