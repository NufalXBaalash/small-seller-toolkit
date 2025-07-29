"use client"

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Loading component
const AnalyticsLoading = () => (
  <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Loading your business performance metrics...
        </p>
      </div>
    </div>
    
    {/* Loading skeleton */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid gap-6 lg:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

// Main analytics component
const AnalyticsContent = dynamic(
  () => import('./analytics-content'),
  {
    loading: () => <AnalyticsLoading />,
    ssr: false
  }
)

export default function AnalyticsPage() {
  return <AnalyticsContent />
}