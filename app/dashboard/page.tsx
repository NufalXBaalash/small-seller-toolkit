"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WhatsAppConnectModal } from "@/components/whatsapp-connect-modal"
import { useAuth } from "@/contexts/auth-context"
import { fetchUserDashboardData } from "@/lib/supabase"
import { useRefetchOnVisibility } from "@/hooks/use-page-visibility"
import { useRouter } from "next/navigation";
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

// Simplified time ago function
const getTimeAgo = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    
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
    return "Unknown"
  }
}

// Simplified activity icon component
const ActivityIcon = React.memo(({ type }: { type: string }) => {
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
})

ActivityIcon.displayName = "ActivityIcon"

// Simplified activity background color function
const getActivityBgColor = (type: string) => {
  switch (type) {
    case "order":
      return "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
    case "message":
      return "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
    case "alert":
      return "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400"
    default:
      return "bg-gray-50 dark:bg-gray-950/20 text-gray-700 dark:text-gray-400"
  }
}

// Simplified stats cards component
const StatsCard = React.memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon 
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
))

StatsCard.displayName = "StatsCard"

// Simplified activity item component
const ActivityItem = React.memo(({ activity }: { activity: DashboardStats['recentActivity'][0] }) => (
  <div className="flex items-center space-x-4">
    <div className={`p-2 rounded-full ${getActivityBgColor(activity.type)}`}>
      <ActivityIcon type={activity.type} />
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
))

ActivityItem.displayName = "ActivityItem"

// Simplified quick action button component
const QuickActionButton = React.memo(({ 
  icon: Icon, 
  children, 
  variant = "outline" 
}: { 
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  variant?: "outline" | "default"
}) => (
  <Button className="w-full justify-start" variant={variant}>
    <Icon className="h-4 w-4 mr-2" />
    {children}
  </Button>
))

QuickActionButton.displayName = "QuickActionButton"

export default function Dashboard() {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const dashboardData = await fetchUserDashboardData(user.id)
      
      // Quick stats calculation
      const orders = dashboardData?.orders || []
      const chats = dashboardData?.chats || []
      const customers = dashboardData?.customers || []
      const products = dashboardData?.products || []

      // Fast stats calculation
      const totalRevenue = orders.reduce((sum, order) => sum + (Number(order?.total_amount) || 0), 0)
      const totalOrders = orders.length
      const activeChats = chats.filter(chat => chat?.unread_count > 0).length
      const totalCustomers = customers.length

      // Quick recent activity (max 3 items)
      const recentActivity: DashboardStats['recentActivity'] = []
      
      // Add orders first (max 2)
      orders.slice(0, 2).forEach((order, index) => {
        if (order) {
          recentActivity.push({
            id: `order-${order.id || index}`,
            type: "order" as const,
            title: `New order from ${order.customers?.name || "Customer"}`,
            description: `$${Number(order.total_amount || 0).toFixed(2)} - ${order.status || "pending"}`,
            time: getTimeAgo(order.created_at || new Date().toISOString()),
            status: order.status || "pending",
          })
        }
      })

      // Add one unread chat if available
      const unreadChat = chats.find(chat => chat?.unread_count > 0)
      if (unreadChat && recentActivity.length < 3) {
        recentActivity.push({
          id: `message-${unreadChat.id}`,
          type: "message" as const,
          title: `New message from ${unreadChat.customers?.name || "Customer"}`,
          description: unreadChat.last_message || "New message received",
          time: getTimeAgo(unreadChat.created_at || new Date().toISOString()),
          status: "unread",
        })
      }

      // Add one low stock alert if available
      const lowStockProduct = products.find(p => p.stock <= 5 && p.stock > 0)
      if (lowStockProduct && recentActivity.length < 3) {
        recentActivity.push({
          id: `alert-${lowStockProduct.id}`,
          type: "alert" as const,
          title: "Low stock alert",
          description: `${lowStockProduct.name} - ${lowStockProduct.stock} left`,
          time: "1h ago",
          status: "warning",
        })
      }

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
  }, [user?.id])

  // Use the visibility hook to refetch data when page becomes visible
  useRefetchOnVisibility(fetchDashboardData)

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchDashboardData()
    }
  }, [user?.id, authLoading, fetchDashboardData])

  // Memoized stats cards data
  const statsCards = useMemo(() => [
    {
      title: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toFixed(2)}`,
      subtitle: "+20.1% from last month",
      icon: DollarSign,
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      subtitle: "+180.1% from last month",
      icon: ShoppingCart,
    },
    {
      title: "Active Chats",
      value: stats?.activeChats || 0,
      subtitle: "+19% from last month",
      icon: MessageSquare,
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      subtitle: "+201 since last month",
      icon: Users,
    },
  ], [stats?.totalRevenue, stats?.totalOrders, stats?.activeChats, stats?.totalCustomers])

  // Memoized quick actions
  const quickActions = useMemo(() => [
    { icon: Plus, children: "Add Product" },
    { icon: Users, children: "Add Customer" },
    { icon: ShoppingCart, children: "Create Order" },
    { icon: MessageSquare, children: "View Messages" },
    { icon: TrendingUp, children: "View Analytics" },
  ], [])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // Let the useEffect handle redirect
  }

  // Show skeleton loading while fetching data
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
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
                <ActivityItem key={activity.id} activity={activity} />
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
            {quickActions.map((action) => (
              <QuickActionButton key={action.children} {...action} />
            ))}
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