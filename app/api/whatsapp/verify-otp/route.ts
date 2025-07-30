import { type NextRequest, NextResponse } from "next/server"
import otpStorage from "@/lib/otp-storage"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json()

    if (!phoneNumber || !otp) {
      return NextResponse.json({ error: "Phone number and OTP are required" }, { status: 400 })
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "OTP must be 6 digits" }, { status: 400 })
    }

    // Get stored OTP data
    const storedData = otpStorage.get(phoneNumber)

    if (!storedData) {
      return NextResponse.json({ error: "OTP not found or expired. Please request a new one." }, { status: 400 })
    }

    // Check attempts limit
    if (storedData.attempts >= 3) {
      otpStorage.delete(phoneNumber)
      return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 400 })
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      otpStorage.incrementAttempts(phoneNumber)
      const remainingAttempts = 3 - (storedData.attempts + 1)
      return NextResponse.json(
        {
          error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
        },
        { status: 400 },
      )
    }

    // OTP verified successfully - clean up
    otpStorage.delete(phoneNumber)

    console.log(`Phone number verified successfully: ${phoneNumber}`)

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
    })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
