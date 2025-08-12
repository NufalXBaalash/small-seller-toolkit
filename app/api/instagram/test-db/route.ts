import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Test basic database connection
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)

    if (usersError) {
      console.error('Users table error:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Users table error',
        details: usersError
      }, { status: 500 })
    }

    // Test user_connections table
    let connectionsTableExists = false
    try {
      const { data: connections, error: connectionsError } = await supabase
        .from('user_connections')
        .select('*')
        .limit(1)
      
      connectionsTableExists = !connectionsError
    } catch (e) {
      connectionsTableExists = false
    }

    // Test chats table
    let chatsTableExists = false
    try {
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .limit(1)
      
      chatsTableExists = !chatsError
    } catch (e) {
      chatsTableExists = false
    }

    // Test messages table
    let messagesTableExists = false
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .limit(1)
      
      messagesTableExists = !messagesError
    } catch (e) {
      messagesTableExists = false
    }

    return NextResponse.json({
      success: true,
      database: {
        users: users?.length > 0 ? 'OK' : 'No users found',
        user_connections: connectionsTableExists ? 'OK' : 'Missing',
        chats: chatsTableExists ? 'OK' : 'Missing',
        messages: messagesTableExists ? 'OK' : 'Missing'
      },
      message: 'Database connection test completed'
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error
    }, { status: 500 })
  }
}
