import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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

    const userId = session.user.id

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking profile:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check profile',
        details: checkError.message
      }, { status: 500 })
    }

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profile: existingProfile
      })
    }

    // Create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: session.user.email,
        first_name: session.user.user_metadata?.first_name || '',
        last_name: session.user.user_metadata?.last_name || '',
        business_name: session.user.user_metadata?.business_name || '',
        phone_number: session.user.user_metadata?.phone_number || ''
      }])
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create profile',
        details: createError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    })

  } catch (error) {
    console.error('Fix user profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
