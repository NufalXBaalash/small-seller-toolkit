export interface WhatsAppConfig {
  accessToken: string
  phoneNumberId: string
  verifyToken: string
  appUrl: string
}

export function validateWhatsAppConfig(): { isValid: boolean; missing: string[] } {
  const requiredVars = [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_VERIFY_TOKEN',
    'NEXT_PUBLIC_APP_URL'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])

  return {
    isValid: missing.length === 0,
    missing
  }
}

export function getWhatsAppConfig(): WhatsAppConfig {
  const config = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!
  }

  const validation = validateWhatsAppConfig()
  if (!validation.isValid) {
    throw new Error(`Missing WhatsApp configuration: ${validation.missing.join(', ')}`)
  }

  return config
}

export function getWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured')
  }
  return `${appUrl}/api/whatsapp/webhook`
} 