"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Bell, Shield, Smartphone, Zap, Save, Palette, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { userProfile, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    business_name: userProfile?.business_name || "",
    phone_number: userProfile?.phone_number || "",
  })

  // Update form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        business_name: userProfile.business_name || "",
        phone_number: userProfile.phone_number || "",
      })
    }
  }, [userProfile])

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      await updateProfile(profileData)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
        <Button onClick={handleProfileUpdate} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>Update your personal and business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={profileData.business_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter your business name"
              />
              <p className="text-sm text-muted-foreground">This will appear in the sidebar under Sellio</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={profileData.phone_number}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>
            
            <Button onClick={handleProfileUpdate} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
            <CardDescription>Customize the look and feel of your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Platform Integrations */}
        <Card className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Platform Integrations</span>
            </CardTitle>
            <CardDescription>Connect your social media platforms to start automating</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">WhatsApp Business API</p>
                  <p className="text-sm text-muted-foreground">Connect your WhatsApp Business account</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Not Connected</Badge>
                <Button size="sm">Connect</Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Facebook Messenger</p>
                  <p className="text-sm text-muted-foreground">Connect your Facebook Page</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Not Connected</Badge>
                <Button size="sm">Connect</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Reply Settings */}
        <Card className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Auto-Reply Settings</span>
            </CardTitle>
            <CardDescription>Configure automatic responses for common inquiries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Auto-Replies</Label>
                <p className="text-sm text-muted-foreground">Automatically respond to customer messages</p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea
                  id="greeting"
                  placeholder="Hi! Thanks for contacting us. How can I help you today?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="away">Away Message</Label>
                <Textarea
                  id="away"
                  placeholder="We're currently away but will respond as soon as possible!"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-confirmation">Order Confirmation</Label>
                <Textarea
                  id="order-confirmation"
                  placeholder="Thank you for your order! We'll process it and get back to you with delivery details."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>Manage how you receive alerts and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Message Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert when inventory is running low</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Sales Summary</Label>
                <p className="text-sm text-muted-foreground">Receive daily sales reports via email</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Order Updates</Label>
                <p className="text-sm text-muted-foreground">Notifications for new orders and status changes</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Business Information</span>
            </CardTitle>
            <CardDescription>Update your business details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input id="business-name" placeholder="Your Business Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-phone">Business Phone</Label>
                <Input id="business-phone" placeholder="+55 11 99999-0000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-email">Business Email</Label>
              <Input id="business-email" type="email" placeholder="contact@yourbusiness.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-address">Business Address</Label>
              <Textarea id="business-address" placeholder="Your business address..." className="min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-hours">Business Hours</Label>
              <Input id="business-hours" placeholder="Mon-Fri: 9AM-6PM, Sat: 9AM-2PM" />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Export Data</Label>
                <p className="text-sm text-muted-foreground">Download all your business data</p>
              </div>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-red-600 dark:text-red-400">Delete Account</Label>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
