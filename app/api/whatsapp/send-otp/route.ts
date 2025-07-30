import { type NextRequest, NextResponse } from "next/server"
import otpStorage from "@/lib/otp-storage"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // Check if there's already a recent OTP for this number
    const existingOTP = otpStorage.get(phoneNumber)
    if (existingOTP) {
      return NextResponse.json(
        {
          error: "OTP already sent. Please wait before requesting a new one.",
          remainingTime: Math.ceil((existingOTP.expiresAt - Date.now()) / 1000),
        },
        { status: 429 },
      )
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP with 5-minute expiration
    otpStorage.set(phoneNumber, otp, 5)

    // Simulate WhatsApp Business API call
    const whatsappResponse = await simulateWhatsAppAPI(phoneNumber, otp)

    if (!whatsappResponse.success) {
      // Clean up stored OTP if sending failed
      otpStorage.delete(phoneNumber)
      return NextResponse.json({ error: "Failed to send OTP via WhatsApp" }, { status: 500 })
    }

    console.log(`OTP sent to ${phoneNumber}: ${otp}`) // For development

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // Only include OTP in development mode
      debug: process.env.NODE_ENV === "development" ? { otp } : undefined,
    })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function simulateWhatsAppAPI(phoneNumber: string, otp: string) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real implementation, this would be:
    /*
    const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: 'verification_code',
          language: { code: 'en_US' },
          components: [{
            type: 'body',
            parameters: [{ type: 'text', text: otp }]
          }]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.messages[0].id };
    */

    // Simulate success response for demo
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  } catch (error) {
    console.error("WhatsApp API simulation error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
