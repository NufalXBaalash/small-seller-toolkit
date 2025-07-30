"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare, Mail, Lock, User, Phone, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  password: string;
  confirmPassword: string;
}

interface UserMetadata {
  firstName: string;
  lastName: string;
  businessName: string;
  phoneNumber: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  phone_number?: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessName: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const { signUp } = useAuth()
  const router = useRouter()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/\s|-|\(|\)/g, ''))
  }

  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 6) {
      return { isValid: false, message: "Password must be at least 6 characters long" }
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return { isValid: false, message: "Password must contain at least one letter" }
    }
    return { isValid: true }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Client-side validation
      if (!formData.firstName.trim()) {
        throw new Error("First name is required")
      }

      if (!formData.email.trim()) {
        throw new Error("Email is required")
      }

      if (!validateEmail(formData.email)) {
        throw new Error("Please enter a valid email address")
      }

      if (!formData.password) {
        throw new Error("Password is required")
      }

      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message)
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }

      if (formData.phone && !validatePhone(formData.phone)) {
        throw new Error("Please enter a valid phone number")
      }

      if (!termsAccepted) {
        throw new Error("Please accept the Terms of Service and Privacy Policy")
      }

      // Prepare user metadata with multiple formats for compatibility
      const userMetadata: UserMetadata = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        businessName: formData.businessName.trim(),
        phoneNumber: formData.phone.trim(),
        // Additional formats that Supabase might expect
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        business_name: formData.businessName.trim(),
        phone_number: formData.phone.trim(),
      }

      console.log("Attempting to sign up with:", {
        email: formData.email,
        metadata: userMetadata
      })

      // Call the signUp function from auth context
      const result = await signUp(formData.email.trim(), formData.password, userMetadata)
      
      console.log("Signup result:", result)

      setSuccess(true)
      toast({
        title: "Account created successfully! 🎉",
        description: "Please check your email to verify your account before signing in.",
      })

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login?message=Please check your email to verify your account")
      }, 3000)

    } catch (error: unknown) {
      console.error("Signup error:", error)
      
      let errorMessage = "Failed to create account. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please sign in instead."
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Password is too weak. Please choose a stronger password."
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address."
        } else if (error.message.includes("signup_disabled")) {
          errorMessage = "New user registration is currently disabled. Please contact support."
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignup = (provider: 'google' | 'facebook') => {
    toast({
      title: "Feature Coming Soon",
      description: `${provider} signup will be available soon.`,
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Account Created Successfully!</CardTitle>
            <CardDescription>
              We've sent a verification email to <strong>{formData.email}</strong>. Please check your inbox and click
              the verification link to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
            <div className="space-y-2">
              <Link href="/login">
                <Button className="w-full">Go to Sign In</Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setSuccess(false)
                  setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    businessName: "",
                    password: "",
                    confirmPassword: "",
                  })
                  setTermsAccepted(false)
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MessageSquare className="h-8 w-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900">Sellio</span>
          </div>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>Start automating your social selling business today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    className="pl-10"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+55 11 99999-0000"
                  className="pl-10"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name (Optional)</Label>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="Your Business Name"
                value={formData.businessName}
                onChange={handleChange}
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  className="pl-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-gray-500">Must be at least 6 characters with letters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                disabled={isLoading}
                required
              />
              <Label htmlFor="terms" className="text-sm leading-4">
                I agree to the{" "}
                <Link href="/terms" className="text-emerald-600 hover:underline" target="_blank">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-emerald-600 hover:underline" target="_blank">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" 
              size="lg" 
              disabled={isLoading || !termsAccepted}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button 
              variant="outline" 
              disabled={isLoading}
              onClick={() => handleSocialSignup('google')}
              type="button"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button 
              variant="outline" 
              disabled={isLoading}
              onClick={() => handleSocialSignup('facebook')}
              type="button"
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>

          <div className="text-center text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}