# 📚 Momentum Vita - Technical Documentation

## 🏗️ Architecture Overview

Momentum Vita is a modern, mobile-first fitness tracking application built with React 18 and TypeScript, designed for optimal performance across all device types.

### 🔧 Core Technology Stack

**Frontend Framework**
- **React 18.2.0**: Utilizing concurrent features, StrictMode, and modern hooks
- **TypeScript 5.0+**: Full type safety with strict configuration
- **Vite 4.4.5**: Lightning-fast development server and optimized production builds

**Styling & UI**
- **Tailwind CSS 3.3+**: Mobile-first responsive design with custom utilities
- **Lucide React 0.263+**: Optimized SVG icon library
- **CSS Grid & Flexbox**: Advanced responsive layouts

**Backend & Database**
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Database Service Layer**: Complete abstraction with fallback strategies
- **Local Storage**: Offline-first approach with automatic synchronization

**Deployment & Build**
- **Vercel**: Edge functions, automatic deployments, and global CDN
- **ESM Modules**: Modern JavaScript module system
- **Production Dependencies**: Optimized for Vercel build environment

## 📱 Mobile-First Architecture

### Responsive Design Strategy

```
Breakpoint Strategy:
- Mobile:  320px - 639px  (flex-col, full-width buttons)
- Tablet:  640px - 1023px (sm: 2-column grids, side-by-side)
- Desktop: 1024px+        (lg: multi-column layouts)
```

**Touch Optimization**
- Minimum touch targets: 44px × 44px (iOS/Android standards)
- `touch-manipulation` CSS for optimal mobile performance
- Active states with `active:scale-95` for tactile feedback
- Proper focus management for accessibility

**Layout Patterns**
```typescript
// Mobile-first responsive pattern
<div className="flex flex-col sm:flex-row gap-3">
  <button className="flex-1 sm:flex-none"> // Full width on mobile

// Grid responsiveness
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

## 🔄 State Management

### React 18 Hooks Architecture

**Primary State Patterns**
```typescript
// Component State
const [currentProgramId, setCurrentProgramId] = useState<string>('foundation-builder');
const [currentWeek, setCurrentWeek] = useState<number>(1);
const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

// Derived State
const currentPhase = useMemo(() => getPhase(currentWeek), [currentWeek]);
const exercisesCompleted = useMemo(() =>
  dayExercises.filter(ex => completedExercises[exerciseKey]).length,
  [dayExercises, completedExercises]
);
```

**Error Boundary Pattern**
```typescript
// Graceful degradation with fallback
try {
  await DatabaseService.switchProgram(programId);
} catch (dbError) {
  console.warn('Database unavailable, using local state only:', dbError);
  // Continue with local state
}
```

## 🗄️ Database Architecture

### Supabase Integration

**Service Layer Design**
```typescript
class DatabaseService {
  static async switchProgram(newProgramId: string): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress()
    if (!currentProgress) {
      throw new Error('No user progress found')
    }
    // Update and return new progress
  }
}
```

**Fallback Strategy**
1. **Primary**: Supabase cloud database
2. **Secondary**: Local storage with same data structure
3. **Tertiary**: In-memory state with default values

**Data Persistence**
```typescript
// Automatic local backup
const saveWithFallback = async (data: any) => {
  try {
    await DatabaseService.save(data);
  } catch (error) {
    localStorage.setItem('backup_data', JSON.stringify(data));
  }
};
```

## 🎮 Component Architecture

### Core Components Structure

```
src/
├── TrainingProgram.tsx          # Main application logic
├── components/
│   ├── ProgramSelection.tsx     # Program selection interface
│   ├── WorkoutModeToggle.tsx    # Standard/Enhanced mode switching
│   ├── TimerPopup.tsx          # Workout timer with popup window
│   ├── AchievementBadges.tsx   # Gamification displays
│   ├── StreakTracker.tsx       # Daily streak visualization
│   ├── UserLevelDisplay.tsx    # XP and level progression
│   └── ...
├── hooks/
│   ├── useGamification.ts      # XP and achievement logic
│   ├── useEnhancedWorkoutTracking.ts # Advanced workout features
│   └── ...
├── lib/
│   ├── supabase.ts            # Database service layer
│   ├── imageService.ts        # Image optimization
│   └── ...
└── types/
    ├── SetTracking.ts         # Workout tracking types
    └── ...
```

### Mobile-Optimized Component Patterns

**Weight Control Component**
```typescript
// Mobile-optimized layout with touch targets
<div className="flex items-center justify-center gap-3">
  <button className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600
                     rounded-xl touch-manipulation active:scale-95">
    <Minus className="w-6 h-6" />
  </button>
  <span className="w-24 text-center font-mono text-xl font-bold">
    {weight}kg
  </span>
  <button className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600
                     rounded-xl touch-manipulation active:scale-95">
    <Plus className="w-6 h-6" />
  </button>
</div>
```

**Responsive Action Buttons**
```typescript
// Vertical stack on mobile, horizontal on desktop
<div className="flex flex-col sm:flex-row gap-3">
  <button className="flex-1 sm:flex-none flex items-center justify-center
                     gap-2 px-4 py-3 bg-gradient-to-r from-purple-500
                     to-purple-600 text-white font-semibold rounded-xl">
    <Timer className="w-5 h-5" />
    Timer
  </button>
  // Additional buttons...
</div>
```

## 🔧 Build & Deployment

### Optimized Build Configuration

**Package.json Dependencies**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5",
    "typescript": "^5.0.2",
    "tailwindcss": "^3.3.0"
    // Build tools in production for Vercel compatibility
  },
  "scripts": {
    "build": "npx vite build"  // Using npx for reliable builds
  }
}
```

**Vercel Configuration**
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NODE_VERSION": "18"
    }
  }
}
```

### Build Optimizations

1. **Dependencies**: Moved build tools to `dependencies` for Vercel compatibility
2. **Routing**: Simplified Vercel configuration for SPA routing
3. **TypeScript**: Using Vite's built-in TypeScript compilation
4. **Assets**: Optimized static asset serving with proper MIME types

## 🧪 Quality Assurance Strategy

### Testing Approach

**1. Mobile Responsiveness Testing**
- Viewport testing: 320px (mobile) → 768px (tablet) → 1024px+ (desktop)
- Touch interaction validation
- Performance on mobile networks
- Orientation testing (portrait/landscape)

**2. Core Functionality Testing**
- Program selection and switching
- Exercise tracking and weight progression
- Timer functionality and popup management
- Nutrition goal tracking
- XP and achievement system

**3. Error Handling Testing**
- Database unavailable scenarios
- Network interruption recovery
- Invalid state handling
- Graceful degradation verification

**4. Performance Testing**
- Initial load times (target: <3 seconds)
- Bundle size optimization
- Memory usage monitoring
- Core Web Vitals compliance

### Error Handling Patterns

**Database Fallback Pattern**
```typescript
const handleProgramSelect = async (programId: string) => {
  try {
    setCurrentProgramId(programId);
    setCurrentWeek(1);

    try {
      await DatabaseService.switchProgram(programId);
      await DatabaseService.savePreferences(preferences);
    } catch (dbError) {
      console.warn('Database unavailable, using local state only:', dbError);
      // Continue with local state - no user-facing error
    }

    setShowProgramSelection(false);
  } catch (error) {
    console.error('Error selecting program:', error);
    alert('Failed to switch program. Please try again.');
  }
};
```

## 🚀 Performance Optimizations

### Bundle Optimization
- **Tree Shaking**: Unused code elimination with ES modules
- **Code Splitting**: Dynamic imports for non-critical features
- **Asset Optimization**: Compressed images and optimized SVGs

### Runtime Performance
- **React 18 Features**: Concurrent rendering for smooth UX
- **Memoization**: Strategic use of `useMemo` and `useCallback`
- **Virtual DOM**: Efficient re-rendering with key props

### Mobile Performance
- **Touch Optimization**: `touch-manipulation` CSS property
- **Reduced JavaScript**: Minimal runtime overhead
- **Efficient Animations**: CSS transforms over layout changes

## 🔒 Security Considerations

### Data Protection
- **Environment Variables**: Sensitive data in server environment only
- **Client-Side Security**: No sensitive operations in browser
- **External Links**: Proper `rel="noopener noreferrer"` attributes

### Error Handling Security
- **No Data Exposure**: Error messages don't reveal system details
- **Graceful Degradation**: App remains functional during failures
- **Input Validation**: Client-side validation with server verification

## 📈 Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Bundle Analysis**: Regular dependency and size audits
- **Error Tracking**: Comprehensive error logging with context

### User Experience Metrics
- **Load Times**: Page load and interaction response times
- **Mobile Performance**: Touch response and layout stability
- **Feature Usage**: Component interaction patterns

---

*This documentation reflects the current state of Momentum Vita as of 2025, including all recent mobile optimizations and deployment improvements.*