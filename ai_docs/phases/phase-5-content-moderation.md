# Phase 5: Content Moderation

## Overview
Implement comprehensive content moderation system with photo approval workflows, user reporting capabilities, and admin moderation tools.

## Goals
- Create photo approval/rejection workflow
- Implement user reporting system
- Build admin moderation queue
- Establish content guidelines enforcement
- Enable bulk moderation actions

## Core Features

### Photo Approval Workflow
- All submissions start as "pending" status
- Admin approval required before public display
- Batch approval capabilities
- Rejection with reason feedback
- Re-submission process for rejected photos

### User Reporting System
- Report button on each photo
- Predefined report categories
- Anonymous reporting option
- Report description field
- Duplicate report prevention

### Admin Moderation Queue
- Centralized pending photos dashboard
- Reported photos priority queue
- Bulk action capabilities
- Moderation history tracking
- Moderator assignment system

### Content Status Management
- Photo status: pending, approved, rejected, flagged
- Status change notifications
- Moderation logs and audit trail
- Appeal process for rejected content

## Technical Implementation

### Photo Status System
```typescript
enum PhotoStatus {
  PENDING = 'pending',
  APPROVED = 'approved', 
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  UNDER_REVIEW = 'under_review'
}
```

### Report Categories
- Inappropriate content
- Copyright violation
- Not wildlife/nature related
- Poor quality/technical issues
- Spam or duplicate
- Other (with description)

### API Endpoints (tRPC)
```typescript
// Moderation procedures
moderation.approvePhoto
moderation.rejectPhoto
moderation.flagPhoto
moderation.bulkApprove
moderation.bulkReject
moderation.getPendingPhotos
moderation.getReportedPhotos

// Reporting procedures
reports.create
reports.list
reports.resolve
reports.getByPhoto
reports.getByUser
```

### Database Updates
- Add moderation logs table
- Extend photos table with moderator_id, moderated_at
- Add indexes for efficient moderation queries
- Report status tracking

## Admin Interface

### Moderation Dashboard
- Quick stats: pending, reported, resolved
- Priority queue with most urgent items first
- Filter options: status, category, date, reporter
- Bulk selection and actions
- Moderator workload distribution

### Photo Review Interface
- Large photo preview
- All submission metadata displayed
- Quick approve/reject buttons
- Rejection reason dropdown
- Similar photos detection (future)
- Previous moderation history

### Reporting Queue
- List of reported photos with report details
- Report reason and user feedback
- Multiple reports per photo aggregation
- Priority scoring based on report volume
- Quick resolution actions

### Moderation History
- Complete audit log of all moderation actions
- Moderator performance tracking
- Photo status change timeline
- Appeal and re-submission tracking

## User Interface

### Reporting System
- Prominent but not intrusive report button
- Modal with report reason selection
- Optional description field
- Confirmation and feedback messages
- Report status tracking for users

### Submission Status
- Clear status indicators on user submissions
- Rejection reason display with improvement tips
- Re-submission guidelines and process
- Appeal request functionality
- Notification system for status changes

### Community Guidelines
- Clear content policy page
- Examples of acceptable/unacceptable content
- Submission best practices
- Appeal process documentation
- Community standards enforcement

## Key Components to Create

### Admin Components
- `app/components/admin/moderation-queue.tsx`
- `app/components/admin/photo-reviewer.tsx`
- `app/components/admin/bulk-actions.tsx`
- `app/components/admin/moderation-stats.tsx`
- `app/components/admin/report-manager.tsx`

### User Components
- `app/components/reporting/report-button.tsx`
- `app/components/reporting/report-modal.tsx`
- `app/components/status/submission-status.tsx`
- `app/components/appeals/appeal-form.tsx`

### Admin Pages
- `app/routes/admin.moderation._index.tsx` - Main moderation dashboard
- `app/routes/admin.moderation.pending.tsx` - Pending photos queue
- `app/routes/admin.moderation.reported.tsx` - Reported photos
- `app/routes/admin.moderation.history.tsx` - Moderation logs
- `app/routes/admin.moderation.$photoId.tsx` - Individual photo review

### User Pages
- `app/routes/guidelines.tsx` - Community guidelines
- `app/routes/appeals.tsx` - Appeal submission
- Enhanced submission status in existing pages

## Moderation Workflow

### Standard Review Process
1. Photo submitted → status: pending
2. Admin reviews photo and metadata
3. Decision: approve, reject, or flag for further review
4. User notified of decision
5. If rejected: reason provided, re-submission allowed

### Report Handling Process
1. User reports photo with reason
2. Photo flagged for admin review
3. Admin investigates report
4. Action taken: dismiss report, reject photo, or escalate
5. Reporter and photo owner notified
6. Photo status updated accordingly

### Bulk Moderation
- Select multiple photos for batch actions
- Apply same action to multiple items
- Bulk rejection with common reasons
- Progress tracking for large batches
- Undo functionality for recent actions

## Success Criteria
- [ ] Photos require approval before public display
- [ ] Users can report inappropriate content
- [ ] Admins have efficient moderation tools
- [ ] Bulk actions work correctly
- [ ] Status changes are tracked and logged
- [ ] Users receive appropriate feedback
- [ ] Report handling is comprehensive
- [ ] Moderation queue is well-organized
- [ ] Performance remains good with large queues

## Moderation Guidelines
- Clear criteria for photo approval
- Consistent application of standards
- Constructive rejection feedback
- Quick response to reports
- Fair appeal process
- Transparency in moderation actions

## Performance Considerations
- Efficient queries for large moderation queues
- Pagination for moderation interfaces
- Caching of moderation statistics
- Background processing for bulk actions
- Optimized image loading in review interface

## Dependencies
- Phase 1: Foundation & Authentication
- Phase 2: Competition Management
- Phase 3: Photo Submissions
- Notification system (email/in-app)
- Image analysis tools (future)

## Estimated Timeline
**4-5 days**

## Next Phase
Phase 6: Winner Declaration - Implement winner selection and results display system.