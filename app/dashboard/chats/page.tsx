"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { fetchUserChats, fetchChatMessages } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, MoreHorizontal, Phone, Video, Send, Paperclip, Smile, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useRefetchOnVisibility } from "@/hooks/use-page-visibility"

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
}

interface Message {
  id: string
  sender_type: string
  content: string
  message_type: string
  is_read: boolean
  created_at: string
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { user } = useAuth()

  const fetchChats = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  // Use the visibility hook to refetch data when page becomes visible
  useRefetchOnVisibility(fetchChats)

  useEffect(() => {
    if (user?.id) {
      fetchChats()
    }
  }, [user?.id])

  const fetchMessages = async (chatId: string) => {
    try {
      const data = await fetchChatMessages(chatId)
      setMessages(data)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Failed to load messages",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || isSending) return

    setIsSending(true)
    try {
      const response = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChat.id,
          message: newMessage,
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setNewMessage("")
      await fetchMessages(selectedChat.id)
      await fetchChats() // Refresh chat list
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
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "inquiry":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "order":
        return "bg-green-100 text-green-800 border-green-200"
      case "support":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

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

  const filteredChats = chats.filter(chat =>
    chat.customers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sellio-neutral-dark">Loading chats...</p>
          </div>
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
                {searchTerm ? "No chats found matching your search." : "No chats yet. Start a conversation to see them here."}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center space-x-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all ${
                    selectedChat?.id === chat.id ? 'bg-gray-50 border-gray-200' : ''
                  }`}
                  onClick={() => {
                    setSelectedChat(chat)
                    fetchMessages(chat.id)
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage
                        src={`/placeholder.svg?height=48&width=48&text=${chat.customers.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}`}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-navy-500 to-navy-600 text-white font-semibold text-xs sm:text-sm">
                        {chat.customers.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {chat.status === "active" && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{chat.customers.name}</p>
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
                      <Badge variant="outline" className="text-xs border">
                        {chat.platform}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(chat.status)}`}>
                        {chat.status.charAt(0).toUpperCase() + chat.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-gray-50 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage src="/placeholder.svg?height=48&width=48&text=MS" />
                  <AvatarFallback className="bg-gradient-to-br from-navy-500 to-navy-600 text-white font-semibold">
                    {selectedChat?.customers.name.split(" ").map(n => n[0]).join("") || "MS"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  {selectedChat?.customers.name || "Select a chat"}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                  {selectedChat && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {selectedChat.platform}
                      </Badge>
                      <span className="text-green-600 font-medium">Online</span>
                    </>
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
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-64 sm:h-80 md:h-96 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {selectedChat ? "No messages yet. Start the conversation!" : "Select a chat to view messages."}
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender_type === 'business' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-2xl p-3 sm:p-4 max-w-xs shadow-sm ${
                      message.sender_type === 'business' 
                        ? 'bg-gradient-to-r from-navy-600 to-navy-700 text-white rounded-br-md' 
                        : 'bg-gray-100 rounded-bl-md'
                    }`}>
                      <p className="text-xs sm:text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(message.created_at)}
                        </span>
                        {message.sender_type === 'auto' && (
                          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            Auto-Reply
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t bg-gray-50 p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs sm:text-sm"
                >
                  Price: $25
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs sm:text-sm"
                >
                  In Stock
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-xs sm:text-sm"
                >
                  Delivery: 2-3 days
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 text-xs sm:text-sm"
                >
                  Payment Options
                </Button>
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
                    placeholder="Type your message..."
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
                  className="bg-gradient-to-r from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800 h-8 sm:h-10 px-3 sm:px-4"
                >
                  {isSending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
