import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    
    console.log('Testing Instagram authentication...')
    
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
    let { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('id', user.id)
      .maybeSingle()
    
    if (dbError) {
      console.log('Database user lookup error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database error when looking up user',
        details: dbError.message,
        authUser: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        suggestion: 'Database lookup failed. This may indicate a setup issue.'
      }, { status: 500 })
    }
    
    if (!dbUser) {
      console.log('User not found in database, creating user record...')
      
      // Try to create the user record if it doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("id, email, created_at")
        .single()

      if (createError) {
        console.log('Failed to create user record:', createError)
        return NextResponse.json({
          success: false,
          error: 'Failed to create user record',
          details: createError.message,
          authUser: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          },
          suggestion: 'Failed to create user in database. This may indicate a setup issue.'
        }, { status: 500 })
      }

      console.log('User record created successfully:', newUser)
      dbUser = newUser
    }
    
    return NextResponse.json({
      success: true,
      message: 'Authentication test successful',
      user: {
        id: dbUser.id,
        email: dbUser.email,
        created_at: dbUser.created_at
      },
      auth: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
