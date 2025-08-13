import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { chatId, message, messageType = "text" } = await request.json()

    if (!chatId || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: chatId and message are required' 
      }, { status: 400 })
    }

    console.log('Sending Facebook message for user:', user.id, 'to chat:', chatId)

    // Get user's Facebook connection details
    let facebookConnection = null
    let pageId = null
    let accessToken = null

    // Try to get from user_connections table first
    try {
      const { data: connectionsData, error: connError } = await supabase
        .from("user_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", "facebook")
        .eq("connected", true)
        .single()

      if (!connError && connectionsData) {
        facebookConnection = connectionsData
        pageId = connectionsData.platform_username
        accessToken = connectionsData.access_token
      }
    } catch (error) {
      console.log('user_connections table not available or no Facebook connection found')
    }

    // If not found in user_connections, try user_profiles table
    if (!facebookConnection) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("facebook_page_id, facebook_connected")
          .eq("user_id", user.id)
          .eq("facebook_connected", true)
          .single()

        if (!profileError && profileData) {
          pageId = profileData.facebook_page_id
          accessToken = process.env.FACEBOOK_ACCESS_TOKEN
        }
      } catch (error) {
        console.log('user_profiles table not available or no Facebook connection found')
      }
    }

    // If still not found, try users table
    if (!facebookConnection && !pageId) {
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("facebook_page_id, facebook_connected")
          .eq("id", user.id)
          .eq("facebook_connected", true)
          .single()

        if (!userError && userData) {
          pageId = userData.facebook_page_id
          accessToken = process.env.FACEBOOK_ACCESS_TOKEN
        }
      } catch (error) {
        console.log('users table not available or no Facebook connection found')
      }
    }

    if (!pageId || !accessToken) {
      return NextResponse.json({
        error: "Facebook connection not found or incomplete",
        suggestion: "Please connect your Facebook Page first in the Settings page"
      }, { status: 400 })
    }

    // Get the recipient ID from the chat
    // For Facebook, the chatId might be the conversation ID, we need to extract the recipient
    const recipientId = chatId.includes('_') ? chatId.split('_')[1] : chatId

    // Send message via Facebook Graph API
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        access_token: accessToken,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Facebook send message API error:", errorData)
      return NextResponse.json({
        error: "Failed to send Facebook message",
        details: errorData
      }, { status: 400 })
    }

    const result = await response.json()
    console.log('Facebook message sent successfully:', result)

    // Store the message in the database
    try {
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_type: "business",
          content: message,
          message_type: messageType,
          platform: "facebook",
          is_read: false,
          created_at: new Date().toISOString()
        })

      if (messageError) {
        console.error('Error storing Facebook message:', messageError)
      }
    } catch (dbError) {
      console.error('Error storing Facebook message in database:', dbError)
    }

    return NextResponse.json({
      success: true,
      message: "Facebook message sent successfully",
      data: {
        message_id: result.message_id,
        recipient_id: recipientId
      }
    })

  } catch (error) {
    console.error('Facebook send message error:', error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
