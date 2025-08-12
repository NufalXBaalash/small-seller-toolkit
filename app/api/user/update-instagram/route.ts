import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, instagramUsername, accessToken, businessName, connected } = await request.json()

    if (!userId || !instagramUsername || !accessToken) {
      return NextResponse.json(
        { error: "User ID, Instagram username, and access token are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // First, check if the user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Update or insert Instagram connection data
    // We'll store this in a new table or extend the existing user profile
    const { data: connectionData, error: connectionError } = await supabase
      .from("user_connections")
      .upsert({
        user_id: userId,
        platform: "instagram",
        platform_username: instagramUsername,
        access_token: accessToken, // In production, encrypt this
        business_name: businessName,
        connected: connected || true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,platform"
      })
      .select()
      .single()

    if (connectionError) {
      console.error("Error updating Instagram connection:", connectionError)
      
      // If the table doesn't exist, try updating the user profile directly
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .update({
          instagram_username: instagramUsername,
          instagram_connected: connected || true,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .select()
        .single()

      if (profileError) {
        return NextResponse.json(
          { error: "Failed to update Instagram connection" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Instagram connection updated successfully",
        data: profileData
      })
    }

    return NextResponse.json({
      success: true,
      message: "Instagram connection updated successfully",
      data: connectionData
    })

  } catch (error) {
    console.error("Update Instagram connection error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
