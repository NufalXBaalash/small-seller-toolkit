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
import { MessageSquare, Bell, Shield, Smartphone, Zap, Save, Palette, User, Instagram, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { InstagramConnectModal } from "@/components/instagram-connect-modal"
import { getInstagramConnectionStatus } from "@/lib/supabase"
import { getInstagramApiUrl } from "@/lib/api-config"

export default function SettingsPage() {
  const { userProfile, updateProfile, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [instagramStatus, setInstagramStatus] = useState<{
    connected: boolean
    username: string
    business_name: string
    last_connected: string
  } | null>(null)
  const [loadingInstagram, setLoadingInstagram] = useState(false) // Start with false for better UX
  const [profileData, setProfileData] = useState({
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    business_name: userProfile?.business_name || "",
    phone_number: userProfile?.phone_number || "",
  })
  const [instagramModalOpen, setInstagramModalOpen] = useState(false)



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

  // Fetch Instagram connection status
  useEffect(() => {
    const fetchInstagramStatus = async () => {
      if (!user?.id) return
      
      try {
        setLoadingInstagram(true)
        console.log('Fetching Instagram status for user:', user.id)
        const status = await getInstagramConnectionStatus(user.id)
        console.log('Instagram status result:', status)
        setInstagramStatus(status)
      } catch (error) {
        console.error('Error fetching Instagram status:', error)
        // Don't show error to user, just set status to null (not connected)
        setInstagramStatus(null)
      } finally {
        setLoadingInstagram(false)
      }
    }

    fetchInstagramStatus()
  }, [user?.id])

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

  const handleDisconnectInstagram = async () => {
    if (!user?.id) return
    
    try {
      console.log('Disconnecting Instagram for user:', user.id)
      // Call API to disconnect Instagram - try main endpoint first, then fallback
      let response
      try {
        response = await fetch(getInstagramApiUrl('CONNECT'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            instagramUsername: instagramStatus?.username || '',
            accessToken: '',
            businessName: instagramStatus?.business_name || '',
            connected: false
          }),
        })
      } catch (error) {
        console.log('Main endpoint failed, trying alternative:', error)
        // Fallback to alternative endpoint
        response = await fetch(getInstagramApiUrl('CONNECT_V2'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            instagramUsername: instagramStatus?.username || '',
            accessToken: '',
            businessName: instagramStatus?.business_name || '',
            connected: false
          }),
        })
      }

      if (response.ok) {
        const result = await response.json()
        console.log('Instagram disconnected successfully:', result)
        setInstagramStatus(null)
        toast({
          title: "Instagram Disconnected",
          description: "Your Instagram account has been disconnected successfully.",
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to disconnect Instagram:', errorData)
        throw new Error(errorData.error || 'Failed to disconnect')
      }
    } catch (error) {
      console.error('Error disconnecting Instagram:', error)
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect Instagram. Please try again.",
        variant: "destructive",
      })
    }
  }

  const refreshInstagramStatus = async () => {
    if (!user?.id) return
    
    try {
      setLoadingInstagram(true)
      const status = await getInstagramConnectionStatus(user.id)
      setInstagramStatus(status)
    } catch (error) {
      console.error('Error refreshing Instagram status:', error)
    } finally {
      setLoadingInstagram(false)
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
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-2">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Instagram integration is currently in Test Mode. This means you can only connect with test users and have limited functionality. 
                See <a href="/setup-instagram" className="underline">setup guide</a> for more details.
              </p>
            </div>
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

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center">
                  <Instagram className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Instagram (Test Mode)</p>
                  <p className="text-sm text-muted-foreground">
                    {instagramStatus?.connected 
                      ? `Connected as @${instagramStatus.username}`
                      : "Connect your Instagram account for basic authentication"
                    }
                  </p>
                  {instagramStatus?.connected && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Last connected: {new Date(instagramStatus.last_connected).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Test Mode: Basic authentication only
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {loadingInstagram ? (
                  <Badge variant="outline">Loading...</Badge>
                ) : instagramStatus?.connected ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
                {instagramStatus?.connected ? (
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={refreshInstagramStatus}
                      disabled={loadingInstagram}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${loadingInstagram ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleDisconnectInstagram}
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={refreshInstagramStatus}
                      disabled={loadingInstagram}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${loadingInstagram ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setInstagramModalOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Connect Instagram
                    </Button>
                  </div>
                )}
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

      {/* Instagram Connect Modal */}
      <InstagramConnectModal 
        open={instagramModalOpen} 
        onOpenChange={setInstagramModalOpen} 
        onSuccess={refreshInstagramStatus}
      />
    </div>
  )
}
