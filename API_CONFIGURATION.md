# API Configuration Guide

This guide explains how to configure the API base URL for different environments.

## Environment Variables

### Development (Local)
For local development, the API calls use relative URLs by default. No configuration is needed.

### Production (Different Domain)
If your API is hosted on a different domain than your frontend, set the `NEXT_PUBLIC_API_URL` environment variable.

#### Vercel Deployment
```bash
# In your Vercel dashboard, add this environment variable:
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

#### Custom Domain
```bash
# If using a custom domain:
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

#### Same Domain (Default)
```bash
# If API is on the same domain, leave empty or remove the variable:
NEXT_PUBLIC_API_URL=
```

## How It Works

The application automatically detects the environment and uses the appropriate base URL:

- **Development**: Uses relative URLs (e.g., `/api/instagram/connect`)
- **Production with env var**: Uses absolute URLs (e.g., `https://your-domain.com/api/instagram/connect`)
- **Production without env var**: Falls back to relative URLs

## API Endpoints

All Instagram API endpoints are centralized in `lib/api-config.ts`:

- `/api/instagram/connect` - Main Instagram connection endpoint
- `/api/instagram/connect-v2` - Alternative endpoint (fallback)
- `/api/instagram/connect-new` - Simplified endpoint (fallback)
- `/api/instagram/test-connection` - Test Instagram connection
- `/api/instagram/test-db` - Test database connection
- `/api/instagram/test-db-structure` - Test database structure

## Usage in Components

```typescript
import { getInstagramApiUrl } from "@/lib/api-config"

// Get the full API URL for a specific endpoint
const connectUrl = getInstagramApiUrl('CONNECT')

// Make API call
const response = await fetch(connectUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

## Troubleshooting

### 404 Errors
If you're getting 404 errors on API calls:

1. Check that your environment variable is set correctly
2. Verify the API endpoint exists in your deployment
3. Ensure the base URL doesn't have trailing slashes
4. Check browser console for the actual URL being called

### CORS Issues
If you're getting CORS errors:

1. Ensure your API domain is properly configured
2. Check that your API allows requests from your frontend domain
3. Verify environment variables are set correctly

### Environment Variable Not Working
If the environment variable isn't being picked up:

1. Restart your development server after adding the variable
2. Check that the variable name is exactly `NEXT_PUBLIC_API_URL`
3. Ensure the variable is set in the correct environment (dev/prod)
