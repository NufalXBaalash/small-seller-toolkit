import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// This should match the verify token you set in Meta Developer Console
const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "your_verify_token_here"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    console.log('Instagram webhook verification request:', { mode, token, challenge })

    // Verify the webhook
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Instagram webhook verified successfully')
      return new NextResponse(challenge, { status: 200 })
    }

    console.log('Instagram webhook verification failed')
    return new NextResponse('Forbidden', { status: 403 })
  } catch (error) {
    console.error('Instagram webhook verification error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Instagram webhook received:', JSON.stringify(body, null, 2))

    // Handle Instagram messaging events
    if (body.object === 'instagram' && body.entry) {
      for (const entry of body.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await handleInstagramMessage(messagingEvent)
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Instagram webhook processing error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

async function handleInstagramMessage(messagingEvent: any) {
  try {
    const { sender, recipient, message, timestamp } = messagingEvent
    
    if (!message || !sender || !recipient) {
      console.log('Invalid messaging event structure')
      return
    }

    console.log('Processing Instagram message:', {
      sender: sender.id,
      recipient: recipient.id,
      message: message.text,
      timestamp
    })

    const supabase = createServerClient()

    // Get the user ID from the recipient (your Instagram account)
    const { data: userConnection, error: connectionError } = await supabase
      .from('user_connections')
      .select('user_id')
      .eq('platform', 'instagram')
      .eq('platform_username', recipient.username)
      .eq('connected', true)
      .single()

    if (connectionError || !userConnection) {
      console.log('No connected Instagram account found for recipient:', recipient.username)
      return
    }

    const userId = userConnection.user_id

    // Create or get the chat
    const chatId = `instagram_${userId}_${sender.username}`
    
    let { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
      // Create new chat
      const { data: newChat, error: createChatError } = await supabase
        .from('chats')
        .insert({
          id: chatId,
          user_id: userId,
          platform: 'instagram',
          customer_username: sender.username,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createChatError) {
        console.error('Error creating chat:', createChatError)
        return
      }
      chat = newChat
    }

    // Store the message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chat.id,
        sender_type: 'customer',
        content: message.text,
        message_type: 'text',
        platform: 'instagram',
        sender_username: sender.username,
        created_at: new Date(timestamp).toISOString()
      })

    if (messageError) {
      console.error('Error storing message:', messageError)
      return
    }

    // Update chat with last message and unread count
    const { error: updateError } = await supabase
      .from('chats')
      .update({
        last_message: message.text,
        unread_count: supabase.sql`unread_count + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', chat.id)

    if (updateError) {
      console.error('Error updating chat:', updateError)
    }

    console.log('Instagram message processed successfully')
  } catch (error) {
    console.error('Error handling Instagram message:', error)
  }
}
