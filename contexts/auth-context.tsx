"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>
  signIn: (email: string, password: string, persistSession?: boolean) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
}

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  business_name?: string
  phone_number?: string
  created_at: string
  updated_at: string
}

interface SignUpData {
  firstName: string
  lastName: string
  businessName?: string
  phoneNumber?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cache key for localStorage
const AUTH_CACHE_KEY = 'sellio-auth-cache'

// Cache interface
interface AuthCache {
  user: User | null
  userProfile: UserProfile | null
  timestamp: number
}

// Helper function to get cached auth data
const getCachedAuth = (): AuthCache | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY)
    if (!cached) return null
    
    const data: AuthCache = JSON.parse(cached)
    const now = Date.now()
    const cacheAge = now - data.timestamp
    
    // Cache is valid for 5 minutes
    if (cacheAge < 5 * 60 * 1000) {
      return data
    }
    
    // Clear expired cache
    localStorage.removeItem(AUTH_CACHE_KEY)
    return null
  } catch (error) {
    console.warn('Failed to parse cached auth data:', error)
    localStorage.removeItem(AUTH_CACHE_KEY)
    return null
  }
}

// Helper function to set cached auth data
const setCachedAuth = (user: User | null, userProfile: UserProfile | null) => {
  if (typeof window === 'undefined') return
  
  try {
    const cache: AuthCache = {
      user,
      userProfile,
      timestamp: Date.now()
    }
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn('Failed to cache auth data:', error)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  
  // Refs to prevent unnecessary re-renders
  const sessionRestoreAttempted = useRef(false)
  const profileFetchInProgress = useRef(false)

  // Memoized fetchUserProfile function
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (profileFetchInProgress.current) {
      console.log('[AuthContext] fetchUserProfile: Already in progress, skipping')
      return
    }

    profileFetchInProgress.current = true
    
    try {
      console.log('[AuthContext] fetchUserProfile: Fetching profile for user:', userId)
      
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error('[AuthContext] fetchUserProfile: Error fetching profile:', error)
        
        if (error.code === "PGRST116") {
          // Profile doesn't exist, try to create it
          console.log('[AuthContext] fetchUserProfile: Profile not found, creating...')
          
          try {
            const response = await fetch('/api/fix-user-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            
            if (response.ok) {
              const result = await response.json()
              if (result.success && result.profile) {
                setUserProfile(result.profile)
                setCachedAuth(user, result.profile)
                return
              }
            }
          } catch (apiError) {
            console.warn('[AuthContext] fetchUserProfile: API creation failed:', apiError)
          }
          
          // Fallback to direct insert
          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .insert([{ id: userId }])
            .select()
            .single()

          if (createError) {
            console.error('[AuthContext] fetchUserProfile: Failed to create profile:', createError)
            setUserProfile(null)
          } else {
            setUserProfile(newProfile)
            setCachedAuth(user, newProfile)
          }
        } else {
          setUserProfile(null)
        }
      } else {
        console.log('[AuthContext] fetchUserProfile: Profile fetched successfully')
        setUserProfile(data)
        setCachedAuth(user, data)
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserProfile: Exception:', error)
      setUserProfile(null)
    } finally {
      profileFetchInProgress.current = false
    }
  }, [user])

  // Initialize auth state from cache first, then from session
  const initializeAuth = useCallback(async () => {
    if (sessionRestoreAttempted.current) return
    
    sessionRestoreAttempted.current = true
    console.log('[AuthContext] initializeAuth: Starting initialization')

    // First, try to restore from cache for instant loading
    const cached = getCachedAuth()
    if (cached && cached.user) {
      console.log('[AuthContext] initializeAuth: Restoring from cache')
      setUser(cached.user)
      setUserProfile(cached.userProfile)
      // Don't set loading to false here - wait for session verification
    }

    // Then, verify with actual session
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('[AuthContext] initializeAuth: Session error:', error)
        setUser(null)
        setUserProfile(null)
        setCachedAuth(null, null)
        setLoading(false)
        setIsInitialized(true)
        return
      }

      if (session?.user) {
        console.log('[AuthContext] initializeAuth: Session found, updating state')
        setUser(session.user)
        
        // Only fetch profile if we don't have it cached or if user changed
        if (!cached?.userProfile || cached.user?.id !== session.user.id) {
          await fetchUserProfile(session.user.id)
        } else {
          // If we have cached profile and user hasn't changed, use cached data
          setUserProfile(cached.userProfile)
        }
      } else {
        console.log('[AuthContext] initializeAuth: No session found')
        setUser(null)
        setUserProfile(null)
        setCachedAuth(null, null)
      }
    } catch (error) {
      console.error('[AuthContext] initializeAuth: Exception:', error)
      setUser(null)
      setUserProfile(null)
      setCachedAuth(null, null)
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }, [fetchUserProfile])

  // Initialize on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange:', event, session?.user?.id)
      
      // Don't process auth changes during initial load
      if (!isInitialized) {
        console.log('[AuthContext] onAuthStateChange: Skipping during initialization')
        return
      }
      
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            setUser(session.user)
            await fetchUserProfile(session.user.id)
          }
          break
        case 'SIGNED_OUT':
          setUser(null)
          setUserProfile(null)
          setCachedAuth(null, null)
          break
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user)
            await fetchUserProfile(session.user.id)
          }
          break
        default:
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          } else {
            setUserProfile(null)
            setCachedAuth(null, null)
          }
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile, isInitialized])

  const signUp = useCallback(async (email: string, password: string, userData: SignUpData) => {
    try {
      console.log("Starting signup process for:", email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            business_name: userData.businessName,
            phone_number: userData.phoneNumber,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        console.log("User created successfully:", data.user.id)
      }
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }, [])

  const createUserProfile = useCallback(async (user: User, userData: SignUpData) => {
    try {
      console.log("Attempting to create/update profile for user:", user.id)

      const { data: existingProfile, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error checking for existing profile:", fetchError)
        throw fetchError
      }

      if (existingProfile) {
        console.log("Profile already exists, updating instead of inserting.")
        const { error: updateError } = await supabase
          .from("users")
          .update({
            first_name: userData.firstName,
            last_name: userData.lastName,
            business_name: userData.businessName,
            phone_number: userData.phoneNumber,
            email: user.email!,
          })
          .eq("id", user.id)

        if (updateError) {
          console.error("Error updating user profile:", updateError)
          throw updateError
        }
      } else {
        console.log("Profile does not exist, inserting new profile.")
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email!,
          first_name: userData.firstName,
          last_name: userData.lastName,
          business_name: userData.businessName,
          phone_number: userData.phoneNumber,
        })

        if (insertError) {
          console.error("Error inserting user profile:", insertError)
          throw insertError
        }
      }

      console.log("User profile created/updated successfully")
    } catch (error) {
      console.error("Error creating/updating user profile:", error)
      throw error
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string, persistSession: boolean = true) => {
    try {
      console.log("Signing in user:", email, "persistSession:", persistSession)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      console.log("Sign in successful")
      
      if (data.user) {
        const { data: existingProfile } = await supabase.from("users").select("id").eq("id", data.user.id).single()
        if (!existingProfile) {
          console.log("No profile found in public.users, creating basic profile after sign-in.")
          await createUserProfile(data.user, {
            firstName: data.user.email?.split("@")[0] || "User",
            lastName: "",
            businessName: "",
            phoneNumber: "",
          })
        }
      }
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }, [createUserProfile])

  const signOut = useCallback(async () => {
    try {
      setUser(null)
      setUserProfile(null)
      setCachedAuth(null, null)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn("Supabase signOut error (non-critical):", error)
      }
      
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      setUser(null)
      setUserProfile(null)
      setCachedAuth(null, null)
      router.push("/")
    }
  }, [router])

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) return

    try {
      const { error } = await supabase.from("users").update(data).eq("id", user.id)

      if (error) throw error

      await fetchUserProfile(user.id)
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }, [user, fetchUserProfile])

  const value = useMemo(() => ({
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }), [user, userProfile, loading, signUp, signIn, signOut, updateProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
