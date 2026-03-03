/*
  # Security Monitoring System Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text, either 'user' or 'admin')
      - `email` (text)
      - `created_at` (timestamptz)
    
    - `login_attempts`
      - `id` (uuid, primary key)
      - `attempted_username` (text) - The username that was attempted
      - `actual_user_id` (uuid, nullable) - Reference to user if identified
      - `attempt_success` (boolean) - Whether login was successful
      - `bypass_detected` (boolean) - Whether character substitution was detected
      - `bypass_details` (jsonb) - Details about bypass attempt
      - `ip_address` (text) - IP address of attacker/user
      - `user_agent` (text) - Browser/client info
      - `website_domain` (text) - Which website this attempt came from
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admin users can view all data
    - Regular users can only view their own data
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempted_username text NOT NULL,
  actual_user_id uuid REFERENCES user_profiles(id),
  attempt_success boolean DEFAULT false,
  bypass_detected boolean DEFAULT false,
  bypass_details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  website_domain text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for login_attempts
CREATE POLICY "Admins can view all login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    actual_user_id = auth.uid()
  );

CREATE POLICY "Service role can insert login attempts"
  ON login_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(actual_user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_bypass_detected ON login_attempts(bypass_detected);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);