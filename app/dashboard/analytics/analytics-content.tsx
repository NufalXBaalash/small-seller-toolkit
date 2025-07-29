import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Download,
  FileText,
  Calendar,
  Minus
} from "lucide-react"

// Types
interface SalesData {
  month: string
  revenue: number
  orders: number
}

interface TopProduct {
  name: string
  sales: number
  revenue: number
}

interface CustomerData {
  name: string
  value: number
  color: string
}

interface KPIChange {
  value: number
  isPositive: boolean
}

// Sample data
const salesData: SalesData[] = [
  { month: "Jan", revenue: 2400, orders: 45 },
  { month: "Feb", revenue: 1398, orders: 32 },
  { month: "Mar", revenue: 9800, orders: 78 },
  { month: "Apr", revenue: 3908, orders: 65 },
  { month: "May", revenue: 4800, orders: 89 },
  { month: "Jun", revenue: 3800, orders: 72 },
]

const topProducts: TopProduct[] = [
  { name: "iPhone Cases", sales: 156, revenue: 3900 },
  { name: "Wireless Headphones", sales: 89, revenue: 8010 },
  { name: "Phone Stands", sales: 67, revenue: 1038 },
  { name: "USB Cables", sales: 45, revenue: 584 },
  { name: "Screen Protectors", sales: 38, revenue: 456 },
]

const customerData: CustomerData[] = [
  { name: "New Customers", value: 65, color: "#3b82f6" },
  { name: "Returning Customers", value: 35, color: "#10b981" },
]

// Utility functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value)
}

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`
}

// Components
interface KPICardProps {
  title: string
  value: string
  change: KPIChange
  icon: React.ComponentType<{ className?: string }>
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon: Icon }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`flex items-center text-xs ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {change.isPositive ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : change.value === 0 ? (
          <Minus className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {change.value === 0 ? 'No change' : `${change.isPositive ? '+' : ''}${formatPercent(change.value)}`} from last month
      </div>
    </CardContent>
  </Card>
)

export default function AnalyticsContent() {
  const [timeRange, setTimeRange] = useState<string>("6months")
  const [isExporting, setIsExporting] = useState(false)

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, data) => sum + data.revenue, 0)
    const totalOrders = salesData.reduce((sum, data) => sum + data.orders, 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const conversionRate = 24.8 // This would typically come from your analytics

    return {
      totalRevenue: {
        value: formatCurrency(totalRevenue),
        change: { value: 12.5, isPositive: true }
      },
      totalOrders: {
        value: formatNumber(totalOrders),
        change: { value: 8.2, isPositive: true }
      },
      avgOrderValue: {
        value: formatCurrency(avgOrderValue),
        change: { value: -2.1, isPositive: false }
      },
      conversionRate: {
        value: formatPercent(conversionRate),
        change: { value: 3.2, isPositive: true }
      }
    }
  }, [])

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true)
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, you would call your export API here
      console.log(`Exporting report as ${format.toUpperCase()}`)
      
      // Create and download a sample file
      const data = format === 'csv' 
        ? salesData.map(d => `${d.month},${d.revenue},${d.orders}`).join('\n')
        : 'Sample PDF content'
      
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.toLowerCase().includes('revenue') 
                ? formatCurrency(entry.value) 
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatPercent(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Track your business performance and growth metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex-1 sm:flex-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={kpis.totalRevenue.value}
          change={kpis.totalRevenue.change}
          icon={DollarSign}
        />
        <KPICard
          title="Total Orders"
          value={kpis.totalOrders.value}
          change={kpis.totalOrders.change}
          icon={ShoppingCart}
        />
        <KPICard
          title="Avg Order Value"
          value={kpis.avgOrderValue.value}
          change={kpis.avgOrderValue.change}
          icon={DollarSign}
        />
        <KPICard
          title="Conversion Rate"
          value={kpis.conversionRate.value}
          change={kpis.conversionRate.change}
          icon={Users}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--color-revenue)" 
                    strokeWidth={3}
                    dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "var(--color-revenue)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
            <CardDescription>Monthly orders over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                orders: {
                  label: "Orders",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="orders" 
                    fill="var(--color-orders)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(product.sales)} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(product.revenue / product.sales)}/unit
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Distribution */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Customer Distribution</CardTitle>
            <CardDescription>New vs returning customers breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                new: {
                  label: "New Customers",
                  color: "#3b82f6",
                },
                returning: {
                  label: "Returning Customers",
                  color: "#10b981",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {customerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center space-x-6 mt-4">
              {customerData.map((entry) => (
                <div key={entry.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-medium">
                    {entry.name}: {formatPercent(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}