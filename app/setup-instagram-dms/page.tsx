"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Instagram, MessageSquare } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function SetupInstagramDMsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runSetup = async () => {
    setIsRunning(true)
    setResults(null)

    try {
      // Run the database migration
      const response = await fetch('/api/instagram/simple-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const setupData = await response.json()
      
      if (setupData.success) {
        setResults({
          setup: setupData,
          message: "Database setup completed successfully!"
        })
        
        toast({
          title: "Setup Complete",
          description: "Instagram DM support has been added to your database",
        })
      } else {
        setResults({
          setup: setupData,
          message: "Setup completed with some errors"
        })
        
        toast({
          title: "Setup Completed with Warnings",
          description: "Instagram DM support added, but some errors occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Setup error:', error)
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Setup failed"
      })
      
      toast({
        title: "Setup Failed",
        description: "Failed to run Instagram DM setup",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const testInstagramDMs = async () => {
    try {
      // Get the current session token
      const { data: { session } } = await fetch('/api/instagram/test-auth', {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to test Instagram DMs",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/instagram/fetch-dms', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Instagram DMs Test Successful",
          description: `Successfully fetched ${data.data.total_conversations} conversations`,
        })
      } else {
        toast({
          title: "Instagram DMs Test Failed",
          description: data.error || "Failed to fetch Instagram DMs",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: "Test Failed",
        description: "Failed to test Instagram DM functionality",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Instagram DM Setup</h1>
        <p className="text-muted-foreground">Add Instagram Direct Message support to your chat system</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What This Setup Does
            </CardTitle>
            <CardDescription>Database changes and new features added</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Adds customer_username column to chats table</p>
                  <p className="text-sm text-muted-foreground">For Instagram user identification</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Creates Instagram-specific database functions</p>
                  <p className="text-sm text-muted-foreground">For managing Instagram chats and messages</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Adds new API endpoints</p>
                  <p className="text-sm text-muted-foreground">For fetching and sending Instagram DMs</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Integrates with existing chat system</p>
                  <p className="text-sm text-muted-foreground">Instagram conversations appear in your main chats</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Setup Actions
            </CardTitle>
            <CardDescription>Run the setup and test functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                onClick={runSetup} 
                disabled={isRunning}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Setup...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Run Instagram DM Setup
                  </>
                )}
              </Button>
              
              <Button 
                onClick={testInstagramDMs} 
                variant="outline"
                className="w-full"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Test Instagram DMs
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• Make sure you're logged in before running setup</p>
              <p>• Ensure Instagram is connected in Settings</p>
              <p>• Check the results below for any errors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.error ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              Setup Results
            </CardTitle>
            <CardDescription>{results.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.setup && (
                <div>
                  <h4 className="font-medium mb-2">Database Setup:</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(results.setup, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {results.error && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Error:</h4>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-700">{results.error}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>After setup, you can use Instagram DMs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. ✅ Run the Instagram DM setup above</p>
          <p>2. 🔗 Ensure Instagram is connected in Settings</p>
          <p>3. 📱 Go to Chats page and click "Fetch Instagram DMs"</p>
          <p>4. 💬 Start chatting with Instagram customers</p>
          <p>5. 🚀 In production, real Instagram DMs will replace mock data</p>
        </CardContent>
      </Card>
    </div>
  )
}
