# Phase 6: Winner Declaration

## Overview
Implement the winner selection system that allows admins to declare 1st, 2nd, and 3rd place winners per category, with public results display and winner showcasing.

## Goals
- Enable admin winner selection per category
- Create public winner announcement system
- Build winner showcase galleries
- Implement winner notification system
- Archive competition results

## Core Features

### Winner Selection Interface
- Admin-only winner selection tools
- Visual photo comparison interface
- Per-category winner selection (1st, 2nd, 3rd)
- Winner selection validation and confirmation
- Undo/change winner selections

### Winner Management
- One winner per place per category
- Winner status tracking in database
- Historical winner records
- Winner photo highlighting
- Awards and recognition system

### Public Results Display
- Competition results page
- Winner showcase galleries
- Category-wise winner display
- Winner photo details and stories
- Social sharing for winners

### Winner Notifications
- Automatic winner notification emails
- In-app winner badges and recognition
- Winner certificate generation (future)
- Social media announcement templates

## Technical Implementation

### Database Schema
```sql
-- Winners table already defined in Phase 1
winners:
- id (primary key)
- photo_id (foreign key to photos)
- category_id (foreign key to categories) 
- place (enum: first, second, third)
- created_at (datetime)
- unique constraint on (category_id, place)
```

### Winner Selection Logic
- Only approved photos eligible for selection
- Cannot select same photo for multiple places
- Category-specific winner selection
- Validation against existing winners
- Admin permission verification

### API Endpoints (tRPC)
```typescript
// Winner procedures
winners.selectWinner      // Select photo as winner for place/category
winners.removeWinner      // Remove winner selection
winners.getWinners        // Get winners for competition/category
winners.getWinnerHistory  // Historical winners across competitions

// Results procedures  
results.getCompetitionResults  // Full competition results
results.publishResults         // Make results public
results.getWinnerStats        // Winner statistics
```

### Winner Validation Rules
- Admin/SuperAdmin only can select winners
- Photo must be approved status
- One winner per place per category
- Cannot win multiple places in same category
- Competition must be ended to select winners

## Admin Interface

### Winner Selection Dashboard
- Competition overview with categories
- Photos eligible for winner selection
- Current winner selections display
- Category-by-category selection interface
- Bulk winner selection tools

### Winner Selection Interface
- Grid view of top-voted photos per category
- Photo comparison tools (side-by-side)
- Quick winner selection buttons (1st, 2nd, 3rd)
- Winner confirmation dialogs
- Selection history and changes tracking

### Results Management
- Competition results preview
- Publish/unpublish results control
- Winner announcement scheduling
- Results page customization
- Winner notification management

## Public Interface

### Competition Results Page
- Hero section with overall competition info
- Category sections with winners displayed
- Winner photo galleries with details
- Voting statistics and participation metrics
- Social sharing and download options

### Winner Showcase
- Featured winner photo displays
- Winner photographer information
- Photo details and technical info
- Winner interview/story (future)
- Achievement badges and recognition

### Historical Results
- Archive of past competition winners
- Winner search and filtering
- Photographer winner history
- Competition comparison tools
- Winner statistics and trends

## Key Components to Create

### Admin Components
- `app/components/admin/winner-selector.tsx`
- `app/components/admin/photo-comparison.tsx`
- `app/components/admin/winner-dashboard.tsx`
- `app/components/admin/results-manager.tsx`
- `app/components/admin/winner-notification.tsx`

### Public Components
- `app/components/winners/winner-showcase.tsx`
- `app/components/winners/results-display.tsx`
- `app/components/winners/winner-card.tsx`
- `app/components/winners/winner-gallery.tsx`
- `app/components/winners/winner-badge.tsx`

### Admin Pages
- `app/routes/admin.winners._index.tsx` - Winner management dashboard
- `app/routes/admin.winners.$competitionId.tsx` - Competition winner selection
- `app/routes/admin.winners.$competitionId.$categoryId.tsx` - Category winner selection
- `app/routes/admin.results.tsx` - Results management

### Public Pages
- `app/routes/results._index.tsx` - Competition results listing
- `app/routes/results.$competitionId.tsx` - Specific competition results
- `app/routes/winners.tsx` - Historical winners gallery
- `app/routes/winners.$photographerId.tsx` - Photographer winner history

## Winner Selection Workflow

### Standard Winner Selection Process
1. Competition ends (end_date passed)
2. Admin accesses winner selection interface
3. Review eligible photos per category
4. Select 1st, 2nd, 3rd place winners
5. Confirm selections and publish results
6. Notify winners automatically
7. Update public results display

### Winner Change Process
1. Admin can modify selections before publishing
2. Change tracking and audit log
3. Re-notification if winners changed
4. Results page updates automatically
5. Historical record of changes maintained

## Results Display Features

### Competition Results Layout
- Competition banner with dates and description
- Category tabs or sections
- Winner podium display (1st, 2nd, 3rd)
- Runner-up galleries
- Overall competition statistics

### Winner Photo Display
- Large high-quality photo display
- Photographer credit and information
- Photo metadata and technical details
- Vote count and engagement stats
- Social sharing buttons

### Interactive Features
- Photo lightbox/modal view
- Winner photo downloads (with watermark)
- Social media sharing templates
- Winner certificate download (future)
- Email winner congratulations

## Success Criteria
- [ ] Admins can select winners per category/place
- [ ] Winner selections are validated correctly
- [ ] Cannot select invalid winner combinations
- [ ] Public results display works beautifully
- [ ] Winner notifications are sent automatically
- [ ] Historical winner records are maintained
- [ ] Results are mobile-responsive
- [ ] Social sharing works correctly
- [ ] Winner selection changes are tracked

## Notification System
- Winner email notifications with congratulations
- Runner-up notifications and encouragement
- General participant thank you emails
- Social media announcement assistance
- Winner press release templates (future)

## Analytics and Tracking
- Winner selection timeline tracking
- Results page view analytics
- Winner photo engagement metrics
- Social sharing statistics
- Winner photographer follow-up

## Dependencies
- Phase 1: Foundation & Authentication
- Phase 2: Competition Management
- Phase 3: Photo Submissions
- Phase 4: Voting System
- Phase 5: Content Moderation
- Email notification system
- Social sharing infrastructure

## Estimated Timeline
**3-4 days**

## Next Phase
Phase 7: Polish & Performance - Final optimizations, mobile enhancements, and accessibility improvements.