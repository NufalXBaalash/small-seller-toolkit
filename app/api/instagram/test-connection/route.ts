import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { username, accessToken } = await request.json()

    console.log('Testing Instagram connection for username:', username)

    if (!username || !accessToken) {
      return NextResponse.json(
        { error: "Username and access token are required" },
        { status: 400 }
      )
    }

    // Basic validation
    if (username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long" },
        { status: 400 }
      )
    }

    if (accessToken.trim().length < 10) {
      return NextResponse.json(
        { error: "Access token must be at least 10 characters long" },
        { status: 400 }
      )
    }

    // Test database connection and tables
    const supabase = createServerClient()
    
    // Test if user_connections table exists
    let connectionsTableExists = false
    try {
      const { data: connections, error: connectionsError } = await supabase
        .from('user_connections')
        .select('*')
        .limit(1)
      
      connectionsTableExists = !connectionsError
      console.log('user_connections table test:', connectionsTableExists ? 'OK' : 'Missing')
    } catch (e) {
      connectionsTableExists = false
      console.log('user_connections table test: Exception - Missing')
    }

    // Test if users table exists and has Instagram fields
    let usersTableExists = false
    let instagramFieldsExist = false
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, instagram_username, instagram_connected')
        .limit(1)
      
      usersTableExists = !usersError
      if (usersTableExists) {
        // Check if Instagram fields exist by trying to access them
        instagramFieldsExist = true
      }
      console.log('users table test:', usersTableExists ? 'OK' : 'Missing')
      console.log('Instagram fields test:', instagramFieldsExist ? 'OK' : 'Missing')
    } catch (e) {
      usersTableExists = false
      instagramFieldsExist = false
      console.log('users table test: Exception - Missing')
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For Test Mode, we'll simulate a successful connection
    // In production, you would validate the token with Instagram's API
    console.log('Instagram connection test successful for:', username)

    return NextResponse.json({
      success: true,
      message: "Instagram connection test successful for Test Mode",
      data: {
        username,
        isValid: true,
        testMode: true,
        timestamp: new Date().toISOString(),
        database: {
          user_connections: connectionsTableExists ? 'OK' : 'Missing',
          users_table: usersTableExists ? 'OK' : 'Missing',
          instagram_fields: instagramFieldsExist ? 'OK' : 'Missing'
        },
        limitations: [
          "Test Mode: Limited to test users only",
          "Basic authentication only",
          "No access to real user data",
          "No business features or DMs"
        ]
      }
    })

  } catch (error) {
    console.error("Instagram connection test error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
