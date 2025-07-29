"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WhatsAppConnectModal } from "@/components/whatsapp-connect-modal"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
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

// Define proper TypeScript interfaces
interface Customer {
  id: string;
  name: string;
  status?: string;
  created_at: string;
}

interface Order {
  id: string;
  total_amount: number | string;
  status: string;
  created_at: string;
  customers?: Customer;
}

interface Chat {
  id: string;
  unread_count: number;
  status: string;
  last_message?: string;
  created_at: string;
  customers?: Customer;
}

interface Product {
  id: string;
  name: string;
  stock: number;
}

interface RecentActivity {
  id: string;
  type: "order" | "message" | "alert";
  title: string;
  description: string;
  time: string;
  status: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeChats: number;
  totalCustomers: number;
  recentActivity: RecentActivity[];
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
}

export default function Dashboard() {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, userProfile } = useAuth()

  const fetchDashboardData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Fetch orders for revenue calculation
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, customers(id, name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (ordersError) {
        console.error("Error fetching orders:", ordersError)
        throw new Error("Failed to fetch orders")
      }

      // Fetch chats
      const { data: chats, error: chatsError } = await supabase
        .from("chats")
        .select("id, unread_count, status, customers(id, name), last_message, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (chatsError) {
        console.error("Error fetching chats:", chatsError)
        throw new Error("Failed to fetch chats")
      }

      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("id, name, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (customersError) {
        console.error("Error fetching customers:", customersError)
        throw new Error("Failed to fetch customers")
      }

      // Fetch products for low stock alerts
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, stock")
        .eq("user_id", user.id)
        .lte("stock", 5)
        .limit(5)

      if (productsError) {
        console.error("Error fetching products:", productsError)
        // Don't throw error for products as it's not critical
      }

      // Calculate stats with proper type safety
      const totalRevenue = orders?.reduce((sum, order) => {
        const amount = typeof order.total_amount === 'string' 
          ? parseFloat(order.total_amount) 
          : Number(order.total_amount)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0) || 0

      const totalOrders = orders?.length || 0
      const activeChats = chats?.filter((chat) => (chat.unread_count || 0) > 0).length || 0
      const totalCustomers = customers?.length || 0

      // Create recent activity with proper typing
      const recentActivity: RecentActivity[] = []

      // Add recent orders
      if (orders && orders.length > 0) {
        orders.slice(0, 2).forEach((order, index) => {
          const amount = typeof order.total_amount === 'string' 
            ? parseFloat(order.total_amount) 
            : Number(order.total_amount)
          
          recentActivity.push({
            id: `order-${order.id}-${index}`,
            type: "order",
            title: `New order from ${order.customers && 'name' in order.customers ? order.customers.name : "Customer"}`,
            description: `$${isNaN(amount) ? "0.00" : amount.toFixed(2)} - ${order.status}`,
            time: getTimeAgo(order.created_at),
            status: order.status,
          })
        })
      }

      // Add recent messages
      if (chats && chats.length > 0) {
        chats.slice(0, 2).forEach((chat, index) => {
          if ((chat.unread_count || 0) > 0) {
            recentActivity.push({
              id: `message-${chat.id}-${index}`,
              type: "message",
              title: `New message from ${chat.customers && 'name' in chat.customers ? chat.customers.name : "Customer"}`,
              description: chat.last_message || "New message received",
              time: getTimeAgo(chat.created_at),
              status: "unread",
            })
          }
        })
      }

      // Add low stock alerts
      if (products && products.length > 0) {
        products.slice(0, 1).forEach((product, index) => {
          recentActivity.push({
            id: `alert-${product.id}-${index}`,
            type: "alert",
            title: "Low stock alert",
            description: `${product.name} - ${product.stock} left`,
            time: "1h ago",
            status: "warning",
          })
        })
      }

      setStats({
        totalRevenue,
        totalOrders,
        activeChats,
        totalCustomers,
        recentActivity: recentActivity.slice(0, 3),
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch dashboard data"
      setError(errorMessage)
      console.error("Error fetching dashboard data:", err)
      toast({
        title: "Error loading dashboard",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  const getTimeAgo = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Unknown"
      }
      
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) {
        return "Just now"
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h ago`
      } else {
        return `${Math.floor(diffInMinutes / 1440)}d ago`
      }
    } catch (error) {
      console.error("Error calculating time ago:", error)
      return "Unknown"
    }
  }, [])

  const getActivityIcon = useCallback((type: RecentActivity['type'], status: string) => {
    switch (type) {
      case "order":
        return <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
      case "message":
        return <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
      case "alert":
        return <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
      default:
        return <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
    }
  }, [])

  const getActivityBgColor = useCallback((type: RecentActivity['type']): string => {
    switch (type) {
      case "order":
        return "bg-green-50"
      case "message":
        return "bg-blue-50"
      case "alert":
        return "bg-orange-50"
      default:
        return "bg-gray-50"
    }
  }, [])

  const handleExportData = useCallback(() => {
    // Add export functionality here
    toast({
      title: "Export Started",
      description: "Your data export will be ready shortly",
    })
  }, [])

  const handleConnectWhatsApp = useCallback(() => {
    setIsWhatsAppModalOpen(true)
  }, [])

  const handleQuickAction = useCallback((action: string) => {
    // Handle quick actions
    toast({
      title: "Feature Coming Soon",
      description: `${action} feature will be available soon`,
    })
  }, [])

  if (loading) {
    return (
      <div className="flex-1 space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const typedUserProfile = userProfile as UserProfile | null

  return (
    <div className="flex-1 space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Good morning, {typedUserProfile?.first_name || "there"}! 👋
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Here's what's happening with your business today
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Button 
            variant="outline" 
            onClick={handleExportData}
            className="font-medium bg-transparent text-sm sm:text-base"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button
            onClick={handleConnectWhatsApp}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-medium text-sm sm:text-base"
          >
            <Plus className="mr-2 h-4 w-4" />
            Connect WhatsApp
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              ${stats?.totalRevenue?.toFixed(2) || "0.00"}
            </div>
            <div className="flex items-center text-xs sm:text-sm text-green-600 mt-1 sm:mt-2">
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="font-medium">+12.5%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Orders</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</div>
            <div className="flex items-center text-xs sm:text-sm text-green-600 mt-1 sm:mt-2">
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="font-medium">+{stats?.totalOrders || 0}</span>
              <span className="text-gray-500 ml-1">total orders</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Active Chats</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.activeChats || 0}</div>
            <div className="flex items-center text-xs sm:text-sm text-orange-600 mt-1 sm:mt-2">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="font-medium">{stats?.activeChats || 0} pending</span>
              <span className="text-gray-500 ml-1">responses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-pink-50 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Customers</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.totalCustomers || 0}</div>
            <div className="flex items-center text-xs sm:text-sm text-green-600 mt-1 sm:mt-2">
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="font-medium">+{stats?.totalCustomers || 0} total</span>
              <span className="text-gray-500 ml-1">customers</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4 border-0 shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold">Recent Activity</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Latest orders and customer interactions
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickAction("View All Activity")}
                className="self-start sm:self-auto bg-transparent"
              >
                <Eye className="mr-2 h-4 w-4" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start sm:items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl ${getActivityBgColor(activity.type)}`}
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white flex-shrink-0">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{activity.title}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{activity.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {activity.time}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400 mt-1">Start by adding products or connecting WhatsApp</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3 border-0 shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl font-bold">Quick Actions</CardTitle>
            <CardDescription className="text-sm sm:text-base">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Button
              onClick={() => handleQuickAction("Add New Product")}
              className="w-full justify-start h-10 sm:h-12 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200 text-sm sm:text-base"
              variant="outline"
            >
              <Package className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Add New Product
            </Button>
            <Button
              onClick={() => handleQuickAction("Create Auto-Reply")}
              className="w-full justify-start h-10 sm:h-12 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border-green-200 text-sm sm:text-base"
              variant="outline"
            >
              <Zap className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Create Auto-Reply
            </Button>
            <Button
              onClick={() => handleQuickAction("Export Customer List")}
              className="w-full justify-start h-10 sm:h-12 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 border-purple-200 text-sm sm:text-base"
              variant="outline"
            >
              <Users className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Export Customer List
            </Button>
            <Button
              onClick={() => handleQuickAction("View Sales Report")}
              className="w-full justify-start h-10 sm:h-12 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 border-orange-200 text-sm sm:text-base"
              variant="outline"
            >
              <TrendingUp className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              View Sales Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl font-bold">Platform Integrations</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Connect your social platforms to start automating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">WhatsApp Business</p>
                  <p className="text-gray-600 text-xs sm:text-sm">Connect your WhatsApp account</p>
                </div>
              </div>
              <Button
                onClick={handleConnectWhatsApp}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base"
              >
                Connect
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">Facebook Messenger</p>
                  <p className="text-gray-600 text-xs sm:text-sm">Connect your Facebook Page</p>
                </div>
              </div>
              <Button 
                onClick={() => handleQuickAction("Connect Facebook Messenger")}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base"
              >
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Connection Modal */}
      <WhatsAppConnectModal 
        open={isWhatsAppModalOpen} 
        onOpenChange={setIsWhatsAppModalOpen} 
      />
    </div>
  )
}