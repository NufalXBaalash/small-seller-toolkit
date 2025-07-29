import { type NextRequest, NextResponse } from "next/server"
import { validateWhatsAppConfig, getWebhookUrl } from "@/lib/whatsapp-config"

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const validation = validateWhatsAppConfig()
    
    if (!validation.isValid) {
      return NextResponse.json({
        connected: false,
        error: "Missing configuration",
        missing: validation.missing,
        webhookUrl: getWebhookUrl(),
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "Not configured"
      })
    }

    // Test WhatsApp API connection
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!

    try {
      // Test API by getting phone number info
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        return NextResponse.json({
          connected: false,
          error: "WhatsApp API connection failed",
          status: response.status,
          webhookUrl: getWebhookUrl(),
          verifyToken: process.env.WHATSAPP_VERIFY_TOKEN
        })
      }

      const data = await response.json()
      
      return NextResponse.json({
        connected: true,
        phoneNumber: data.phone_number,
        displayName: data.display_name,
        webhookUrl: getWebhookUrl(),
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
        status: "Connected and ready"
      })

    } catch (error) {
      return NextResponse.json({
        connected: false,
        error: "Failed to test WhatsApp API",
        details: error instanceof Error ? error.message : "Unknown error",
        webhookUrl: getWebhookUrl(),
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN
      })
    }

  } catch (error) {
    console.error("Error checking WhatsApp status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 