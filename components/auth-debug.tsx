"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, User, Shield, AlertCircle } from "lucide-react"

export function AuthDebug() {
  const { user, userProfile, loading } = useAuth()
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [localStorageData, setLocalStorageData] = useState<any>(null)

  const testAuth = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/test-auth')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTesting(false)
    }
  }

  const checkLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('sellio-auth-token')
      const supabaseData = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/[^a-zA-Z0-9]/g, '_') + '-auth-token')
      
      setLocalStorageData({
        sellioAuthToken: authData ? JSON.parse(authData) : null,
        supabaseAuthToken: supabaseData ? JSON.parse(supabaseData) : null
      })
    }
  }

  useEffect(() => {
    checkLocalStorage()
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auth Context State */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Auth Context State
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Loading:</div>
            <div>
              <Badge variant={loading ? "default" : "secondary"}>
                {loading ? "Yes" : "No"}
              </Badge>
            </div>
            <div>User:</div>
            <div>
              <Badge variant={user ? "default" : "destructive"}>
                {user ? "Authenticated" : "Not Authenticated"}
              </Badge>
            </div>
            <div>Profile:</div>
            <div>
              <Badge variant={userProfile ? "default" : "destructive"}>
                {userProfile ? "Found" : "Not Found"}
              </Badge>
            </div>
          </div>
          {user && (
            <div className="text-xs bg-muted p-2 rounded">
              <div>User ID: {user.id}</div>
              <div>Email: {user.email}</div>
              <div>Created: {new Date(user.created_at).toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Test API */}
        <div className="space-y-2">
          <h3 className="font-semibold">API Test</h3>
          <Button 
            onClick={testAuth} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Auth API
              </>
            )}
          </Button>
          {testResult && (
            <div className="text-xs bg-muted p-2 rounded">
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Local Storage */}
        <div className="space-y-2">
          <h3 className="font-semibold">Local Storage</h3>
          <Button 
            onClick={checkLocalStorage} 
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Storage
          </Button>
          {localStorageData && (
            <div className="text-xs bg-muted p-2 rounded">
              <div className="font-semibold mb-1">Sellio Auth Token:</div>
              <div className="mb-2">
                {localStorageData.sellioAuthToken ? (
                  <Badge variant="default">Present</Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
              <div className="font-semibold mb-1">Supabase Auth Token:</div>
              <div>
                {localStorageData.supabaseAuthToken ? (
                  <Badge variant="default">Present</Badge>
                ) : (
                  <Badge variant="destructive">Missing</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Issues */}
        {(!user && !loading) && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              No user found in auth context
            </span>
          </div>
        )}
        
        {(user && !userProfile && !loading) && (
          <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/20 rounded">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning">
              User found but no profile
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
