import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    console.log('Authorization header present:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header')
      return NextResponse.json(
        { 
          error: "Authentication required",
          suggestion: "Please ensure you are logged in and try again"
        },
        { status: 401 }
      )
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')
    console.log('Token extracted from header')

    // Create a Supabase client with the user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    console.log('Supabase client created with token')

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      console.log('Auth error:', authError)
      return NextResponse.json(
        { 
          error: "Authentication failed",
          details: authError?.message || "No authenticated user found",
          suggestion: "Please ensure you are logged in and try again"
        },
        { status: 401 }
      )
    }

    console.log('Authenticated user found:', { id: authUser.id, email: authUser.email })

    // Check user_connections table
    const { data: userConnections, error: connectionsError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('platform', 'instagram')

    console.log('User connections data:', userConnections)
    console.log('User connections error:', connectionsError)
    
    // Log the first connection details if it exists
    if (userConnections && userConnections.length > 0) {
      console.log('First Instagram connection details:', userConnections[0])
    }

    // Check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // Check existing chats
    const { data: existingChats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('platform', 'instagram')

    return NextResponse.json({
      success: true,
      message: "Debug information retrieved",
      data: {
        user_id: authUser.id,
        user_email: authUser.email,
        user_connections: {
          data: userConnections,
          error: connectionsError?.message,
          count: userConnections?.length || 0
        },
        user_table: {
          data: userData,
          error: userError?.message,
          instagram_username: userData?.instagram_username,
          instagram_connected: userData?.instagram_connected
        },
        existing_chats: {
          data: existingChats,
          error: chatsError?.message,
          count: existingChats?.length || 0
        }
      }
    })

  } catch (error) {
    console.error("Debug connection error:", error)
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
