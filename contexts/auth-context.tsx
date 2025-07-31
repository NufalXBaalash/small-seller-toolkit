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
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
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

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        // Page became visible again, refresh auth state
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && !user) {
            setUser(session.user)
            fetchUserProfile(session.user.id)
          } else if (!session?.user && user) {
            // User was logged out while tab was inactive
            setUser(null)
            setUserProfile(null)
            setLoading(false)
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isInitialized, user])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
      console.log("Auth state changed:", event, session?.user?.id)
      setUser(session?.user ?? null)

      if (session?.user) {
        // If this is a new signup, the profile is created by the database trigger.
        // We just need to fetch it.
        if (event === "SIGNED_UP" as any) {
          console.log("New user signed up, profile should be created by trigger. Fetching profile...")
        }
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
      setIsInitialized(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId)
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        // If profile doesn't exist (PGRST116), that's okay - user might need to complete signup or trigger hasn't fired yet
        if (error.code !== "PGRST116") {
          console.error("Unexpected error:", error)
        }
        setUserProfile(null) // Ensure profile is null if not found or error
      } else {
        console.log("Profile fetched successfully:", data)
        setUserProfile(data)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setUserProfile(null)
    } finally {
      setLoading(false)
      setIsInitialized(true)
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

      // The public.users profile is now created by the database trigger (on_auth_user_created)
      // We don't need to manually call createUserProfile here for the initial insert.
      // The auth state change listener will fetch the profile once it's created.
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log("Sign in successful")

      // After sign-in, ensure user profile exists in public.users
      // This handles cases where the trigger might not have run (e.g., social login, or old signups)
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
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setUserProfile(null)
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
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
    signUp,
    signIn,
    signOut,
    updateProfile,
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
