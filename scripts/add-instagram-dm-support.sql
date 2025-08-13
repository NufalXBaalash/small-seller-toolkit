-- Add Instagram DM Support
-- This script adds the necessary columns and updates for Instagram Direct Messages

-- Add customer_username column to chats table for Instagram users
ALTER TABLE public.chats 
ADD COLUMN IF NOT EXISTS customer_username TEXT;

-- Create index for better performance on Instagram chats
CREATE INDEX IF NOT EXISTS idx_chats_platform_customer_username 
ON public.chats(platform, customer_username) 
WHERE platform = 'instagram';

-- Update existing Instagram chats to have customer_username if they don't
UPDATE public.chats 
SET customer_username = 'instagram_user_' || id::text 
WHERE platform = 'instagram' AND customer_username IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.chats.customer_username IS 'Username for Instagram customers (e.g., @username)';

-- Create a function to get Instagram chats for a user
CREATE OR REPLACE FUNCTION get_instagram_chats(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  platform TEXT,
  customer_username TEXT,
  last_message TEXT,
  unread_count INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.platform,
    c.customer_username,
    c.last_message,
    c.unread_count,
    c.status,
    c.created_at,
    c.updated_at
  FROM public.chats c
  WHERE c.user_id = user_id_param 
    AND c.platform = 'instagram'
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_instagram_chats(UUID) TO authenticated;

-- Create a function to get messages for a specific Instagram chat
CREATE OR REPLACE FUNCTION get_instagram_chat_messages(chat_id_param UUID)
RETURNS TABLE (
  id UUID,
  sender_type TEXT,
  content TEXT,
  message_type TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_type,
    m.content,
    m.message_type,
    m.is_read,
    m.created_at
  FROM public.messages m
  WHERE m.chat_id = chat_id_param
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_instagram_chat_messages(UUID) TO authenticated;

-- Create a function to mark Instagram messages as read
CREATE OR REPLACE FUNCTION mark_instagram_messages_read(chat_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.messages 
  SET is_read = true 
  WHERE chat_id = chat_id_param 
    AND sender_type = 'customer'
    AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Update the chat's unread count
  UPDATE public.chats 
  SET unread_count = 0 
  WHERE id = chat_id_param;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION mark_instagram_messages_read(UUID) TO authenticated;

-- Create a function to send a message in Instagram chat
CREATE OR REPLACE FUNCTION send_instagram_message(
  chat_id_param UUID,
  content_param TEXT,
  message_type_param TEXT DEFAULT 'text'
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
BEGIN
  -- Insert the new message
  INSERT INTO public.messages (chat_id, sender_type, content, message_type, is_read)
  VALUES (chat_id_param, 'business', content_param, message_type_param, true)
  RETURNING id INTO new_message_id;
  
  -- Update the chat's last message and timestamp
  UPDATE public.chats 
  SET 
    last_message = content_param,
    updated_at = NOW()
  WHERE id = chat_id_param;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION send_instagram_message(UUID, TEXT, TEXT) TO authenticated;

-- Verify the setup
SELECT 'Instagram DM support setup completed successfully' as status;
