# Instagram Integration Setup Guide

This guide will help you set up Instagram integration for your Small Seller Toolkit application, allowing you to receive and send Instagram DMs directly from your dashboard.

## Prerequisites

1. **Facebook Developer Account**: You need a Facebook Developer account to access Instagram APIs
2. **Instagram Business Account**: Your Instagram account must be converted to a Business account
3. **Facebook Page**: You need a Facebook Page connected to your Instagram Business account
4. **Domain Verification**: Your domain must be verified with Facebook

## Step 1: Facebook Developer Setup

### 1.1 Create a Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" and select "Business" as the app type
3. Fill in your app details and create the app

### 1.2 Add Instagram Basic Display
1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Configure the basic settings:
   - App Domains: Add your domain
   - Privacy Policy URL: Add your privacy policy URL
   - Terms of Service URL: Add your terms of service URL

### 1.3 Add Instagram Graph API (for Business accounts)
1. Click "Add Product" again
2. Find "Instagram Graph API" and click "Set Up"
3. This will allow you to send and receive messages

## Step 2: Configure Instagram Permissions

### 2.1 Basic Display Permissions
Add these permissions to your app:
- `user_profile` - Access to user's profile information
- `user_media` - Access to user's media
- `instagram_basic` - Basic Instagram functionality
- `instagram_content_publish` - Ability to publish content

### 2.2 Graph API Permissions
For business accounts, also add:
- `instagram_manage_comments` - Manage comments
- `instagram_manage_insights` - Access to insights
- `pages_show_list` - Access to connected pages
- `pages_read_engagement` - Read page engagement

## Step 3: Generate Access Token

### 3.1 User Token Generation
1. In your app dashboard, go to "Instagram Basic Display" > "Basic Display"
2. Click "Generate Token"
3. Follow the authorization flow
4. Copy the generated access token

### 3.2 Long-lived Token (Recommended)
1. Go to "Instagram Basic Display" > "Basic Display"
2. Click "Generate Long-lived Token"
3. This token will last longer (60 days vs 1 hour)

## Step 4: Webhook Configuration

### 4.1 Set Up Webhook
1. In your app dashboard, go to "Instagram Basic Display" > "Basic Display"
2. Click "Add Instagram Test Users" if you haven't already
3. Go to "Webhooks" and click "Add Callback URL"
4. Enter your webhook URL: `https://yourdomain.com/api/instagram/webhook`
5. Set the verify token (use the same value as in your environment variables)

### 4.2 Subscribe to Events
Subscribe to these webhook events:
- `messages` - Incoming messages
- `messaging_postbacks` - Button clicks
- `message_deliveries` - Message delivery confirmations
- `message_reads` - Message read receipts

## Step 5: Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Instagram Configuration
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_VERIFY_TOKEN=your_webhook_verify_token
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Step 6: Database Setup

Run the database migration script to create the necessary tables:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f scripts/setup-instagram-integration.sql
```

Or run it through the Supabase dashboard SQL editor.

## Step 7: Test the Integration

### 7.1 Test Connection
1. Go to your app's Settings page
2. Click "Connect Instagram" in the Platform Integrations section
3. Follow the connection wizard:
   - Enter your Instagram username
   - Enter your access token
   - Test the connection

### 7.2 Test Webhook
1. Send a message to your Instagram account from another account
2. Check your app logs to see if the webhook is receiving messages
3. Verify that messages appear in your chat dashboard

## Step 8: Production Deployment

### 8.1 App Review
Before going live, submit your app for Facebook review:
1. Go to "App Review" in your app dashboard
2. Submit the required permissions for review
3. Wait for Facebook's approval (can take several days)

### 8.2 Domain Verification
1. Verify your domain with Facebook
2. Add your production domain to the app settings
3. Update your webhook URL to the production domain

### 8.3 SSL Certificate
Ensure your production domain has a valid SSL certificate, as Facebook requires HTTPS for webhooks.

## Troubleshooting

### Common Issues

#### 1. Webhook Verification Fails
- Check that your verify token matches exactly
- Ensure your webhook endpoint is accessible
- Verify your domain is properly configured

#### 2. Access Token Invalid
- Check if your token has expired
- Verify the token has the correct permissions
- Ensure you're using the right app's token

#### 3. Messages Not Receiving
- Check webhook subscription status
- Verify webhook endpoint is responding correctly
- Check app review status for required permissions

#### 4. Cannot Send Messages
- Verify Instagram Graph API is enabled
- Check if your account has the required permissions
- Ensure your access token is long-lived

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=instagram:*
```

## Security Considerations

### 1. Access Token Security
- Never expose access tokens in client-side code
- Store tokens securely in your database
- Consider encrypting tokens before storage
- Implement token refresh mechanisms

### 2. Webhook Security
- Use HTTPS for all webhook endpoints
- Implement webhook signature verification
- Rate limit webhook endpoints
- Validate all incoming data

### 3. User Data Privacy
- Follow Instagram's data usage policies
- Implement proper data retention policies
- Provide clear privacy notices to users
- Allow users to disconnect their accounts

## API Rate Limits

Instagram has the following rate limits:
- **Messages per second**: 5
- **Messages per minute**: 200
- **Messages per hour**: 1000

Implement proper rate limiting in your application to avoid hitting these limits.

## Support and Resources

### Official Documentation
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Facebook Webhooks](https://developers.facebook.com/docs/graph-api/webhooks)

### Community Resources
- [Facebook Developer Community](https://developers.facebook.com/community/)
- [Instagram Developer Community](https://developers.facebook.com/community/instagram/)

### Getting Help
If you encounter issues:
1. Check the troubleshooting section above
2. Review Facebook's error codes and messages
3. Check your app's error logs
4. Consult the Facebook Developer Community

## Next Steps

Once your Instagram integration is working:

1. **Set up Auto-replies**: Configure automatic responses for common inquiries
2. **Message Templates**: Create reusable message templates for quick responses
3. **Analytics**: Monitor your Instagram engagement and response times
4. **Multi-platform**: Consider adding other social media platforms (Facebook, Twitter, etc.)

## Updates and Maintenance

### Regular Tasks
- Monitor access token expiration
- Check webhook health
- Review API usage and rate limits
- Update permissions as needed

### App Updates
- Keep your app updated with the latest Instagram API changes
- Monitor Facebook's developer announcements
- Test new features in development before production

---

**Note**: This integration uses Instagram's official APIs and follows their terms of service. Make sure to comply with all Instagram and Facebook policies when using this integration.
