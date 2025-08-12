import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Instagram connect-v2 endpoint is accessible",
    timestamp: new Date().toISOString(),
    endpoint: "/api/instagram/connect-v2"
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('Instagram connect-v2 API called')
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

    // Try to update user_connections table first
    let connectionSuccess = false
    let connectionData = null

    try {
      const { data: connectionsData, error: connectionError } = await supabase
        .from("user_connections")
        .upsert({
          user_id: userId,
          platform: "instagram",
          platform_username: instagramUsername,
          access_token: accessToken,
          business_name: businessName,
          connected: connected || true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,platform"
        })
        .select()
        .single()

      if (!connectionError) {
        console.log('Instagram connection updated via user_connections table')
        connectionSuccess = true
        connectionData = connectionsData
      } else {
        console.log('user_connections table error:', connectionError)
      }
    } catch (connectionsError) {
      console.log('user_connections table not available:', connectionsError)
    }

    // If user_connections table failed, try updating the user profile directly
    if (!connectionSuccess) {
      console.log('Trying fallback to user_profiles table')
      
      try {
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

        if (!profileError) {
          console.log('Instagram connection updated via user_profiles table')
          connectionSuccess = true
          connectionData = profileData
        } else {
          console.log('user_profiles table error:', profileError)
        }
      } catch (profileError) {
        console.log('user_profiles table not available:', profileError)
      }
    }

    // If both tables failed, try updating the users table directly
    if (!connectionSuccess) {
      console.log('Trying fallback to users table')
      
      try {
        const { data: userData, error: userUpdateError } = await supabase
          .from("users")
          .update({
            instagram_username: instagramUsername,
            instagram_connected: connected || true,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId)
          .select()
          .single()

        if (!userUpdateError) {
          console.log('Instagram connection updated via users table')
          connectionSuccess = true
          connectionData = userData
        } else {
          console.log('users table update error:', userUpdateError)
        }
      } catch (userError) {
        console.log('users table update failed:', userError)
      }
    }

    if (connectionSuccess) {
      return NextResponse.json({
        success: true,
        message: "Instagram connection updated successfully",
        data: connectionData
      })
    } else {
      console.error("All connection update methods failed")
      return NextResponse.json(
        { error: "Failed to update Instagram connection. Please check your database setup." },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Update Instagram connection error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
