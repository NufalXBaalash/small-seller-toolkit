import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get the session from the request
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({
        success: false,
        error: 'Failed to get session',
        details: sessionError.message
      }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'No active session found'
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({
        success: false,
        authenticated: true,
        user: session.user,
        error: 'Failed to get profile',
        details: profileError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: session.user,
      profile: profile,
      sessionExpiresAt: session.expires_at,
      currentTime: Math.floor(Date.now() / 1000)
    })

  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
