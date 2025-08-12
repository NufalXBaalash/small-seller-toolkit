import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  // Instagram webhook verification
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Verify token should match your app's verify token
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || "your_instagram_verify_token_123"

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Instagram webhook verified")
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Instagram webhook received:", body)

    const supabase = createServerClient()

    // Handle different types of Instagram webhook events
    if (body.object === "instagram" && body.entry) {
      for (const entry of body.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await handleInstagramMessage(messagingEvent, supabase)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Instagram webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleInstagramMessage(messagingEvent: any, supabase: any) {
  try {
    const { sender, recipient, message, timestamp } = messagingEvent

    if (!message || !sender || !recipient) {
      return
    }

    // Find the user who owns this Instagram account
    const { data: connection, error: connectionError } = await supabase
      .from("user_connections")
      .select("user_id, platform_username")
      .eq("platform", "instagram")
      .eq("platform_username", recipient.username)
      .eq("connected", true)
      .single()

    if (connectionError || !connection) {
      console.log("No connected user found for Instagram account:", recipient.username)
      return
    }

    const userId = connection.user_id
    const senderUsername = sender.username || sender.id

    // Create or get chat
    const chatId = `instagram_${userId}_${senderUsername}`
    
    // Check if chat exists
    let { data: existingChat } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .single()

    if (!existingChat) {
      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({
          id: chatId,
          user_id: userId,
          platform: "instagram",
          customer_username: senderUsername,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (chatError) {
        console.error("Error creating chat:", chatError)
        return
      }
    }

    // Store the message
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_type: "customer",
        content: message.text || "Media message",
        message_type: message.text ? "text" : "media",
        platform: "instagram",
        sender_username: senderUsername,
        created_at: new Date(timestamp).toISOString()
      })

    if (messageError) {
      console.error("Error storing Instagram message:", messageError)
    }

    // Update chat's last message and timestamp
    await supabase
      .from("chats")
      .update({
        last_message: message.text || "Media message",
        updated_at: new Date().toISOString(),
        unread_count: supabase.sql`unread_count + 1`
      })
      .eq("id", chatId)

  } catch (error) {
    console.error("Error handling Instagram message:", error)
  }
}
