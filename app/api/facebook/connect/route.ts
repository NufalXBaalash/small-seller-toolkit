import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { pageId, accessToken, businessName, connected } = await request.json()

    if (!pageId || !accessToken) {
      return NextResponse.json({ 
        error: 'Missing required fields: pageId and accessToken are required' 
      }, { status: 400 })
    }

    console.log('Connecting Facebook for user:', user.id, 'with page ID:', pageId)

    let connectionSuccess = false
    let connectionData = null
    let connectionError = null

    // Try to use user_connections table first
    try {
      console.log('Attempting to use user_connections table...')
      const { data: connectionsData, error: connError } = await supabase
        .from("user_connections")
        .upsert({
          user_id: user.id,
          platform: "facebook",
          platform_username: pageId,
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
        console.log('Facebook connection updated via user_connections table')
        connectionSuccess = true
        connectionData = connectionsData
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
      console.log('Trying fallback to user_profiles table')
      
      try {
        // First check if user_profiles table exists and has the right columns
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .update({
            facebook_page_id: pageId,
            facebook_connected: connected || true,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .select()
          .single()

        if (!profileError) {
          console.log('Facebook connection updated via user_profiles table')
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
        const { data: userData, error: userError } = await supabase
          .from("users")
          .update({
            facebook_page_id: pageId,
            facebook_connected: connected || true,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id)
          .select()
          .single()

        if (!userError) {
          console.log('Facebook connection updated via users table')
          connectionSuccess = true
          connectionData = userData
        } else {
          console.log('users table error:', userError)
        }
      } catch (userError) {
        console.log('users table not available:', userError)
      }
    }

    // If all tables failed, try creating a new user_profiles record
    if (!connectionSuccess) {
      console.log('Trying to create new user_profiles record')
      
      try {
        const { data: newProfileData, error: newProfileError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            facebook_page_id: pageId,
            facebook_connected: connected || true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (!newProfileError) {
          console.log('Facebook connection created via new user_profiles record')
          connectionSuccess = true
          connectionData = newProfileData
        } else {
          console.log('Failed to create new user_profiles record:', newProfileError)
        }
      } catch (newProfileError) {
        console.log('Failed to create new user_profiles record:', newProfileError)
      }
    }

    if (connectionSuccess) {
      console.log('Facebook connection successful for user:', user.id)
      return NextResponse.json({
        success: true,
        message: "Facebook connection updated successfully",
        data: connectionData
      })
    } else {
      console.error('All Facebook connection methods failed for user:', user.id)
      return NextResponse.json({
        error: "Failed to update Facebook connection",
        details: connectionError,
        suggestion: "Please check your database configuration and try again"
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Facebook connection error:', error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
