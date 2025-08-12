"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasRedirected = useRef(false)
  const initialLoadComplete = useRef(false)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Wait for initial load to complete before making any decisions
    if (!initialLoadComplete.current && !loading) {
      initialLoadComplete.current = true
    }

    // Only redirect if initial load is complete, user is not authenticated, and we haven't already redirected
    if (initialLoadComplete.current && !loading && !user && !isRedirecting && !hasRedirected.current) {
      console.log('[ProtectedRoute] User not authenticated, redirecting to login')
      hasRedirected.current = true
      setIsRedirecting(true)
      // Use replace instead of push to prevent back button issues
      router.replace("/login")
    } else if (loading && initialLoadComplete.current && !user) {
      // Only set timeout if we're loading and don't have a user
      timeoutRef.current = setTimeout(() => {
        console.warn('[ProtectedRoute] Loading timeout reached, forcing redirect to login')
        if (!hasRedirected.current) {
          hasRedirected.current = true
          setIsRedirecting(true)
          router.replace("/login")
        }
      }, 3000) // Reduced to 3 seconds for faster response
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [user, loading, router, isRedirecting])

  // Reset redirecting state when user changes
  useEffect(() => {
    if (user) {
      setIsRedirecting(false)
      hasRedirected.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [user])

  // Show loading state only if we're loading and don't have a user
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated or we're redirecting
  if (!user || isRedirecting) {
    return null
  }

  return <>{children}</>
}
