import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    
    console.log('Verifying Instagram database setup...')
    
    const results = {
      users_table: { exists: false, columns: [], instagram_fields: [] },
      user_connections_table: { exists: false, columns: [] },
      user_profiles_table: { exists: false, columns: [], instagram_fields: [] },
      setup_status: 'incomplete'
    }

    // Test users table
    try {
      console.log('Testing users table...')
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
      
      if (!usersError) {
        results.users_table.exists = true
        // Get column information
        const { data: columns } = await supabase
          .from('users')
          .select('*')
          .limit(0)
        
        if (columns) {
          results.users_table.columns = Object.keys(columns)
          // Check for Instagram-specific columns
          results.users_table.instagram_fields = Object.keys(columns).filter(col => 
            col.includes('instagram')
          )
        }
        console.log('Users table exists with columns:', results.users_table.columns)
      } else {
        console.log('Users table error:', usersError)
      }
    } catch (e) {
      console.log('Users table test failed:', e)
    }

    // Test user_connections table
    try {
      console.log('Testing user_connections table...')
      const { data: connections, error: connectionsError } = await supabase
        .from('user_connections')
        .select('*')
        .limit(1)
      
      if (!connectionsError) {
        results.user_connections_table.exists = true
        const { data: columns } = await supabase
          .from('user_connections')
          .select('*')
          .limit(0)
        
        if (columns) {
          results.user_connections_table.columns = Object.keys(columns)
        }
        console.log('User connections table exists with columns:', results.user_connections_table.columns)
      } else {
        console.log('User connections table error:', connectionsError)
      }
    } catch (e) {
      console.log('User connections table test failed:', e)
    }

    // Test user_profiles table
    try {
      console.log('Testing user_profiles table...')
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
      
      if (!profilesError) {
        results.user_profiles_table.exists = true
        const { data: columns } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(0)
        
        if (columns) {
          results.user_profiles_table.columns = Object.keys(columns)
          // Check for Instagram-specific columns
          results.user_profiles_table.instagram_fields = Object.keys(columns).filter(col => 
            col.includes('instagram')
          )
        }
        console.log('User profiles table exists with columns:', results.user_profiles_table.columns)
      } else {
        console.log('User profiles table error:', profilesError)
      }
    } catch (e) {
      console.log('User profiles table test failed:', e)
    }

    // Determine setup status
    if (results.user_connections_table.exists) {
      results.setup_status = 'complete'
    } else if (results.users_table.exists && results.users_table.instagram_fields.length > 0) {
      results.setup_status = 'partial'
    } else {
      results.setup_status = 'incomplete'
    }

    // Provide recommendations
    let recommendations = []
    if (results.setup_status === 'incomplete') {
      recommendations.push('Run the Instagram setup script to create required tables and columns')
    } else if (results.setup_status === 'partial') {
      recommendations.push('Instagram setup is partially complete - some tables exist but user_connections table is missing')
      recommendations.push('Consider running the setup script again or manually creating the user_connections table')
    } else {
      recommendations.push('Instagram setup is complete and ready to use')
    }

    return NextResponse.json({
      success: true,
      message: 'Instagram database setup verification completed',
      results,
      recommendations,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Instagram setup verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Setup verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
