"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Instagram,
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
import { getInstagramApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabase"

interface InstagramConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InstagramConnectModal({ open, onOpenChange, onSuccess }: InstagramConnectModalProps) {
  const [step, setStep] = useState(1)
  const [instagramUsername, setInstagramUsername] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const { user, userProfile } = useAuth()

  const handleUsernameSubmit = async () => {
    if (!instagramUsername || instagramUsername.trim().length < 3) {
      toast({
        title: "Invalid Username",
        description: "Please enter a valid Instagram username (minimum 3 characters)",
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
        description: "Please enter a valid Instagram access token",
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
      // Test the Instagram connection
      const response = await fetch(getInstagramApiUrl('TEST_CONNECTION'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: instagramUsername,
          accessToken: accessToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to test Instagram connection")
      }

      // Update user's Instagram connection
      if (user) {
        console.log('Attempting to connect Instagram for user:', user.id)
        
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token
        
        if (!accessToken) {
          throw new Error("No active session found. Please log in again.")
        }
        
        let updateResponse
        try {
          updateResponse = await fetch(getInstagramApiUrl('CONNECT'), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              instagramUsername: instagramUsername,
              accessToken: accessToken,
              businessName: userProfile?.business_name || "My Business",
              connected: true,
            }),
          })
        } catch (error) {
          console.log('Main endpoint failed, trying alternative:', error)
          // Fallback to alternative endpoint
          updateResponse = await fetch(getInstagramApiUrl('CONNECT_NEW'), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              instagramUsername: instagramUsername,
              accessToken: accessToken,
              businessName: userProfile?.business_name || "My Business",
              connected: true,
            }),
          })
        }

        if (!updateResponse.ok) {
          const updateError = await updateResponse.json()
          console.error('Instagram connection failed:', updateError)
          
          // Provide more detailed error information
          let errorMessage = updateError.error || "Failed to update Instagram connection"
          let errorDetails = ""
          
          if (updateError.details) {
            if (typeof updateError.details === 'object') {
              errorDetails = Object.entries(updateError.details)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')
            } else {
              errorDetails = updateError.details
            }
          }
          
          if (updateError.suggestion) {
            errorDetails += `\n\nSuggestion: ${updateError.suggestion}`
          }
          
          if (updateError.debug) {
            errorDetails += `\n\nDebug Info: ${JSON.stringify(updateError.debug, null, 2)}`
          }
          
          throw new Error(`${errorMessage}\n\n${errorDetails}`)
        }

        const updateData = await updateResponse.json()
        console.log('Instagram connection updated successfully:', updateData)
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
        title: "Instagram Connected Successfully! 🎉",
        description:
          "Your Instagram account is now connected for basic authentication and account linking.",
      })

      // Automatically fetch Instagram DMs after successful connection
      try {
        console.log('Automatically fetching Instagram DMs after connection...')
        
        // Get the current Supabase session token for authentication
        const { data: { session } } = await supabase.auth.getSession()
        const sessionToken = session?.access_token
        
        if (!sessionToken) {
          console.log('No session token available for auto-fetch DMs')
          return
        }
        
        const dmResponse = await fetch('/api/instagram/fetch-dms', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        })

        if (dmResponse.ok) {
          const dmData = await dmResponse.json()
          console.log('Auto-fetched Instagram DMs:', dmData)
          toast({
            title: "Instagram DMs Loaded",
            description: `Successfully loaded ${dmData.data?.total_conversations || 0} conversations. You can now view them in the Chats page.`,
          })
        } else {
          console.log('Auto-fetch DMs failed, but connection was successful')
        }
      } catch (dmError) {
        console.log('Auto-fetch DMs error (non-critical):', dmError)
        // Don't show error to user since connection was successful
      }
    } catch (error) {
      console.error('Instagram connection error:', error)
      
      let errorMessage = "Failed to connect Instagram"
      let errorDetails = ""
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Show detailed error in toast
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Also show error in the UI
      setStep(3) // Go back to connection test step
      
      // Add error display below the button
      const errorElement = document.createElement('div')
      errorElement.className = 'mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'
      errorElement.innerHTML = `
        <div class="flex items-start gap-2">
          <div class="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0">⚠️</div>
          <div class="text-sm">
            <p class="font-medium text-red-900">Connection Error:</p>
            <p class="text-red-700 whitespace-pre-line">${errorMessage}</p>
            <p class="text-red-600 mt-2">Please check your credentials and try again.</p>
          </div>
        </div>
      `
      
      // Remove any existing error display
      const existingError = document.querySelector('.instagram-error-display')
      if (existingError) {
        existingError.remove()
      }
      
      errorElement.classList.add('instagram-error-display')
      
      // Find the button container and add error below it
      const buttonContainer = document.querySelector('.instagram-connect-button-container')
      if (buttonContainer) {
        buttonContainer.parentNode?.insertBefore(errorElement, buttonContainer.nextSibling)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setInstagramUsername("")
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
            <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            Connect Instagram (Test Mode)
          </DialogTitle>
          <DialogDescription>
            Connect your Instagram account for basic authentication and account linking. This is for testing purposes only.
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
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : stepNumber === step
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber < step ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`h-1 w-8 sm:w-12 mx-2 ${stepNumber < step ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Instagram Username */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Step 1: Enter Your Instagram Username
                </CardTitle>
                <CardDescription>Enter the username of the Instagram account you want to connect</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Instagram Username</Label>
                  <div className="flex gap-2">
                    <span className="text-gray-500 text-lg">@</span>
                    <Input
                      type="text"
                      placeholder="yourusername"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, ""))}
                      className="flex-1 text-base"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Username: <span className="font-mono">@{instagramUsername || "yourusername"}</span>
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Test Mode Setup:</p>
                      <p className="text-blue-700">
                        Since you're in Test Mode, you only need basic authentication. No special permissions or business features are required.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUsernameSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                  <Shield className="h-5 w-5 text-purple-600" />
                  Step 2: Instagram Access Token
                </CardTitle>
                <CardDescription>
                  You need to provide an Instagram access token to connect your account. Follow the instructions below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter your Instagram access token"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="text-base font-mono"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">How to get your access token for Test Mode:</p>
                      <ol className="text-blue-700 list-decimal list-inside space-y-1 mt-2">
                        <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1">Facebook Developers <ExternalLink className="h-3 w-3" /></a></li>
                        <li>Create a new app or select an existing one</li>
                        <li>Add <strong>Instagram Basic Display</strong> (not Graph API)</li>
                        <li>Set app to <strong>Development Mode</strong></li>
                        <li>Add yourself as a test user</li>
                        <li>Generate a <strong>User Token</strong> with basic permissions</li>
                        <li>Copy the token and paste it above</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900">Test Mode Limitations:</p>
                      <p className="text-yellow-700">
                        In Test Mode, you can only connect with test users. The token will have limited permissions and won't access real user data.
                      </p>
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
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                  <Shield className="h-5 w-5 text-purple-600" />
                  Step 3: Test Connection
                </CardTitle>
                <CardDescription>Test your Instagram connection to ensure everything is working properly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Instagram Account</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Instagram className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">@{instagramUsername}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-purple-600" />
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
                        Your Instagram account is configured and ready. Click "Test Connection" to verify the integration.
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
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 instagram-connect-button-container"
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
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                  Instagram Connected Successfully!
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Your Instagram account is now connected for basic authentication and account linking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">Instagram Account</h4>
                    <p className="text-sm text-purple-700 font-mono">@{instagramUsername}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">Business Name</h4>
                    <p className="text-sm text-purple-700">{userProfile?.business_name || "My Business"}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">What's Available in Test Mode:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Basic Instagram account authentication</li>
                    <li>• Account linking and verification</li>
                    <li>• Test user connection (limited to test users)</li>
                    <li>• Basic profile information access</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Next Steps for Production:</p>
                      <p className="text-blue-700">
                        When you're ready to go live, you'll need to submit your app for review to access real user data and additional features.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleClose} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Start Using Instagram
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
