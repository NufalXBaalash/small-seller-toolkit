"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  Shield,
  Zap,
  Users,
  Globe,
  Check,
  X,
  Info,
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
  const [error, setError] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    return cleanPhone.length >= 7 && cleanPhone.length <= 15
  }

  const handlePhoneSubmit = async () => {
    setError("")
    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid phone number (7-15 digits)")
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
      const errorMessage = error instanceof Error ? error.message : "Please try again"
      setError(errorMessage)
      toast({
        title: "Failed to Send OTP",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async () => {
    setError("")
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter the 6-digit verification code")
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
      const errorMessage = error instanceof Error ? error.message : "Please check your code and try again"
      setError(errorMessage)
      toast({
        title: "Verification Failed",
        description: errorMessage,
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
      const errorMessage = error instanceof Error ? error.message : "Please check your WhatsApp Business API configuration"
      setError(errorMessage)
      toast({
        title: "Connection Failed",
        description: errorMessage,
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
    setError("")
    setShowAdvanced(false)
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

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return <Phone className="h-4 w-4" />
      case 2:
        return <QrCode className="h-4 w-4" />
      case 3:
        return <Smartphone className="h-4 w-4" />
      case 4:
        return <Settings className="h-4 w-4" />
      case 5:
        return <CheckCircle className="h-4 w-4" />
      default:
        return stepNumber
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-bold">Connect WhatsApp Business</div>
              <div className="text-sm font-normal text-gray-600">Automate your customer conversations</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div key={stepNumber} className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      stepNumber < step
                        ? "bg-emerald-500 text-white shadow-lg"
                        : stepNumber === step
                          ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {stepNumber < step ? <CheckCircle className="h-5 w-5" /> : getStepIcon(stepNumber)}
                  </div>
                  <div className="text-xs mt-1 text-center">
                    {stepNumber === 1 && "Phone"}
                    {stepNumber === 2 && "Verify"}
                    {stepNumber === 3 && "Business"}
                    {stepNumber === 4 && "Connect"}
                    {stepNumber === 5 && "Done"}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-10">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-900">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Phone Number */}
          {step === 1 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  Enter Your WhatsApp Business Number
                </CardTitle>
                <CardDescription>
                  We'll send a verification code to this number to connect your WhatsApp Business account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Country & Phone Number</Label>
                  <div className="flex gap-3">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[200px]">
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
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <span>Full number: </span>
                    <span className="font-mono font-medium">
                      {countryCode}
                      {phoneNumber.replace(/\D/g, "")}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-emerald-900 mb-1">Before you continue:</p>
                      <ul className="text-emerald-700 space-y-1">
                        <li>• Make sure this number is registered with WhatsApp Business</li>
                        <li>• Ensure you have WhatsApp Business API access</li>
                        <li>• The number should be able to receive messages</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePhoneSubmit}
                  disabled={isLoading || !validatePhoneNumber(phoneNumber)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12 text-base font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="h-5 w-5 text-emerald-600" />
                  Verify Your Phone Number
                </CardTitle>
                <CardDescription>
                  We sent a 6-digit code to your WhatsApp. Enter it below to verify your number.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
                  <div className="relative">
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center text-2xl tracking-widest font-mono h-14 border-2 focus:border-emerald-500"
                      maxLength={6}
                    />
                    {verificationCode.length === 6 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  {debugOtp && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-xs text-orange-700">
                        <span className="font-medium">Development Mode:</span> Your OTP is{" "}
                        <span className="font-mono font-bold">{debugOtp}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">Didn't receive the code?</p>
                  <Button
                    variant="link"
                    onClick={resendOtp}
                    disabled={isLoading || !canResend}
                    className="text-emerald-600 p-0 h-auto"
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

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)} 
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerificationSubmit}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Set up your business profile for WhatsApp Business automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="business" className="text-sm font-medium">Business Name</Label>
                  <Input
                    id="business"
                    type="text"
                    placeholder={userProfile?.business_name || "Your Business Name"}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="text-base h-12"
                  />
                  <p className="text-xs text-gray-500">
                    This will be used for your WhatsApp Business profile and customer communications
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Important:</p>
                      <p className="text-blue-700">
                        Make sure this matches the business name on your WhatsApp Business account for proper
                        verification and customer recognition.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)} 
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleBusinessSetup}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-emerald-600" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Your webhook is configured and ready to receive messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Verify Token</Label>
                    <div className="flex gap-2">
                      <Input value={verifyToken} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(verifyToken)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900 mb-1">Ready to Connect!</p>
                      <p className="text-green-700">
                        Your webhook is configured and ready. Click "Test Connection" to send a test message and
                        complete the setup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(3)} 
                    className="flex-1 h-12"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleWebhookSetup}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  WhatsApp Connected Successfully!
                </CardTitle>
                <CardDescription className="text-green-700">
                  Your WhatsApp Business account is now connected and ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-800">Phone Number</h4>
                    </div>
                    <p className="text-sm text-green-700 font-mono">
                      {countryCode}
                      {phoneNumber.replace(/\D/g, "")}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-800">Business Name</h4>
                    </div>
                    <p className="text-sm text-green-700">{businessName}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-800">What's Next?</h4>
                  </div>
                  <ul className="text-sm text-green-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Check your WhatsApp for a test message
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Set up auto-reply messages in Settings
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Configure your product catalog
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      Start receiving and managing customer messages
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={handleClose} 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-base font-medium"
                >
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
