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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  
  // Refs to track state and prevent unnecessary re-renders
  const profileFetchInProgress = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sessionRestoreAttempted = useRef(false)
  const lastUserRef = useRef<string | null>(null)
  const lastProfileRef = useRef<string | null>(null)

  // Memoized fetchUserProfile function to prevent unnecessary re-renders
  const fetchUserProfile = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous profile fetches
    if (profileFetchInProgress.current) {
      console.log('[AuthContext] fetchUserProfile: Already in progress, skipping')
      return
    }

    // Check if we already have the profile for this user
    if (lastProfileRef.current === userId && userProfile) {
      console.log('[AuthContext] fetchUserProfile: Profile already cached for user:', userId)
      return
    }

    profileFetchInProgress.current = true
    
    // Set a timeout to prevent infinite loading - reduced to 2 seconds
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('[AuthContext] fetchUserProfile: Timeout reached, forcing loading to false')
      profileFetchInProgress.current = false
      setLoading(false)
      setIsInitialized(true)
    }, 2000) // Reduced to 2 seconds for faster response
    
    try {
      console.log('[AuthContext] fetchUserProfile: Fetching profile for user:', userId)
      
      // First, check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('[AuthContext] fetchUserProfile: No active session found')
        setUserProfile(null)
        setLoading(false)
        setIsInitialized(true)
        return
      }
      
      // Single attempt with better error handling
      try {
        console.log('[AuthContext] fetchUserProfile: Attempting to fetch profile')
        
        const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

        if (error) {
          console.error('[AuthContext] fetchUserProfile: Error fetching profile:', error)
          
          // Handle specific error cases
          if (error.code === "PGRST116") {
            // Profile doesn't exist - this might be a new user or trigger failed
            console.log('[AuthContext] fetchUserProfile: Profile not found (PGRST116), attempting to create profile')
            
            // Try to create the profile using the API endpoint first
            try {
              const response = await fetch('/api/fix-user-profile', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                }
              })
              
              if (response.ok) {
                const result = await response.json()
                if (result.success && result.profile) {
                  console.log('[AuthContext] fetchUserProfile: Profile created via API successfully')
                  setUserProfile(result.profile)
                  lastProfileRef.current = userId
                  return
                }
              }
            } catch (apiError) {
              console.warn('[AuthContext] fetchUserProfile: API profile creation failed, trying direct insert:', apiError)
            }
            
            // Fallback to direct insert if API fails
            const { data: newProfile, error: createError } = await supabase
              .from("users")
              .insert([{ id: userId }])
              .select()
              .single()

            if (createError) {
              console.error('[AuthContext] fetchUserProfile: Failed to create profile:', createError)
              // Set profile to null and continue - don't fail the auth
              setUserProfile(null)
            } else {
              console.log('[AuthContext] fetchUserProfile: Profile created successfully')
              setUserProfile(newProfile)
              lastProfileRef.current = userId
            }
          } else {
            // For other errors, set profile to null but don't fail auth
            console.error('[AuthContext] fetchUserProfile: Profile fetch failed:', error)
            setUserProfile(null)
          }
        } else {
          // Success - clear timeout and set profile
          console.log('[AuthContext] fetchUserProfile: Profile fetched successfully')
          setUserProfile(data)
          lastProfileRef.current = userId
        }
      } catch (error) {
        console.error('[AuthContext] fetchUserProfile: Exception during profile fetch:', error)
        // Don't fail auth if profile fetch fails
        setUserProfile(null)
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserProfile: Unexpected error:', error)
      // Don't fail auth if profile fetch fails
      setUserProfile(null)
    } finally {
      // Clear timeout and reset state
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      profileFetchInProgress.current = false
      setLoading(false)
      setIsInitialized(true)
    }
  }, [userProfile])

  // Enhanced session restoration function with caching
  const restoreSession = useCallback(async () => {
    if (sessionRestoreAttempted.current) {
      console.log('[AuthContext] restoreSession: Already attempted, skipping')
      return
    }

    sessionRestoreAttempted.current = true
    console.log('[AuthContext] restoreSession: Starting session restoration')

    try {
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('[AuthContext] restoreSession: Error getting session:', error)
        setUser(null)
        setUserProfile(null)
        setLoading(false)
        setIsInitialized(true)
        return
      }

      console.log('[AuthContext] restoreSession: Session result:', session ? 'Found' : 'Not found')
      
      if (session?.user) {
        // Check if we already have this user cached
        if (lastUserRef.current === session.user.id && user) {
          console.log('[AuthContext] restoreSession: User already cached, skipping profile fetch')
          setLoading(false)
          setIsInitialized(true)
          return
        }

        console.log('[AuthContext] restoreSession: User found, setting user state')
        setUser(session.user)
        lastUserRef.current = session.user.id
        await fetchUserProfile(session.user.id)
      } else {
        console.log('[AuthContext] restoreSession: No user in session')
        setUser(null)
        setUserProfile(null)
        lastUserRef.current = null
        lastProfileRef.current = null
        setLoading(false)
        setIsInitialized(true)
      }
    } catch (error) {
      console.error('[AuthContext] restoreSession: Exception during session restoration:', error)
      setUser(null)
      setUserProfile(null)
      lastUserRef.current = null
      lastProfileRef.current = null
      setLoading(false)
      setIsInitialized(true)
    }
  }, [fetchUserProfile, user])

  // Reduced fallback timeout
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (loading && isInitialized) {
        console.warn('[AuthContext] Fallback timeout: Forcing loading to false after 5 seconds')
        setLoading(false)
        setIsInitialized(true)
      }
    }, 5000) // Reduced to 5 seconds

    return () => {
      clearTimeout(fallbackTimeout)
    }
  }, [loading, isInitialized])

  // Optimized page visibility handling - only refresh if user changed
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        console.log('[AuthContext] visibilitychange: Page became visible')
        
        // Debounce the visibility change to prevent multiple rapid calls
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        timeoutId = setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession()
          console.log('[AuthContext] visibilitychange: getSession result:', session?.user?.id)
          
          // Only update if user actually changed
          if (session?.user?.id !== lastUserRef.current) {
            if (session?.user && !user) {
              setUser(session.user)
              lastUserRef.current = session.user.id
              fetchUserProfile(session.user.id)
            } else if (!session?.user && user) {
              // User was logged out while tab was inactive
              setUser(null)
              setUserProfile(null)
              lastUserRef.current = null
              lastProfileRef.current = null
              setLoading(false)
              setIsInitialized(true)
            }
          }
        }, 200) // Increased debounce to 200ms
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isInitialized, user, fetchUserProfile])

  // Main authentication effect - improved session restoration
  useEffect(() => {
    let isMounted = true
    
    // Restore session on mount
    console.log('[AuthContext] useEffect: Starting session restoration')
    restoreSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('[AuthContext] onAuthStateChange:', event, session?.user?.id)
      
      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            setUser(session.user)
            lastUserRef.current = session.user.id
            await fetchUserProfile(session.user.id)
          }
          break
        case 'SIGNED_OUT':
          setUser(null)
          setUserProfile(null)
          lastUserRef.current = null
          lastProfileRef.current = null
          setLoading(false)
          setIsInitialized(true)
          break
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user)
            lastUserRef.current = session.user.id
            await fetchUserProfile(session.user.id)
          }
          break
        default:
          // For other events, just update the user state
          setUser(session?.user ?? null)
          if (session?.user) {
            lastUserRef.current = session.user.id
            await fetchUserProfile(session.user.id)
          } else {
            setUserProfile(null)
            lastUserRef.current = null
            lastProfileRef.current = null
            setLoading(false)
            setIsInitialized(true)
          }
      }
      
      setIsInitialized(true)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      // Clear any pending timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [restoreSession, fetchUserProfile])

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
        // Profile will be created by the database trigger
        // We'll fetch it in the onAuthStateChange handler
      }
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }, [])

  // This function is now primarily for updating existing profiles or creating basic ones if missing (e.g., social logins)
  const createUserProfile = useCallback(async (user: User, userData: SignUpData) => {
    try {
      console.log("Attempting to create/update profile for user:", user.id)

      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "not found"
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
            email: user.email!, // Ensure email is updated if changed
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
      // After sign-in, ensure user profile exists in public.users
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
      // Clear local state first to prevent UI issues
      setUser(null)
      setUserProfile(null)
      lastUserRef.current = null
      lastProfileRef.current = null
      setLoading(false)
      setIsInitialized(true)
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn("Supabase signOut error (non-critical):", error)
        // Don't throw error, just log it since we already cleared local state
      }
      
      // Always redirect regardless of Supabase signOut success
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      // Even if there's an error, clear local state and redirect
      setUser(null)
      setUserProfile(null)
      lastUserRef.current = null
      lastProfileRef.current = null
      setLoading(false)
      setIsInitialized(true)
      router.push("/")
    }
  }, [router])

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) return

    try {
      const { error } = await supabase.from("users").update(data).eq("id", user.id)

      if (error) throw error

      // Refresh profile
      await fetchUserProfile(user.id)
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }, [user, fetchUserProfile])

  // Memoize the context value to prevent unnecessary re-renders
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
