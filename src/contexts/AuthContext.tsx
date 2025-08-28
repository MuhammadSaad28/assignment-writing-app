import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore'
import { auth, db, Profile } from '../lib/firebase'

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        await fetchProfile(user.uid)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const profileDoc = doc(db, 'profiles', userId)
      const profileSnapshot = await getDoc(profileDoc)
      
      if (profileSnapshot.exists()) {
        const profileData = profileSnapshot.data() as Profile
        setProfile({ ...profileData, id: userId })
      } else {
        console.log('No profile found for user:', userId)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create profile document
      const profileData: Omit<Profile, 'id'> = {
        full_name: userData.fullName,
        phone: userData.phone,
        email: email,
        role: 'worker',
        is_approved: false,
        payment_screenshot_url: userData.paymentScreenshot || null,
        total_earnings: 0,
        created_at: new Date().toISOString(),
        father_name: userData.fatherName,
        city: userData.city,
        qualification: userData.qualification,
        job: userData.job
      }

      await setDoc(doc(db, 'profiles', user.uid), profileData)

      // Set profile in state
      setProfile({ ...profileData, id: user.uid })

      return userCredential
    } catch (error) {
      console.error('Error in signUp:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential
    } catch (error) {
      console.error('Error in signIn:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user')

    try {
      const profileRef = doc(db, 'profiles', user.uid)
      await updateDoc(profileRef, updates)
      
      if (profile) {
        setProfile({ ...profile, ...updates })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
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