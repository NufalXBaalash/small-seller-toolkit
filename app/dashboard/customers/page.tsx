import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Search, Download, MessageSquare, Phone, Mail } from "lucide-react"

export default function CustomersPage() {
  const customers = [
    {
      id: 1,
      name: "Maria Santos",
      email: "maria.santos@email.com",
      phone: "+55 11 99999-1234",
      platform: "WhatsApp",
      totalOrders: 8,
      totalSpent: 450.0,
      lastOrder: "2 days ago",
      status: "Active",
    },
    {
      id: 2,
      name: "João Silva",
      email: "joao.silva@email.com",
      phone: "+55 11 88888-5678",
      platform: "Facebook",
      totalOrders: 3,
      totalSpent: 180.5,
      lastOrder: "1 week ago",
      status: "Active",
    },
    {
      id: 3,
      name: "Ana Costa",
      email: "ana.costa@email.com",
      phone: "+55 11 77777-9012",
      platform: "WhatsApp",
      totalOrders: 12,
      totalSpent: 890.75,
      lastOrder: "3 days ago",
      status: "VIP",
    },
    {
      id: 4,
      name: "Pedro Lima",
      email: "pedro.lima@email.com",
      phone: "+55 11 66666-3456",
      platform: "Facebook",
      totalOrders: 1,
      totalSpent: 25.0,
      lastOrder: "2 months ago",
      status: "Inactive",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "VIP":
        return "bg-purple-100 text-purple-800"
      case "Inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button>Add Customer</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <p className="text-xs text-muted-foreground">75% of total customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">High-value customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$68.50</div>
            <p className="text-xs text-muted-foreground">Per customer average</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>Manage your customer database and contact information</CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage
                          src={`/placeholder.svg?height=32&width=32&text=${customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}`}
                        />
                        <AvatarFallback>
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span>{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{customer.email}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.platform}</Badge>
                  </TableCell>
                  <TableCell>{customer.totalOrders}</TableCell>
                  <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>{customer.lastOrder}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(customer.status)}>{customer.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
