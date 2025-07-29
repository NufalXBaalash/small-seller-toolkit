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
      return NextResponse.json({ 
        error: "Invalid phone number format. Please include country code (e.g., +1234567890)" 
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

    // Check if there's already a recent OTP for this number
    const existingOTP = otpStorage.get(phoneNumber)
    if (existingOTP) {
      const remainingTime = Math.ceil((existingOTP.expiresAt - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: "OTP already sent. Please wait before requesting a new one.",
          remainingTime,
          message: `Please wait ${Math.ceil(remainingTime / 60)} minutes before requesting a new OTP`
        },
        { status: 429 },
      )
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP with 5-minute expiration
    otpStorage.set(phoneNumber, otp, 5)

    // Send OTP via WhatsApp Business API
    const whatsappResponse = await sendWhatsAppOTP(phoneNumber, otp)

    if (!whatsappResponse.success) {
      // Clean up stored OTP if sending failed
      otpStorage.delete(phoneNumber)
      return NextResponse.json({ 
        error: whatsappResponse.error || "Failed to send OTP via WhatsApp" 
      }, { status: 500 })
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
    return NextResponse.json({ 
      error: "Internal server error. Please try again." 
    }, { status: 500 })
  }
}

async function sendWhatsAppOTP(phoneNumber: string, otp: string) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN!
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!

    // Create a more professional message
    const messageBody = `🔐 Sellio Verification Code

Your verification code is: ${otp}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this message.

Thank you,
The Sellio Team`

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
          body: messageBody,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("WhatsApp API error:", errorData)
      
      // Handle specific error cases with user-friendly messages
      if (response.status === 401) {
        throw new Error("Invalid WhatsApp access token. Please check your API configuration.")
      } else if (response.status === 403) {
        throw new Error("WhatsApp API permissions denied. Please check your app permissions.")
      } else if (response.status === 400) {
        throw new Error("Invalid phone number or message format. Please check the phone number.")
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment before trying again.")
      }
      
      throw new Error(`WhatsApp API error (${response.status}): ${errorData}`)
    }

    const data = await response.json()
    console.log("WhatsApp OTP sent successfully:", data)

    return {
      success: true,
      messageId: data.messages?.[0]?.id || `msg_${Date.now()}`,
    }
  } catch (error) {
    console.error("WhatsApp API error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send message via WhatsApp" 
    }
  }
}
