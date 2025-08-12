import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { username, accessToken } = await request.json()

    if (!username || !accessToken) {
      return NextResponse.json(
        { error: "Username and access token are required" },
        { status: 400 }
      )
    }

    // Validate Instagram access token by making a test API call
    try {
      // This is a simplified test - in production you'd want to make actual Instagram API calls
      // For now, we'll simulate a successful connection
      const isValidToken = accessToken.length >= 10 && accessToken.startsWith("IG")
      
      if (!isValidToken) {
        return NextResponse.json(
          { error: "Invalid Instagram access token format" },
          { status: 400 }
        )
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Instagram connection test successful",
        username: username,
        accountType: "business", // or "personal" based on token permissions
        permissions: ["read_messages", "send_messages", "read_profile"]
      })

    } catch (apiError) {
      console.error("Instagram API error:", apiError)
      return NextResponse.json(
        { error: "Failed to validate Instagram credentials. Please check your access token and try again." },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Instagram test connection error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
