# Task 6: Public Photo Gallery

## Objective
Create a public gallery interface for viewing approved photo submissions with filtering, search, and modal view capabilities.

## Requirements
- Public gallery view for approved photos only
- Category-based filtering
- Competition-based filtering
- Search functionality
- Responsive image grid
- Photo detail modal view
- Optimized image loading

## Gallery Features

### Public Access
- No authentication required
- Display only approved photos
- Hide pending/rejected submissions
- Show competition and category context

### Filtering and Search
- Filter by competition
- Filter by category within competition
- Search by photo title, description, location
- Sort by date, popularity (future), title
- Clear active filters functionality

### Image Display
- Responsive grid layout
- Lazy loading for performance
- Progressive image loading
- Thumbnail optimization
- High-resolution modal view

## Page Structure

### Main Gallery Page
**Route:** `app/routes/gallery._index.tsx`

**Features:**
- All approved photos across competitions
- Competition filter tabs
- Category filter dropdowns
- Search bar
- Photo grid display

### Competition Gallery Page
**Route:** `app/routes/gallery.$competitionId.tsx`

**Features:**
- Photos from specific competition only
- Category filter for that competition
- Competition context header
- Same search and grid functionality

## Components to Create

### PhotoGrid Component
```typescript
// app/components/photo/photo-grid.tsx
interface PhotoGridProps {
  photos: PublicPhoto[];
  loading?: boolean;
  onPhotoClick: (photo: PublicPhoto) => void;
  columns?: number;
  aspectRatio?: 'square' | 'original';
}
```

**Features:**
- Responsive grid layout (1-4 columns based on screen size)
- Lazy loading with intersection observer
- Image optimization and compression
- Hover effects and overlays
- Loading skeletons

### PhotoModal Component
```typescript
// app/components/photo/photo-modal.tsx
interface PhotoModalProps {
  photo: PublicPhoto | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}
```

**Features:**
- Full-screen photo display
- Photo metadata overlay
- Navigation between photos
- Keyboard navigation (arrow keys, escape)
- Mobile touch gestures
- Social sharing buttons (future)

### GalleryFilters Component
```typescript
// app/components/photo/gallery-filters.tsx
interface GalleryFiltersProps {
  competitions: Competition[];
  categories: Category[];
  selectedCompetition?: string;
  selectedCategory?: string;
  searchQuery: string;
  sortBy: SortOption;
  onFiltersChange: (filters: GalleryFilters) => void;
}
```

**Features:**
- Competition dropdown/tabs
- Category dropdown (filtered by competition)
- Search input with debouncing
- Sort options dropdown
- Clear filters button
- Active filter display

### PhotoCard Component
```typescript
// app/components/photo/photo-card.tsx
interface PhotoCardProps {
  photo: PublicPhoto;
  onClick: () => void;
  showMetadata?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

**Features:**
- Responsive image display
- Title and photographer overlay
- Competition/category badges
- Optimized thumbnails
- Loading states

## Image Optimization

### Image Sizes
- **Thumbnail**: 300x300px (for grid)
- **Medium**: 800x600px (for modal preview)
- **Original**: Full resolution (for download)

### Loading Strategy
- Lazy load thumbnails in grid
- Progressive loading with blur-up
- Preload adjacent images in modal
- Cache management for performance

### Image Processing
```typescript
// workers/services/image-processing.ts
class ImageProcessor {
  async generateThumbnail(originalPath: string): Promise<string>
  async generateMediumSize(originalPath: string): Promise<string>
  async optimizeImage(imagePath: string, quality: number): Promise<string>
}
```

## Search and Filtering

### Search Implementation
- Full-text search across title, description, location
- Search suggestions/autocomplete (future)
- Search result highlighting
- Search analytics (future)

### Filter Types
```typescript
interface GalleryFilters {
  competitionId?: string;
  categoryId?: string;
  searchQuery?: string;
  sortBy: 'newest' | 'oldest' | 'title' | 'photographer';
  dateRange?: { start: Date; end: Date };
}
```

### URL State Management
- Reflect filters in URL parameters
- Shareable filtered gallery URLs
- Browser back/forward support
- Bookmark-friendly URLs

## Performance Optimization

### Image Loading
- Lazy loading with intersection observer
- Progressive JPEG loading
- WebP format support with fallbacks
- CDN integration for global delivery

### Data Loading
- Infinite scroll or pagination
- Virtual scrolling for large datasets
- Cache management with React Query
- Optimistic updates

### SEO Considerations
- Server-side rendering for initial load
- Meta tags for social sharing
- Structured data for photos
- Sitemap generation

## Implementation Steps

1. **Create Basic Gallery Page**
   - Set up route and layout
   - Implement photo grid
   - Add basic filtering

2. **Build Photo Modal**
   - Create modal component
   - Add navigation functionality
   - Implement keyboard controls

3. **Implement Search and Filters**
   - Add search functionality
   - Create filter components
   - Implement URL state management

4. **Add Image Optimization**
   - Set up image processing
   - Implement lazy loading
   - Add progressive loading

5. **Create Competition Gallery**
   - Build competition-specific page
   - Add competition context
   - Implement category filtering

6. **Optimize Performance**
   - Add infinite scroll
   - Implement caching
   - Optimize image delivery

## Files to Create
- `app/routes/gallery._index.tsx`
- `app/routes/gallery.$competitionId.tsx`
- `app/components/photo/photo-grid.tsx`
- `app/components/photo/photo-modal.tsx`
- `app/components/photo/gallery-filters.tsx`
- `app/components/photo/photo-card.tsx`
- `app/hooks/use-gallery.ts`
- `app/hooks/use-photo-modal.ts`
- `workers/services/image-processing.ts`

## API Endpoints Required
- `photos.getPublicGallery` - Get approved photos with filters
- `photos.getByCompetition` - Get photos for specific competition
- `photos.search` - Search photos by text
- `competitions.getPublic` - Get competitions for filtering

## Styling Requirements
- Responsive grid layout (CSS Grid/Flexbox)
- Smooth hover transitions
- Mobile-optimized touch interactions
- Accessible keyboard navigation
- Loading states and skeletons

## Acceptance Criteria
- [ ] Gallery displays approved photos only
- [ ] Filtering by competition/category works
- [ ] Search functionality returns relevant results
- [ ] Photo modal displays full details
- [ ] Images load progressively and efficiently
- [ ] Mobile experience is smooth
- [ ] Keyboard navigation works in modal
- [ ] Performance is good with many photos
- [ ] SEO optimization implemented
- [ ] Shareable URLs work correctly

## Dependencies
- Task 2: Photo Database Schema (for photo data)
- Task 1: R2 Storage Setup (for image serving)

## Estimated Time
**1.5 days**

## Notes
- Consider adding photo download functionality
- Implement social sharing capabilities
- Add photo reporting mechanism
- Consider watermarking for copyright protection
- Plan for future voting/rating features