import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Type definitions
export type Profile = {
  id: string
  full_name: string
  phone: string
  role: 'worker' | 'admin'
  is_approved: boolean
  payment_screenshot_url?: string
  total_earnings: number
  created_at: string
  email: string
  father_name?: string
  city?: string
  qualification?: string
  job?: string
}

export type Assignment = {
  id: string
  title: string
  description?: string
  file_url: string
  payment_amount: number
  created_at: string
  status: 'active' | 'inactive'
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

export type Registration = {
  id: string
  name: string
  fatherName: string
  email: string
  whatsapp: string
  city: string
  qualification: string
  job: string
  screenshot: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
