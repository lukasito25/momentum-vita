# 🏋️ Momentum Vita: Your AI Strength Trainer

A comprehensive fitness tracking application with multiple training programs, advanced gamification, and professional-grade workout management. Built with modern React, TypeScript, and cloud synchronization.

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

### 📱 **Mobile-First Design**
- **Touch-Optimized** - Perfect for gym usage on phones
- **Responsive Layout** - Adapts beautifully to any screen size
- **Modern UI** - Clean, professional interface inspired by top fitness apps

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite (blazing fast development)
- **Database**: Supabase (PostgreSQL with real-time features)
- **Icons**: Lucide React (clean, consistent icons)
- **Authentication**: Supabase Auth (with anonymous support)
- **Deployment**: Vercel (instant deployments)

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

## 📊 Current Status

**✅ Fully Functional:**
- All workout tracking features
- Program selection and switching
- Gamification system with fallback data
- Timer and advanced tracking
- Responsive mobile design

**⚡ Enhanced with Database:**
- Real-time cloud synchronization
- Achievement unlocking with XP rewards
- Cross-device progress sharing
- Complete workout analytics

## 🔗 Live Application

🌐 **[View Live Application](http://localhost:5174)** (Development)

## 📝 License

This project is for personal use. All training programs and methodologies are proprietary.

---

**Build momentum. Unlock your vita. Train with AI precision.** 💪

*Built with ❤️ for serious fitness enthusiasts*