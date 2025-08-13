# Platform Integration Guide

This guide covers the integration of Facebook Messenger and WhatsApp Business API with your Sellio application.

## Overview

The application now supports three major messaging platforms:
- **Instagram** (Test Mode) - Basic authentication and account linking
- **Facebook Messenger** - Full messaging capabilities
- **WhatsApp Business API** - Business messaging with webhook support

## Features

### 1. Platform Connection Management
- **Settings Page**: Connect and manage all platforms from one central location
- **Connection Status**: Real-time status monitoring for each platform
- **Auto-refresh**: Automatic connection status updates
- **Reconnection**: Easy platform reconnection when needed

### 2. Message Management
- **Unified Chat Interface**: View all platform conversations in one place
- **Platform Categorization**: Clear visual indicators for each platform
- **Message Sending**: Send messages to customers on any connected platform
- **Conversation History**: Complete message history for all platforms

### 3. DM Fetching
- **Instagram DMs**: Fetch and display Instagram conversations
- **Facebook DMs**: Retrieve Facebook Messenger conversations
- **WhatsApp DMs**: Access WhatsApp Business conversations
- **Auto-sync**: Automatic conversation loading after platform connection

## Setup Instructions

### Facebook Messenger Integration

#### Prerequisites
1. Facebook Developer Account
2. Facebook App with Messenger product
3. Facebook Page
4. Page Access Token

#### Setup Steps
1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app or select existing one
   - Add "Messenger" product to your app

2. **Configure Messenger**
   - Set app to Development Mode
   - Generate Page Access Token
   - Note your Page ID

3. **Connect in Sellio**
   - Go to Settings → Platform Integrations
   - Click "Connect Facebook"
   - Enter Page ID and Access Token
   - Test connection

#### Environment Variables
```env
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

### WhatsApp Business API Integration

#### Prerequisites
1. Facebook Developer Account
2. WhatsApp Business App
3. Phone Number ID
4. Access Token
5. Verify Token

#### Setup Steps
1. **Create WhatsApp Business App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create app with WhatsApp product
   - Set to Development Mode

2. **Configure WhatsApp**
   - Generate Phone Number ID
   - Create Access Token
   - Set Verify Token for webhooks

3. **Connect in Sellio**
   - Go to Settings → Platform Integrations
   - Click "Connect WhatsApp"
   - Enter Phone Number ID, Access Token, and Verify Token
   - Test connection

#### Environment Variables
```env
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

## Database Schema

### User Connections Table
```sql
CREATE TABLE user_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'facebook', 'telegram')),
    platform_username TEXT NOT NULL,
    access_token TEXT NOT NULL,
    business_name TEXT,
    connected BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);
```

### Chats Table
```sql
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    customer_username TEXT,
    last_message TEXT,
    unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    platform TEXT DEFAULT 'whatsapp',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Facebook API
- `POST /api/facebook/connect` - Connect Facebook Page
- `POST /api/facebook/test-connection` - Test Facebook connection
- `POST /api/facebook/fetch-dms` - Fetch Facebook conversations
- `POST /api/facebook/send-message` - Send Facebook message

### WhatsApp API
- `POST /api/whatsapp/connect` - Connect WhatsApp Business
- `POST /api/whatsapp/test-connection` - Test WhatsApp connection
- `POST /api/whatsapp/fetch-dms` - Fetch WhatsApp conversations
- `POST /api/whatsapp/send-message` - Send WhatsApp message

### Instagram API
- `POST /api/instagram/connect` - Connect Instagram account
- `POST /api/instagram/fetch-dms` - Fetch Instagram conversations
- `POST /api/instagram/send-dm` - Send Instagram message

## Usage Examples

### Connecting a Platform
```typescript
// Open connection modal
setFacebookModalOpen(true)

// Modal handles the connection process
// On success, platform status is updated
```

### Fetching DMs
```typescript
const fetchFacebookDMs = async () => {
  const response = await fetch('/api/facebook/fetch-dms', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  
  if (response.ok) {
    const data = await response.json()
    // Refresh chats to show new conversations
    await fetchChats()
  }
}
```

### Sending Messages
```typescript
const sendMessage = async () => {
  const response = await fetch('/api/facebook/send-message', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      chatId: selectedChat.id,
      message: newMessage,
      messageType: 'text'
    })
  })
}
```

## Platform-Specific Features

### Facebook Messenger
- **Page Management**: Connect multiple Facebook Pages
- **Conversation Threading**: Maintain conversation history
- **Rich Media**: Support for text, images, and attachments
- **Webhook Integration**: Real-time message reception

### WhatsApp Business
- **Business Profile**: Professional business messaging
- **Message Templates**: Pre-approved message formats
- **Webhook Support**: Real-time updates
- **Media Support**: Text, images, documents, and more

### Instagram (Test Mode)
- **Basic Authentication**: Account verification
- **Profile Linking**: Connect business profiles
- **Limited Functionality**: Test user interactions only

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check access token validity
   - Verify platform permissions
   - Ensure proper app configuration

2. **Connection Failures**
   - Verify API credentials
   - Check network connectivity
   - Review platform status

3. **Message Sending Issues**
   - Confirm platform connection
   - Check message format requirements
   - Verify recipient permissions

### Debug Tools
- **Connection Test**: Test platform connectivity
- **Status Refresh**: Update connection status
- **Error Logging**: Detailed error information
- **API Response**: Raw API response data

## Security Considerations

1. **Token Storage**: Access tokens are encrypted in database
2. **User Isolation**: Users can only access their own connections
3. **API Rate Limits**: Respect platform-specific rate limits
4. **Webhook Security**: Verify webhook signatures

## Future Enhancements

1. **Multi-Platform Broadcasting**: Send messages to multiple platforms
2. **Advanced Analytics**: Platform-specific metrics and insights
3. **Automated Responses**: AI-powered auto-reply system
4. **Integration APIs**: Third-party platform connections
5. **Mobile Apps**: Native mobile applications

## Support

For technical support or questions:
1. Check the troubleshooting section
2. Review platform documentation
3. Contact development team
4. Submit issue reports with detailed information

## Version History

- **v1.0.0**: Initial platform integration
- **v1.1.0**: Added Facebook Messenger support
- **v1.2.0**: Added WhatsApp Business API support
- **v1.3.0**: Enhanced chat interface and platform categorization
