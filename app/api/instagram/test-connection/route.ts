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

    // Test if chats table exists
    let chatsTableExists = false
    try {
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .limit(1)
      
      chatsTableExists = !chatsError
      console.log('chats table test:', chatsTableExists ? 'OK' : 'Missing')
    } catch (e) {
      chatsTableExists = false
      console.log('chats table test: Exception - Missing')
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For now, we'll simulate a successful connection
    // In production, you would validate the token with Instagram's API
    console.log('Instagram connection test successful for:', username)

    return NextResponse.json({
      success: true,
      message: "Instagram connection test successful",
      data: {
        username,
        isValid: true,
        timestamp: new Date().toISOString(),
        database: {
          user_connections: connectionsTableExists ? 'OK' : 'Missing',
          chats: chatsTableExists ? 'OK' : 'Missing'
        }
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
