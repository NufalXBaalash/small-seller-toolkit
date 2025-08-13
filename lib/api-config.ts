/**
 * API Configuration
 * Centralized configuration for API base URLs and endpoints
 */

// Get base URL for API calls
export const getApiBaseUrl = (): string => {
  // In production, use the environment variable if set
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || ''
  }
  
  // In development, use empty string (relative URLs)
  return ''
}

// Instagram API endpoints
export const INSTAGRAM_ENDPOINTS = {
  CONNECT: '/api/instagram/connect',
  CONNECT_V2: '/api/instagram/connect-v2',
  CONNECT_NEW: '/api/instagram/connect-new',
  TEST_CONNECTION: '/api/instagram/test-connection',
  TEST_DB: '/api/instagram/test-db',
  TEST_DB_STRUCTURE: '/api/instagram/test-db-structure',
  SEND_MESSAGE: '/api/instagram/send-message',
  WEBHOOK: '/api/instagram/webhook',
} as const

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}${endpoint}`
}

// Helper function for Instagram API calls
export const getInstagramApiUrl = (endpoint: keyof typeof INSTAGRAM_ENDPOINTS): string => {
  return buildApiUrl(INSTAGRAM_ENDPOINTS[endpoint])
}
