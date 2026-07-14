-- CRF League Supabase Setup Script
-- Run this in your Supabase SQL Editor (Database > SQL Editor > New Query)

-- ============================================================
-- 1. ENABLE REALTIME (for live updates)
-- ============================================================

-- Enable the Realtime extension
begin;
  -- Create a publication for realtime if it doesn't exist
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- Add tables to the publication
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table clubs;
alter publication supabase_realtime add table transfer_listings;

-- ============================================================
-- 2. CREATE TABLES
-- ============================================================

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table (Master Sheet)
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roblox_username TEXT NOT NULL,
  roblox_user_id TEXT NOT NULL,
  roblox_avatar_url TEXT,
  club TEXT REFERENCES clubs(name) ON DELETE SET NULL,
  position TEXT NOT NULL CHECK (position IN ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF')),
  goals INTEGER DEFAULT 0 CHECK (goals >= 0),
  assists INTEGER DEFAULT 0 CHECK (assists >= 0),
  tackles INTEGER DEFAULT 0 CHECK (tackles >= 0),
  saves INTEGER DEFAULT 0 CHECK (saves >= 0),
  yellow_cards INTEGER DEFAULT 0 CHECK (yellow_cards >= 0),
  red_cards INTEGER DEFAULT 0 CHECK (red_cards >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transfer Listings table
CREATE TABLE IF NOT EXISTS transfer_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  asking_price NUMERIC DEFAULT 0 CHECK (asking_price >= 0),
  current_club TEXT,
  position TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table (to track admin users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 3. CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_players_club ON players(club);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(roblox_username);
CREATE INDEX IF NOT EXISTS idx_transfer_player ON transfer_listings(player_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Players policies
-- Anyone can read players
CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT USING (true);

-- Only admins can insert/update/delete players
CREATE POLICY "Players insertable by admins" ON players
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Players updatable by admins" ON players
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Players deletable by admins" ON players
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Clubs policies
CREATE POLICY "Clubs are viewable by everyone" ON clubs
  FOR SELECT USING (true);

CREATE POLICY "Clubs insertable by admins" ON clubs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Clubs deletable by admins" ON clubs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Transfer listings policies
CREATE POLICY "Transfers are viewable by everyone" ON transfer_listings
  FOR SELECT USING (true);

CREATE POLICY "Transfers insertable by admins" ON transfer_listings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Transfers deletable by admins" ON transfer_listings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Admins policies
CREATE POLICY "Admins viewable by authenticated users" ON admins
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to make a user an admin (run manually after they sign up)
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  INSERT INTO admins (user_id, email)
  VALUES (target_user_id, user_email)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. SAMPLE DATA (Optional - remove if you don't want defaults)
-- ============================================================

-- Insert sample clubs
INSERT INTO clubs (name) VALUES
  ('Manchester Red'),
  ('London Blues'),
  ('Merseyside Reds'),
  ('North London Whites')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SETUP INSTRUCTIONS (Read this!)
-- ============================================================
--
-- After running this script:
--
-- 1. Go to Authentication > Settings in Supabase
-- 2. Enable Email provider (disable "Confirm email" if you want instant access)
-- 3. Sign up via the website's "Admin Login" modal
-- 4. Go back to SQL Editor and run:
--    SELECT make_admin('your-email@example.com');
-- 5. Refresh the website - you now have admin access!
--
-- ============================================================
