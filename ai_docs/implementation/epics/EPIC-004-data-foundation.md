# Epic: Data Foundation & Seeding

**ID**: EPIC-004
**Status**: Backlog
**Priority**: High (Must be completed first)
**Target Release**: v1.0

## Description

Establish the database schema for worklog tracking, extend the user model with daily hour requirements, and seed the system with realistic test data to support development and testing. This epic creates the data foundation for all other features.

## User Value

- System can store and retrieve worklog data efficiently
- Realistic test data enables meaningful feature validation
- Performance testing possible with production-like data volumes

## User Stories

This epic contains the following stories:
- US-009: Establish worklog data structure and user hour policies

## Success Metrics

- Schema deployed without errors
- All indexes created successfully
- Seed data covers 30 days for 3+ test users
- Mix of OT/UT/normal cases in seed data
- Query performance < 500ms with full seed data

## Dependencies

- None (foundational epic)

## Architectural Constraints

- **Schema**: Convex schema with type-safe validators
- **Indexes**: Compound indexes for efficient queries (`by_user_date`, `by_date_user`)
- **Data types**: Number for hours (decimals allowed), string for dates (YYYY-MM-DD format)
- **Migrations**: Schema changes automatically applied by Convex

## Timeline

- Estimated duration: 0.5 weeks
- Target completion: Week 1
