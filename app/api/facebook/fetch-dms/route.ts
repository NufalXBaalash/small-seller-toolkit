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

    console.log('Fetching Facebook DMs for user:', user.id)

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
          // For user_profiles, we need to get the access token from environment
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

    // Fetch conversations from Facebook API
    const conversationsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/conversations?fields=participants,updated_time,unread_count&access_token=${accessToken}`
    )

    if (!conversationsResponse.ok) {
      const errorData = await conversationsResponse.text()
      console.error("Facebook conversations API error:", errorData)
      return NextResponse.json({
        error: "Failed to fetch Facebook conversations",
        details: errorData
      }, { status: 400 })
    }

    const conversationsData = await conversationsResponse.json()
    console.log('Facebook conversations fetched:', conversationsData)

    // Process conversations and store in database
    const conversations = conversationsData.data || []
    let processedCount = 0
    let errorCount = 0

    for (const conversation of conversations) {
      try {
        // Extract participant information
        const participants = conversation.participants?.data || []
        const customerId = participants.find(p => p.id !== pageId)?.id
        
        if (!customerId) continue

        // Get customer details
        const customerResponse = await fetch(
          `https://graph.facebook.com/v18.0/${customerId}?fields=name,profile_pic&access_token=${accessToken}`
        )
        
        let customerName = `Customer ${customerId}`
        if (customerResponse.ok) {
          const customerData = await customerResponse.json()
          customerName = customerData.name || customerName
        }

        // Get messages for this conversation
        const messagesResponse = await fetch(
          `https://graph.facebook.com/v18.0/${conversation.id}/messages?fields=id,from,to,message,created_time&access_token=${accessToken}&limit=10`
        )

        let lastMessage = "No messages"
        let lastMessageTime = conversation.updated_time

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          const messages = messagesData.data || []
          if (messages.length > 0) {
            const latestMessage = messages[0]
            lastMessage = latestMessage.message || "Media message"
            lastMessageTime = latestMessage.created_time
          }
        }

        // Store or update chat in database
        const { error: chatError } = await supabase
          .from("chats")
          .upsert({
            id: conversation.id,
            user_id: user.id,
            platform: "facebook",
            customer_username: customerId,
            last_message: lastMessage,
            unread_count: conversation.unread_count || 0,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date(lastMessageTime).toISOString()
          }, {
            onConflict: "id"
          })

        if (!chatError) {
          processedCount++
        } else {
          console.error('Error storing Facebook chat:', chatError)
          errorCount++
        }

      } catch (conversationError) {
        console.error('Error processing Facebook conversation:', conversationError)
        errorCount++
      }
    }

    console.log(`Facebook DMs processed: ${processedCount} successful, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: "Facebook DMs fetched successfully",
      data: {
        total_conversations: conversations.length,
        processed_count: processedCount,
        error_count: errorCount
      }
    })

  } catch (error) {
    console.error('Facebook fetch DMs error:', error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
