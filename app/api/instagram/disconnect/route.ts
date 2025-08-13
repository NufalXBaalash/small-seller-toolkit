import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
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

    // First check if Instagram connection exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('platform', 'instagram')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.log('Error checking Instagram connection:', checkError)
      return NextResponse.json(
        { 
          error: "Failed to check Instagram connection",
          details: checkError.message,
          suggestion: "Please try again or contact support"
        },
        { status: 500 }
      )
    }

    if (existingConnection) {
      console.log('Found existing Instagram connection, disconnecting...')
      // Disconnect Instagram by updating user_connections table
      // Only update columns that exist in the table
      const { error: disconnectError } = await supabase
        .from('user_connections')
        .update({
          connected: false,
          access_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authUser.id)
        .eq('platform', 'instagram')

      if (disconnectError) {
        console.log('Error disconnecting Instagram:', disconnectError)
        return NextResponse.json(
          { 
            error: "Failed to disconnect Instagram",
            details: disconnectError.message,
            suggestion: "Please try again or contact support"
          },
          { status: 500 }
        )
      }
      console.log('Successfully updated user_connections table')
    } else {
      console.log('No Instagram connection found to disconnect')
    }

    // Also clear Instagram-related fields from users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        instagram_username: null,
        instagram_connected: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.id)

    if (userUpdateError) {
      console.log('Error updating user table:', userUpdateError)
      // Don't fail the request, just log the error
    }

    console.log('Instagram disconnected successfully for user:', authUser.id)

    return NextResponse.json({
      success: true,
      message: "Instagram disconnected successfully",
      data: {
        user_id: authUser.id,
        platform: 'instagram',
        connected: false
      }
    })

  } catch (error) {
    console.error("Disconnect Instagram error:", error)
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
