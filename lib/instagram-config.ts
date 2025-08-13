// Instagram Integration Configuration for Test Mode

export const INSTAGRAM_CONFIG = {
  // API endpoints
  API_BASE_URL: "https://graph.instagram.com/v18.0",
  API_VERSION: "v18.0",
  
  // Required permissions for Instagram Basic Display API (Test Mode)
  BASIC_DISPLAY_PERMISSIONS: [
    "user_profile",
    "user_media",
    "instagram_basic"
  ],
  
  // Test Mode limitations
  TEST_MODE_LIMITATIONS: [
    "Limited to test users only",
    "Basic authentication only",
    "No access to real user data",
    "No business features or DMs",
    "Development Mode required"
  ],
  
  // Connection status
  CONNECTION_STATUS: {
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    PENDING: "pending",
    ERROR: "error",
    TEST_MODE: "test_mode"
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
  },
  TEST_MODE_REQUIRED: {
    code: 200,
    message: "App must be in Development Mode for Test Mode integration"
  }
}

// Instagram message templates for Test Mode
export const INSTAGRAM_MESSAGES = {
  WELCOME: "Hi! Thanks for reaching out. How can I help you today?",
  AWAY: "We're currently away but will respond as soon as possible!",
  ORDER_CONFIRMATION: "Thank you for your order! We'll process it and get back to you with delivery details.",
  OUT_OF_OFFICE: "We're currently out of the office. We'll respond when we return.",
  THANK_YOU: "Thank you for your message. We appreciate your business!",
  TEST_MODE: "This is a test mode connection. Limited functionality available."
}

// Instagram connection status interface for Test Mode
export interface InstagramConnection {
  user_id: string
  platform: "instagram"
  platform_username: string
  access_token: string
  business_name?: string
  connected: boolean
  test_mode: boolean
  created_at: string
  updated_at: string
}

// Instagram user interface for Test Mode
export interface InstagramUser {
  id: string
  username: string
  account_type: string
  media_count: number
  profile_picture_url?: string
  test_user: boolean
}

// Instagram message interface for database (Test Mode - limited)
export interface InstagramMessageDB {
  id?: string
  user_id: string
  platform: "instagram"
  message_type: "test_mode_notice"
  content: string
  created_at?: string
}

// Test Mode specific interfaces
export interface InstagramTestModeConfig {
  enabled: boolean
  test_users: string[]
  permissions: string[]
  limitations: string[]
}

export interface InstagramBasicProfile {
  id: string
  username: string
  account_type: string
  media_count: number
  profile_picture_url?: string
  test_mode: boolean
}
