# 🚀 Momentum Vita - GitHub + Vercel Deployment

Complete guide to deploy **Momentum Vita: Your AI Strength Trainer** from GitHub to Vercel.

## 📋 Prerequisites

- [GitHub Desktop](https://desktop.github.com/) app installed
- [GitHub account](https://github.com) (free)
- [Vercel account](https://vercel.com) (free)
- Your project is ready in: `/Users/lukashosala/Documents/Claude AI apps/Momentum`

## 🗂️ Step 1: Create GitHub Repository

### Using GitHub Desktop:

1. **Open GitHub Desktop**
2. **Add Local Repository**:
   - Click "File" → "Add Local Repository"
   - Browse to: `/Users/lukashosala/Documents/Claude AI apps/Momentum`
   - Click "Add Repository"

3. **Publish to GitHub**:
   - Click "Publish repository" button
   - **Repository Name**: `momentum-vita`
   - **Description**: `Momentum Vita: Your AI Strength Trainer - A comprehensive fitness app with gamification`
   - ✅ Keep "Private" unchecked (make it public for easy Vercel deployment)
   - Click "Publish Repository"

4. **Initial Commit**:
   - You'll see all your changes in the left panel
   - Add commit message: `🎉 Initial commit: Momentum Vita - Your AI Strength Trainer`
   - Click "Commit to main"
   - Click "Push origin" to upload to GitHub

## 🌐 Step 2: Deploy to Vercel

### Option A: Direct Vercel Integration (Recommended)

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Import Project**:
   - Click "New Project"
   - Select your GitHub repository: `momentum-vita`
   - Click "Import"

4. **Configure Deployment**:
   - **Project Name**: `momentum-vita` (auto-filled)
   - **Framework Preset**: Should auto-detect "Vite"
   - **Root Directory**: `.` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm ci` (auto-detected)

## 🔐 Step 3: Configure Environment Variables

### In Vercel Dashboard:

1. **Go to your project** in Vercel dashboard
2. **Click "Settings" tab**
3. **Click "Environment Variables"**
4. **Add the following variables**:

```bash
# Required Environment Variables
VITE_SUPABASE_URL=https://nxrwlczrwkludybkknrk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54cndsY3pyd2tsdWR5YmrrbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwOTczODAsImV4cCI6MjA3MzY3MzM4MH0.8O_6sNy8fJpipVBo51E0YhxFHh4O7Kwvld1tH6bVPbg
```

**For each variable:**
- Name: `VITE_SUPABASE_URL` → Value: `https://nxrwlczrwkludybkknrk.supabase.co`
- Name: `VITE_SUPABASE_ANON_KEY` → Value: `[your-anon-key]`
- Environment: **Production**, **Preview**, **Development** (select all)

5. **Click "Save"** for each variable

## 🗄️ Step 4: Setup Database (Optional but Recommended)

Your app works without database, but for full features:

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard/project/nxrwlczrwkludybkknrk)**
2. **SQL Editor** → **New Query**
3. **Copy entire content** of `database-schema-simple.sql`
4. **Paste and Run**
5. ✅ **All cloud features activated instantly!**

## 🎯 Step 5: Trigger Deployment

### Automatic Deployment:
- Vercel automatically deploys on every push to `main` branch
- Any changes you commit → automatic redeployment

### Manual Deployment:
1. **In Vercel dashboard** → **Deployments** tab
2. **Click "Redeploy"** if needed

## 🔗 Step 6: Access Your Live App

After deployment completes (usually 1-2 minutes):

1. **Vercel provides a URL** like: `https://momentum-vita.vercel.app`
2. **Your app is LIVE** and accessible worldwide! 🌍
3. **Share the URL** with anyone

## 🔄 Step 7: Future Updates

### Making Changes:

1. **Edit code locally** in your project
2. **In GitHub Desktop**:
   - See changes in left panel
   - Add commit message describing changes
   - Click "Commit to main"
   - Click "Push origin"
3. **Vercel automatically redeploys** with your changes!

## ✅ Verification Checklist

After deployment, verify everything works:

- [ ] **Website loads** at your Vercel URL
- [ ] **Program selection** works (3 programs display)
- [ ] **Exercise tracking** saves progress
- [ ] **Gamification** shows XP and achievements
- [ ] **Timer popup** works in exercises
- [ ] **Mobile responsive** on phone/tablet
- [ ] **Database sync** (if setup) persists data across devices

## 🎉 Success!

Your **Momentum Vita: Your AI Strength Trainer** is now:

- ✅ **Live on the internet** via Vercel
- ✅ **Version controlled** with Git/GitHub
- ✅ **Auto-deploying** on every code change
- ✅ **Globally accessible** with HTTPS
- ✅ **Production ready** with professional hosting

**Your Live URL**: `https://momentum-vita.vercel.app`

---

**🎉 Build momentum. Unlock your vita. Train with AI precision! 💪**

*Your AI strength trainer is now live and ready for the world!*