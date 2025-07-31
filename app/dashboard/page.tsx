"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WhatsAppConnectModal } from "@/components/whatsapp-connect-modal"
import { useAuth } from "@/contexts/auth-context"
import { fetchUserDashboardData } from "@/lib/supabase"
import {
  MessageSquare,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Plus,
  Eye,
  Download,
  Zap,
  Loader2,
} from "lucide-react"

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeChats: number
  totalCustomers: number
  recentActivity: Array<{
    id: string
    type: "order" | "message" | "alert"
    title: string
    description: string
    time: string
    status: string
  }>
}

export default function Dashboard() {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, userProfile } = useAuth()

  const getTimeAgo = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      // Validate date
      if (isNaN(date.getTime())) {
        return "Unknown"
      }
      
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 0) {
        return "Just now"
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h ago`
      } else {
        return `${Math.floor(diffInMinutes / 1440)}d ago`
      }
    } catch (err) {
      console.error("Error calculating time ago:", err)
      return "Unknown"
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const dashboardData = await fetchUserDashboardData(user.id)
      
      // Extract data with fallbacks
      const { orders, chats, customers, products, dailyStats } = dashboardData

      // Calculate stats with null checks
      const totalRevenue = orders.reduce((sum, order) => {
        const amount = order?.total_amount ? Number(order.total_amount) : 0
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)

      const totalOrders = orders.length
      const activeChats = chats.filter((chat) => chat?.unread_count && chat.unread_count > 0).length
      const totalCustomers = customers.length

      // Create recent activity with better error handling
      const recentActivity: Array<{
        id: string;
        type: "order" | "message" | "alert";
        title: string;
        description: string;
        time: string;
        status: string;
      }> = []

      // Add recent orders
      orders.slice(0, 2).forEach((order, index) => {
        if (order) {
          const customerName = Array.isArray(order.customers) 
            ? order.customers[0]?.name || "Unknown Customer"
            : (order.customers as { name?: string })?.name || "Unknown Customer"
          const amount = order.total_amount ? Number(order.total_amount) : 0
          const status = order.status || "unknown"
          
          recentActivity.push({
            id: `order-${order.created_at || Date.now()}-${index}`,
            type: "order" as const,
            title: `New order from ${customerName}`,
            description: `$${amount.toFixed(2)} - ${status}`,
            time: getTimeAgo(order.created_at || new Date().toISOString()),
            status: status,
          })
        }
      })

      // Add recent messages
      chats.slice(0, 2).forEach((chat, index) => {
        if (chat && chat.unread_count && chat.unread_count > 0) {
          const customerName = Array.isArray(chat.customers) 
            ? chat.customers[0]?.name || "Unknown Customer"
            : (chat.customers as { name: string })?.name || "Unknown Customer"
          
          recentActivity.push({
            id: `message-${chat.created_at || Date.now()}-${index}`,
            type: "message" as const,
            title: `New message from ${customerName}`,
            description: chat.last_message || "New message received",
            time: getTimeAgo(chat.created_at || new Date().toISOString()),
            status: "unread",
          })
        }
      })

      // Add low stock alerts
      products.slice(0, 1).forEach((product, index) => {
        if (product && product.name) {
          recentActivity.push({
            id: `alert-${Date.now()}-${index}`,
            type: "alert" as const,
            title: "Low stock alert",
            description: `${product.name} - ${product.stock || 0} left`,
            time: "1h ago",
            status: "warning",
          })
        }
      })

      setStats({
        totalRevenue,
        totalOrders,
        activeChats,
        totalCustomers,
        recentActivity
      })

    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [user?.id, getTimeAgo])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4" />
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "alert":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-50 text-blue-700"
      case "message":
        return "bg-green-50 text-green-700"
      case "alert":
        return "bg-orange-50 text-orange-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userProfile?.first_name || user?.email}!
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsWhatsAppModalOpen(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Connect WhatsApp
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRevenue.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeChats || 0}</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +201 since last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              You have {stats?.recentActivity.length || 0} new activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${getActivityBgColor(activity.type)}`}>
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
              {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Create Order
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              View Messages
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Connect Modal */}
      <WhatsAppConnectModal
        open={isWhatsAppModalOpen}
        onOpenChange={setIsWhatsAppModalOpen}
      />
    </div>
  )
}