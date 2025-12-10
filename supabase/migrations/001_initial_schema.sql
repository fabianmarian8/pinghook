-- PingHook Database Schema
-- Run this in your Supabase SQL Editor

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks table
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  endpoint_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  headers JSONB DEFAULT '{}',
  body TEXT,
  query_params JSONB,
  source_ip TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cron monitors table
CREATE TABLE public.cron_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ping_url TEXT UNIQUE NOT NULL,
  expected_interval INTEGER NOT NULL, -- in seconds
  grace_period INTEGER DEFAULT 300, -- 5 minutes default
  last_ping TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'healthy', 'late', 'down')),
  alert_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cron pings table
CREATE TABLE public.cron_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES public.cron_monitors(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_webhooks_endpoint_id ON public.webhooks(endpoint_id);
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_received_at ON public.webhook_logs(received_at DESC);
CREATE INDEX idx_cron_monitors_user_id ON public.cron_monitors(user_id);
CREATE INDEX idx_cron_monitors_ping_url ON public.cron_monitors(ping_url);
CREATE INDEX idx_cron_monitors_status ON public.cron_monitors(status);
CREATE INDEX idx_cron_pings_monitor_id ON public.cron_pings(monitor_id);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_pings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Webhooks policies
CREATE POLICY "Users can view own webhooks" ON public.webhooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create webhooks" ON public.webhooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks" ON public.webhooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks" ON public.webhooks
  FOR DELETE USING (auth.uid() = user_id);

-- Webhook logs policies (users can view logs of their webhooks)
CREATE POLICY "Users can view own webhook logs" ON public.webhook_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.webhooks
      WHERE webhooks.id = webhook_logs.webhook_id
      AND webhooks.user_id = auth.uid()
    )
  );

-- Allow service role to insert logs (from API routes)
CREATE POLICY "Service can insert webhook logs" ON public.webhook_logs
  FOR INSERT WITH CHECK (true);

-- Cron monitors policies
CREATE POLICY "Users can view own cron monitors" ON public.cron_monitors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create cron monitors" ON public.cron_monitors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cron monitors" ON public.cron_monitors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cron monitors" ON public.cron_monitors
  FOR DELETE USING (auth.uid() = user_id);

-- Cron pings policies
CREATE POLICY "Users can view own cron pings" ON public.cron_pings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cron_monitors
      WHERE cron_monitors.id = cron_pings.monitor_id
      AND cron_monitors.user_id = auth.uid()
    )
  );

-- Allow service role to insert pings (from API routes)
CREATE POLICY "Service can insert cron pings" ON public.cron_pings
  FOR INSERT WITH CHECK (true);

-- Allow service role to update cron monitor status
CREATE POLICY "Service can update cron monitor status" ON public.cron_monitors
  FOR UPDATE USING (true);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get webhook count for user (for limits)
CREATE OR REPLACE FUNCTION public.get_user_webhook_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.webhooks WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get cron monitor count for user (for limits)
CREATE OR REPLACE FUNCTION public.get_user_cron_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.cron_monitors WHERE user_id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable realtime for webhook_logs (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cron_pings;
