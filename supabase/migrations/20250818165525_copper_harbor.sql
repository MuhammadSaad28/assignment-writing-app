/*
# Assignment Writing Website Database Schema

1. New Tables
  - `profiles` - User profiles for workers and admins
    - `id` (uuid, primary key, references auth.users)
    - `full_name` (text)
    - `phone` (text)
    - `role` (text, 'worker' or 'admin')
    - `is_approved` (boolean)
    - `payment_screenshot_url` (text)
    - `total_earnings` (numeric)
    - `created_at` (timestamp)

  - `assignments` - Assignment PDFs uploaded by admin
    - `id` (uuid, primary key)
    - `title` (text)
    - `description` (text)
    - `file_url` (text)
    - `payment_amount` (numeric)
    - `created_at` (timestamp)

  - `submissions` - Work submitted by workers
    - `id` (uuid, primary key)
    - `assignment_id` (uuid, foreign key)
    - `worker_id` (uuid, foreign key)
    - `file_url` (text)
    - `status` (text, 'pending', 'approved', 'rejected')
    - `submitted_at` (timestamp)
    - `reviewed_at` (timestamp)

  - `withdrawals` - Withdrawal requests from workers
    - `id` (uuid, primary key)
    - `worker_id` (uuid, foreign key)
    - `amount` (numeric)
    - `payment_method` (text)
    - `payment_details` (text)
    - `status` (text, 'pending', 'approved', 'rejected')
    - `requested_at` (timestamp)
    - `processed_at` (timestamp)

2. Security
  - Enable RLS on all tables
  - Add appropriate policies for workers and admins
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'admin')),
  is_approved boolean DEFAULT false,
  payment_screenshot_url text,
  total_earnings numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  payment_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_details text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assignments policies
CREATE POLICY "Approved workers can read assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

CREATE POLICY "Admins can manage assignments"
  ON assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Submissions policies
CREATE POLICY "Workers can read own submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "Workers can create submissions"
  ON submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Admins can read all submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update submissions"
  ON submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Withdrawals policies
CREATE POLICY "Workers can read own withdrawals"
  ON withdrawals
  FOR SELECT
  TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "Workers can create withdrawals"
  ON withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Admins can manage withdrawals"
  ON withdrawals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );