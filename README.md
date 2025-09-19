# 🏋️ Momentum Vita: Your AI Strength Trainer

A comprehensive fitness tracking application with multiple training programs, advanced gamification, and professional-grade workout management. Built with modern React 18, TypeScript, and real-time cloud synchronization.

**🌐 Live Application**: [momentum-vita.vercel.app](https://momentum-vita.vercel.app)

## ✨ Key Features

### 🎯 **Multiple Training Programs**
- **Foundation Builder** (12 weeks) - Beginner-friendly form and strength building
- **Power Surge Pro** (16 weeks) - Intermediate explosive power training
- **Beast Mode Elite** (20 weeks) - Advanced competition-prep training
- **Smart Program Switching** - Seamlessly transition between programs

### 🎮 **Advanced Gamification System**
- **XP & Leveling** - Earn experience points for workouts and nutrition
- **13 Achievements** - Unlock badges from "First Steps" to "Fitness Legend"
- **Streak Tracking** - Visual fire indicators for daily consistency
- **Weekly Analytics** - Detailed progress and consistency metrics

### 🔥 **Professional Workout Tracking**
- **Set-by-Set Tracking** - Individual set completion with weights/reps
- **Smart Timer System** - Popup timer windows with audio notifications
- **Auto-Save Everything** - Instant cloud sync on every interaction
- **Weight Progression** - Automatic weight suggestions based on history

### ☁️ **Cloud Synchronization**
- **Cross-Device Sync** - Start on phone, continue on tablet/PC
- **Real-Time Updates** - Progress syncs instantly across all devices
- **Cloud Backup** - Never lose your workout data
- **Anonymous Support** - Works immediately without account creation

### 📱 **Progressive Web App (PWA)**
- **Install on Home Screen** - Add to iOS/Android home screen like a native app
- **iOS Safe Area Support** - Proper navigation in iOS standalone mode
- **Custom App Icon** - Professional fitness-themed logo with barbell and lightning bolt
- **Offline Functionality** - Full workout tracking without internet connection
- **Push Notifications Ready** - Infrastructure for workout reminders (future feature)
- **Touch-Optimized** - Perfect for gym usage on phones and tablets
- **Responsive Layout** - Adapts beautifully to any screen size (320px to 4K)
- **Modern UI** - Clean, professional interface inspired by top fitness apps

## 🚀 Tech Stack

- **Frontend**: React 18 (Concurrent Features, StrictMode), TypeScript 5.0+
- **Build Tool**: Vite 4 (ESM, fast HMR, optimized production builds)
- **Styling**: Tailwind CSS 3.3+ (mobile-first responsive design)
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Icons**: Lucide React (optimized SVG icons)
- **Authentication**: Supabase Auth (anonymous/social login support)
- **PWA**: Service Worker, Web App Manifest, installable app experience
- **Icon Generation**: Node.js Canvas for dynamic PNG icon creation
- **Deployment**: Vercel (Edge functions, automatic deployments)
- **State Management**: React 18 hooks (useState, useReducer, useContext)
- **Error Handling**: Comprehensive fallback strategies with offline support

## 🏃‍♂️ Quick Start

### Development Setup
```bash
# Clone and install
git clone [repository-url]
cd momentum-vita
npm install

# Start development server
npm run dev
# App opens at http://localhost:5174

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Configuration
Create a `.env` file in the root directory:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key
```

## 🗄️ Database Setup

### Option 1: Quick Setup (Recommended)
1. Create a [Supabase account](https://supabase.com)
2. Create a new project
3. Go to SQL Editor → New Query
4. Copy and paste the entire content of `database-schema-simple.sql`
5. Click "Run" to execute
6. Add your credentials to `.env`
7. ✅ **Instant activation** - all features work immediately!

### Option 2: Full Setup
- Use `database-schema-lukasito.sql` for complete feature set
- Same process, includes enhanced tracking and analytics

## 🎯 Training Programs

### 📚 Foundation Builder (FREE)
- **Duration**: 12 weeks
- **Level**: Beginner
- **Focus**: Proper form, movement patterns, base strength
- **Phases**: Foundation → Growth → Intensity
- **Schedule**: 3x/week (Mon/Wed/Fri)

### ⚡ Power Surge Pro (PREMIUM)
- **Duration**: 16 weeks
- **Level**: Intermediate
- **Focus**: Explosive power, strength gains
- **Phases**: Power Build → Strength Surge → Power Peak → Elite Conditioning
- **Advanced Techniques**: Plyometrics, Olympic lifts

### 🦁 Beast Mode Elite (PREMIUM)
- **Duration**: 20 weeks
- **Level**: Advanced
- **Focus**: Elite performance, competition prep
- **Phases**: Beast Foundation → Power Dominance → Strength Supremacy → Hypertrophy Warfare → Elite Mastery
- **Maximum Intensity**: Powerlifting methodology, peak performance

## 🏆 Achievement System

**Workout Achievements:**
- First Steps (50 XP) → Workout Warrior (150 XP) → Strength Master (500 XP) → Fitness Legend (1000 XP)

**Streak Achievements:**
- Streak Starter (3 days) → Streak Warrior (7 days) → Streak Master (30 days)

**Program Completion:**
- Foundation Graduate (500 XP) → Power Surge Master (750 XP) → Beast Mode Champion

**Nutrition & Consistency:**
- Nutrition goals, weekly consistency targets, and special challenges

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Development server with hot reload
npm run build        # Production build with TypeScript checking
npm run preview      # Preview production build locally
npm run lint         # ESLint code quality checks
```

### Project Structure
```
src/
├── components/           # React components
│   ├── ProgramSelection.tsx    # Program selection interface
│   ├── TimerPopup.tsx         # Workout timer popup
│   ├── AchievementBadges.tsx  # Gamification displays
│   └── ...
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and services
│   ├── supabase.ts     # Database service layer
│   └── ...
├── types/              # TypeScript type definitions
└── TrainingProgram.tsx # Main application component
```

### Key Services
- **DatabaseService** (`src/lib/supabase.ts`) - Complete database operations
- **Gamification Hooks** (`src/hooks/useGamification.ts`) - XP and achievement logic
- **Enhanced Tracking** (`src/hooks/useEnhancedWorkoutTracking.ts`) - Advanced workout features

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 📊 Current Status & Recent Improvements

### ✅ **Production Ready Features:**
- ✅ **Vercel Deployment** - Successfully deployed at [momentum-vita.vercel.app](https://momentum-vita.vercel.app)
- ✅ **Mobile Optimization** - Comprehensive responsive design for all screen sizes
- ✅ **Program Switching** - Fixed "Failed to switch program" errors with proper fallback handling
- ✅ **Error Handling** - Robust database fallback and offline mode support
- ✅ **Build System** - Optimized dependencies and simplified Vercel configuration
- ✅ **Workout Tracking** - Complete set-by-set tracking with auto-save
- ✅ **Gamification** - XP system, achievements, and streak tracking
- ✅ **Timer System** - Advanced workout timers with audio notifications

### 🚀 **Recent Major Improvements (2025):**
1. **Progressive Web App Implementation** - Full PWA functionality with home screen installation
   - Service Worker: Advanced caching, offline support, background sync
   - Web App Manifest: Complete app metadata, shortcuts, screenshots
   - Install Prompts: Smart platform detection with guided installation
   - iOS Compatibility: Proper PNG icons and apple-touch-icon declarations

2. **iOS Mobile App Mode** - Native-like experience on iOS devices
   - Safe Area Support: CSS env() variables for iOS notch/status bar
   - Proper Navigation: Back button and headers work correctly in standalone mode
   - Touch Targets: 44px minimum touch areas for iOS accessibility guidelines
   - Status Bar Integration: No overlay issues, proper content positioning

3. **Professional App Icon** - Custom fitness-themed logo
   - Complete Icon Set: 9 PNG sizes (72x72 to 512x512) generated with Node.js Canvas
   - Fitness Branding: Blue gradient background with orange barbell, lightning bolt, and "M" logo
   - Cross-Platform: Works on iOS home screen, Android launcher, desktop bookmarks
   - Fallback Support: SVG icon for modern browsers, PNG for mobile OS

4. **Mobile Interface** - Complete mobile layout overhaul for workout interface
   - Weight controls: Centered layout with larger touch targets (12x12 buttons)
   - Action buttons: Vertical stacking on mobile, horizontal on desktop
   - Touch optimization: Added `touch-manipulation` for better mobile interactions
   - Responsive breakpoints: Proper layouts for mobile (320px), tablet (768px), desktop (1024px+)

5. **Deployment & Performance** - Production-ready optimizations
   - Resolved MIME type issues and build dependencies for Vercel
   - Enhanced fallback strategies for offline usage
   - Moved build tools to production dependencies for faster builds
   - Improved program switching with better error messages

### ⚡ **Cloud Features (when connected):**
- Real-time progress synchronization across devices
- Achievement unlocking with XP rewards
- Cross-device workout history sharing
- Advanced analytics and progress tracking

## 📱 PWA Installation Guide

### Install on iOS (iPhone/iPad):
1. Open [momentum-vita.vercel.app](https://momentum-vita.vercel.app) in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired, then tap "Add"
5. The app icon will appear on your home screen with the custom Momentum Vita logo

### Install on Android:
1. Open [momentum-vita.vercel.app](https://momentum-vita.vercel.app) in Chrome
2. Tap the three-dot menu and select "Add to Home screen"
3. Or look for the automatic install banner and tap "Add"
4. The app will install with the custom fitness icon

### Install on Desktop:
1. Open [momentum-vita.vercel.app](https://momentum-vita.vercel.app) in Chrome/Edge
2. Click the install icon in the address bar (or use the Install button in the app)
3. Click "Install" in the dialog
4. The app will open in a dedicated window

## 🌐 Live Application

🌍 **Production**: [momentum-vita.vercel.app](https://momentum-vita.vercel.app)
📱 **PWA Installation**: Follow the guide above to install as a native app
💻 **Development**: [localhost:5174](http://localhost:5174) (when running locally)

## 📝 License

This project is for personal use. All training programs and methodologies are proprietary.

---

**Build momentum. Unlock your vita. Train with AI precision.** 💪

*Built with ❤️ for serious fitness enthusiasts*