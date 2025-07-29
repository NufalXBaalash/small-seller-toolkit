"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, MoreHorizontal, Phone, Video, Send, Paperclip, Smile, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function ChatsPage() {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchChats()
    }
  }, [user])

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select(`
        *,
        customers (*)
      `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setChats(data || [])
      if (data && data.length > 0) {
        setSelectedChat(data[0])
        fetchMessages(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (chatId) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
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
          userId: user.id,
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
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-medium text-sm sm:text-base">
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
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search chats..." className="pl-10 border-gray-200 text-sm sm:text-base" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 max-h-96 sm:max-h-none overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center space-x-3 p-3 sm:p-4 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all"
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage
                      src={`/placeholder.svg?height=48&width=48&text=${chat.customers.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}`}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-semibold text-xs sm:text-sm">
                      {chat.customers.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{chat.customers.name}</p>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {chat.unread > 0 && (
                        <Badge
                          variant="destructive"
                          className="text-xs h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center"
                        >
                          {chat.unread}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">{chat.time}</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 truncate mb-2">{chat.lastMessage}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs border">
                      {chat.platform}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(chat.status)}`}>{chat.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b bg-gray-50 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage src="/placeholder.svg?height=48&width=48&text=MS" />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-semibold">
                    MS
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">Maria Santos</CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                  <Badge variant="outline" className="text-xs">
                    WhatsApp
                  </Badge>
                  <span className="text-green-600 font-medium">Online</span>
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
              {/* Customer Message */}
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md p-3 sm:p-4 max-w-xs shadow-sm">
                  <p className="text-xs sm:text-sm text-gray-900">Hi! Do you have the iPhone case in blue?</p>
                  <span className="text-xs text-gray-500 mt-2 block">2:30 PM</span>
                </div>
              </div>

              {/* Auto Reply */}
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl rounded-br-md p-3 sm:p-4 max-w-xs shadow-sm">
                  <p className="text-xs sm:text-sm">
                    Hello! Yes, we have iPhone cases in blue. Which model do you need?
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-blue-100">2:31 PM</span>
                    <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                      Auto-Reply
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Customer Response */}
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md p-3 sm:p-4 max-w-xs shadow-sm">
                  <p className="text-xs sm:text-sm text-gray-900">iPhone 14 Pro please. How much?</p>
                  <span className="text-xs text-gray-500 mt-2 block">2:32 PM</span>
                </div>
              </div>
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
                  />
                  <Button size="sm" variant="ghost" className="absolute right-1 top-1 h-6 w-6 sm:h-8 sm:w-8 p-0">
                    <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={isSending}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-8 sm:h-10 px-3 sm:px-4"
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
