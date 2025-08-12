import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    
    const results = {
      users_table: { exists: false, columns: [] },
      user_connections_table: { exists: false, columns: [] },
      user_profiles_table: { exists: false, columns: [] },
      messages: { exists: false, columns: [] },
      chats: { exists: false, columns: [] }
    }

    // Test users table
    try {
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
        }
      }
    } catch (e) {
      console.log('Users table test failed:', e)
    }

    // Test user_connections table
    try {
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
      }
    } catch (e) {
      console.log('User connections table test failed:', e)
    }

    // Test user_profiles table
    try {
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
        }
      }
    } catch (e) {
      console.log('User profiles table test failed:', e)
    }

    // Test messages table
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(1)
      
      if (!messagesError) {
        results.messages.exists = true
        const { data: columns } = await supabase
          .from('messages')
          .select('*')
          .limit(0)
        
        if (columns) {
          results.messages.columns = Object.keys(columns)
        }
      }
    } catch (e) {
      console.log('Messages table test failed:', e)
    }

    // Test chats table
    try {
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .limit(1)
      
      if (!chatsError) {
        results.chats.exists = true
        const { data: columns } = await supabase
          .from('chats')
          .select('*')
          .limit(0)
        
        if (columns) {
          results.chats.columns = Object.keys(columns)
        }
      }
    } catch (e) {
      console.log('Chats table test failed:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Database structure test completed',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database structure test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
