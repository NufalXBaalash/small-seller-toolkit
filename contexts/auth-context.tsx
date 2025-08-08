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
  
  // Ref to track if a profile fetch is in progress
  const profileFetchInProgress = useRef(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoized fetchUserProfile function to prevent unnecessary re-renders
  const fetchUserProfile = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous profile fetches
    if (profileFetchInProgress.current) {
      console.log('[AuthContext] fetchUserProfile: Already in progress, skipping')
      return
    }

    profileFetchInProgress.current = true
    
    // Set a timeout to prevent infinite loading
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('[AuthContext] fetchUserProfile: Timeout reached, forcing loading to false')
      profileFetchInProgress.current = false
      setLoading(false)
      setIsInitialized(true)
    }, 15000) // Increased to 15 seconds for production
    
    try {
      console.log('[AuthContext] fetchUserProfile: Fetching profile for user:', userId)
      
      // First, check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('[AuthContext] fetchUserProfile: No active session found')
        setUserProfile(null)
        return
      }
      
      // Retry logic for profile fetch
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[AuthContext] fetchUserProfile: Attempt ${attempt}/3`);
          
          const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

          if (error) {
            console.error(`[AuthContext] fetchUserProfile: Attempt ${attempt} error:`, error)
            lastError = error;
            
            // Handle specific error cases
            if (error.code === "PGRST116") {
              // Profile doesn't exist - this is okay for new users
              console.log('[AuthContext] fetchUserProfile: Profile not found (PGRST116), user may need to complete signup')
              setUserProfile(null)
              break;
            } else if (error.code === "42501") {
              // Permission denied - RLS policy issue
              console.error('[AuthContext] fetchUserProfile: Permission denied - RLS policy may be blocking access')
              setUserProfile(null)
              break;
            } else if (error.message?.includes('timeout') || error.message?.includes('network')) {
              // Network/timeout error - retry
              if (attempt < 3) {
                console.log(`[AuthContext] fetchUserProfile: Network error, retrying in ${attempt * 1000}ms...`)
                await new Promise(resolve => setTimeout(resolve, attempt * 1000))
                continue;
              }
            }
            
            // For other errors, don't retry
            setUserProfile(null)
            break;
          } else {
            console.log('[AuthContext] fetchUserProfile: Profile fetched successfully:', data)
            setUserProfile(data)
            break;
          }
        } catch (error) {
          console.error(`[AuthContext] fetchUserProfile: Attempt ${attempt} exception:`, error)
          lastError = error;
          
          if (attempt < 3) {
            console.log(`[AuthContext] fetchUserProfile: Exception, retrying in ${attempt * 1000}ms...`)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000))
            continue;
          }
        }
      }
      
      // If all attempts failed, set profile to null
      if (lastError && !userProfile) {
        console.error('[AuthContext] fetchUserProfile: All attempts failed, setting profile to null')
        setUserProfile(null)
      }
      
    } catch (error) {
      console.error('[AuthContext] fetchUserProfile: Error:', error)
      setUserProfile(null)
    } finally {
      // Clear the timeout since we completed successfully
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      
      profileFetchInProgress.current = false
      setLoading(false)
      setIsInitialized(true)
      console.log('[AuthContext] fetchUserProfile: setLoading(false), setIsInitialized(true)')
    }
  }, [userProfile])

  // Fallback mechanism to ensure loading state is always resolved
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (loading && isInitialized) {
        console.warn('[AuthContext] Fallback timeout: Forcing loading to false after 15 seconds')
        setLoading(false)
        setIsInitialized(true)
      }
    }, 15000) // 15 second fallback

    return () => {
      clearTimeout(fallbackTimeout)
    }
  }, [loading, isInitialized])

  // Additional safety check for edge cases
  useEffect(() => {
    // If we have a user but no profile after 5 seconds, assume profile doesn't exist
    if (user && !userProfile && !loading && isInitialized) {
      const profileTimeout = setTimeout(() => {
        console.log('[AuthContext] User exists but no profile after 5s, assuming profile is null')
        setUserProfile(null)
      }, 5000)

      return () => clearTimeout(profileTimeout)
    }
  }, [user, userProfile, loading, isInitialized])

  // Handle page visibility changes with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        console.log('[AuthContext] visibilitychange: Page became visible, refreshing auth state')
        
        // Debounce the visibility change to prevent multiple rapid calls
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        timeoutId = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[AuthContext] visibilitychange: getSession result:', session)
            if (session?.user && !user) {
              setUser(session.user)
              fetchUserProfile(session.user.id)
            } else if (!session?.user && user) {
              // User was logged out while tab was inactive
              setUser(null)
              setUserProfile(null)
              setLoading(false)
              setIsInitialized(true)
            } else if (!session?.user && !user) {
              // No user in session and already logged out
              setLoading(false)
              setIsInitialized(true)
            }
          })
        }, 100) // 100ms debounce
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

  useEffect(() => {
    let isMounted = true
    
    // Get initial session
    console.log('[AuthContext] useEffect: Get initial session')
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      
      console.log('[AuthContext] supabase.auth.getSession result:', session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
        setIsInitialized(true)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('[AuthContext] onAuthStateChange:', event, session?.user?.id)
      setUser(session?.user ?? null)

      if (session?.user) {
        // If this is a new signup, the profile is created by the database trigger.
        // We just need to fetch it.
        if (event === "SIGNED_UP" as any) {
          console.log('[AuthContext] New user signed up, fetching profile...')
        }
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
        setIsInitialized(true)
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
  }, [fetchUserProfile])

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
