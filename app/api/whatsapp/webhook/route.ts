import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  // Verify webhook
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Webhook verified successfully")
    return new Response(challenge, { status: 200 })
  }

  return new Response("Forbidden", { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Webhook received:", JSON.stringify(body, null, 2))

    // Check if this is a WhatsApp message
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            await handleWhatsAppMessage(change.value)
          }
        }
      }
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleWhatsAppMessage(messageData: any) {
  const supabase = createServerClient()

  try {
    // Extract message information
    const messages = messageData.messages || []
    const contacts = messageData.contacts || []

    for (const message of messages) {
      const contact = contacts.find((c: any) => c.wa_id === message.from)
      const customerName = contact?.profile?.name || `Customer ${message.from}`
      const customerPhone = message.from

      console.log(`Processing message from ${customerName} (${customerPhone})`)

      // Find or create customer
      let { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("phone_number", `+${customerPhone}`)
        .single()

      if (!customer) {
        // Create new customer - we'll need to associate with a user
        // For now, we'll use the first user in the system
        const { data: firstUser } = await supabase.from("users").select("id").limit(1).single()

        if (firstUser) {
          const { data: newCustomer } = await supabase
            .from("customers")
            .insert({
              user_id: firstUser.id,
              name: customerName,
              phone_number: `+${customerPhone}`,
              platform: "whatsapp",
              status: "active",
            })
            .select()
            .single()

          customer = newCustomer
        }
      }

      if (customer) {
        // Find or create chat
        let { data: chat } = await supabase
          .from("chats")
          .select("*")
          .eq("customer_id", customer.id)
          .eq("platform", "whatsapp")
          .single()

        if (!chat) {
          const { data: newChat } = await supabase
            .from("chats")
            .insert({
              user_id: customer.user_id,
              customer_id: customer.id,
              platform: "whatsapp",
              status: "active",
            })
            .select()
            .single()

          chat = newChat
        }

        if (chat) {
          // Extract message content
          let messageContent = ""
          if (message.type === "text") {
            messageContent = message.text.body
          } else if (message.type === "image") {
            messageContent = `[Image] ${message.image.caption || ""}`
          } else if (message.type === "document") {
            messageContent = `[Document] ${message.document.filename || ""}`
          } else {
            messageContent = `[${message.type}] message`
          }

          // Save message
          await supabase.from("messages").insert({
            chat_id: chat.id,
            sender_type: "customer",
            content: messageContent,
            message_type: message.type,
            is_read: false,
          })

          // Update chat with last message and increment unread count
          await supabase
            .from("chats")
            .update({
              last_message: messageContent,
              unread_count: (chat.unread_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", chat.id)

          // Update customer last order date
          await supabase
            .from("customers")
            .update({
              updated_at: new Date().toISOString(),
            })
            .eq("id", customer.id)

          console.log(`Message saved successfully for chat ${chat.id}`)

          // Check for auto-reply triggers
          await handleAutoReply(chat, customer, messageContent)
        }
      }
    }
  } catch (error) {
    console.error("Error handling WhatsApp message:", error)
  }
}

async function handleAutoReply(chat: any, customer: any, messageContent: string) {
  const supabase = createServerClient()

  try {
    // Simple auto-reply logic
    const lowerMessage = messageContent.toLowerCase()
    let replyMessage = ""

    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("oi")) {
      replyMessage = `Hello ${customer.name}! 👋 Thanks for contacting us. How can I help you today?`
    } else if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("preço")) {
      replyMessage =
        "I'd be happy to help you with pricing! Could you please let me know which product you're interested in?"
    } else if (lowerMessage.includes("order") || lowerMessage.includes("buy") || lowerMessage.includes("comprar")) {
      replyMessage = "Great! I can help you place an order. What would you like to purchase?"
    } else if (
      lowerMessage.includes("delivery") ||
      lowerMessage.includes("shipping") ||
      lowerMessage.includes("entrega")
    ) {
      replyMessage =
        "Our standard delivery time is 2-3 business days. Would you like to know more about our shipping options?"
    } else {
      // Default auto-reply
      replyMessage = "Thanks for your message! I'll get back to you as soon as possible. 😊"
    }

    // Send auto-reply via WhatsApp API
    await sendWhatsAppMessage(customer.phone_number.replace("+", ""), replyMessage)

    // Save auto-reply message to database
    await supabase.from("messages").insert({
      chat_id: chat.id,
      sender_type: "auto",
      content: replyMessage,
      message_type: "text",
      is_read: true,
    })

    console.log(`Auto-reply sent to ${customer.name}`)
  } catch (error) {
    console.error("Error sending auto-reply:", error)
  }
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: {
          body: message,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("WhatsApp API error:", error)
      throw new Error(`WhatsApp API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Message sent successfully:", data)
    return data
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    throw error
  }
}
