-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brightness INTEGER DEFAULT 100 CHECK (brightness >= 0 AND brightness <= 100),
  warning_time INTEGER DEFAULT 300 CHECK (warning_time > 0),
  shutoff_time INTEGER DEFAULT 600 CHECK (shutoff_time > warning_time),
  notifications_enabled BOOLEAN DEFAULT true,
  esp32_device_id TEXT,
  esp32_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Water events table
CREATE TABLE water_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stopped_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT CHECK (status IN ('running', 'stopped', 'auto_stopped')) NOT NULL,
  warning_sent BOOLEAN DEFAULT false,
  auto_shutoff BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESP32 devices table
CREATE TABLE esp32_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT UNIQUE NOT NULL,
  device_secret TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active sessions table (for real-time monitoring)
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  water_event_id UUID REFERENCES water_events(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE esp32_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for water_events
CREATE POLICY "Users can view own events"
  ON water_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON water_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON water_events FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for esp32_devices
CREATE POLICY "Users can view own devices"
  ON esp32_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON esp32_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for active_sessions
CREATE POLICY "Users can view own sessions"
  ON active_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON active_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_water_events_user_id ON water_events(user_id);
CREATE INDEX idx_water_events_created_at ON water_events(created_at DESC);
CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();