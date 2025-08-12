-- Fix Instagram Integration Database Setup
-- This script ensures all necessary tables and columns exist for Instagram integration

-- Create user_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_connections (
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

-- Add RLS policies for user_connections if they don't exist
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON user_connections;

CREATE POLICY "Users can view their own connections" ON user_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" ON user_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON user_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON user_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Add Instagram-specific columns to users table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'instagram_username') THEN
        ALTER TABLE users ADD COLUMN instagram_username TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'instagram_connected') THEN
        ALTER TABLE users ADD COLUMN instagram_connected BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add Instagram-specific columns to user_profiles table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'instagram_username') THEN
            ALTER TABLE user_profiles ADD COLUMN instagram_username TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'instagram_connected') THEN
            ALTER TABLE user_profiles ADD COLUMN instagram_connected BOOLEAN DEFAULT false;
        END IF;
    END IF;
END $$;

-- Add Instagram-specific columns to messages table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'platform') THEN
        ALTER TABLE messages ADD COLUMN platform TEXT DEFAULT 'whatsapp';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sender_username') THEN
        ALTER TABLE messages ADD COLUMN sender_username TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recipient_username') THEN
        ALTER TABLE messages ADD COLUMN recipient_username TEXT;
    END IF;
END $$;

-- Add Instagram-specific columns to chats table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'customer_username') THEN
        ALTER TABLE chats ADD COLUMN customer_username TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_platform ON user_connections(platform);
CREATE INDEX IF NOT EXISTS idx_messages_platform ON messages(platform);
CREATE INDEX IF NOT EXISTS idx_chats_platform ON chats(platform);

-- Create or replace function to get user's Instagram connection status
CREATE OR REPLACE FUNCTION get_user_instagram_status(user_id_param UUID)
RETURNS TABLE(
    connected BOOLEAN,
    username TEXT,
    business_name TEXT,
    last_connected TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.connected,
        uc.platform_username,
        uc.business_name,
        uc.updated_at
    FROM user_connections uc
    WHERE uc.user_id = user_id_param 
    AND uc.platform = 'instagram'
    AND uc.connected = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to get Instagram chats for a user
CREATE OR REPLACE FUNCTION get_instagram_chats(user_id_param UUID)
RETURNS TABLE(
    chat_id TEXT,
    customer_username TEXT,
    last_message TEXT,
    unread_count INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.customer_username,
        c.last_message,
        c.unread_count,
        c.updated_at
    FROM chats c
    WHERE c.user_id = user_id_param 
    AND c.platform = 'instagram'
    ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_connections TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_instagram_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_instagram_chats(UUID) TO authenticated;

-- Create or replace trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_connections_updated_at ON user_connections;

CREATE TRIGGER update_user_connections_updated_at
    BEFORE UPDATE ON user_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_connections IS 'Stores user connections to various social media platforms';
COMMENT ON COLUMN user_connections.platform IS 'The social media platform (instagram, whatsapp, facebook, etc.)';
COMMENT ON COLUMN user_connections.access_token IS 'Encrypted access token for the platform API';
COMMENT ON COLUMN user_connections.connected IS 'Whether the connection is currently active';

COMMENT ON FUNCTION get_user_instagram_status(UUID) IS 'Returns the Instagram connection status for a given user';
COMMENT ON FUNCTION get_instagram_chats(UUID) IS 'Returns all Instagram chats for a given user';

-- Verify the setup
SELECT 
    'user_connections table' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'user_connections') as exists
UNION ALL
SELECT 
    'users.instagram_username column' as table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'instagram_username') as exists
UNION ALL
SELECT 
    'users.instagram_connected column' as table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'instagram_connected') as exists
UNION ALL
SELECT 
    'messages.platform column' as table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'platform') as exists
UNION ALL
SELECT 
    'chats.customer_username column' as table_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'customer_username') as exists;
