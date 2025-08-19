import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle() // Use maybeSingle() to handle 0 results gracefully

    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    if (!data) {
      console.log('No profile found for user:', userId)
      // Profile doesn't exist, this shouldn't happen with the trigger
      // but let's handle it gracefully
      throw new Error('Profile not found. Please contact support.')
    }

    console.log('Profile loaded:', data)
    setProfile(data)
  } catch (error) {
    console.error('Error fetching profile:', error)
    setProfile(null)
  } finally {
    setLoading(false)
  }
}

  const signUp = async (email: string, password: string, userData: any) => {
  // Pass user data as metadata so the database trigger can use it
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.fullName,
        phone: userData.phone,
        payment_screenshot_url: userData.paymentScreenshot || null, // Use null for now, dummy later if needed
      }
    }
  })

  if (error) throw error

  // DON'T manually insert into profiles - the database trigger handles it automatically!
  // Remove this block:
  /*
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{...}])
    if (profileError) throw profileError
  }
  */

  return data
}

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error
    
    if (profile) {
      setProfile({ ...profile, ...updates })
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}