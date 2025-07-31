# Small Seller Toolkit

A comprehensive dashboard for small sellers to manage their business operations including inventory, customers, orders, and messaging.

## Features

- **Dashboard Overview**: Real-time stats and recent activity
- **Inventory Management**: Track products, stock levels, and pricing
- **Customer Management**: Manage customer relationships and data
- **Order Management**: Track orders and fulfillment
- **Chat Management**: Handle customer conversations across platforms
- **Analytics**: Business performance insights and reporting
- **Settings**: Configure integrations and preferences

## Recent Fixes

### Page Visibility Issue (Fixed)

**Problem**: Dashboard pages would get stuck at the loading screen when switching browser tabs and returning.

**Solution**: Implemented page visibility handling across all dashboard pages:

1. **Auth Context Enhancement**: Added page visibility detection to automatically refresh authentication state when the tab becomes visible again.

2. **Protected Route Improvement**: Enhanced the protected route component to handle redirect states better and prevent infinite loading loops.

3. **Page Visibility Hook**: Created a custom hook (`useRefetchOnVisibility`) that automatically refetches data when pages become visible again.

4. **Dashboard Pages Update**: All dashboard pages now use the visibility hook to ensure data is fresh when returning to the tab.

**Files Modified**:
- `contexts/auth-context.tsx` - Added page visibility handling
- `components/protected-route.tsx` - Improved redirect handling
- `hooks/use-page-visibility.ts` - New custom hook for visibility management
- All dashboard pages (`app/dashboard/*/page.tsx`) - Added visibility hook usage

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up your environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
Small_Seller_Toolkit/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/           # Reusable components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utility functions
└── scripts/             # Database setup scripts
```

## Database Setup

Run the database setup scripts in the `scripts/` directory to initialize your Supabase database with the required tables and functions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. 