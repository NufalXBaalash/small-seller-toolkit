import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

    const isConfigured = !!(accessToken && phoneNumberId && verifyToken)

    if (!isConfigured) {
      return NextResponse.json({
        status: "not_configured",
        message: "WhatsApp API not configured",
        configured: false,
      })
    }

    // Test the API connection by making a simple request
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        return NextResponse.json({
          status: "error",
          message: "WhatsApp API connection failed",
          configured: true,
          connected: false,
          error: `HTTP ${response.status}`,
        })
      }

      const data = await response.json()

      return NextResponse.json({
        status: "connected",
        message: "WhatsApp API is connected and ready",
        configured: true,
        connected: true,
        phoneNumberId: data.id,
        name: data.name,
        code_verification_status: data.code_verification_status,
        quality_rating: data.quality_rating,
      })
    } catch (error) {
      return NextResponse.json({
        status: "error",
        message: "Failed to connect to WhatsApp API",
        configured: true,
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  } catch (error) {
    console.error("Error checking WhatsApp status:", error)
    return NextResponse.json({
      status: "error",
      message: "Internal server error",
      configured: false,
      connected: false,
    }, { status: 500 })
  }
} 