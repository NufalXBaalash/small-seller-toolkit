"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Facebook,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
  Loader2,
  ArrowRight,
  ExternalLink,
  Info,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface FacebookConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function FacebookConnectModal({ open, onOpenChange, onSuccess }: FacebookConnectModalProps) {
  const [step, setStep] = useState(1)
  const [pageId, setPageId] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const { user, userProfile } = useAuth()

  const handlePageIdSubmit = async () => {
    if (!pageId || pageId.trim().length < 3) {
      toast({
        title: "Invalid Page ID",
        description: "Please enter a valid Facebook Page ID (minimum 3 characters)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setStep(2)
    setIsLoading(false)
  }

  const handleAccessTokenSubmit = async () => {
    if (!accessToken || accessToken.trim().length < 10) {
      toast({
        title: "Invalid Access Token",
        description: "Please enter a valid Facebook access token",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setStep(3)
    setIsLoading(false)
  }

  const handleConnectionTest = async () => {
    setIsLoading(true)

    try {
      // Test the Facebook connection
      const response = await fetch('/api/facebook/test-connection', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId: pageId,
          accessToken: accessToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to test Facebook connection")
      }

      // Update user's Facebook connection
      if (user) {
        console.log('Attempting to connect Facebook for user:', user.id)
        
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession()
        const sessionToken = session?.access_token
        
        if (!sessionToken) {
          throw new Error("No active session found. Please log in again.")
        }
        
        const updateResponse = await fetch('/api/facebook/connect', {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            pageId: pageId,
            accessToken: accessToken,
            businessName: userProfile?.business_name || "My Business",
            connected: true,
          }),
        })

        if (!updateResponse.ok) {
          const updateError = await updateResponse.json()
          console.error('Facebook connection failed:', updateError)
          throw new Error(updateError.error || "Failed to update Facebook connection")
        }

        const updateData = await updateResponse.json()
        console.log('Facebook connection updated successfully:', updateData)
      } else {
        throw new Error("User not authenticated. Please log in and try again.")
      }

      setIsConnected(true)
      setStep(4)

      // Call the success callback to refresh the parent component
      if (onSuccess) {
        onSuccess()
      }

      toast({
        title: "Facebook Connected Successfully! 🎉",
        description:
          "Your Facebook Page is now connected and ready to receive messages.",
      })

      // Automatically fetch Facebook DMs after successful connection
      try {
        console.log('Automatically fetching Facebook DMs after connection...')
        
        const { data: { session } } = await supabase.auth.getSession()
        const sessionToken = session?.access_token
        
        if (!sessionToken) {
          console.log('No session token available for auto-fetch DMs')
          return
        }
        
        const dmResponse = await fetch('/api/facebook/fetch-dms', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        })

        if (dmResponse.ok) {
          const dmData = await dmResponse.json()
          console.log('Auto-fetched Facebook DMs:', dmData)
          toast({
            title: "Facebook DMs Loaded",
            description: `Successfully loaded ${dmData.data?.total_conversations || 0} conversations. You can now view them in the Chats page.`,
          })
        } else {
          console.log('Auto-fetch DMs failed, but connection was successful')
        }
      } catch (dmError) {
        console.log('Auto-fetch DMs error (non-critical):', dmError)
      }
    } catch (error) {
      console.error('Facebook connection error:', error)
      
      let errorMessage = "Failed to connect Facebook"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      setStep(3)
    } finally {
      setIsLoading(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setPageId("")
    setAccessToken("")
    setIsConnected(false)
    setIsLoading(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    if (isConnected) {
      setTimeout(resetModal, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Facebook className="h-5 w-5 text-white" />
            </div>
            Connect Facebook Messenger
          </DialogTitle>
          <DialogDescription>
            Connect your Facebook Page to start receiving and responding to customer messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber < step
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      : stepNumber === step
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber < step ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`h-1 w-8 sm:w-12 mx-2 ${stepNumber < step ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Facebook Page ID */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Step 1: Enter Your Facebook Page ID
                </CardTitle>
                <CardDescription>Enter the ID of the Facebook Page you want to connect</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Facebook Page ID</Label>
                  <Input
                    type="text"
                    placeholder="123456789012345"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value.replace(/[^0-9]/g, ""))}
                    className="text-base font-mono"
                  />
                  <p className="text-sm text-gray-600">
                    Page ID: <span className="font-mono">{pageId || "123456789012345"}</span>
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">How to find your Page ID:</p>
                      <ol className="text-blue-700 list-decimal list-inside space-y-1 mt-2">
                        <li>Go to your Facebook Page</li>
                        <li>Click on "About" in the left sidebar</li>
                        <li>Scroll down to find "Page ID"</li>
                        <li>Copy the numeric ID (e.g., 123456789012345)</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePageIdSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Access Token */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Step 2: Facebook Access Token
                </CardTitle>
                <CardDescription>
                  You need to provide a Facebook access token to connect your page. Follow the instructions below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter your Facebook access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="text-base font-mono"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">How to get your access token:</p>
                      <ol className="text-blue-700 list-decimal list-inside space-y-1 mt-2">
                        <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1">Facebook Developers <ExternalLink className="h-3 w-3" /></a></li>
                        <li>Create a new app or select an existing one</li>
                        <li>Add <strong>Messenger</strong> product to your app</li>
                        <li>Set app to <strong>Development Mode</strong></li>
                        <li>Generate a <strong>Page Access Token</strong></li>
                        <li>Copy the token and paste it above</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleAccessTokenSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Connection Test */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Step 3: Test Connection
                </CardTitle>
                <CardDescription>Test your Facebook connection to ensure everything is working properly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Facebook Page ID</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{pageId}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{userProfile?.business_name || "My Business"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Ready to Connect!</p>
                      <p className="text-green-700">
                        Your Facebook Page is configured and ready. Click "Test Connection" to verify the integration.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleConnectionTest}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  Facebook Connected Successfully!
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Your Facebook Page is now connected and ready to receive messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Facebook Page ID</h4>
                    <p className="text-sm text-blue-700 font-mono">{pageId}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Business Name</h4>
                    <p className="text-sm text-blue-700">{userProfile?.business_name || "My Business"}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">What's Available:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Receive messages from Facebook Messenger</li>
                    <li>• Send responses to customers</li>
                    <li>• View conversation history</li>
                    <li>• Manage customer inquiries</li>
                  </ul>
                </div>

                <Button onClick={handleClose} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  Start Using Facebook Messenger
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
