## Worklog Tracking System

We are building a simple system to track users' worked hours for a company with a 10K user-base.
Data from the last 10 years will be migrated.

Tech Stack & Setup

- Frontend: React-Router, Tailwind, shadcn
- Backend: NodeJS, Bun, tRPC
- Database: SQLite, Drizzle
- Authentication: Clerk

Access Control

- Anonymous users
  - can only view the login and a help page (use lorem ipsum).
- Registered users
  - Log in (see SIMPLIFICATIONS at the end)
  - Create worklogs (multiple logs per day)
  - (SKIP = have menu item there, but use an empty page with a description) List their worklogs
    - data should be grouped by days
  - we display total hours of a user for a given day
  - beside the hours we should have a UT (undertime) sign if worked less than minimum and an OT (overtime) sign if worked more than maximum!
  - add filtering by OT or UT
    - add paging (entries)
    - use default sorting (by day) - most recent first
- Admin
  - (SKIP = have menu item there, but use an empty page with a description) List all users
  - (SKIP = have menu item there, but use an empty page with a description) Edit users' min/max daily hours
  - List each user's worklog (same as user's personal worklog, with one major detail)
    - we need to show user's name too
  - we sort by day, then by user name

Database Seeding

- Users: user1, user2, admin (with different min-max hours, e.g., user1: 3-5, user2: 7-9)
- Worklogs: 0–N per user/day (mostly 2-3), also ensure we have cases where users work below min or above max

Data Model

- User: name, dailyMinHours, dailyMaxHours
- Worklog: date, workedHours, taskId (optional), description (optional)

Environments:

- Dev → In-memory SQLite
- Local & Prod → SQL

Usual requests;

- Front-end should be able to consume localhost API or a deployed API (stage or prod) - IMPORTANT: please DO NOT set up a deployed environment, localhost should be enough!
