"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function SetupInstagramPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [setupResult, setSetupResult] = useState<any>(null)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup-instagram')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error checking status:', error)
      setStatus({ error: 'Failed to check status' })
    } finally {
      setLoading(false)
    }
  }

  const runSetup = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup-instagram', {
        method: 'POST'
      })
      const data = await response.json()
      setSetupResult(data)
      
      // Check status after setup
      await checkStatus()
    } catch (error) {
      console.error('Error running setup:', error)
      setSetupResult({ error: 'Failed to run setup' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Instagram Integration Setup</h1>
        <p className="text-muted-foreground mt-2">
          Set up the database tables and columns needed for Instagram integration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check Status</CardTitle>
            <CardDescription>
              Check if Instagram integration tables and columns exist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkStatus} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Status'
              )}
            </Button>

            {status && (
              <div className="space-y-2">
                {status.error ? (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{status.error}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert>
                      {status.ready ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Instagram integration is ready!
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Instagram integration needs setup
                          </AlertDescription>
                        </>
                      )}
                    </Alert>

                    {status.checks && (
                      <div className="space-y-1">
                        {status.checks.map((check: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{check.name}</span>
                            {check.exists ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Setup</CardTitle>
            <CardDescription>
              Create missing tables and columns for Instagram integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runSetup} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Run Setup'
              )}
            </Button>

            {setupResult && (
              <div className="space-y-2">
                {setupResult.error ? (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{setupResult.error}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    {setupResult.success ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          {setupResult.message}
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {setupResult.message}
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}

                {setupResult.results && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Setup Results:</p>
                    {setupResult.results.map((result: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate">{result.statement}</span>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Click "Check Status" to see what's missing</p>
            <p>2. Click "Run Setup" to create missing tables and columns</p>
            <p>3. Try connecting Instagram again</p>
            <p>4. If issues persist, check the browser console for detailed error messages</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
