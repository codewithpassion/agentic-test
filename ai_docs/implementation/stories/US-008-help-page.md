# User Story: Access Help Page as Anonymous User

**ID**: US-008
**Epic**: EPIC-003 (Public Access & Help System)
**Status**: Backlog
**Priority**: Low
**Estimate**: 0.5 days

## User Story

**As an** anonymous user
**I want to** access a help page without logging in
**So that** I can learn about the system before deciding to sign up

## Acceptance Criteria

1. **Given** I am not logged in
   **When** I navigate to the help page URL
   **Then** I can view the help content without authentication

2. **Given** I am on the help page
   **When** the page loads
   **Then** I see helpful documentation about the worklog system
   **And** I see a link to sign in/sign up

3. **Given** I am on the help page
   **When** I click the navigation menu
   **Then** I see a link back to the home/landing page
   **And** I see a link to the login page

4. **Given** the page is indexed by search engines
   **When** a search engine bot visits
   **Then** the content is server-side rendered for SEO

## Business Rules

- No authentication required (public route)
- Content should be informative (for MVP, lorem ipsum is acceptable per PRD)
- Page should have proper meta tags for SEO
- Navigation consistent with other public pages
- Future: Replace lorem ipsum with real help content

## Full-Stack Implementation Notes

### Frontend Layer (React)
```typescript
// app/routes/help.tsx
// - Public route (no _auth. prefix)
// - Use PublicLayout wrapper
// - Display help content (lorem ipsum for MVP)
// - Include navigation to login and home
// - Add meta tags for SEO

export const meta: MetaFunction = () => {
  return [
    { title: "Help - Worklog Tracker" },
    { name: "description", content: "Learn how to use the worklog tracking system" },
  ];
};

export default function HelpPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Help & Documentation</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Logging Work Hours</h2>
            <p>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Understanding Overtime & Undertime</h2>
            <p>
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
              officia deserunt mollit anim id est laborum. Sed ut perspiciatis
              unde omnis iste natus error sit voluptatem.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">How do I sign up?</h3>
                <p>Click the "Sign In" button in the navigation menu to create an account.</p>
              </div>
              <div>
                <h3 className="font-semibold">Can I edit my worklogs?</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>
              <div>
                <h3 className="font-semibold">Who can see my work hours?</h3>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit.</p>
              </div>
            </div>
          </section>

          <section className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Ready to get started?</h2>
            <p className="mb-4">Sign in to start tracking your work hours today.</p>
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
```

### Navigation Updates
```typescript
// Ensure app/components/shared/navigation-header.tsx includes help link
// Add help link to footer as well for easy access
```

## Technical Notes

- Public route (no authentication guard)
- Server-side rendering for SEO (React Router 7 handles this)
- Use Tailwind prose class for typography
- Lorem ipsum acceptable for MVP (per PRD requirements)
- Future enhancement: CMS or markdown-based help docs

## Testing Checklist

- [ ] Help page accessible without login
- [ ] Content displays correctly
- [ ] Navigation links work (home, login)
- [ ] Meta tags render for SEO
- [ ] Server-side rendering works
- [ ] Responsive design (mobile/desktop)
- [ ] Typography readable and well-formatted
- [ ] CTA to sign in/sign up present
- [ ] Page loads quickly (< 1 second)

## Dependencies

- PublicLayout component (already exists)
- Navigation component (already exists)
- shadcn/ui Button component

## Definition of Done

- [ ] Help route created (app/routes/help.tsx)
- [ ] Lorem ipsum content added
- [ ] Navigation links added
- [ ] Meta tags for SEO configured
- [ ] All acceptance criteria passing
- [ ] No TypeScript errors (`bun check` passes)
- [ ] SSR verified working
- [ ] Responsive design tested
- [ ] Code reviewed
