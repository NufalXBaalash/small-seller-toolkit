import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies from the request
    const cookieHeader = request.headers.get('cookie') || ''
    console.log('Auth header:', cookieHeader)
    
    // Create a Supabase client that can read cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Cookie: cookieHeader
        }
      }
    })
    
    // Try to get user info from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: authError.message,
        suggestion: 'Please ensure you are logged in'
      }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user found',
        suggestion: 'Please log in and try again'
      }, { status: 401 })
    }
    
    console.log('Authenticated user found:', user)
    
    // Check if user exists in the users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (dbError) {
      console.log('Database user lookup error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        details: dbError.message,
        authUser: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        suggestion: 'User exists in auth but not in database. This may indicate a setup issue.'
      }, { status: 404 })
    }
    
    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        authUser: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        suggestion: 'User exists in auth but not in database. This may indicate a setup issue.'
      }, { status: 404 })
    }
    
    // Check Instagram-related fields
    const instagramFields = {
      instagram_username: dbUser.instagram_username || null,
      instagram_connected: dbUser.instagram_connected || false
    }
    
    // Check if user_connections table exists and has data
    let connectionsData = null
    let connectionsError = null
    
    try {
      const { data: connections, error: connError } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'instagram')
      
      if (!connError) {
        connectionsData = connections
      } else {
        connectionsError = connError.message
      }
    } catch (e) {
      connectionsError = 'Table not accessible'
    }
    
    return NextResponse.json({
      success: true,
      message: 'User debug information retrieved successfully',
      user: {
        id: dbUser.id,
        email: dbUser.email,
        created_at: dbUser.created_at,
        instagram: instagramFields
      },
      database: {
        users_table: 'OK',
        user_connections_table: connectionsError ? 'Error' : 'OK',
        connections_error: connectionsError
      },
      connections: connectionsData || [],
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
