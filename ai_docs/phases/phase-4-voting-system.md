# Phase 4: Voting System

## Overview
Implement the voting mechanics that allow authenticated users to vote on photo submissions, with vote tracking, display, and sorting capabilities.

## Goals
- Enable one vote per photo per user
- Track and display vote counts
- Implement sorting and filtering by votes
- Create engaging voting interface
- Prevent vote manipulation

## Core Features

### Voting Mechanics
- One vote per photo per authenticated user
- Vote toggle (vote/unvote)
- Anonymous voting (votes not publicly attributed)
- Real-time vote count updates
- Vote history tracking for users

### Vote Display
- Public vote counts on each photo
- Vote count badges and indicators
- Top-voted photos highlights
- Voting statistics in admin dashboard

### Sorting and Filtering
- Sort by: most votes, newest, oldest, random
- Filter by: category, date range, vote threshold
- Search within competition photos
- Combination filtering options

### Voting Interface
- Prominent vote buttons on photo cards
- Visual feedback for voted/unvoted state
- Vote count animation on change
- Mobile-optimized voting controls

## Technical Implementation

### Database Operations
- Vote creation with duplicate prevention
- Vote removal (unvote functionality)
- Efficient vote counting queries
- Vote history for users

### API Endpoints (tRPC)
```typescript
// Voting procedures
votes.toggle         // Vote or unvote a photo
votes.getPhotoVotes  // Get vote count for photo
votes.getUserVotes   // Get user's voting history
votes.getTopPhotos   // Get highest voted photos

// Statistics procedures
stats.getVotingStats     // Overall voting statistics
stats.getCategoryVotes   // Votes per category
stats.getUserVoteCount   // User's total votes cast
```

### Vote Validation
- User must be authenticated
- Cannot vote on own photos
- One vote per photo per user
- Competition must be active for voting
- Photo must be approved for voting

### Real-time Updates
- Optimistic UI updates
- Vote count synchronization
- Live vote count updates (optional)
- Conflict resolution for concurrent votes

## User Interface

### Voting Controls
- Heart/thumbs-up icon for voting
- Clear visual state (voted/not voted)
- Vote count display next to button
- Smooth animations for interactions
- Keyboard accessibility

### Photo Gallery Enhancements
- Vote buttons integrated into photo cards
- Sort dropdown with vote-based options
- "Most Popular" section/filter
- Vote count prominence in layout

### Voting Stats Display
- Personal voting statistics page
- Competition voting leaderboards
- Category-wise popular photos
- Voting participation metrics

### Mobile Voting Experience
- Touch-friendly vote buttons
- Swipe-to-vote gesture (optional)
- Pull-to-refresh vote counts
- Optimized for one-handed use

## Key Components to Create

### Voting Components
- `app/components/voting/vote-button.tsx`
- `app/components/voting/vote-counter.tsx`
- `app/components/voting/voting-stats.tsx`
- `app/components/voting/top-photos.tsx`

### Enhanced Gallery Components
- Update `app/components/photo/photo-grid.tsx` with voting
- Update `app/components/photo/photo-card.tsx` with vote UI
- `app/components/filters/vote-filters.tsx`
- `app/components/sorting/vote-sorting.tsx`

### Pages
- `app/routes/voting-stats.tsx` - Personal voting statistics
- Update gallery pages with voting functionality
- `app/routes/leaderboard.tsx` - Top photos by votes

### API Routes
- `api/routes/votes.ts` - Voting procedures
- `api/routes/statistics.ts` - Voting statistics
- Database query optimizations

## Voting Analytics

### User Analytics
- Photos voted on
- Voting patterns and preferences
- Most active voting periods
- Category voting distribution

### Photo Analytics
- Vote progression over time
- Vote velocity (votes per hour/day)
- Geographic voting patterns (future)
- Voter engagement metrics

### Competition Analytics
- Total votes per competition
- Average votes per photo
- Voting participation rate
- Peak voting periods

## Success Criteria
- [ ] Users can vote on photos successfully
- [ ] Vote counts display correctly
- [ ] One vote per photo constraint enforced
- [ ] Cannot vote on own photos
- [ ] Vote sorting and filtering works
- [ ] Real-time vote updates function
- [ ] Mobile voting experience is smooth
- [ ] Vote statistics are accurate
- [ ] Performance remains good with many votes
- [ ] Voting controls are accessible

## Security and Integrity
- Prevent vote manipulation/spam
- Rate limiting on voting actions
- Vote authenticity verification
- Protection against automated voting
- Audit trail for vote changes

## Performance Considerations
- Efficient vote counting queries
- Caching for popular photos
- Database indexing on vote tables
- Optimized real-time updates
- Lazy loading of vote counts

## Dependencies
- Phase 1: Foundation & Authentication
- Phase 2: Competition Management  
- Phase 3: Photo Submissions
- Real-time update infrastructure (optional)
- Analytics tracking setup

## Estimated Timeline
**3-4 days**

## Next Phase
Phase 5: Content Moderation - Implement photo approval workflow and user reporting system.