"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { fetchUserChats, fetchChatMessages, clearCache } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, MoreHorizontal, Phone, Video, Send, Paperclip, Smile, Loader2, Instagram, RefreshCw, MessageSquare } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRefetchOnVisibility } from "@/hooks/use-page-visibility"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"

interface Chat {
  id: string
  platform: string
  last_message: string | null
  unread_count: number
  status: string
  created_at: string
  updated_at: string
  customers: {
    id: string
    name: string
    email: string | null
    phone_number: string | null
  }
  customer_username?: string // For Instagram chats
}

interface Message {
  id: string
  sender_type: string
  content: string
  message_type: string
  is_read: boolean
  created_at: string
}

// Memoized status color function
const getStatusColor = (status: string) => {
  switch (status) {
    case "inquiry":
      return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800"
    case "order":
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
    case "support":
      return "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800"
    case "completed":
      return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800"
    default:
      return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800"
  }
}

// Memoized platform badge component
const PlatformBadge = React.memo(({ platform }: { platform: string }) => {
  const getPlatformConfig = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return {
          icon: <Instagram className="h-3 w-3" />,
          className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm",
          label: "Instagram"
        }
      case "whatsapp":
        return {
          icon: null,
          className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
          label: "WhatsApp"
        }
      case "facebook":
        return {
          icon: null,
          className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800",
          label: "Facebook"
        }
      default:
        return {
          icon: null,
          className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-200 dark:border-gray-800",
          label: platform.charAt(0).toUpperCase() + platform.slice(1)
        }
    }
  }

  const config = getPlatformConfig(platform)
  
  return (
    <Badge variant="outline" className={`text-xs border flex items-center gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  )
})

PlatformBadge.displayName = "PlatformBadge"

// Memoized time ago function
const getTimeAgo = (dateString: string) => {
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

// Memoized chat item component
const ChatItem = React.memo(({ 
  chat, 
  isSelected, 
  onSelect 
}: { 
  chat: Chat
  isSelected: boolean
  onSelect: (chat: Chat) => void
}) => (
  <div
    className={`flex items-center space-x-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all ${
      isSelected ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : ''
    }`}
    onClick={() => onSelect(chat)}
  >
    <div className="relative flex-shrink-0">
      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
        <AvatarImage
          src={`/placeholder.svg?height=48&width=48&text=${chat.platform === "instagram" && chat.customer_username
            ? chat.customer_username.charAt(0).toUpperCase()
            : chat.customers.name
              .split(" ")
              .map((n) => n[0])
              .join("")}`}
        />
        <AvatarFallback className={`font-semibold text-xs sm:text-sm ${
          chat.platform === "instagram" 
            ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white"
            : "bg-gradient-to-br from-navy-500 to-navy-600 text-white"
        }`}>
          {chat.platform === "instagram" && chat.customer_username
            ? chat.customer_username.charAt(0).toUpperCase()
            : chat.customers.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
        </AvatarFallback>
      </Avatar>
      {chat.status === "active" && (
        <div className={`absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 border-2 border-white rounded-full ${
          chat.platform === "instagram" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-green-500"
        }`}></div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
            {chat.platform === "instagram" && chat.customer_username 
              ? `@${chat.customer_username}` 
              : chat.customers.name
            }
          </p>
          {chat.platform === "instagram" && (
            <div className="h-1.5 w-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          )}
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {chat.unread_count > 0 && (
            <Badge
              variant="destructive"
              className="text-xs h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center"
            >
              {chat.unread_count}
            </Badge>
          )}
          <span className="text-xs text-gray-500">{getTimeAgo(chat.updated_at)}</span>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-sellio-primary truncate mb-2">
        {chat.last_message || "No messages yet"}
      </p>
      <div className="flex items-center justify-between">
        <PlatformBadge platform={chat.platform} />
        <Badge className={`text-xs ${getStatusColor(chat.status)}`}>
          {chat.status.charAt(0).toUpperCase() + chat.status.slice(1)}
        </Badge>
      </div>
    </div>
  </div>
))

ChatItem.displayName = "ChatItem"

// Memoized message component
const MessageItem = React.memo(({ message, platform }: { message: Message; platform?: string }) => (
  <div className={`flex ${message.sender_type === 'business' ? 'justify-end' : 'justify-start'}`}>
    <div className={`rounded-2xl p-3 sm:p-4 max-w-xs shadow-sm ${
      message.sender_type === 'business' 
        ? platform === 'instagram' 
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md' 
          : 'bg-gradient-to-r from-navy-600 to-navy-700 text-white rounded-br-md'
        : 'bg-gray-100 rounded-bl-md'
    }`}>
      <p className="text-xs sm:text-sm">{message.content}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">
          {getTimeAgo(message.created_at)}
        </span>
        <div className="flex items-center gap-2">
          {message.sender_type === 'auto' && (
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              Auto-Reply
            </Badge>
          )}
          {platform === 'instagram' && (
            <div className="h-2 w-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  </div>
))

MessageItem.displayName = "MessageItem"

// Memoized quick reply button component
const QuickReplyButton = React.memo(({ 
  text, 
  color = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" 
}: { 
  text: string
  color?: string
}) => (
  <Button
    size="sm"
    variant="outline"
    className={`${color} text-xs sm:text-sm`}
  >
    {text}
  </Button>
))

QuickReplyButton.displayName = "QuickReplyButton"

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Debounce search term to reduce filtering operations
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchChats = useCallback(async () => {
    if (!user?.id) return

    try {
      setPageLoading(true)
      const data = await fetchUserChats(user.id)
      setChats(data)
      if (data.length > 0) {
        setSelectedChat(data[0])
        await fetchMessages(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
      toast({
        title: "Failed to load chats",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setPageLoading(false)
    }
  }, [user?.id])

  // Use the visibility hook to refetch data when page becomes visible
  useRefetchOnVisibility(() => {
    if (!loading && user?.id) {
      fetchChats();
    }
  });

  useEffect(() => {
    if (!loading && user?.id) {
      fetchChats();
    }
  }, [user?.id, loading]);

  useEffect(() => {
    clearCache();
  }, []);

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      setMessagesLoading(true)
      const data = await fetchChatMessages(chatId)
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Failed to load messages",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return

    setIsSending(true)
    try {
      // Determine the API endpoint based on the platform
      let apiEndpoint = "/api/whatsapp/send-message"
      let requestBody: any = {
        chatId: selectedChat.id,
        message: newMessage,
        userId: user?.id,
      }

      // For Instagram, we need to extract the recipient username from the chat ID
      if (selectedChat.platform === "instagram") {
        apiEndpoint = "/api/instagram/send-message"
        // Extract username from chat ID format: instagram_${userId}_${recipientUsername}
        const parts = selectedChat.id.split("_")
        if (parts.length >= 3) {
          const recipientUsername = parts.slice(2).join("_") // Handle usernames with underscores
          requestBody = {
            userId: user?.id,
            recipientUsername: recipientUsername,
            message: newMessage,
            messageType: "text"
          }
        }
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setNewMessage("")
      await fetchMessages(selectedChat.id)
      // Clear cache and refresh chat list
      clearCache("chats")
      await fetchChats()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }, [newMessage, selectedChat, isSending, user?.id, fetchMessages, fetchChats])

  // Memoized filtered chats
  const filteredChats = useMemo(() => 
    chats.filter(chat =>
      chat.customers.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      chat.platform.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      chat.last_message?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [chats, debouncedSearchTerm]
  )

  // Memoized quick reply buttons
  const quickReplyButtons = useMemo(() => [
    { text: "Price: $25", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
    { text: "In Stock", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
    { text: "Delivery: 2-3 days", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
    { text: "Payment Options", color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  ], [])

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

  // Show skeleton loading while fetching data
  if (pageLoading) {
    return (
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Chat Layout Skeleton */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Chat List Skeleton */}
          <Card className="lg:col-span-1 border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
              <div className="relative">
                <div className="absolute left-3 top-3 h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse pl-10"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 max-h-96 sm:max-h-none overflow-y-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Window Skeleton */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-gray-50 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 sm:h-80 md:h-96 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs sm:max-w-sm lg:max-w-md ${i % 2 === 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'} rounded-lg p-3 animate-pulse`}>
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input Skeleton */}
              <div className="border-t bg-gray-50 p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ))}
                  <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Chat Management</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage customer conversations across all platforms
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <Button 
            variant="outline" 
            className="font-medium bg-transparent text-sm sm:text-base"
            onClick={fetchChats}
            disabled={pageLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${pageLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="font-medium bg-transparent text-sm sm:text-base">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-gradient-to-r from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800 font-medium text-sm sm:text-base">
            Create Auto-Reply
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Chat List */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl font-bold">Active Chats</CardTitle>
            <CardDescription className="text-sm sm:text-base">Manage your customer conversations</CardDescription>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-sellio-primary" />
              <Input 
                placeholder="Search chats..." 
                className="pl-10 border-gray-200 text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 max-h-96 sm:max-h-none overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {debouncedSearchTerm ? (
                  <div className="space-y-2">
                    <Search className="h-8 w-8 mx-auto text-gray-400" />
                    <p>No chats found matching your search.</p>
                    <p className="text-sm">Try adjusting your search terms.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <MessageSquare className="h-8 w-8 mx-auto text-gray-400" />
                    <p>No chats yet.</p>
                    <p className="text-sm">Connect your platforms to start receiving messages.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.href = '/dashboard/settings'}
                      className="mt-2"
                    >
                      Go to Settings
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <ChatItem 
                  key={chat.id} 
                  chat={chat}
                  isSelected={selectedChat?.id === chat.id}
                  onSelect={(chat) => {
                    setSelectedChat(chat)
                    fetchMessages(chat.id)
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-gray-50 space-y-3 sm:space-y-0">
            {selectedChat ? (
              <>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src="/placeholder.svg?height=48&width=48&text=MS" />
                      <AvatarFallback className={`font-semibold ${
                        selectedChat.platform === "instagram" 
                          ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white"
                          : "bg-gradient-to-br from-navy-500 to-navy-600 text-white"
                      }`}>
                        {selectedChat.platform === "instagram" && selectedChat?.customer_username
                          ? selectedChat.customer_username.charAt(0).toUpperCase()
                          : selectedChat?.customers.name.split(" ").map(n => n[0]).join("") || "MS"
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 border-2 border-white rounded-full ${
                      selectedChat.platform === "instagram" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-green-500"
                    }`}></div>
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold">
                      {selectedChat.platform === "instagram" && selectedChat?.customer_username
                        ? `@${selectedChat.customer_username}`
                        : selectedChat?.customers.name || "Select a chat"
                      }
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                      <PlatformBadge platform={selectedChat.platform} />
                      {selectedChat.platform === "instagram" ? (
                        <span className="text-purple-600 font-medium">Instagram DM</span>
                      ) : (
                        <span className="text-green-600 font-medium">Online</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-transparent">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-transparent">
                    <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-transparent">
                    <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-gray-500">No Chat Selected</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Choose a conversation from the left panel to start messaging
                  </CardDescription>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 sm:h-80 md:h-96 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedChat ? (
                    <div className="space-y-2">
                      <MessageSquare className="h-8 w-8 mx-auto text-gray-400" />
                      <p>No messages yet.</p>
                      <p className="text-sm">
                        {selectedChat.platform === 'instagram' 
                          ? 'Start the conversation with your Instagram follower!'
                          : 'Start the conversation!'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <MessageSquare className="h-8 w-8 mx-auto text-gray-400" />
                      <p>Select a chat to view messages.</p>
                      <p className="text-sm">Choose a conversation from the left panel.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((message) => (
                    <MessageItem key={message.id} message={message} platform={selectedChat?.platform} />
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t bg-gray-50 p-3 sm:p-4">
              {selectedChat ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {quickReplyButtons.map((button) => (
                      <QuickReplyButton key={button.text} {...button} />
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-transparent flex-shrink-0"
                    >
                      <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder={`Type your message to ${selectedChat.platform === 'instagram' ? '@' + selectedChat.customer_username : selectedChat.customers.name}...`}
                        className="pr-10 sm:pr-12 border-gray-200 text-sm sm:text-base"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button size="sm" variant="ghost" className="absolute right-1 top-1 h-6 w-6 sm:h-8 sm:w-8 p-0">
                        <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={isSending || !selectedChat}
                      className={`h-8 sm:h-10 px-3 sm:px-4 ${
                        selectedChat.platform === 'instagram'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                          : 'bg-gradient-to-r from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800'
                      }`}
                    >
                      {isSending ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm">Select a chat to start messaging</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
