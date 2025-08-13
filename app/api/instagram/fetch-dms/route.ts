import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
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

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      console.log('Auth error:', authError)
      return NextResponse.json(
        { 
          error: "Authentication failed",
          details: authError?.message || "No authenticated user found",
          suggestion: "Please ensure you are logged in and try again"
        },
        { status: 401 }
      )
    }

    console.log('Authenticated user found:', { id: authUser.id, email: authUser.email })

    // Get user's Instagram connection (any connection, not just connected ones)
    const { data: instagramConnection, error: connectionError } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('platform', 'instagram')
      .single()

    if (connectionError || !instagramConnection) {
      console.log('No Instagram connection found:', connectionError)
      return NextResponse.json(
        { 
          error: "Instagram not connected",
          suggestion: "Please connect your Instagram account first"
        },
        { status: 400 }
      )
    }

    console.log('Instagram connection found:', JSON.stringify(instagramConnection, null, 2))
    console.log('Instagram connection platform_username:', instagramConnection.platform_username)
    console.log('Instagram connection connected status:', instagramConnection.connected)

    // In Test Mode, we'll create mock conversations since we can't access real DMs
    // In production, you would use the Instagram Graph API to fetch real conversations
    
    // Create mock conversations for testing
    const mockConversations = [
      {
        id: 'mock-instagram-1',
        customer_username: 'test_user_1',
        last_message: 'Hi! I saw your product on Instagram. Is it still available?',
        unread_count: 2,
        status: 'active',
        platform: 'instagram',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        messages: [
          {
            id: 'msg-1',
            sender_type: 'customer',
            content: 'Hi! I saw your product on Instagram. Is it still available?',
            message_type: 'text',
            is_read: false,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-2',
            sender_type: 'business',
            content: 'Yes, it is! Would you like to know more details?',
            message_type: 'text',
            is_read: true,
            created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-3',
            sender_type: 'customer',
            content: 'Great! What colors do you have?',
            message_type: 'text',
            is_read: false,
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: 'mock-instagram-2',
        customer_username: 'test_user_2',
        last_message: 'Thanks for the quick response!',
        unread_count: 0,
        status: 'completed',
        platform: 'instagram',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        messages: [
          {
            id: 'msg-4',
            sender_type: 'customer',
            content: 'Do you ship internationally?',
            message_type: 'text',
            is_read: true,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-5',
            sender_type: 'business',
            content: 'Yes, we do! Shipping takes 5-7 business days.',
            message_type: 'text',
            is_read: true,
            created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'msg-6',
            sender_type: 'customer',
            content: 'Thanks for the quick response!',
            message_type: 'text',
            is_read: true,
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ]

    // For each mock conversation, create or update the chat and messages in the database
    const processedChats = []
    
    for (const conversation of mockConversations) {
      try {
                 // Check if chat already exists
         let { data: existingChat, error: chatError } = await supabase
           .from('chats')
           .select('*')
           .eq('user_id', authUser.id)
           .eq('platform', 'instagram')
           .eq('customer_username', conversation.customer_username)
           .single()

         console.log(`Checking for existing chat for ${conversation.customer_username}:`, { existingChat, chatError })

         let chatId: string

         if (chatError || !existingChat) {
                     // First, create a customer record for Instagram user
           let customerId: string | null = null
           try {
             console.log(`Creating customer record for ${conversation.customer_username}...`)
             const { data: customer, error: customerError } = await supabase
               .from('customers')
               .insert({
                 user_id: authUser.id,
                 name: `@${conversation.customer_username}`,
                 email: null,
                 phone_number: null,
                 platform: 'instagram',
                 platform_username: conversation.customer_username,
                 created_at: new Date().toISOString(),
                 updated_at: new Date().toISOString()
               })
               .select('id')
               .single()

             if (!customerError && customer) {
               customerId = customer.id
               console.log('Created customer record for Instagram user:', customerId)
             } else {
               console.log('Customer creation error:', customerError)
             }
           } catch (customerError) {
             console.log('Failed to create customer record, continuing with null customer_id:', customerError)
           }

                     // Create new chat
           console.log(`Creating new chat for ${conversation.customer_username}...`)
           const { data: newChat, error: createChatError } = await supabase
             .from('chats')
             .insert({
               user_id: authUser.id,
               customer_id: customerId,
               platform: 'instagram',
               customer_username: conversation.customer_username,
               last_message: conversation.last_message,
               unread_count: conversation.unread_count,
               status: conversation.status,
               created_at: conversation.created_at,
               updated_at: conversation.updated_at
             })
             .select()
             .single()

           if (createChatError) {
             console.log('Failed to create chat:', createChatError)
             continue
           }

           chatId = newChat.id
           console.log('Created new Instagram chat:', chatId)
        } else {
          // Update existing chat
          const { error: updateChatError } = await supabase
            .from('chats')
            .update({
              last_message: conversation.last_message,
              unread_count: conversation.unread_count,
              status: conversation.status,
              updated_at: conversation.updated_at
            })
            .eq('id', existingChat.id)

          if (updateChatError) {
            console.log('Failed to update chat:', updateChatError)
            continue
          }

          chatId = existingChat.id
          console.log('Updated existing Instagram chat:', chatId)
        }

        // Create or update messages for this chat
        for (const message of conversation.messages) {
          // Check if message already exists
          const { data: existingMessage } = await supabase
            .from('messages')
            .select('id')
            .eq('chat_id', chatId)
            .eq('content', message.content)
            .eq('created_at', message.created_at)
            .single()

          if (!existingMessage) {
            // Create new message
            const { error: messageError } = await supabase
              .from('messages')
              .insert({
                chat_id: chatId,
                sender_type: message.sender_type,
                content: message.content,
                message_type: message.message_type,
                is_read: message.is_read,
                created_at: message.created_at
              })

            if (messageError) {
              console.log('Failed to create message:', messageError)
            }
          }
        }

        // Add to processed chats
        processedChats.push({
          id: chatId,
          platform: 'instagram',
          customer_username: conversation.customer_username,
          last_message: conversation.last_message,
          unread_count: conversation.unread_count,
          status: conversation.status,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
        })

      } catch (error) {
        console.log('Error processing conversation:', error)
        continue
      }
    }

    console.log('Successfully processed Instagram conversations')

    return NextResponse.json({
      success: true,
      message: "Instagram DMs fetched and processed successfully",
      data: {
        chats: processedChats,
        total_conversations: processedChats.length,
        platform: 'instagram',
        test_mode: true
      },
      note: "This is Test Mode - showing mock conversations. In production, real Instagram DMs would be fetched."
    })

  } catch (error) {
    console.error("Fetch Instagram DMs error:", error)
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
