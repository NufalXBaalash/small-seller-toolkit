# Sellio - Smart Sales Automation

Sellio is a powerful WhatsApp Business automation platform designed for small sellers, dropshippers, and social commerce entrepreneurs.

## Features

- 🤖 **AI-Powered Auto-Replies** - Never miss a customer message
- 📊 **Real-time Analytics** - Track sales, customers, and performance
- 📦 **Inventory Management** - Never run out of stock again
- 👥 **Customer Management** - Build lasting relationships
- 📱 **Mobile-First Design** - Work from anywhere
- 🔗 **WhatsApp Business Integration** - Seamless messaging automation

## WhatsApp Business Setup

### Prerequisites

1. **WhatsApp Business Account** - You need a verified WhatsApp Business account
2. **Meta Developer Account** - Create an account at [developers.facebook.com](https://developers.facebook.com)
3. **WhatsApp Business API Access** - Apply for WhatsApp Business API access

### Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Getting WhatsApp Business API Credentials

1. **Create a Meta App**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a new app or use an existing one
   - Add the "WhatsApp Business API" product

2. **Get Access Token**
   - In your app dashboard, go to "WhatsApp" → "Getting Started"
   - Copy your access token

3. **Get Phone Number ID**
   - Go to "WhatsApp" → "Phone Numbers"
   - Copy the Phone Number ID for your verified number

4. **Set Up Webhook**
   - Go to "WhatsApp" → "Configuration"
   - Set Webhook URL to: `https://your-app.vercel.app/api/whatsapp/webhook`
   - Set Verify Token to your chosen token (same as `WHATSAPP_VERIFY_TOKEN`)
   - Subscribe to `messages` and `message_deliveries` events

### Testing the Connection

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Open the App**
   - Go to `http://localhost:3000`
   - Sign up or log in
   - Go to Dashboard
   - Click "Connect WhatsApp"

3. **Follow the Setup Process**
   - Enter your WhatsApp Business phone number
   - Verify with the OTP sent to your WhatsApp
   - Complete the business setup
   - Test the connection

### Troubleshooting

**Common Issues:**

1. **"WhatsApp API not configured"**
   - Check that all environment variables are set correctly
   - Ensure your Meta app has WhatsApp Business API enabled

2. **"Invalid access token"**
   - Verify your access token is correct
   - Make sure your app has the right permissions

3. **"Phone number not found"**
   - Ensure the phone number is registered with WhatsApp Business
   - Check that the number format includes country code (e.g., +1234567890)

4. **"Webhook verification failed"**
   - Verify the webhook URL is accessible
   - Check that the verify token matches your environment variable

**Debug Mode:**
- In development, OTP codes are logged to the console
- Check the browser console for debug information
- Use the status API: `GET /api/whatsapp/status`

## Development

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sellio

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the development server
pnpm dev
```

### Project Structure

```
sellio/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── whatsapp/      # WhatsApp API endpoints
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components
│   └── whatsapp-connect-modal.tsx
├── lib/                  # Utility libraries
│   ├── otp-storage.ts    # OTP management
│   └── supabase.ts       # Database client
└── contexts/             # React contexts
    └── auth-context.tsx  # Authentication
```

### API Endpoints

- `POST /api/whatsapp/send-otp` - Send verification code
- `POST /api/whatsapp/verify-otp` - Verify OTP
- `POST /api/whatsapp/test-connection` - Test WhatsApp connection
- `GET /api/whatsapp/status` - Check connection status
- `GET/POST /api/whatsapp/webhook` - WhatsApp webhook

## Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Set environment variables in Vercel dashboard

2. **Deploy**
   - Push to main branch triggers automatic deployment
   - Or deploy manually from Vercel dashboard

3. **Update Webhook URL**
   - Update your Meta app webhook URL to your production domain
   - Test the webhook verification

### Environment Variables for Production

Make sure to set these in your production environment:

```env
WHATSAPP_ACCESS_TOKEN=your_production_access_token
WHATSAPP_PHONE_NUMBER_ID=your_production_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_production_verify_token
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact us at support@sellio.com or create an issue in this repository. 