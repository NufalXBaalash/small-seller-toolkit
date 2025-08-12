import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log('Instagram connect API called')
    const { userId, instagramUsername, accessToken, businessName, connected } = await request.json()

    console.log('Request data:', { userId, instagramUsername, businessName, connected })

    if (!userId || !instagramUsername || !accessToken) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: "User ID, Instagram username, and access token are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    console.log('Supabase client created')

    // First, check if the user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.log('User not found:', userError)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    console.log('User found, attempting to create/update Instagram connection')

    // Update or insert Instagram connection data
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
      console.log('Trying fallback to user_profiles table')
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
        console.error('Profile update also failed:', profileError)
        return NextResponse.json(
          { error: "Failed to update Instagram connection" },
          { status: 500 }
        )
      }

      console.log('Instagram connection updated via user_profiles table')
      return NextResponse.json({
        success: true,
        message: "Instagram connection updated successfully",
        data: profileData
      })
    }

    console.log('Instagram connection updated via user_connections table')
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
