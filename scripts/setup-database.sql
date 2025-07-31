-- Comprehensive Database Setup Script for Small Seller Toolkit
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP ALL EXISTING TABLES (BE CAREFUL - THIS WILL DELETE DATA!)
-- ============================================================================
-- Uncomment the following lines if you want to start fresh
-- DROP TABLE IF EXISTS public.platform_integrations CASCADE;
-- DROP TABLE IF EXISTS public.user_settings CASCADE;
-- DROP TABLE IF EXISTS public.daily_stats CASCADE;
-- DROP TABLE IF EXISTS public.analytics_events CASCADE;
-- DROP TABLE IF EXISTS public.alerts CASCADE;
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.auto_reply_logs CASCADE;
-- DROP TABLE IF EXISTS public.auto_replies CASCADE;
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.chats CASCADE;
-- DROP TABLE IF EXISTS public.order_items CASCADE;
-- DROP TABLE IF EXISTS public.orders CASCADE;
-- DROP TABLE IF EXISTS public.customer_tags CASCADE;
-- DROP TABLE IF EXISTS public.customers CASCADE;
-- DROP TABLE IF EXISTS public.product_categories CASCADE;
-- DROP TABLE IF EXISTS public.products CASCADE;
-- DROP TABLE IF EXISTS public.businesses CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP SEQUENCE IF EXISTS order_sequence CASCADE;

-- ============================================================================
-- CORE USER MANAGEMENT TABLES
-- ============================================================================

-- Create users table first (no foreign key constraints initially)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  business_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  address TEXT,
  business_hours TEXT,
  whatsapp_connected BOOLEAN DEFAULT FALSE,
  facebook_connected BOOLEAN DEFAULT FALSE,
  whatsapp_phone_number_id TEXT,
  whatsapp_access_token TEXT,
  whatsapp_verify_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVENTORY MANAGEMENT TABLES
-- ============================================================================

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_categories table for better organization
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CUSTOMER MANAGEMENT TABLES
-- ============================================================================

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  platform TEXT, -- 'whatsapp', 'facebook', 'instagram', etc.
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  last_order_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[], -- Array of tags for customer segmentation
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_tags table for better tag management
CREATE TABLE IF NOT EXISTS public.customer_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ORDER MANAGEMENT TABLES
-- ============================================================================

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  order_number TEXT UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  platform TEXT,
  shipping_address TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table for detailed order tracking
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  platform TEXT NOT NULL,
  platform_chat_id TEXT, -- External platform chat ID
  last_message TEXT,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL,
  platform_message_id TEXT, -- External platform message ID
  sender_type TEXT NOT NULL, -- 'customer', 'business', 'auto'
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'document', 'audio', 'video'
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_delivered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AUTO-REPLY AND AUTOMATION TABLES
-- ============================================================================

-- Create auto_replies table
CREATE TABLE IF NOT EXISTS public.auto_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'keyword', 'greeting', 'away', 'custom'
  trigger_text TEXT,
  response_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create auto_reply_logs table for tracking auto-reply usage
CREATE TABLE IF NOT EXISTS public.auto_reply_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_reply_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  trigger_text TEXT,
  response_sent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS AND ALERTS TABLES
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'order', 'message', 'stock', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB, -- Additional data for the notification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table for system alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'low_stock', 'new_order', 'new_message', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  is_dismissed BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS AND REPORTING TABLES
-- ============================================================================

-- Create analytics_events table for tracking user actions
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'button_click', 'form_submit', etc.
  event_name TEXT NOT NULL,
  properties JSONB,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_stats table for aggregated analytics
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  active_chats INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================================
-- SETTINGS AND CONFIGURATION TABLES
-- ============================================================================

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  auto_replies_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform_integrations table
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- 'whatsapp', 'facebook', 'instagram', 'telegram'
  is_connected BOOLEAN DEFAULT FALSE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  platform_user_id TEXT,
  platform_username TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- ============================================================================
-- FIX COLUMN TYPES IF THEY EXIST WITH WRONG TYPES
-- ============================================================================

-- Check and fix user_id columns to be UUID type
DO $$ 
BEGIN
    -- Fix businesses table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'businesses' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.businesses ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix products table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.products ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix product_categories table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'product_categories' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.product_categories ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix customers table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'customers' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.customers ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix customer_tags table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'customer_tags' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.customer_tags ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix orders table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.orders ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix chats table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'chats' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.chats ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix auto_replies table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'auto_replies' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.auto_replies ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix notifications table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notifications' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.notifications ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix alerts table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'alerts' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.alerts ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix analytics_events table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'analytics_events' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.analytics_events ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix daily_stats table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'daily_stats' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.daily_stats ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix user_settings table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_settings' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.user_settings ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
    -- Fix platform_integrations table user_id column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'platform_integrations' AND column_name = 'user_id' 
               AND data_type != 'uuid') THEN
        ALTER TABLE public.platform_integrations ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not convert some columns to UUID type. You may need to drop and recreate tables with conflicting data.';
END $$;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS AFTER ALL TABLES ARE CREATED
-- ============================================================================

-- Add foreign key constraints to businesses table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'businesses_user_id_fkey' 
        AND table_name = 'businesses'
    ) THEN
        ALTER TABLE public.businesses 
        ADD CONSTRAINT businesses_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to products table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_user_id_fkey' 
        AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT products_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to product_categories table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_categories_user_id_fkey' 
        AND table_name = 'product_categories'
    ) THEN
        ALTER TABLE public.product_categories 
        ADD CONSTRAINT product_categories_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to customers table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_user_id_fkey' 
        AND table_name = 'customers'
    ) THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to customer_tags table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customer_tags_user_id_fkey' 
        AND table_name = 'customer_tags'
    ) THEN
        ALTER TABLE public.customer_tags 
        ADD CONSTRAINT customer_tags_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_user_id_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_customer_id_fkey' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to order_items table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_order_id_fkey' 
        AND table_name = 'order_items'
    ) THEN
        ALTER TABLE public.order_items 
        ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_product_id_fkey' 
        AND table_name = 'order_items'
    ) THEN
        ALTER TABLE public.order_items 
        ADD CONSTRAINT order_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to chats table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chats_user_id_fkey' 
        AND table_name = 'chats'
    ) THEN
        ALTER TABLE public.chats 
        ADD CONSTRAINT chats_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chats_customer_id_fkey' 
        AND table_name = 'chats'
    ) THEN
        ALTER TABLE public.chats 
        ADD CONSTRAINT chats_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to messages table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_chat_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_chat_id_fkey 
        FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to auto_replies table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'auto_replies_user_id_fkey' 
        AND table_name = 'auto_replies'
    ) THEN
        ALTER TABLE public.auto_replies 
        ADD CONSTRAINT auto_replies_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to auto_reply_logs table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'auto_reply_logs_auto_reply_id_fkey' 
        AND table_name = 'auto_reply_logs'
    ) THEN
        ALTER TABLE public.auto_reply_logs 
        ADD CONSTRAINT auto_reply_logs_auto_reply_id_fkey 
        FOREIGN KEY (auto_reply_id) REFERENCES public.auto_replies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'auto_reply_logs_chat_id_fkey' 
        AND table_name = 'auto_reply_logs'
    ) THEN
        ALTER TABLE public.auto_reply_logs 
        ADD CONSTRAINT auto_reply_logs_chat_id_fkey 
        FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'auto_reply_logs_customer_id_fkey' 
        AND table_name = 'auto_reply_logs'
    ) THEN
        ALTER TABLE public.auto_reply_logs 
        ADD CONSTRAINT auto_reply_logs_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to notifications table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE public.notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to alerts table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'alerts_user_id_fkey' 
        AND table_name = 'alerts'
    ) THEN
        ALTER TABLE public.alerts 
        ADD CONSTRAINT alerts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to analytics_events table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'analytics_events_user_id_fkey' 
        AND table_name = 'analytics_events'
    ) THEN
        ALTER TABLE public.analytics_events 
        ADD CONSTRAINT analytics_events_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to daily_stats table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'daily_stats_user_id_fkey' 
        AND table_name = 'daily_stats'
    ) THEN
        ALTER TABLE public.daily_stats 
        ADD CONSTRAINT daily_stats_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to user_settings table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_settings_user_id_fkey' 
        AND table_name = 'user_settings'
    ) THEN
        ALTER TABLE public.user_settings 
        ADD CONSTRAINT user_settings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints to platform_integrations table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'platform_integrations_user_id_fkey' 
        AND table_name = 'platform_integrations'
    ) THEN
        ALTER TABLE public.platform_integrations 
        ADD CONSTRAINT platform_integrations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Businesses policies
DROP POLICY IF EXISTS "Users can manage own business" ON public.businesses;

-- Products policies
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own product categories" ON public.product_categories;

-- Customers policies
DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can manage own customer tags" ON public.customer_tags;

-- Orders policies
DROP POLICY IF EXISTS "Users can manage own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage own order items" ON public.order_items;

-- Communication policies
DROP POLICY IF EXISTS "Users can manage own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can manage messages from own chats" ON public.messages;

-- Automation policies
DROP POLICY IF EXISTS "Users can manage own auto replies" ON public.auto_replies;
DROP POLICY IF EXISTS "Users can manage own auto reply logs" ON public.auto_reply_logs;

-- Notification policies
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own alerts" ON public.alerts;

-- Analytics policies
DROP POLICY IF EXISTS "Users can manage own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can manage own daily stats" ON public.daily_stats;

-- Settings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage own platform integrations" ON public.platform_integrations;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Users can manage own business" ON public.businesses
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own product categories" ON public.product_categories
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Customers policies
CREATE POLICY "Users can manage own customers" ON public.customers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own customer tags" ON public.customer_tags
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can manage own orders" ON public.orders
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own order items" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Communication policies
CREATE POLICY "Users can manage own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage messages from own chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Automation policies
CREATE POLICY "Users can manage own auto replies" ON public.auto_replies
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own auto reply logs" ON public.auto_reply_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.auto_replies
      WHERE auto_replies.id = auto_reply_logs.auto_reply_id
      AND auto_replies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auto_replies
      WHERE auto_replies.id = auto_reply_logs.auto_reply_id
      AND auto_replies.user_id = auth.uid()
    )
  );

-- Notification policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts" ON public.alerts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can manage own analytics events" ON public.analytics_events
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily stats" ON public.daily_stats
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own platform integrations" ON public.platform_integrations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core tables
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- Inventory tables
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_product_categories_user_id ON public.product_categories(user_id);

-- Customer tables
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone_number ON public.customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_platform ON public.customers(platform);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customer_tags_user_id ON public.customer_tags(user_id);

-- Order tables
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Communication tables
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON public.chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_chats_platform ON public.chats(platform);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats(status);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON public.messages(sender_type);

-- Automation tables
CREATE INDEX IF NOT EXISTS idx_auto_replies_user_id ON public.auto_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_replies_trigger_type ON public.auto_replies(trigger_type);
CREATE INDEX IF NOT EXISTS idx_auto_replies_is_active ON public.auto_replies(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_reply_logs_auto_reply_id ON public.auto_reply_logs(auto_reply_id);
CREATE INDEX IF NOT EXISTS idx_auto_reply_logs_chat_id ON public.auto_reply_logs(chat_id);

-- Notification tables
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);

-- Analytics tables
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON public.daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date);

-- Settings tables
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_user_id ON public.platform_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_platform ON public.platform_integrations(platform);

-- ============================================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for creating user profile on signup
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, business_name, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for creating default settings for new users
CREATE OR REPLACE FUNCTION create_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_sequence START 1;

-- Function for generating order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                     LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || '-' ||
                     LPAD(EXTRACT(DAY FROM NOW())::TEXT, 2, '0') || '-' ||
                     LPAD(nextval('order_sequence')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for updating customer stats when order is created
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customers
  SET 
    total_orders = total_orders + 1,
    total_spent = total_spent + NEW.total_amount,
    last_order_date = NOW(),
    updated_at = NOW()
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for updating daily stats
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.daily_stats (user_id, date, total_orders, total_revenue)
  VALUES (NEW.user_id, DATE(NOW()), 1, NEW.total_amount)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_orders = daily_stats.total_orders + 1,
    total_revenue = daily_stats.total_revenue + NEW.total_amount,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_product_categories_updated_at ON public.product_categories;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
DROP TRIGGER IF EXISTS update_auto_replies_updated_at ON public.auto_replies;
DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON public.daily_stats;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
DROP TRIGGER IF EXISTS update_platform_integrations_updated_at ON public.platform_integrations;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON public.users;
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON public.orders;
DROP TRIGGER IF EXISTS update_daily_stats_trigger ON public.orders;

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_replies_updated_at BEFORE UPDATE ON public.auto_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON public.daily_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_integrations_updated_at BEFORE UPDATE ON public.platform_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create business logic triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_default_settings();

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

CREATE TRIGGER update_daily_stats_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_daily_stats();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant usage on the order sequence
GRANT USAGE, SELECT ON SEQUENCE order_sequence TO anon, authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- This script has successfully created all necessary tables, policies, and functions
-- for the Small Seller Toolkit application. The database is now ready to use!