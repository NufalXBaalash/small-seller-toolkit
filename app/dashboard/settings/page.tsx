import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Bell, Shield, Smartphone, Zap, Save } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Platform Integrations */}
        <Card>
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
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
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
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
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
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
                <Label className="text-red-600">Delete Account</Label>
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
