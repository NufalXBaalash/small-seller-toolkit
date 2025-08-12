// Instagram Integration Configuration

export const INSTAGRAM_CONFIG = {
  // API endpoints
  API_BASE_URL: "https://graph.instagram.com/v18.0",
  API_VERSION: "v18.0",
  
  // Required permissions for Instagram Basic Display API
  BASIC_DISPLAY_PERMISSIONS: [
    "user_profile",
    "user_media",
    "instagram_basic",
    "instagram_content_publish"
  ],
  
  // Required permissions for Instagram Graph API (Business accounts)
  GRAPH_API_PERMISSIONS: [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_comments",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement"
  ],
  
  // Webhook subscription fields
  WEBHOOK_FIELDS: [
    "messages",
    "messaging_postbacks",
    "message_deliveries",
    "message_reads"
  ],
  
  // Message types supported
  SUPPORTED_MESSAGE_TYPES: [
    "text",
    "image",
    "video",
    "audio",
    "file",
    "location",
    "contact"
  ],
  
  // Rate limiting
  RATE_LIMITS: {
    MESSAGES_PER_SECOND: 5,
    MESSAGES_PER_MINUTE: 200,
    MESSAGES_PER_HOUR: 1000
  },
  
  // Connection status
  CONNECTION_STATUS: {
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    PENDING: "pending",
    ERROR: "error"
  }
}

// Instagram API error codes and messages
export const INSTAGRAM_ERRORS = {
  INVALID_TOKEN: {
    code: 190,
    message: "Invalid access token"
  },
  TOKEN_EXPIRED: {
    code: 190,
    message: "Access token has expired"
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 10,
    message: "Insufficient permissions for this action"
  },
  RATE_LIMIT_EXCEEDED: {
    code: 4,
    message: "Rate limit exceeded"
  },
  USER_NOT_FOUND: {
    code: 100,
    message: "User not found"
  }
}

// Instagram message templates
export const INSTAGRAM_MESSAGES = {
  WELCOME: "Hi! Thanks for reaching out. How can I help you today?",
  AWAY: "We're currently away but will respond as soon as possible!",
  ORDER_CONFIRMATION: "Thank you for your order! We'll process it and get back to you with delivery details.",
  OUT_OF_OFFICE: "We're currently out of the office. We'll respond when we return.",
  THANK_YOU: "Thank you for your message. We appreciate your business!"
}

// Instagram webhook event types
export const INSTAGRAM_WEBHOOK_EVENTS = {
  MESSAGE: "messages",
  MESSAGE_DELIVERIES: "message_deliveries",
  MESSAGE_READS: "message_reads",
  POSTBACK: "messaging_postbacks",
  ACCOUNT_LINKING: "account_linking",
  ACCOUNT_UNLINKING: "account_unlinking"
}

// Instagram API response types
export interface InstagramUser {
  id: string
  username: string
  account_type: string
  media_count: number
  profile_picture_url?: string
}

export interface InstagramMessage {
  id: string
  from: {
    id: string
    username?: string
  }
  to: {
    id: string
    username?: string
  }
  timestamp: number
  message?: {
    text?: string
    mid: string
    attachments?: Array<{
      type: string
      payload: {
        url?: string
      }
    }>
  }
  postback?: {
    payload: string
    title: string
  }
}

export interface InstagramWebhookPayload {
  object: string
  entry: Array<{
    id: string
    time: number
    messaging?: InstagramMessage[]
  }>
}

// Instagram connection status interface
export interface InstagramConnection {
  user_id: string
  platform: "instagram"
  platform_username: string
  access_token: string
  business_name?: string
  connected: boolean
  created_at: string
  updated_at: string
}

// Instagram chat interface
export interface InstagramChat {
  id: string
  user_id: string
  platform: "instagram"
  customer_username: string
  status: string
  last_message?: string
  unread_count: number
  created_at: string
  updated_at: string
}

// Instagram message interface for database
export interface InstagramMessageDB {
  id?: string
  chat_id: string
  sender_type: "customer" | "business"
  content: string
  message_type: string
  platform: "instagram"
  sender_username?: string
  recipient_username?: string
  created_at?: string
}
