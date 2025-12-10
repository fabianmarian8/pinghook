-- Migration: Add Pro/Team features columns
-- Run this in Supabase SQL Editor

-- Add alert_email and slack_webhook_url to webhooks table
ALTER TABLE webhooks
ADD COLUMN IF NOT EXISTS alert_email TEXT,
ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT;

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, member_id)
);

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY "Users can view their own team members"
  ON team_members FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = member_id);

CREATE POLICY "Users can manage their own team members"
  ON team_members FOR ALL
  USING (auth.uid() = owner_id);

-- RLS policies for team_invitations
CREATE POLICY "Users can view their own invitations"
  ON team_invitations FOR SELECT
  USING (auth.uid() = owner_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their own invitations"
  ON team_invitations FOR ALL
  USING (auth.uid() = owner_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_owner ON team_invitations(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_webhooks_alert_email ON webhooks(alert_email) WHERE alert_email IS NOT NULL;
