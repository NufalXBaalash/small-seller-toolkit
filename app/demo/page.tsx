import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sellio-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <MessageSquare className="h-8 w-8 text-sellio-primary" />
            <span className="text-2xl font-bold text-sellio-text-main">Sellio</span>
          </div>
          <CardTitle>Demo Access</CardTitle>
          <CardDescription>Quick access to explore the Small Seller Toolkit dashboard and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <Button className="w-full bg-sellio-primary hover:bg-sellio-accent text-white" size="lg">
                <ArrowRight className="mr-2 h-4 w-4" />
                Enter Dashboard
              </Button>
            </Link>

            <Link href="/dashboard/chats" className="block">
              <Button variant="outline" className="w-full bg-sellio-tertiary text-sellio-text-main">
                View Chat Management
              </Button>
            </Link>

            <Link href="/dashboard/inventory" className="block">
              <Button variant="outline" className="w-full bg-sellio-tertiary text-sellio-text-main">
                View Inventory
              </Button>
            </Link>

            <Link href="/dashboard/analytics" className="block">
              <Button variant="outline" className="w-full bg-sellio-tertiary text-sellio-text-main">
                View Analytics
              </Button>
            </Link>

            <Link href="/dashboard/customers" className="block">
              <Button variant="outline" className="w-full bg-sellio-tertiary text-sellio-text-main">
                View Customers
              </Button>
            </Link>

            <Link href="/dashboard/settings" className="block">
              <Button variant="outline" className="w-full bg-sellio-tertiary text-sellio-text-main">
                View Settings
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-sellio-text-muted">
            This is a demo version. In production, proper authentication would be required.
          </div>

          <div className="text-center">
            <Link href="/" className="text-sellio-primary hover:underline text-sm">
              ← Back to Landing Page
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
