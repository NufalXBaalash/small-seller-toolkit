import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, recipientUsername, message, messageType = "text" } = await request.json()

    if (!userId || !recipientUsername || !message) {
      return NextResponse.json(
        { error: "User ID, recipient username, and message are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get the user's Instagram connection
    const { data: connection, error: connectionError } = await supabase
      .from("user_connections")
      .select("access_token, platform_username")
      .eq("user_id", userId)
      .eq("platform", "instagram")
      .eq("connected", true)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Instagram not connected. Please connect your Instagram account first." },
        { status: 400 }
      )
    }

    // In production, you would make an actual Instagram API call here
    // For now, we'll simulate the message sending
    try {
      // Simulate Instagram API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Store the message in the database
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          chat_id: `instagram_${userId}_${recipientUsername}`,
          sender_type: "business",
          content: message,
          message_type: messageType,
          platform: "instagram",
          recipient_username: recipientUsername,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (messageError) {
        console.error("Error storing message:", messageError)
        // Continue even if storing fails
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
        data: {
          messageId: messageData?.id,
          timestamp: new Date().toISOString(),
          platform: "instagram",
          recipient: recipientUsername
        }
      })

    } catch (apiError) {
      console.error("Instagram API error:", apiError)
      return NextResponse.json(
        { error: "Failed to send message via Instagram. Please try again." },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Send Instagram message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
