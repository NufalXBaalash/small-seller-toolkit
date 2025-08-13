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

    const { phoneNumberId, accessToken, verifyToken, businessName, connected } = await request.json()

    if (!phoneNumberId || !accessToken || !verifyToken) {
      return NextResponse.json({ 
        error: 'Missing required fields: phoneNumberId, accessToken, and verifyToken are required' 
      }, { status: 400 })
    }

    console.log('Connecting WhatsApp for user:', user.id, 'with phone number ID:', phoneNumberId)

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
          platform: "whatsapp",
          platform_username: phoneNumberId,
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
        console.log('WhatsApp connection updated via user_connections table')
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
            whatsapp_phone_number_id: phoneNumberId,
            whatsapp_connected: connected || true,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .select()
          .single()

        if (!profileError) {
          console.log('WhatsApp connection updated via user_profiles table')
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
            whatsapp_phone_number_id: phoneNumberId,
            whatsapp_connected: connected || true,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id)
          .select()
          .single()

        if (!userError) {
          console.log('WhatsApp connection updated via users table')
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
            whatsapp_phone_number_id: phoneNumberId,
            whatsapp_connected: connected || true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (!newProfileError) {
          console.log('WhatsApp connection created via new user_profiles record')
          connectionSuccess = true
          connectionData = newProfileData
        } else {
          console.log('Failed to create new user_profiles record:', newProfileError)
        }
      } catch (newProfileError) {
        console.log('Failed to create new user_profiles record:', newProfileError)
      }
    }

    // Store WhatsApp configuration in environment or database
    try {
      // Update or create WhatsApp configuration
      const { error: configError } = await supabase
        .from("platform_integrations")
        .upsert({
          user_id: user.id,
          platform: "whatsapp",
          is_connected: connected || true,
          access_token: accessToken,
          platform_user_id: phoneNumberId,
          platform_username: phoneNumberId,
          webhook_secret: verifyToken,
          settings: {
            phone_number_id: phoneNumberId,
            verify_token: verifyToken
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,platform"
        })

      if (!configError) {
        console.log('WhatsApp configuration stored successfully')
      } else {
        console.log('WhatsApp configuration storage error (non-critical):', configError)
      }
    } catch (configError) {
      console.log('WhatsApp configuration storage failed (non-critical):', configError)
    }

    if (connectionSuccess) {
      console.log('WhatsApp connection successful for user:', user.id)
      return NextResponse.json({
        success: true,
        message: "WhatsApp connection updated successfully",
        data: connectionData
      })
    } else {
      console.error('All WhatsApp connection methods failed for user:', user.id)
      return NextResponse.json({
        error: "Failed to update WhatsApp connection",
        details: connectionError,
        suggestion: "Please check your database configuration and try again"
      }, { status: 500 })
    }

  } catch (error) {
    console.error('WhatsApp connection error:', error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
