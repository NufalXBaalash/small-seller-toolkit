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

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true)
      router.push("/login")
    } else if (loading) {
      // Set a timeout to prevent infinite loading
      timeoutRef.current = setTimeout(() => {
        console.warn('[ProtectedRoute] Loading timeout reached, forcing redirect to login')
        setIsRedirecting(true)
        router.push("/login")
      }, 15000) // 15 second timeout
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (!user || isRedirecting) {
    return null
  }

  return <>{children}</>
}
