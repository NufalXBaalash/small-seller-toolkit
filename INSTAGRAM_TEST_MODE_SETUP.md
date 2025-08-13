# Instagram Integration Setup for Test Mode

This guide will help you set up Instagram integration in Test Mode for basic authentication and account linking only.

## What You'll Get in Test Mode

- ✅ Basic Instagram account authentication
- ✅ Account linking and verification
- ✅ Test user connection (limited to test users)
- ✅ Basic profile information access
- ❌ No access to real user data
- ❌ No Instagram Direct Messages
- ❌ No business features
- ❌ No content publishing

## Prerequisites

1. **Facebook Developer Account**: You need a Facebook Developer account
2. **Instagram Account**: A personal Instagram account (can be converted to business later)
3. **Test Mode Understanding**: Know that you'll only be able to connect with test users

## Step-by-Step Setup

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" or select an existing app
3. Choose "Consumer" as the app type
4. Fill in basic app information

### 2. Add Instagram Basic Display

1. In your app dashboard, click "Add Product"
2. Find and add "Instagram Basic Display"
3. This is the correct product for Test Mode (NOT Instagram Graph API)

### 3. Configure Instagram Basic Display

1. Go to "Instagram Basic Display" in your app dashboard
2. Click "Create New App"
3. Add your Instagram account as a test user
4. Set the app to "Development Mode" (this keeps it in Test Mode)

### 4. Generate Access Token

1. In Instagram Basic Display settings, go to "Basic Display"
2. Click "Generate Token"
3. Choose "User Token" (not Page Token)
4. Select basic permissions only:
   - `user_profile`
   - `user_media`
   - `instagram_basic`
5. Copy the generated token

### 5. Connect in Your App

1. Go to your app's Settings page
2. Click "Connect Instagram" in the Platform Integrations section
3. Enter your Instagram username (without @)
4. Paste the access token from step 4
5. Complete the connection test

## Important Notes for Test Mode

### Limitations
- **Test Users Only**: You can only connect with Instagram accounts you've added as test users
- **No Real Data**: The app won't access real user data or content
- **Limited Permissions**: Basic profile info only, no messaging or business features
- **Development Only**: The app must stay in Development Mode

### What Happens When You Go Live
When you're ready to go live:
1. Submit your app for review
2. Request additional permissions
3. Convert to Instagram Graph API for business features
4. Access real user data and messaging features

## Troubleshooting

### Common Issues

1. **"Invalid Access Token"**
   - Make sure you're using Instagram Basic Display, not Graph API
   - Verify the token hasn't expired
   - Check that you're using a User Token, not Page Token

2. **"User Not Found"**
   - Ensure the Instagram account is added as a test user
   - Verify the username is correct (without @ symbol)
   - Check that the account is public or you're a test user

3. **"Insufficient Permissions"**
   - Instagram Basic Display has limited permissions by design
   - This is normal for Test Mode
   - Additional permissions require app review

### Database Issues

If you encounter database errors:
1. Check the `/setup-instagram` page to verify database structure
2. Ensure required tables and columns exist
3. Check browser console for detailed error messages

## Next Steps

Once connected in Test Mode:
1. Test the basic authentication flow
2. Verify account linking works
3. Test with different test user accounts
4. Plan your production requirements
5. Prepare for app review when ready to go live

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Facebook app configuration
3. Ensure you're following Test Mode limitations
4. Check that your Instagram account is properly set up as a test user

Remember: Test Mode is designed for development and testing only. It provides a safe environment to build and test your integration before going live.
