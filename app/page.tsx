"use client"

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
  Sparkles,
  Bot,
  Target,
  Rocket,
  CheckCircle,
  Lock,
  Phone,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-[#27AE60] to-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-lg sm:text-2xl font-bold text-[#27AE60]">
              Sellio
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-[#555555] hover:text-[#27AE60]">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-[#27AE60] to-[#2ECC71] hover:from-[#2ECC71] hover:to-[#27AE60] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started Free
              </Button>
            </Link>
          </div>
          <div className="sm:hidden">
            <Button variant="ghost" size="sm" className="text-[#555555]">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#27AE60]/10 via-[#2ECC71]/5 to-[#27AE60]/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#27AE60]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-[#2ECC71]/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-[#27AE60]/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#2ECC71]/20 rounded-full blur-2xl animate-bounce delay-500"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-32 right-32 animate-float">
          <div className="w-4 h-4 bg-[#27AE60]/30 rounded-full"></div>
        </div>
        <div className="absolute top-48 left-20 animate-float-delayed">
          <div className="w-3 h-3 bg-[#2ECC71]/40 rounded-full"></div>
        </div>
        <div className="absolute bottom-32 right-16 animate-float">
          <div className="w-5 h-5 bg-[#27AE60]/25 rounded-full"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Badge
                className="mb-4 sm:mb-6 bg-[#27AE60] text-white border-0 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm shadow-lg animate-fade-in-up"
                variant="secondary"
              >
                <Sparkles className="w-3 h-3 mr-1 animate-spin-slow" />
                Trusted by 10,000+ sellers worldwide
              </Badge>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6 sm:mb-8 leading-tight animate-fade-in-up delay-200">
                Automate Your
                <br />
                <span className="text-[#27AE60] animate-gradient-x">
                  Social Selling
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-[#555555] mb-8 sm:mb-12 max-w-2xl leading-relaxed animate-fade-in-up delay-400">
                The AI-Powered Dashboard for WhatsApp & Facebook Sellers
              </p>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8 animate-fade-in-up delay-600">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-[#27AE60] to-[#2ECC71] hover:from-[#2ECC71] hover:to-[#27AE60] text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:rotate-1"
                  >
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-bounce-x" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold border-2 hover:bg-[#27AE60]/10 bg-transparent text-[#27AE60] border-[#27AE60] hover:border-[#2ECC71] transition-all duration-300 hover:scale-105"
                >
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Book a Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-sm text-[#555555] animate-fade-in-up delay-800">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Avatar key={i} className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-white shadow-lg hover:scale-110 transition-transform duration-300">
                        <AvatarImage src={`/placeholder.svg?height=32&width=32&text=U${i}`} />
                        <AvatarFallback className="bg-[#27AE60] text-white">U{i}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="font-medium">Join 10,000+ sellers</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 animate-pulse" />
                  ))}
                  <span className="ml-2 font-medium">4.9/5 rating</span>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100 hover:shadow-3xl transition-all duration-500 transform hover:scale-105 animate-fade-in-up delay-500">
                <div className="bg-gradient-to-br from-[#27AE60] to-[#2ECC71] rounded-xl p-6 mb-6 animate-pulse-slow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white font-medium">WhatsApp Business</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/20 rounded-lg p-3 animate-slide-in-left">
                      <div className="text-white text-sm">Hi! I'm interested in your products</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 ml-8 animate-slide-in-right">
                      <div className="text-[#27AE60] text-sm">Thanks for reaching out! Here are our latest products...</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1A1A1A] mb-2 animate-count-up">$2,450</div>
                  <div className="text-[#555555] text-sm">Revenue this month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F9F9F9] via-white to-[#F4F6F6]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#27AE60] to-[#2ECC71]"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 sm:mb-6 animate-fade-in-up">
              From Chaos to
              <br />
              <span className="text-[#27AE60] animate-gradient-x">
                Clarity
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-[#555555] max-w-3xl mx-auto animate-fade-in-up delay-200">
              Stop losing customers and start growing your business with intelligent automation
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                problem: "Manual messaging chaos",
                solution: "Manage chats easily with AI",
                icon: MessageSquare,
                color: "from-[#27AE60] to-[#2ECC71]"
              },
              {
                problem: "Inventory headaches",
                solution: "Track everything automatically",
                icon: Package,
                color: "from-[#2ECC71] to-[#27AE60]"
              },
              {
                problem: "Missed sales",
                solution: "Never lose a customer again",
                icon: TrendingUp,
                color: "from-[#27AE60] to-[#2ECC71]"
              }
            ].map((item, index) => (
              <div
                key={item.problem}
                className={`text-center transition-all duration-1000 delay-${600 + index * 100} hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              >
                <div className={`h-16 w-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:rotate-12`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{item.problem}</h3>
                <p className="text-[#27AE60] font-medium">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9F9] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#27AE60] to-[#2ECC71]"></div>
        <div className="absolute top-20 right-10 w-32 h-32 bg-[#27AE60]/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-[#2ECC71]/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 sm:mb-6 animate-fade-in-up">
              Powerful Features
            </h2>
            <p className="text-lg sm:text-xl text-[#555555] max-w-3xl mx-auto animate-fade-in-up delay-200">
              Everything you need to scale your social selling business
            </p>
          </div>

          <div className="space-y-16">
            {[
              {
                title: "AI Chat Assistant",
                subtitle: "for WhatsApp & Facebook",
                description: "Automatically respond to customer inquiries with intelligent AI that understands context and provides helpful, personalized responses.",
                icon: Bot,
                color: "from-[#27AE60] to-[#2ECC71]",
                features: ["24/7 instant responses", "Multi-language support", "Context-aware replies"]
              },
              {
                title: "Inventory Management",
                subtitle: "System",
                description: "Track stock levels, manage products, and get low-stock alerts automatically. Never run out of popular items again.",
                icon: Package,
                color: "from-[#2ECC71] to-[#27AE60]",
                features: ["Real-time stock tracking", "Low stock notifications", "Product catalog"]
              },
              {
                title: "Sales & Revenue",
                subtitle: "Dashboard",
                description: "Beautiful analytics showing your revenue trends, best-selling products, and customer insights to help you make data-driven decisions.",
                icon: BarChart3,
                color: "from-[#27AE60] to-[#2ECC71]",
                features: ["Revenue tracking", "Customer analytics", "Export reports"]
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className={`grid lg:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-${800 + index * 100} hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className={`h-16 w-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:rotate-12`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#27AE60] font-medium mb-4">{feature.subtitle}</p>
                  <p className="text-[#555555] text-lg mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                        <CheckCircle className="h-5 w-5 text-[#27AE60] flex-shrink-0 animate-pulse" />
                        <span className="text-[#555555]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#27AE60] mb-2 animate-count-up">
                        {index === 0 ? "98%" : index === 1 ? "24/7" : "$50K+"}
                      </div>
                      <div className="text-[#555555] text-sm">
                        {index === 0 ? "Response Rate" : index === 1 ? "Monitoring" : "Revenue Generated"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F9F9F9] to-white"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#27AE60] to-[#2ECC71]"></div>
        
        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <div className={`transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-6 animate-fade-in-up">
              Built for Mobile Entrepreneurs
            </h2>
            <p className="text-lg sm:text-xl text-[#555555] max-w-3xl mx-auto mb-12 animate-fade-in-up delay-200">
              "Built for solo sellers, small shops, and mobile entrepreneurs who sell through WhatsApp or Facebook every day."
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Solo Sellers", description: "Individual entrepreneurs managing their own business", icon: Users },
                { title: "Small Shops", description: "Local businesses with growing customer bases", icon: Package },
                { title: "Mobile Entrepreneurs", description: "Business owners who work from anywhere", icon: Smartphone }
              ].map((item, index) => (
                <div key={item.title} className="bg-[#F9F9F9] rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:scale-105 animate-fade-in-up delay-300">
                  <div className="h-12 w-12 bg-[#27AE60] rounded-xl flex items-center justify-center mx-auto mb-4 hover:rotate-12 transition-transform duration-300">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                  <p className="text-[#555555]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9F9] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#27AE60] to-[#2ECC71]"></div>
        <div className="absolute top-32 left-20 w-24 h-24 bg-[#27AE60]/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-32 h-32 bg-[#2ECC71]/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className={`text-center mb-12 sm:mb-16 transition-all duration-1000 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-6 animate-fade-in-up">
              What Our Users Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria Santos",
                business: "Fashion Seller, São Paulo",
                quote: "Sellio transformed my WhatsApp business. I went from manually responding to 50+ messages daily to having everything automated. My sales increased 300% in just 2 months!",
                avatar: "MS"
              },
              {
                name: "João Silva",
                business: "Electronics Seller, Rio",
                quote: "The inventory management is a game-changer. I never run out of stock anymore, and the analytics help me understand which products sell best. Highly recommended!",
                avatar: "JS"
              },
              {
                name: "Ana Costa",
                business: "Handmade Crafts, Belo Horizonte",
                quote: "As a busy mom running a home business, Sellio gives me my time back. The auto-replies handle customer questions while I focus on family. Perfect solution!",
                avatar: "AC"
              }
            ].map((testimonial, index) => (
              <div
                key={testimonial.name}
                className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-100 transition-all duration-1000 delay-${1200 + index * 100} hover:shadow-2xl hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400 animate-pulse" />
                  ))}
                </div>
                <p className="text-[#555555] mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 hover:scale-110 transition-transform duration-300">
                    <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${testimonial.avatar}`} />
                    <AvatarFallback className="bg-[#27AE60] text-white">{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-[#1A1A1A]">{testimonial.name}</div>
                    <div className="text-sm text-[#555555]">{testimonial.business}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F9F9F9] to-white"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#27AE60] to-[#2ECC71]"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className={`transition-all duration-1000 delay-1300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="h-16 w-16 bg-[#27AE60] rounded-2xl flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300 animate-bounce-slow">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4 animate-fade-in-up">
              Your Data is Secure
            </h2>
            <p className="text-lg text-[#555555] mb-8 animate-fade-in-up delay-200">
              Your customer data is encrypted. You own your conversations and inventory.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: "End-to-End Encryption", description: "All data is encrypted in transit and at rest" },
                { icon: Lock, title: "You Own Your Data", description: "Your conversations and inventory belong to you" },
                { icon: Globe, title: "GDPR Compliant", description: "Built with privacy and security in mind" }
              ].map((item, index) => (
                <div key={item.title} className="text-center hover:scale-105 transition-transform duration-300">
                  <div className="h-12 w-12 bg-[#27AE60]/10 rounded-xl flex items-center justify-center mx-auto mb-4 hover:bg-[#27AE60]/20 transition-colors duration-300">
                    <item.icon className="h-6 w-6 text-[#27AE60]" />
                  </div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#555555]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#27AE60] to-[#2ECC71] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className={`transition-all duration-1000 delay-1400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in-up">
              Ready to grow your social selling business?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in-up delay-200">
              Join thousands of sellers who have automated their social selling process and increased their revenue by 300%
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center animate-fade-in-up delay-400">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-[#27AE60] hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:rotate-1"
                >
                  Start Free Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-bounce-x" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto font-semibold border-2 border-white text-white hover:bg-white hover:text-[#27AE60] bg-transparent transition-all duration-300 hover:scale-105"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F9F9F9] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5 mb-8 sm:mb-12">
            <div className="sm:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-[#27AE60] to-[#2ECC71] rounded-xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-lg sm:text-2xl font-bold text-[#27AE60]">
                  Sellio
                </span>
              </div>
              <p className="text-[#555555] mb-6 max-w-md text-sm sm:text-base">
                Empowering small sellers with smart automation tools to grow their social selling business.
              </p>
              <div className="flex space-x-4">
                {[MessageSquare, TrendingUp, Users].map((Icon, index) => (
                  <div key={index} className="h-8 w-8 sm:h-10 sm:w-10 bg-white rounded-lg flex items-center justify-center hover:bg-[#27AE60]/10 cursor-pointer transition-all duration-300 shadow-sm hover:scale-110">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#555555] hover:text-[#27AE60]" />
                  </div>
                ))}
              </div>
            </div>

            {[
              { title: "Product", items: ["Features", "Pricing", "Integrations", "API"] },
              { title: "Support", items: ["Help Center", "Contact Us", "Status", "Community"] },
              { title: "Company", items: ["About", "Blog", "Careers", "Privacy"] }
            ].map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold mb-4 text-base sm:text-lg text-[#1A1A1A]">{section.title}</h3>
                <ul className="space-y-3 text-[#555555] text-sm sm:text-base">
                  {section.items.map((item) => (
                    <li key={item} className="hover:text-[#27AE60] cursor-pointer transition-colors duration-300 hover:translate-x-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[#555555] text-xs sm:text-sm text-center sm:text-left">
              © 2024 Sellio. All rights reserved.
            </p>
            <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm text-[#555555]">
              {["Terms", "Privacy", "Cookies"].map((item) => (
                <span key={item} className="hover:text-[#27AE60] cursor-pointer transition-colors duration-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes slide-in-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes count-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-bounce-x {
          animation: bounce-x 2s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 1s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 1s ease-out;
        }
        
        .animate-count-up {
          animation: count-up 2s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          background: linear-gradient(90deg, #27AE60, #2ECC71, #27AE60);
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
