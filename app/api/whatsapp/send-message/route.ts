import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, userId } = await request.json()

    if (!chatId || !message || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get chat and customer information
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select(`
        *,
        customers (*)
      `)
      .eq("id", chatId)
      .eq("user_id", userId)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const customer = chat.customers
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Send message via WhatsApp API
    const phoneNumber = customer.phone_number.replace("+", "")
    await sendWhatsAppMessage(phoneNumber, message)

    // Save message to database
    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_type: "business",
      content: message,
      message_type: "text",
      is_read: true,
    })

    // Update chat last message
    await supabase
      .from("chats")
      .update({
        last_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
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

  return response.json()
}
