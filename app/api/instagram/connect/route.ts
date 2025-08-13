import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Explicitly export both GET and POST methods
export async function GET(request: NextRequest) {
  console.log('Instagram connect GET method called')
  
  return NextResponse.json({
    success: true,
    message: "Instagram connect endpoint is accessible",
    timestamp: new Date().toISOString(),
    endpoint: "/api/instagram/connect",
    method: "GET"
  })
}

export async function POST(request: NextRequest) {
  console.log('Instagram connect POST method called')
  
  try {
    const body = await request.json()
    console.log('Request body:', body)
    
    const { userId, instagramUsername, accessToken, businessName, connected } = body

    console.log('Parsed request data:', { userId, instagramUsername, businessName, connected })

    // Validate required fields
    if (!userId) {
      console.log('Missing userId')
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    if (!instagramUsername) {
      console.log('Missing instagramUsername')
      return NextResponse.json(
        { error: "Instagram username is required" },
        { status: 400 }
      )
    }

    if (!accessToken) {
      console.log('Missing accessToken')
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    console.log('Supabase client created')

    // First, check if the user exists and get user details
    console.log('Looking up user with ID:', userId)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, created_at")
      .eq("id", userId)
      .single()

    if (userError) {
      console.log('User lookup error:', userError)
      return NextResponse.json(
        { 
          error: "User not found",
          details: userError.message,
          userId: userId,
          suggestion: "Please ensure you are logged in and try again"
        },
        { status: 404 }
      )
    }

    if (!user) {
      console.log('No user returned from database')
      return NextResponse.json(
        { 
          error: "User not found",
          details: "No user data returned from database",
          userId: userId
        },
        { status: 404 }
      )
    }

    console.log('User found:', { id: user.id, email: user.email, created_at: user.created_at })

    // Try to update user_connections table first
    let connectionSuccess = false
    let connectionData = null
    let connectionError = null
    let connectionMethod = ''

    try {
      console.log('Attempting to use user_connections table...')
      const { data: connectionsData, error: connError } = await supabase
        .from("user_connections")
        .upsert({
          user_id: userId,
          platform: "instagram",
          platform_username: instagramUsername,
          access_token: accessToken,
          business_name: businessName || "My Business",
          connected: connected !== undefined ? connected : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,platform"
        })
        .select()
        .single()

      if (!connError) {
        console.log('Instagram connection updated via user_connections table')
        connectionSuccess = true
        connectionData = connectionsData
        connectionMethod = 'user_connections_table'
      } else {
        connectionError = connError
        console.log('user_connections table error:', connError)
      }
    } catch (connectionsError) {
      connectionError = connectionsError
      console.log('user_connections table not available:', connectionsError)
    }

    // If user_connections table failed, try updating the user profile directly
    if (!connectionSuccess) {
      console.log('Trying fallback to user_profiles table...')
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .update({
            instagram_username: instagramUsername,
            instagram_connected: connected !== undefined ? connected : true,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)
          .select()
          .single()

        if (!profileError) {
          console.log('Instagram connection updated via user_profiles table')
          connectionSuccess = true
          connectionData = profileData
          connectionMethod = 'user_profiles_table'
        } else {
          console.log('user_profiles table error:', profileError)
        }
      } catch (profileError) {
        console.log('user_profiles table not available:', profileError)
      }
    }

    // If both tables failed, try updating the users table directly
    if (!connectionSuccess) {
      console.log('Trying fallback to users table...')
      
      try {
        const { data: userData, error: userUpdateError } = await supabase
          .from("users")
          .update({
            instagram_username: instagramUsername,
            instagram_connected: connected !== undefined ? connected : true,
            updated_at: new Date().toISOString()
          })
          .eq("id", userId)
          .select()
          .single()

        if (!userUpdateError) {
          console.log('Instagram connection updated via users table')
          connectionSuccess = true
          connectionData = userData
          connectionMethod = 'users_table'
        } else {
          console.log('users table update error:', userUpdateError)
        }
      } catch (userError) {
        console.log('users table update failed:', userError)
      }
    }

    if (connectionSuccess) {
      console.log('Instagram connection successful using method:', connectionMethod)
      return NextResponse.json({
        success: true,
        message: "Instagram connection updated successfully",
        data: connectionData,
        method: connectionMethod,
        user: {
          id: user.id,
          email: user.email
        },
        instagram: {
          username: instagramUsername,
          connected: connected !== undefined ? connected : true
        }
      })
    } else {
      console.error("All connection update methods failed")
      
      // Provide detailed error information
      const errorDetails = {
        user_connections_error: connectionError?.message || 'Table not available or update failed',
        user_profiles_error: 'Table not available or update failed',
        users_table_error: 'Update failed'
      }
      
      return NextResponse.json(
        { 
          error: "Failed to update Instagram connection. Database setup may be incomplete.",
          details: errorDetails,
          suggestion: "Please run the Instagram setup script again or check database structure.",
          debug: {
            userId: userId,
            userFound: !!user,
            tablesTried: ['user_connections', 'user_profiles', 'users'],
            connectionMethod: connectionMethod
          }
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Update Instagram connection error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: "Check the server logs for more details"
      },
      { status: 500 }
    )
  }
}
