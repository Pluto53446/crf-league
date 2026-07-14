# CRF League Management System

A professional football league management website for Roblox football leagues. Built with React, Vite, and Supabase.

## Features

- **Master Sheet** — Central player database with auto Roblox avatar/username fetch
- **Club Rosters** — Unlimited clubs with 21-player caps
- **Leaderboards** — Auto-updating top scorers, assists, tackles, saves, cards
- **Transfer Listings** — List players with asking prices and descriptions
- **Admin Panel** — Full management dashboard for league staff
- **Real-time Sync** — All data updates live across all users
- **Dark Football Theme** — Professional dark UI optimized for all devices

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Lucide Icons
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **APIs:** Roblox User API (auto avatar/username fetch)
- **Hosting:** Vercel

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon public API key** from Project Settings > API

### 2. Run the Database Setup

1. In Supabase, go to **SQL Editor** > **New query**
2. Open `supabase/setup.sql` from this repo
3. Copy the entire file contents and paste into the SQL Editor
4. Click **Run**

This creates all tables, indexes, RLS policies, and sample data.

### 3. Set Up Environment Variables

Create a `.env` file in the root of your project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual Supabase URL and anon key.

### 4. Install & Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 5. Make Yourself an Admin

1. Click **"Admin Login"** in the top right
2. Sign up with your email and password
3. Go back to Supabase **SQL Editor**
4. Run:

```sql
SELECT make_admin('your-email@example.com');
```

5. Refresh the website — you now have full admin access!

### 6. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add the same environment variables in Vercel dashboard (Settings > Environment Variables)
4. Deploy!

## Project Structure

```
crf-league/
├── index.html              # Entry HTML
├── package.json            # Dependencies
├── vite.config.js          # Vite config
├── vercel.json             # Vercel routing
├── .env                    # Environment variables (not committed)
├── src/
│   ├── main.jsx            # React entry
│   ├── App.jsx             # Main app with routing
│   ├── components/
│   │   ├── MasterSheet.jsx      # Player database
│   │   ├── ClubRosters.jsx      # Club management
│   │   ├── Leaderboards.jsx     # Auto leaderboards
│   │   ├── TransferListings.jsx # Transfer market
│   │   ├── AdminPanel.jsx       # Admin dashboard
│   │   └── LoginModal.jsx       # Auth modal
│   ├── hooks/
│   │   ├── useSupabase.js       # Supabase client
│   │   └── useAuth.js           # Auth state
│   └── styles/
│       └── index.css            # Global styles
└── supabase/
    └── setup.sql                # Database setup
```

## Roblox Integration

When adding a player, just type their **Roblox username**. The app automatically:

1. Fetches their **User ID** from `users.roblox.com`
2. Fetches their **avatar headshot** from `thumbnails.roblox.com`
3. Stores everything in the database

No manual ID or avatar URL entry needed.

## Admin Features

Once logged in as admin, you can:

- Add/edit/delete players
- Create unlimited clubs
- Manage transfer listings
- View all stats in the admin dashboard
- Everything syncs in real-time for all users

## License

MIT — free to use for your Roblox football league.
