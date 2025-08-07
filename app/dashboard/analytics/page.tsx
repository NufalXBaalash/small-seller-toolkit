"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { fetchUserAnalytics } from "@/lib/supabase"
import { testDatabaseConnection } from "@/lib/supabase";
import { clearCache } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Loader2, Calendar } from "lucide-react"
import { useRefetchOnVisibility } from "@/hooks/use-page-visibility"
import React, { useRef } from "react";
import { useRouter } from "next/navigation"

interface Order {
  id: string
  total_amount: number
  created_at: string
  status: string
}

interface Customer {
  id: string
  created_at: string
  total_orders: number
  total_spent: number
}

interface DailyStats {
  date: string
  total_orders: number
  total_revenue: number
  new_customers: number
  active_chats: number
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [productStats, setProductStats] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const { user, loading } = useAuth();
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showLoadingError, setShowLoadingError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const fetchAnalytics = async () => {
    console.log('[AnalyticsPage] fetchAnalytics: called');
    setShowLoadingError(false);
    setPageLoading(true);
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    loadingTimeout.current = setTimeout(() => {
      setShowLoadingError(true);
      console.error('[AnalyticsPage] fetchAnalytics: Loading timeout!');
    }, 10000);
    try {
      if (!user?.id) return;
      setError(null);
      console.log('[AnalyticsPage] fetchAnalytics: Before testDatabaseConnection');
      const connectionTest = await testDatabaseConnection();
      console.log('[AnalyticsPage] fetchAnalytics: After testDatabaseConnection', connectionTest);
      if (!connectionTest.success) {
        console.log('[AnalyticsPage] fetchAnalytics: Database connection failed', connectionTest.error);
        throw new Error(`Database connection failed: ${connectionTest.error}`);
      }
      console.log('[AnalyticsPage] fetchAnalytics: Before fetchUserAnalytics');
      const data = await fetchUserAnalytics(user.id);
      console.log('[AnalyticsPage] fetchAnalytics: Analytics fetched successfully');
      setOrders(data.orders as Order[]);
      setCustomers(data.customers as Customer[]);
      setDailyStats(data.dailyStats || []);
      setProductStats(data.productStats || []);
    } catch (err) {
      console.error('[AnalyticsPage] fetchAnalytics: Error:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setPageLoading(false);
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      console.log('[AnalyticsPage] fetchAnalytics: setPageLoading(false)');
    }
  }

  // Use the visibility hook to refetch data when page becomes visible
  useRefetchOnVisibility(() => {
    console.log('[AnalyticsPage] useRefetchOnVisibility: triggered');
    if (!loading && user?.id) {
      fetchAnalytics();
    }
  });

  useEffect(() => {
    clearCache();
  }, []);

  useEffect(() => {
    if (!loading && user?.id) {
      fetchAnalytics();
    }
  }, [user?.id, loading]);

  // Calculate analytics from real data
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const conversionRate = customers.length > 0 ? (orders.length / customers.length) * 100 : 0

  // Filter data based on time range
  const getFilteredData = (data: any[], dateField: string) => {
    const now = new Date()
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    return data.filter((item: any) => new Date(item[dateField]) >= cutoffDate)
  }

  const filteredOrders = getFilteredData(orders, 'created_at')
  const filteredCustomers = getFilteredData(customers, 'created_at')
  const filteredDailyStats = getFilteredData(dailyStats, 'date')

  // Prepare chart data
  const salesData = filteredOrders.reduce((acc, order) => {
    const date = new Date(order.created_at)
    const month = date.toLocaleString('default', { month: 'short' })
    
    const existing = acc.find((p: any) => p.month === month)
    if (existing) {
      existing.revenue += order.total_amount
      existing.orders += 1
    } else {
      acc.push({ month, revenue: order.total_amount, orders: 1 })
    }
    return acc
  }, [] as Array<{ month: string; revenue: number; orders: number }>)

  const revenueData = filteredDailyStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: stat.total_revenue,
    orders: stat.total_orders
  }))

  const customerData = [
    { name: "New Customers", value: filteredCustomers.length, color: "#3b82f6" },
    { name: "Returning Customers", value: customers.length - filteredCustomers.length, color: "#10b981" },
  ]

  const topProducts = productStats.reduce((acc, item) => {
    const productName = item.products?.name || "Unknown Product"
    const existing = acc.find((p: any) => p.name === productName)
    if (existing) {
      existing.sales += item.quantity
      existing.revenue += item.total_price
    } else {
      acc.push({ 
        name: productName, 
        sales: item.quantity, 
        revenue: item.total_price 
      })
    }
    return acc
  }, [] as Array<{ name: string; sales: number; revenue: number }>)

  // Calculate growth rates
  const currentPeriodRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0)
  const previousPeriodDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  const previousPeriodStart = new Date(Date.now() - previousPeriodDays * 2 * 24 * 60 * 60 * 1000)
  const previousPeriodEnd = new Date(Date.now() - previousPeriodDays * 24 * 60 * 60 * 1000)
  
  const previousPeriodOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at)
    return orderDate >= previousPeriodStart && orderDate < previousPeriodEnd
  })
  const previousPeriodRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total_amount, 0)
  
  const revenueGrowth = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
    : 0

  if (showLoadingError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Loading took too long</h3>
          <p className="text-gray-600 mb-4">Something went wrong. <button onClick={fetchAnalytics} className="text-blue-600 underline">Try Again</button></p>
        </div>
      </div>
    );
  }

  if (loading || (!loading && !user)) {
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
          <TrendingUp className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your business performance and growth
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("7d")}
          >
            7D
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("30d")}
          >
            30D
          </Button>
          <Button
            variant={timeRange === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("90d")}
          >
            90D
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
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(revenueGrowth).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length} in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Customers to orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Daily revenue over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Customer Distribution</CardTitle>
            <CardDescription>
              New vs returning customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {customerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Month */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales by Month</CardTitle>
            <CardDescription>
              Monthly revenue and order count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>
              Best selling products by revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {product.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${product.revenue.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.sales} units
                    </div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No product data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
