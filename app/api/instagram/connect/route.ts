import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Explicitly export both GET and POST methods
export async function GET(request: NextRequest) {
  console.log('Instagram connect GET method called')
  
  return NextResponse.json({
    success: true,
    message: "Instagram connect endpoint is accessible",
    timestamp: new Date().toISOString(),
    endpoint: "/api/instagram/connect",
    method: "GET"
  })
}

export async function POST(request: NextRequest) {
  console.log('Instagram connect POST method called')
  
  try {
    const body = await request.json()
    console.log('Request body:', body)
    
    const { instagramUsername, accessToken, businessName, connected } = body

    console.log('Parsed request data:', { instagramUsername, businessName, connected })

    // Validate required fields
    if (!instagramUsername) {
      console.log('Missing instagramUsername')
      return NextResponse.json(
        { error: "Instagram username is required" },
        { status: 400 }
      )
    }

    if (!accessToken) {
      console.log('Missing accessToken')
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      )
    }

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

    // Try to get user info from Supabase auth using the token
    console.log('Getting authenticated user from Supabase auth...')
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('Auth error:', authError)
      return NextResponse.json(
        { 
          error: "Authentication failed",
          details: authError.message,
          suggestion: "Please ensure you are logged in and try again"
        },
        { status: 401 }
      )
    }

    if (!authUser) {
      console.log('No authenticated user found')
      return NextResponse.json(
        { 
          error: "No authenticated user found",
          suggestion: "Please log in and try again"
        },
        { status: 401 }
      )
    }

    console.log('Authenticated user found:', { id: authUser.id, email: authUser.email })

    // Now check if the user exists in the users table
    console.log('Looking up user in database with ID:', authUser.id)
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, created_at")
      .eq("id", authUser.id)
      .maybeSingle() // Use maybeSingle instead of single to avoid the multiple rows error

    if (userError) {
      console.log('User lookup error:', userError)
      return NextResponse.json(
        { 
          error: "Database error when looking up user",
          details: userError.message,
          userId: authUser.id,
          suggestion: "Please try again or contact support if the issue persists"
        },
        { status: 500 }
      )
    }

    if (!user) {
      console.log('User not found in database, creating user record...')
      
      // Try to create the user record if it doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("id, email, created_at")
        .single()

      if (createError) {
        console.log('Failed to create user record:', createError)
        return NextResponse.json(
          { 
            error: "Failed to create user record",
            details: createError.message,
            userId: authUser.id,
            suggestion: "Please try again or contact support"
          },
          { status: 500 }
        )
      }

      console.log('User record created successfully:', newUser)
      user = newUser
    }

    console.log('User confirmed in database:', { id: user.id, email: user.email, created_at: user.created_at })

    // Try to update user_connections table first
    let connectionSuccess = false
    let connectionData = null
    let connectionError = null
    let connectionMethod = ''

    try {
      console.log('Attempting to use user_connections table...')
      const { data: connectionsData, error: connError } = await supabase
        .from("user_connections")
        .upsert({
          user_id: user.id,
          platform: "instagram",
          platform_username: instagramUsername,
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
        console.log('Instagram connection updated via user_connections table')
        connectionSuccess = true
        connectionData = connectionsData
        connectionMethod = 'user_connections_table'
        
        // Also update the users table to keep it in sync
        try {
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({
              instagram_username: instagramUsername,
              instagram_connected: connected !== undefined ? connected : true,
              updated_at: new Date().toISOString()
            })
            .eq("id", user.id)

          if (!userUpdateError) {
            console.log('Users table also updated successfully')
          } else {
            console.log('Users table update error (non-critical):', userUpdateError)
          }
        } catch (userError) {
          console.log('Users table update failed (non-critical):', userError)
        }
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
      console.log('Trying fallback to user_profiles table...')
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .upsert({
            user_id: user.id,
            instagram_username: instagramUsername,
            instagram_connected: connected !== undefined ? connected : true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "user_id"
          })
          .select()
          .single()

        if (!profileError) {
          console.log('Instagram connection updated via user_profiles table')
          connectionSuccess = true
          connectionData = profileData
          connectionMethod = 'user_profiles_table'
        } else {
          console.log('user_profiles table error:', profileError)
        }
      } catch (profileError) {
        console.log('user_profiles table not available:', profileError)
      }
    }

    // If both tables failed, try updating the users table directly
    if (!connectionSuccess) {
      console.log('Trying fallback to users table...')
      
      try {
        const { data: userData, error: userUpdateError } = await supabase
          .from("users")
          .update({
            instagram_username: instagramUsername,
            instagram_connected: connected !== undefined ? connected : true,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id)
          .select()
          .single()

        if (!userUpdateError) {
          console.log('Instagram connection updated via users table')
          connectionSuccess = true
          connectionData = userData
          connectionMethod = 'users_table'
        } else {
          console.log('users table update error:', userUpdateError)
        }
      } catch (userError) {
        console.log('users table update failed:', userError)
      }
    }

    if (connectionSuccess) {
      console.log('Instagram connection successful using method:', connectionMethod)
      return NextResponse.json({
        success: true,
        message: "Instagram connection updated successfully",
        data: connectionData,
        method: connectionMethod,
        user: {
          id: user.id,
          email: user.email
        },
        instagram: {
          username: instagramUsername,
          connected: connected !== undefined ? connected : true
        }
      })
    } else {
      console.error("All connection update methods failed")
      
      // Provide detailed error information
      const errorDetails = {
        user_connections_error: connectionError && typeof connectionError === 'object' && 'message' in connectionError ? connectionError.message : 'Table not available or update failed',
        user_profiles_error: 'Table not available or update failed',
        users_table_error: 'Update failed'
      }
      
      return NextResponse.json(
        { 
          error: "Failed to update Instagram connection. Database setup may be incomplete.",
          details: errorDetails,
          suggestion: "Please run the Instagram setup script again or check database structure.",
          debug: {
            userId: user.id,
            userFound: !!user,
            tablesTried: ['user_connections', 'user_profiles', 'users'],
            connectionMethod: connectionMethod
          }
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Update Instagram connection error:", error)
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
