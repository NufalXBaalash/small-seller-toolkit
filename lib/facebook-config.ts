export interface FacebookConfig {
  accessToken: string
  pageId: string
  appId: string
  appSecret: string
  appUrl: string
}

export function validateFacebookConfig(): { isValid: boolean; missing: string[] } {
  const requiredVars = [
    'FACEBOOK_ACCESS_TOKEN',
    'FACEBOOK_PAGE_ID',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])

  return {
    isValid: missing.length === 0,
    missing
  }
}

export function getFacebookConfig(): FacebookConfig {
  const config = {
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN!,
    pageId: process.env.FACEBOOK_PAGE_ID!,
    appId: process.env.FACEBOOK_APP_ID!,
    appSecret: process.env.FACEBOOK_APP_SECRET!,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!
  }

  const validation = validateFacebookConfig()
  if (!validation.isValid) {
    throw new Error(`Missing Facebook configuration: ${validation.missing.join(', ')}`)
  }

  return config
}

export function getWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured')
  }
  return `${appUrl}/api/facebook/webhook`
}

export function getFacebookApiUrl(endpoint: string): string {
  const baseUrl = 'https://graph.facebook.com/v18.0'
  
  switch (endpoint) {
    case 'PAGE_INFO':
      return `${baseUrl}/${process.env.FACEBOOK_PAGE_ID}?fields=id,name,access_token&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`
    case 'SEND_MESSAGE':
      return `${baseUrl}/${process.env.FACEBOOK_PAGE_ID}/messages`
    case 'GET_CONVERSATIONS':
      return `${baseUrl}/${process.env.FACEBOOK_PAGE_ID}/conversations?fields=participants,updated_time,unread_count&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`
    case 'GET_MESSAGES':
      return `${baseUrl}/conversation_id/messages?fields=id,from,to,message,created_time&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}`
    default:
      return `${baseUrl}/${endpoint}`
  }
}
