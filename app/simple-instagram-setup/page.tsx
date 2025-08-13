"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertCircle, Database, Instagram } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function SimpleInstagramSetupPage() {
  const [loading, setLoading] = useState(false)
  const [setupResult, setSetupResult] = useState<any>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const runSimpleSetup = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/instagram/simple-setup', {
        method: 'POST'
      })
      const data = await response.json()
      setSetupResult(data)
      
      if (data.success) {
        toast({
          title: "Setup Successful!",
          description: "Instagram database setup completed successfully.",
        })
        // Auto-verify after successful setup
        await verifySetup()
      } else {
        toast({
          title: "Setup Failed",
          description: "Instagram database setup failed. Check the results below.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error running setup:', error)
      setSetupResult({ error: 'Failed to run setup' })
      toast({
        title: "Setup Error",
        description: "Failed to run Instagram setup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const verifySetup = async () => {
    try {
      const response = await fetch('/api/instagram/verify-setup')
      const data = await response.json()
      setVerificationResult(data)
    } catch (error) {
      console.error('Error verifying setup:', error)
      setVerificationResult({ error: 'Failed to verify setup' })
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Simple Instagram Setup</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This page creates only the essential database tables and columns needed for Instagram Test Mode integration.
          It's a simplified setup that focuses on the core requirements.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Run Simple Setup
            </CardTitle>
            <CardDescription>
              Create the essential tables and columns for Instagram integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runSimpleSetup} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Run Instagram Setup
                </>
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
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="truncate flex-1 mr-2">{result.statement}</span>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verify Setup
            </CardTitle>
            <CardDescription>
              Check if the Instagram setup was successful
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={verifySetup} 
              variant="outline"
              className="w-full"
            >
              Verify Setup
            </Button>

            {verificationResult && (
              <div className="space-y-2">
                {verificationResult.error ? (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{verificationResult.error}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Setup verification completed
                      </AlertDescription>
                    </Alert>

                    {verificationResult.results && (
                      <div className="space-y-2">
                        <div className="grid gap-2">
                          <div className="p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium">Users Table</p>
                            <p className="text-xs text-gray-600">
                              Status: {verificationResult.results.users_table.exists ? '✅ Exists' : '❌ Missing'}
                            </p>
                            {verificationResult.results.users_table.instagram_fields.length > 0 && (
                              <p className="text-xs text-gray-600">
                                Instagram columns: {verificationResult.results.users_table.instagram_fields.join(', ')}
                              </p>
                            )}
                          </div>

                          <div className="p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium">User Connections Table</p>
                            <p className="text-xs text-gray-600">
                              Status: {verificationResult.results.user_connections_table.exists ? '✅ Exists' : '❌ Missing'}
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium">Setup Status</p>
                            <p className="text-xs text-gray-600">
                              {verificationResult.results.setup_status === 'complete' ? '✅ Complete' : 
                               verificationResult.results.setup_status === 'partial' ? '⚠️ Partial' : '❌ Incomplete'}
                            </p>
                          </div>
                        </div>

                        {verificationResult.recommendations && (
                          <div className="mt-3">
                            <p className="text-sm font-medium">Recommendations:</p>
                            <ul className="text-xs text-gray-600 space-y-1 mt-1">
                              {verificationResult.recommendations.map((rec: string, index: number) => (
                                <li key={index}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What This Setup Creates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">user_connections table</p>
                <p className="text-gray-600">Stores Instagram connection information for each user</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Instagram columns in users table</p>
                <p className="text-gray-600">Adds instagram_username and instagram_connected columns</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Platform column in messages table</p>
                <p className="text-gray-600">Adds platform column for future Instagram message support</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Row Level Security (RLS)</p>
                <p className="text-gray-600">Ensures users can only access their own Instagram connections</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Click "Run Instagram Setup" to create the required database structure</p>
            <p>2. Click "Verify Setup" to confirm everything was created correctly</p>
            <p>3. If setup is successful, go back to Settings and try connecting Instagram</p>
            <p>4. If you encounter issues, check the setup results for specific error messages</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
