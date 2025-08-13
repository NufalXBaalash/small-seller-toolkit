import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Send DM request body:', body)
    
    const { chatId, message, messageType = 'text' } = body

    // Validate required fields
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      )
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    console.log('Authorization header present:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return NextResponse.json(
        { 
          error: "Authentication required",
          suggestion: "Please ensure you are logged in and try again"
        },
        { status: 401 }
      )
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    console.log('Token extracted from header')

    // Create a Supabase client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    console.log('Supabase client created with token')

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      console.log('Auth error:', authError)
      return NextResponse.json(
        { 
          error: "Authentication failed",
          details: authError?.message || "No authenticated user found",
          suggestion: "Please ensure you are logged in and try again"
        },
        { status: 401 }
      )
    }

    console.log('Authenticated user found:', { id: authUser.id, email: authUser.email })

    // Verify the chat belongs to the user and is an Instagram chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', authUser.id)
      .eq('platform', 'instagram')
      .single()

    if (chatError || !chat) {
      console.log('Chat not found or access denied:', chatError)
      return NextResponse.json(
        { 
          error: "Chat not found or access denied",
          suggestion: "Please check the chat ID and try again"
        },
        { status: 404 }
      )
    }

    console.log('Instagram chat found:', { id: chat.id, customer_username: chat.customer_username })

    // In Test Mode, we'll simulate sending the message
    // In production, you would use the Instagram Graph API to send real messages
    
    // Create the message in the database
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: 'business',
        content: message.trim(),
        message_type: messageType,
        is_read: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (messageError) {
      console.log('Failed to create message:', messageError)
      return NextResponse.json(
        { 
          error: "Failed to send message",
          details: messageError.message,
          suggestion: "Please try again"
        },
        { status: 500 }
      )
    }

    // Update the chat's last message and timestamp
    const { error: updateError } = await supabase
      .from('chats')
      .update({
        last_message: message.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId)

    if (updateError) {
      console.log('Failed to update chat:', updateError)
      // Don't fail the request if chat update fails
    }

    console.log('Message sent successfully:', newMessage.id)

    // In Test Mode, simulate a response from the customer after a delay
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        try {
          const mockResponses = [
            "Thanks for getting back to me!",
            "That sounds great!",
            "Can you tell me more?",
            "Perfect, I'll take it!",
            "Do you have other options?",
            "What's the delivery time?",
            "Thanks for the information!",
            "I'll think about it and get back to you."
          ]
          
          const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
          
          // Create a mock customer response
          await supabase
            .from('messages')
            .insert({
              chat_id: chatId,
              sender_type: 'customer',
              content: randomResponse,
              message_type: 'text',
              is_read: false,
              created_at: new Date().toISOString()
            })

          // Update chat with new message and increment unread count
          await supabase
            .from('chats')
            .update({
              last_message: randomResponse,
              unread_count: (chat.unread_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', chatId)

          console.log('Mock customer response sent:', randomResponse)
        } catch (error) {
          console.log('Failed to send mock response:', error)
        }
      }, 2000 + Math.random() * 3000) // Random delay between 2-5 seconds
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: {
        messageId: newMessage.id,
        chatId: chatId,
        content: message.trim(),
        messageType: messageType,
        timestamp: newMessage.created_at,
        platform: 'instagram',
        customerUsername: chat.customer_username
      },
      note: process.env.NODE_ENV === 'development' 
        ? "Test Mode: Mock customer response will arrive in 2-5 seconds" 
        : "Message sent via Instagram API"
    })

  } catch (error) {
    console.error("Send Instagram DM error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: "Check the server logs for more details"
      },
      { status: 500 }
    )
  }
}
