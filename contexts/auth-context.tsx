"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  sessionChecked: boolean
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  refreshSession: () => Promise<boolean>
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
  const [sessionChecked, setSessionChecked] = useState(false)
  const router = useRouter()

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      console.log("Refreshing session...")
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error("Error refreshing session:", error)
        return false
      }
      
      if (data.session) {
        console.log("Session refreshed successfully")
        return true
      } else {
        console.log("No session to refresh")
        return false
      }
    } catch (error) {
      console.error("Error in refreshSession:", error)
      return false
    }
  }
  
  // Initialize auth and set up session refresh
  useEffect(() => {
    // Set loading state at the beginning
    setLoading(true)
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        
        console.log("Initial session check:", session ? "Session found" : "No session")
        
        // Set the user state
        setUser(session?.user ?? null)
        
        // If we have a user, fetch their profile
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setLoading(false)
        }
        
        // Mark session as checked
        setSessionChecked(true)
      } catch (error) {
        console.error("Error initializing auth:", error)
        setLoading(false)
        setSessionChecked(true)
      }
    }
    
    // Initialize auth
    initializeAuth()
    
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)
      
      // Update user state
      setUser(session?.user ?? null)

      if (session?.user) {
        // If this is a new signup, the profile is created by the database trigger.
        // We just need to fetch it.
        console.log("Auth event:", event, "Fetching profile...")
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])
  
  // Set up periodic session refresh
  useEffect(() => {
    // Only start the refresh interval if we have a user
    if (!user) return
    
    console.log("Setting up session refresh interval")
    
    // Refresh the session every 10 minutes to keep it active
    const intervalId = setInterval(async () => {
      const refreshed = await refreshSession()
      console.log("Session refresh attempt result:", refreshed ? "Success" : "Failed")
      
      // If refresh failed and we thought we had a user, force a re-check
      if (!refreshed && user) {
        console.log("Session refresh failed, rechecking session...")
        const { data } = await supabase.auth.getSession()
        
        if (!data.session) {
          console.log("No valid session found, signing out...")
          // Force sign out if no valid session
          setUser(null)
          setUserProfile(null)
          router.push("/login")
        }
      }
    }, 10 * 60 * 1000) // 10 minutes
    
    return () => clearInterval(intervalId)
  }, [user, router])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId)
      
      // Set a timeout to ensure we don't get stuck in loading state
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
      })
      
      // Fetch the profile with a timeout
      const profilePromise = supabase.from("users").select("*").eq("id", userId).single()
      
      // Race the fetch against the timeout
      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise.then(() => {
          console.warn("Profile fetch timed out, continuing without profile")
          return { data: null, error: { message: "Timeout" } }
        })
      ])

      if (error) {
        console.error("Error fetching user profile:", error)
        // If profile doesn't exist (PGRST116), that's okay - user might need to complete signup or trigger hasn't fired yet
        if (error.code !== "PGRST116") {
          console.error("Unexpected error:", error)
        }
        setUserProfile(null) // Ensure profile is null if not found or error
      } else if (data) {
        console.log("Profile fetched successfully:", data)
        setUserProfile(data)
      } else {
        console.warn("No profile data returned")
        setUserProfile(null)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setUserProfile(null)
    } finally {
      // Always set loading to false to prevent UI from being stuck
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: SignUpData) => {
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

      if (error) {
        console.error("Signup error:", error)
        throw error
      }

      console.log("Signup successful:", data)

      // Ensure the user profile is created in public.users table
      // The trigger should handle this, but we'll also call createUserProfile as backup
      if (data.user) {
        try {
          await createUserProfile(data.user, userData)
        } catch (profileError) {
          console.error("Error creating user profile:", profileError)
          // Don't throw here - the user was created successfully, profile can be fixed later
        }
      }
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  // This function is now primarily for updating existing profiles or creating basic ones if missing (e.g., social logins)
  const createUserProfile = async (user: User, userData: SignUpData) => {
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

      // Create default business if business name provided and not already exists
      if (userData.businessName) {
        console.log("Checking/creating business profile")
        const { data: existingBusiness, error: fetchBusinessError } = await supabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (fetchBusinessError && fetchBusinessError.code !== "PGRST116") {
          console.error("Error checking for existing business profile:", fetchBusinessError)
        }

        if (!existingBusiness) {
          const { error: businessError } = await supabase.from("businesses").insert({
            user_id: user.id,
            name: userData.businessName,
            phone_number: userData.phoneNumber,
          })

          if (businessError) {
            console.error("Error creating business profile:", businessError)
          } else {
            console.log("Business profile created successfully")
          }
        } else {
          console.log("Business profile already exists, skipping creation.")
        }
      }

      // Refresh the profile
      await fetchUserProfile(user.id)
    } catch (error) {
      console.error("Error in createUserProfile:", error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in user:", email)
      setLoading(true) // Set loading state at the beginning of sign in
      
      // Set a timeout to ensure we don't get stuck in loading state
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Sign in timeout")), 10000)
      })
      
      // Attempt to sign in with a timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      // Race the sign in against the timeout
      const { data, error } = await Promise.race([
        signInPromise,
        timeoutPromise.then(() => {
          console.warn("Sign in timed out")
          return { data: null, error: { message: "Sign in timed out. Please try again." } }
        })
      ])

      if (error) throw error

      console.log("Sign in successful")

      // After sign-in, ensure user profile exists in public.users
      // This handles cases where the trigger might not have run (e.g., social login, or old signups)
      if (data?.user) {
        try {
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
        } catch (profileError) {
          console.error("Error checking/creating profile after sign in:", profileError)
          // Don't throw here - the user was signed in successfully, profile can be fixed later
        }
      } else if (!error) {
        // If we don't have an error but also don't have user data, something went wrong
        throw new Error("Sign in failed: No user data returned")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setLoading(false) // Make sure to reset loading state on error
      throw error
    }
  }

  const signOut = async () => {
    try {
      setLoading(true) // Set loading state to prevent UI flicker
      
      // Set a timeout to ensure we don't get stuck in loading state
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Sign out timeout")), 5000)
      })
      
      // Attempt to sign out with a timeout
      const signOutPromise = supabase.auth.signOut()
      
      // Race the sign out against the timeout
      const { error } = await Promise.race([
        signOutPromise,
        timeoutPromise.then(() => {
          console.warn("Sign out timed out, forcing client-side logout")
          return { error: null } // Return a successful result to continue with client-side cleanup
        })
      ])
      
      if (error) throw error

      // Clear local state regardless of server response
      setUser(null)
      setUserProfile(null)
      
      // Add a small delay before redirecting to ensure state is updated
      setTimeout(() => {
        router.push("/")
      }, 300)
    } catch (error) {
      console.error("Sign out error:", error)
      
      // Even if there's an error, clear local state and redirect
      setUser(null)
      setUserProfile(null)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
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
  }

  const value = {
    user,
    userProfile,
    loading,
    sessionChecked,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
