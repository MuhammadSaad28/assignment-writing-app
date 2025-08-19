import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://naynzlbtqxcsabmemxsh.supabase.co'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5heW56bGJ0cXhjc2FibWVteHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MzcyOTIsImV4cCI6MjA3MTExMzI5Mn0.7MJsJBIE-f-2XrpYfCIG3hrTCXZg7lPEvcCgRqBKuW4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string
  phone: string
  role: 'worker' | 'admin'
  is_approved: boolean
  payment_screenshot_url?: string
  total_earnings: number
  created_at: string
}

export type Assignment = {
  id: string
  title: string
  description?: string
  file_url: string
  payment_amount: number
  created_at: string
}

export type Submission = {
  id: string
  assignment_id: string
  worker_id: string
  file_url: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  assignment?: Assignment
}

export type Withdrawal = {
  id: string
  worker_id: string
  amount: number
  payment_method: string
  payment_details: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  processed_at?: string
}