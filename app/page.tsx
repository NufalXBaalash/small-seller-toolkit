import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowRight,
  MessageSquare,
  BarChart3,
  Package,
  Users,
  Zap,
  Smartphone,
  Star,
  Check,
  Play,
  TrendingUp,
  Shield,
  Clock,
  Globe,
  Menu,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SellerKit
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium">
                Get Started Free
              </Button>
            </Link>
          </div>
          <div className="sm:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container mx-auto text-center max-w-6xl relative">
          <Badge
            className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
            variant="secondary"
          >
            🚀 Trusted by 10,000+ sellers worldwide
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
            Turn Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              WhatsApp{" "}
            </span>
            Into a
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {" "}
              Sales Machine
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            Automate customer conversations, manage inventory, and grow your social selling business with AI-powered
            tools designed for mobile entrepreneurs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4 sm:px-0">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold border-2 hover:bg-gray-50 bg-transparent"
            >
              <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-gray-600 px-4 sm:px-0">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Avatar key={i} className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-white">
                    <AvatarImage src={`/placeholder.svg?height=32&width=32&text=U${i}`} />
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="font-medium">Join 10,000+ sellers</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 font-medium">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200 text-xs sm:text-sm" variant="secondary">
              POWERFUL FEATURES
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4 sm:px-0">
              Everything You Need to
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Scale Fast
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Built specifically for mobile-first entrepreneurs who sell through WhatsApp and Facebook Marketplace
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold">Smart Auto-Replies</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  AI-powered responses that understand customer intent and reply instantly with personalized messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    24/7 instant responses
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Custom message templates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Multi-language support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-green-50">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold">Smart Inventory</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  Track stock levels, get low-stock alerts, and manage your products with photos and descriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Real-time stock tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Low stock notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Product catalog management
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold">Sales Analytics</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  Beautiful dashboards showing revenue trends, best-selling products, and customer insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Revenue tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Customer analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Export reports
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-orange-50">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold">Customer Hub</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  Build and manage your customer database automatically from chat interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Auto customer profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Purchase history
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Segmentation tools
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-yellow-50">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold">AI Intent Detection</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  Automatically categorize messages as inquiries, orders, or support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Smart categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Priority handling
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Auto-routing
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-white to-pink-50">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold">Mobile-First</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  Designed for mobile entrepreneurs - manage everything from your phone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Mobile optimized
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Offline capabilities
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    Push notifications
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Trusted by Sellers Worldwide</h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-12 sm:mb-16 max-w-2xl mx-auto px-4 sm:px-0">
            Join thousands of entrepreneurs who have transformed their social selling business
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">10K+</div>
              <div className="text-blue-100 font-medium text-sm sm:text-base">Active Sellers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">2M+</div>
              <div className="text-blue-100 font-medium text-sm sm:text-base">Messages Automated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">$50M+</div>
              <div className="text-blue-100 font-medium text-sm sm:text-base">Sales Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-100 font-medium text-sm sm:text-base">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200 text-xs sm:text-sm" variant="secondary">
              SUCCESS STORIES
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 px-4 sm:px-0">
              What Our Sellers Say
            </h2>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-sm sm:text-base">
                  "SellerKit transformed my WhatsApp business. I went from manually responding to 50+ messages daily to
                  having everything automated. My sales increased 300% in just 2 months!"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40&text=MS" />
                    <AvatarFallback>MS</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">Maria Santos</div>
                    <div className="text-xs sm:text-sm text-gray-600">Fashion Seller, São Paulo</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-sm sm:text-base">
                  "The inventory management is a game-changer. I never run out of stock anymore, and the analytics help
                  me understand which products sell best. Highly recommended!"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40&text=JS" />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">João Silva</div>
                    <div className="text-xs sm:text-sm text-gray-600">Electronics Seller, Rio</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 md:col-span-2 lg:col-span-1">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic text-sm sm:text-base">
                  "As a busy mom running a home business, SellerKit gives me my time back. The auto-replies handle
                  customer questions while I focus on family. Perfect solution!"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src="/placeholder.svg?height=40&width=40&text=AC" />
                    <AvatarFallback>AC</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm sm:text-base">Ana Costa</div>
                    <div className="text-xs sm:text-sm text-gray-600">Handmade Crafts, Belo Horizonte</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <Badge
              className="mb-4 bg-purple-100 text-purple-700 border-purple-200 text-xs sm:text-sm"
              variant="secondary"
            >
              SIMPLE PRICING
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 px-4 sm:px-0">
              Start Free, Scale as You Grow
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
              No setup fees, no hidden costs. Pay only for what you use.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardHeader className="text-center pb-6 sm:pb-8">
                <CardTitle className="text-xl sm:text-2xl font-bold">Starter</CardTitle>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4">Free</div>
                <CardDescription className="text-sm sm:text-base mt-2">Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Up to 100 messages/month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Basic auto-replies</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Simple inventory tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Basic analytics</span>
                  </li>
                </ul>
                <Link href="/signup" className="block">
                  <Button className="w-full mt-6 sm:mt-8 bg-transparent" variant="outline">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 shadow-xl relative">
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 sm:px-4 py-1 text-xs sm:text-sm">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-6 sm:pb-8">
                <CardTitle className="text-xl sm:text-2xl font-bold">Professional</CardTitle>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4">
                  $29<span className="text-base sm:text-lg text-gray-600">/month</span>
                </div>
                <CardDescription className="text-sm sm:text-base mt-2">For growing businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Unlimited messages</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Advanced AI auto-replies</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Full inventory management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Customer management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Priority support</span>
                  </li>
                </ul>
                <Link href="/signup" className="block">
                  <Button className="w-full mt-6 sm:mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 shadow-lg md:col-span-2 lg:col-span-1">
              <CardHeader className="text-center pb-6 sm:pb-8">
                <CardTitle className="text-xl sm:text-2xl font-bold">Enterprise</CardTitle>
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4">
                  $99<span className="text-base sm:text-lg text-gray-600">/month</span>
                </div>
                <CardDescription className="text-sm sm:text-base mt-2">For large operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Everything in Professional</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Multi-user accounts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Custom integrations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">White-label options</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Dedicated support</span>
                  </li>
                </ul>
                <Link href="/signup" className="block">
                  <Button className="w-full mt-6 sm:mt-8 bg-transparent" variant="outline">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 px-4 sm:px-0">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-12 max-w-2xl mx-auto px-4 sm:px-0">
            Join thousands of sellers who have automated their social selling process and increased their revenue by
            300%
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 sm:px-0">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold bg-white text-gray-900 hover:bg-gray-100"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-12 text-blue-100 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Global Reach</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5 mb-8 sm:mb-12">
            <div className="sm:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  SellerKit
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md text-sm sm:text-base">
                Empowering small sellers with smart automation tools to grow their social selling business.
              </p>
              <div className="flex space-x-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-base sm:text-lg">Product</h3>
              <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                <li className="hover:text-white cursor-pointer">Features</li>
                <li className="hover:text-white cursor-pointer">Pricing</li>
                <li className="hover:text-white cursor-pointer">Integrations</li>
                <li className="hover:text-white cursor-pointer">API</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-base sm:text-lg">Support</h3>
              <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                <li className="hover:text-white cursor-pointer">Help Center</li>
                <li className="hover:text-white cursor-pointer">Contact Us</li>
                <li className="hover:text-white cursor-pointer">Status</li>
                <li className="hover:text-white cursor-pointer">Community</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-base sm:text-lg">Company</h3>
              <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                <li className="hover:text-white cursor-pointer">About</li>
                <li className="hover:text-white cursor-pointer">Blog</li>
                <li className="hover:text-white cursor-pointer">Careers</li>
                <li className="hover:text-white cursor-pointer">Privacy</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © 2024 SellerKit. All rights reserved.
            </p>
            <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-400">
              <span className="hover:text-white cursor-pointer">Terms</span>
              <span className="hover:text-white cursor-pointer">Privacy</span>
              <span className="hover:text-white cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
