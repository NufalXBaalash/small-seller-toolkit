"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Instagram,
  CheckCircle,
  AlertCircle,
  Copy,
  User,
  QrCode,
  Smartphone,
  ArrowRight,
  Loader2,
  Search,
  Clock,
  Settings,
  Globe,
  Camera,
  Shield,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { getInstagramApiUrl } from "@/lib/api-config"

interface InstagramConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InstagramConnectModal({ open, onOpenChange, onSuccess }: InstagramConnectModalProps) {
  const [step, setStep] = useState(1)
  const [instagramUsername, setInstagramUsername] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionMethod, setConnectionMethod] = useState<"username" | "business">("username")

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

  const handleBusinessSetup = async () => {
    const businessNameToUse = businessName.trim() || userProfile?.business_name || "My Business"

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setBusinessName(businessNameToUse)
    setIsLoading(false)
    setStep(4)
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

      // Update user's business with Instagram connection
      if (user) {
        // Try the main endpoint first, then fallback to alternatives
        let updateResponse
        try {
          updateResponse = await fetch(getInstagramApiUrl('CONNECT'), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              instagramUsername: instagramUsername,
              accessToken: accessToken,
              businessName: businessName,
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
            },
            body: JSON.stringify({
              userId: user.id,
              instagramUsername: instagramUsername,
              accessToken: accessToken,
              businessName: businessName,
              connected: true,
            }),
          })
        }

        if (!updateResponse.ok) {
          const updateError = await updateResponse.json()
          throw new Error(updateError.error || "Failed to update Instagram connection")
        }

        const updateData = await updateResponse.json()
        console.log('Instagram connection updated successfully:', updateData)
      }

      setIsConnected(true)
      setStep(5)

      // Call the success callback to refresh the parent component
      if (onSuccess) {
        onSuccess()
      }

      toast({
        title: "Instagram Connected Successfully! 🎉",
        description:
          "Your Instagram account is now connected and ready to use. You can now receive and send DMs!",
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Please check your Instagram API configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setInstagramUsername("")
    setAccessToken("")
    setBusinessName("")
    setIsConnected(false)
    setIsLoading(false)
    setConnectionMethod("username")
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
            Connect Instagram
          </DialogTitle>
          <DialogDescription>
            Follow these steps to connect your Instagram account and start managing your DMs and messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
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
                {stepNumber < 5 && (
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

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-purple-900">Important:</p>
                      <p className="text-purple-700">
                        Make sure this is the Instagram account you want to connect. You'll need to provide an access token in the next step.
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
                      <p className="font-medium text-blue-900">How to get your access token:</p>
                      <ol className="text-blue-700 list-decimal list-inside space-y-1 mt-2">
                        <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline">Facebook Developers</a></li>
                        <li>Create a new app or select an existing one</li>
                        <li>Add Instagram Basic Display or Instagram Graph API</li>
                        <li>Generate an access token with the required permissions</li>
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

          {/* Step 3: Business Setup */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  Step 3: Business Information
                </CardTitle>
                <CardDescription>Set up your business profile for Instagram integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business">Business Name</Label>
                  <Input
                    id="business"
                    type="text"
                    placeholder={userProfile?.business_name || "Your Business Name"}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="text-base"
                  />
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-purple-900">Important:</p>
                      <p className="text-purple-700">
                        This business name will be used for your Instagram integration and customer communications.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleBusinessSetup}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Connection Test */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Step 4: Test Connection
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
                      <Camera className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">{businessName}</span>
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
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleConnectionTest}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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

          {/* Step 5: Success */}
          {step === 5 && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                  Instagram Connected Successfully!
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Your Instagram account is now connected and ready to use
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
                    <p className="text-sm text-purple-700">{businessName}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-800 mb-2">What's Next?</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Start receiving Instagram DMs in your chat dashboard</li>
                    <li>• Reply to customers directly from the platform</li>
                    <li>• Set up auto-reply messages for Instagram</li>
                    <li>• Manage all your social media conversations in one place</li>
                  </ul>
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
