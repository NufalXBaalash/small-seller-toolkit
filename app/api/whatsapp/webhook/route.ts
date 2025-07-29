import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "your_verify_token_123"

    // Handle webhook verification
    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified successfully")
      return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse("Forbidden", { status: 403 })
  } catch (error) {
    console.error("Webhook verification error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received webhook:", JSON.stringify(body, null, 2))

    // Handle different types of webhook events
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.value?.messages) {
            for (const message of change.value.messages) {
              await handleIncomingMessage(message, change.value.metadata)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const { from, text, type, timestamp } = message
    const { phone_number_id, display_name } = metadata

    console.log(`Received ${type} message from ${from}:`, text?.body || "No text content")

    // Here you would implement your message handling logic
    // For example:
    // - Store message in database
    // - Trigger auto-reply based on keywords
    // - Route to appropriate handler
    // - Update conversation status

    // For now, just log the message
    const messageData = {
      id: message.id,
      from,
      type,
      text: text?.body,
      timestamp: new Date(timestamp * 1000).toISOString(),
      phoneNumberId: phone_number_id,
      displayName: display_name,
    }

    console.log("Processed message:", messageData)

    // You could send an auto-reply here
    // await sendAutoReply(from, text?.body)

  } catch (error) {
    console.error("Error handling incoming message:", error)
  }
}

async function sendAutoReply(to: string, messageText?: string) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.error("Missing WhatsApp API credentials for auto-reply")
      return
    }

    // Simple auto-reply logic
    let replyText = "Thank you for your message! We'll get back to you soon."

    if (messageText) {
      const lowerText = messageText.toLowerCase()
      
      if (lowerText.includes("hello") || lowerText.includes("hi")) {
        replyText = "Hello! Welcome to Sellio. How can we help you today?"
      } else if (lowerText.includes("price") || lowerText.includes("cost")) {
        replyText = "For pricing information, please visit our website or contact our sales team."
      } else if (lowerText.includes("support") || lowerText.includes("help")) {
        replyText = "Our support team is here to help! Please describe your issue and we'll assist you."
      }
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace("+", ""),
        type: "text",
        text: {
          body: replyText,
        },
      }),
    })

    if (!response.ok) {
      console.error("Failed to send auto-reply:", await response.text())
    } else {
      console.log("Auto-reply sent successfully")
    }
  } catch (error) {
    console.error("Error sending auto-reply:", error)
  }
}
