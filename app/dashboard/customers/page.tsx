"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { fetchUserCustomers, createCustomer, updateCustomer, clearCache, searchCustomers } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Search, Download, MessageSquare, Phone, Mail, Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRefetchOnVisibility } from "@/hooks/use-page-visibility"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"

interface Customer {
  id: string
  name: string
  email: string | null
  phone_number: string | null
  platform: string
  total_orders: number
  total_spent: number
  status: string
  last_order_date: string | null
  created_at: string
  orders?: { count: number }
  chats?: { count: number }
}

// Memoized status color function
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
    case "vip":
      return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200"
    case "inactive":
      return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200"
    default:
      return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200"
  }
}

// Memoized time ago function
const getTimeAgo = (dateString: string | null) => {
  if (!dateString) return "Never"
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 0) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  } catch {
    return "Unknown"
  }
}

// Memoized initials function
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Memoized customer row component
const CustomerRow = React.memo(({ 
  customer, 
  onEdit, 
  onDelete 
}: { 
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (customerId: string) => void
}) => (
  <TableRow>
    <TableCell>
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src="" alt={customer.name} />
          <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-muted-foreground">
            Customer since {new Date(customer.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <div className="space-y-1">
        {customer.email && (
          <div className="flex items-center text-sm">
            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
            {customer.email}
          </div>
        )}
        {customer.phone_number && (
          <div className="flex items-center text-sm">
            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
            {customer.phone_number}
          </div>
        )}
      </div>
    </TableCell>
    <TableCell>
      <Badge variant="outline">{customer.platform}</Badge>
    </TableCell>
    <TableCell>
      <div className="font-medium">{customer.total_orders}</div>
      <div className="text-sm text-muted-foreground">
        {customer.orders?.count || 0} total
      </div>
    </TableCell>
    <TableCell>
      <div className="font-medium">${customer.total_spent.toFixed(2)}</div>
      <div className="text-sm text-muted-foreground">
        {customer.total_orders > 0 ? `$${(customer.total_spent / customer.total_orders).toFixed(2)} avg` : "No orders"}
      </div>
    </TableCell>
    <TableCell>
      <Badge className={getStatusColor(customer.status)}>
        {customer.status}
      </Badge>
    </TableCell>
    <TableCell>
      <div className="text-sm">
        {customer.last_order_date ? (
          getTimeAgo(customer.last_order_date)
        ) : (
          <span className="text-muted-foreground">Never</span>
        )}
      </div>
    </TableCell>
    <TableCell className="text-right">
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(customer)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(customer.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
))

CustomerRow.displayName = "CustomerRow"

// Memoized stats card component
const StatsCard = React.memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  color = "text-muted-foreground"
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  color?: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
))

StatsCard.displayName = "StatsCard"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const { user, loading } = useAuth();
  const router = useRouter();

  // Debounce search term to reduce filtering operations
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchCustomers = useCallback(async () => {
    if (!user?.id) return

    try {
      setPageLoading(true)
      setError(null)
      
      let data
      if (debouncedSearchTerm.trim()) {
        // Use optimized search function when search term is provided
        data = await searchCustomers(user.id, debouncedSearchTerm.trim())
      } else {
        // Use optimized pagination function for regular fetching
        data = await fetchUserCustomers(user.id)
      }
      
      setCustomers(data)
    } catch (err) {
      console.error("Error fetching customers:", err)
      setError("Failed to load customers. Please try again.")
    } finally {
      setPageLoading(false)
    }
  }, [user?.id, debouncedSearchTerm])

  // Use the visibility hook to refetch data when page becomes visible
  useRefetchOnVisibility(() => {
    if (!loading && user?.id) {
      fetchCustomers();
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user?.id) {
      fetchCustomers();
    }
  }, [user?.id, loading, fetchCustomers]);

  useEffect(() => {
    clearCache();
  }, []);

  const handleCustomerUpdate = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    try {
      await updateCustomer(customerId, updates)
      // Clear cache and refresh the list
      clearCache("customers")
      await fetchCustomers()
      toast({
        title: "Customer updated",
        description: "Customer has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      })
    }
  }, [fetchCustomers])

  const handleCustomerDelete = useCallback(async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return

    try {
      // Note: You'll need to implement deleteCustomer function in supabase.ts
      // await deleteCustomer(customerId)
      // Clear cache and refresh the list
      clearCache("customers")
      await fetchCustomers()
      toast({
        title: "Customer deleted",
        description: "Customer has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    }
  }, [fetchCustomers])

  // Memoized filtered customers
  const filteredCustomers = useMemo(() => 
    customers.filter(customer =>
      customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      customer.platform.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [customers, debouncedSearchTerm]
  )

  // Memoized stats
  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.status === "active").length,
    vip: customers.filter(c => c.status === "vip").length,
    avgOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length 
      : 0,
    newThisMonth: customers.filter(c => {
      const customerDate = new Date(c.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return customerDate > thirtyDaysAgo
    }).length
  }), [customers])

  // Memoized stats cards data
  const statsCards = useMemo(() => [
    {
      title: "Total Customers",
      value: stats.total,
      subtitle: `${stats.active} active customers`,
      icon: Users,
    },
    {
      title: "VIP Customers",
      value: stats.vip,
      subtitle: "High-value customers",
      icon: Users,
      color: "text-purple-500",
    },
    {
      title: "Avg Order Value",
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      subtitle: "Per customer",
      icon: Users,
    },
    {
      title: "New This Month",
      value: stats.newThisMonth,
      subtitle: "Last 30 days",
      icon: Users,
      color: "text-green-500",
    },
  ], [stats])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // Let the useEffect handle redirect
  }

  if (pageLoading) {
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
          <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Customers</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchCustomers}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and track their activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            View and manage your customer database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      {debouncedSearchTerm ? (
                        <div>
                          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                          <p className="text-gray-600 mb-4">No customers match your search criteria.</p>
                          <Button variant="outline" onClick={() => setSearchTerm("")}>
                            Clear Search
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
                          <p className="text-gray-600 mb-4">Start by adding your first customer to build your customer database.</p>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Customer
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <CustomerRow 
                      key={customer.id} 
                      customer={customer}
                      onEdit={setEditingCustomer}
                      onDelete={handleCustomerDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
