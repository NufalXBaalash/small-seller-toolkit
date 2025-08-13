"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function TestAuthTokenPage() {
  const { user } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [])

  const testAuthEndpoint = async () => {
    if (!session?.access_token) {
      setTestResults({ error: "No access token available" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/instagram/test-auth', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const data = await response.json()
      setTestResults({
        status: response.status,
        data: data
      })
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testDebugEndpoint = async () => {
    if (!session?.access_token) {
      setTestResults({ error: "No access token available" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/instagram/debug-user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const data = await response.json()
      setTestResults({
        status: response.status,
        data: data
      })
    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Authentication Token Test</h1>
        <p className="text-muted-foreground">Debug authentication and test API endpoints</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
            <CardDescription>Information about the currently logged-in user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">User ID:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {user.id}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant="default">Authenticated</Badge>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Badge variant="destructive">Not Authenticated</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Current Supabase session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {session ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Access Token:</span>
                  <Badge variant={session.access_token ? "default" : "destructive"}>
                    {session.access_token ? "Present" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Refresh Token:</span>
                  <Badge variant={session.refresh_token ? "default" : "destructive"}>
                    {session.refresh_token ? "Present" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Expires At:</span>
                  <span className="text-sm">
                    {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : "N/A"}
                  </span>
                </div>
                {session.access_token && (
                  <div className="pt-2">
                    <span className="font-medium text-xs">Token Preview:</span>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                      {session.access_token.substring(0, 50)}...
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Badge variant="destructive">No Session</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Test API Endpoints</CardTitle>
          <CardDescription>Test the authentication with different API endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={testAuthEndpoint} 
              disabled={loading || !session?.access_token}
              variant="default"
            >
              Test Auth Endpoint
            </Button>
            <Button 
              onClick={testDebugEndpoint} 
              disabled={loading || !session?.access_token}
              variant="outline"
            >
              Test Debug Endpoint
            </Button>
          </div>
          
          {testResults && (
            <div className="mt-4">
              <Separator className="my-4" />
              <h3 className="font-medium mb-2">Test Results:</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
          <CardDescription>Steps to test authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Make sure you are logged in to the app</p>
          <p>2. Check that you have a valid session with an access token</p>
          <p>3. Use the test buttons to verify API endpoint authentication</p>
          <p>4. If tests fail, check the browser console and network tab for errors</p>
        </CardContent>
      </Card>
    </div>
  )
}
