import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ 
        error: "Phone number is required" 
      }, { status: 400 })
    }

    // Check environment variables
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.error("Missing WhatsApp API credentials")
      return NextResponse.json({ 
        error: "WhatsApp API not configured. Please contact support." 
      }, { status: 500 })
    }

    // Test the WhatsApp Business API connection
    const testMessage = `🎉 WhatsApp connection successful! 

Your Sellio account is now connected and ready to automate your customer conversations.

You'll receive automated responses and can manage all your customer interactions from your Sellio dashboard.

Thank you for choosing Sellio! 🚀`

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber.replace("+", ""),
        type: "text",
        text: {
          body: testMessage,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("WhatsApp API error:", error)
      
      // Handle specific error cases with user-friendly messages
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Invalid WhatsApp access token. Please check your API credentials.",
            details: error,
          },
          { status: 401 },
        )
      } else if (response.status === 403) {
        return NextResponse.json(
          {
            error: "WhatsApp API permissions denied. Please check your app permissions.",
            details: error,
          },
          { status: 403 },
        )
      } else if (response.status === 400) {
        return NextResponse.json(
          {
            error: "Invalid phone number or message format. Please check the phone number.",
            details: error,
          },
          { status: 400 },
        )
      } else if (response.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded. Please wait a moment before trying again.",
            details: error,
          },
          { status: 429 },
        )
      }
      
      return NextResponse.json(
        {
          error: "Failed to connect to WhatsApp. Please try again later.",
          details: error,
        },
        { status: 400 },
      )
    }

    const data = await response.json()
    console.log("Test message sent successfully:", data)

    return NextResponse.json({
      success: true,
      message: "WhatsApp connection test successful",
      messageId: data.messages?.[0]?.id || `msg_${Date.now()}`,
      connected: true,
    })
  } catch (error) {
    console.error("Error testing WhatsApp connection:", error)
    return NextResponse.json({ 
      error: "Internal server error. Please try again." 
    }, { status: 500 })
  }
}
