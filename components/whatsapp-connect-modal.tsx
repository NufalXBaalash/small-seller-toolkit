"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Copy,
  Phone,
  QrCode,
  Smartphone,
  ArrowRight,
  Loader2,
  Search,
  Clock,
  Settings,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { countryCodes } from "@/lib/country-codes"
import { useAuth } from "@/contexts/auth-context"

interface WhatsAppConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsAppConnectModal({ open, onOpenChange }: WhatsAppConnectModalProps) {
  const [step, setStep] = useState(1)
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [searchCountry, setSearchCountry] = useState("")
  const [debugOtp, setDebugOtp] = useState("")
  const [canResend, setCanResend] = useState(true)
  const [resendCooldown, setResendCooldown] = useState(0)

  const { user, userProfile } = useAuth()

  // Use your actual webhook URL
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/api/whatsapp/webhook`
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "your_verify_token_123"

  const filteredCountries = countryCodes.filter(
    (country) =>
      country.country.toLowerCase().includes(searchCountry.toLowerCase()) || country.code.includes(searchCountry),
  )

  const startResendCooldown = (seconds = 60) => {
    setCanResend(false)
    setResendCooldown(seconds)

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePhoneSubmit = async () => {
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`

    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 7) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/whatsapp/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          const remainingTime = data.remainingTime || 300
          startResendCooldown(remainingTime)
          throw new Error(`Please wait ${Math.ceil(remainingTime / 60)} minutes before requesting a new OTP`)
        }
        throw new Error(data.error || "Failed to send OTP")
      }

      if (data.debug?.otp) {
        setDebugOtp(data.debug.otp)
      }

      setStep(2)
      startResendCooldown(60)

      toast({
        title: "OTP Sent Successfully! 📱",
        description: `Verification code sent to ${fullPhoneNumber}${
          data.debug?.otp ? ` (Dev: ${data.debug.otp})` : ""
        }`,
      })
    } catch (error) {
      toast({
        title: "Failed to Send OTP",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`
      const response = await fetch("/api/whatsapp/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          otp: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP")
      }

      setStep(3)
      toast({
        title: "Phone Verified! ✅",
        description: "Your phone number has been successfully verified",
      })
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Please check your code and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBusinessSetup = async () => {
    const businessNameToUse = businessName.trim() || userProfile?.business_name || "My Business"

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setBusinessName(businessNameToUse)
    setIsLoading(false)
    setStep(4)
  }

  const handleWebhookSetup = async () => {
    setIsLoading(true)

    try {
      // Test the WhatsApp connection
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`

      const response = await fetch("/api/whatsapp/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to test WhatsApp connection")
      }

      // Update user's business with WhatsApp connection
      if (user) {
        const { error } = await fetch("/api/user/update-whatsapp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            phoneNumber: fullPhoneNumber,
            businessName: businessName,
            connected: true,
          }),
        })
      }

      setIsConnected(true)
      setStep(5)

      toast({
        title: "WhatsApp Connected Successfully! 🎉",
        description:
          "Your WhatsApp Business account is now connected and ready to use. Check your phone for a test message!",
      })
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Please check your WhatsApp Business API configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard",
    })
  }

  const resetModal = () => {
    setStep(1)
    setCountryCode("+1")
    setPhoneNumber("")
    setVerificationCode("")
    setBusinessName("")
    setIsConnected(false)
    setIsLoading(false)
    setDebugOtp("")
    setSearchCountry("")
    setCanResend(true)
    setResendCooldown(0)
  }

  const handleClose = () => {
    onOpenChange(false)
    if (isConnected) {
      setTimeout(resetModal, 300)
    }
  }

  const resendOtp = async () => {
    if (!canResend) return
    await handlePhoneSubmit()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            Connect WhatsApp Business
          </DialogTitle>
          <DialogDescription>
            Follow these steps to connect your WhatsApp Business account and start automating your customer
            conversations.
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
                      ? "bg-green-500 text-white"
                      : stepNumber === step
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber < step ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div className={`h-1 w-8 sm:w-12 mx-2 ${stepNumber < step ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Phone Number */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  Step 1: Enter Your WhatsApp Business Number
                </CardTitle>
                <CardDescription>Enter the phone number associated with your WhatsApp Business account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Country & Phone Number</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search country..."
                              value={searchCountry}
                              onChange={(e) => setSearchCountry(e.target.value)}
                              className="pl-8 h-8"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCountries.map((country, index) => (
                            <SelectItem key={`${country.code}-${index}`} value={country.code}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{country.flag}</span>
                                <span className="font-mono text-sm">{country.code}</span>
                                <span className="text-sm">{country.country}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      placeholder="123 456 7890"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d\s\-()]/g, "")
                        setPhoneNumber(value)
                      }}
                      className="flex-1 text-base"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Full number:{" "}
                    <span className="font-mono">
                      {countryCode}
                      {phoneNumber.replace(/\D/g, "")}
                    </span>
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Important:</p>
                      <p className="text-blue-700">
                        Make sure this number is registered with WhatsApp Business API and you have the access token
                        configured in your environment variables.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePhoneSubmit}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  Step 2: Enter Verification Code
                </CardTitle>
                <CardDescription>
                  We sent a 6-digit code to your WhatsApp ({countryCode}
                  {phoneNumber.replace(/\D/g, "")}). Enter it below to verify your number.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                  {debugOtp && (
                    <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      Development Mode: Your OTP is <span className="font-mono font-bold">{debugOtp}</span>
                    </p>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                  <Button
                    variant="link"
                    onClick={resendOtp}
                    disabled={isLoading || !canResend}
                    className="text-blue-600 p-0 h-auto"
                  >
                    {!canResend ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      "Resend OTP"
                    )}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleVerificationSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
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
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  Step 3: Business Information
                </CardTitle>
                <CardDescription>Set up your business profile for WhatsApp Business</CardDescription>
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
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Important:</p>
                      <p className="text-blue-700">
                        Make sure this matches the business name on your WhatsApp Business account for proper
                        verification.
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
                    className="flex-1 bg-green-600 hover:bg-green-700"
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

          {/* Step 4: Webhook Configuration */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Step 4: API Configuration
                </CardTitle>
                <CardDescription>Your webhook is configured and ready to receive messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Verify Token</Label>
                    <div className="flex gap-2">
                      <Input value={verifyToken} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(verifyToken)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Ready to Connect!</p>
                      <p className="text-green-700">
                        Your webhook is configured and ready. Click "Test Connection" to send a test message and
                        complete the setup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleWebhookSetup}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
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
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  WhatsApp Connected Successfully!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your WhatsApp Business account is now connected and ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Phone Number</h4>
                    <p className="text-sm text-green-700 font-mono">
                      {countryCode}
                      {phoneNumber.replace(/\D/g, "")}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Business Name</h4>
                    <p className="text-sm text-green-700">{businessName}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">What's Next?</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Check your WhatsApp for a test message</li>
                    <li>• Set up auto-reply messages in Settings</li>
                    <li>• Configure your product catalog</li>
                    <li>• Start receiving and managing customer messages</li>
                  </ul>
                </div>

                <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
                  Start Using WhatsApp
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
