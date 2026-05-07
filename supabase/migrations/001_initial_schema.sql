-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  has_cigarette BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table with join code
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT '1v1' CHECK (mode IN ('1v1', '2v2', 'normal')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_players INTEGER NOT NULL DEFAULT 2,
  join_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text), 1, 6)),
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room players (junction table)
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat INTEGER NOT NULL DEFAULT 0,
  team INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Game states
CREATE TABLE IF NOT EXISTS game_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  state_json JSONB NOT NULL DEFAULT '{}',
  current_turn UUID REFERENCES auth.users(id),
  round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moves history
CREATE TABLE IF NOT EXISTS moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_played JSONB NOT NULL,
  action TEXT NOT NULL DEFAULT 'play_card',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Rooms RLS policies
CREATE POLICY "Rooms are viewable by everyone" 
  ON rooms FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" 
  ON rooms FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their room" 
  ON rooms FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Host can delete their room" 
  ON rooms FOR DELETE USING (auth.uid() = host_id);

-- Room players RLS policies
CREATE POLICY "Room players are viewable by everyone" 
  ON room_players FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" 
  ON room_players FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" 
  ON room_players FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ready status" 
  ON room_players FOR UPDATE USING (auth.uid() = user_id);

-- Game states RLS policies
CREATE POLICY "Game states are viewable by everyone" 
  ON game_states FOR SELECT USING (true);

CREATE POLICY "Host can insert game states" 
  ON game_states FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM rooms WHERE id = room_id AND host_id = auth.uid())
  );

CREATE POLICY "Host can update game states" 
  ON game_states FOR UPDATE USING (
    EXISTS (SELECT 1 FROM rooms WHERE id = room_id AND host_id = auth.uid())
  );

-- Moves RLS policies
CREATE POLICY "Moves are viewable by everyone" 
  ON moves FOR SELECT USING (true);

CREATE POLICY "Players can record moves" 
  ON moves FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboard RLS policies
CREATE POLICY "Leaderboard is viewable by everyone" 
  ON leaderboard FOR SELECT USING (true);

CREATE POLICY "System can update leaderboard" 
  ON leaderboard FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
ALTER PUBLICATION supabase_realtime ADD TABLE moves;

-- Function to auto-update leaderboard on game end
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leaderboard (user_id, score, updated_at)
  SELECT 
    (key)::UUID,
    (value)::INTEGER,
    NOW()
  FROM jsonb_each_text(NEW.state_json->'scores')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    score = leaderboard.score + EXCLUDED.score,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard when game state changes to game_over
CREATE OR REPLACE TRIGGER trigger_update_leaderboard
  AFTER UPDATE ON game_states
  FOR EACH ROW
  WHEN (NEW.state_json->>'phase' = 'game_over')
  EXECUTE FUNCTION update_leaderboard();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, wins, losses, has_cigarette)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    0,
    0,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-confirm email on signup (no verification required)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := NOW();
  NEW.confirmed_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_confirm_user ON auth.users;
CREATE TRIGGER trigger_auto_confirm_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- RPC function to increment wins
CREATE OR REPLACE FUNCTION increment_wins(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET wins = wins + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to increment losses
CREATE OR REPLACE FUNCTION increment_losses(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET losses = losses + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to get or create leaderboard entry
CREATE OR REPLACE FUNCTION upsert_leaderboard(user_id UUID, score_points INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO leaderboard (user_id, score, rank, updated_at)
  VALUES (user_id, score_points, 0, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    score = leaderboard.score + score_points,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
