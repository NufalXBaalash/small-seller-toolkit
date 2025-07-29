"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Set a timeout to show a different message if loading takes too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    if (loading) {
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true)
      }, 5000) // Show timeout message after 5 seconds
    } else {
      setLoadingTimeout(false)
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [loading])

  // Handle redirection to login page
  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true)
      console.log('No user found, redirecting to login page')
      router.push('/login')
    }
  }, [user, loading, router, redirecting])

  // Show loading state
  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {loadingTimeout 
              ? "Taking longer than expected. Please refresh if this continues." 
              : redirecting 
                ? "Redirecting to login..." 
                : "Loading..."}
          </p>
        </div>
      </div>
    )
  }

  // If not loading and no user, return null (will be redirected by the useEffect)
  if (!user) {
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}
