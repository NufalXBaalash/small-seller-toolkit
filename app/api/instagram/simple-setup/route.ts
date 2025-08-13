import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = createServerClient()
    console.log('Starting simple Instagram setup...')
    
    const results = []
    let success = true

    // 1. Create user_connections table if it doesn't exist
    try {
      console.log('Creating user_connections table...')
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS user_connections (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            platform TEXT NOT NULL,
            platform_username TEXT NOT NULL,
            access_token TEXT NOT NULL,
            business_name TEXT,
            connected BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, platform)
          );
        `
      })
      
      if (error) {
        console.log('Error creating user_connections table:', error)
        // Try alternative method
        const { error: altError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS user_connections (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL,
              platform TEXT NOT NULL,
              platform_username TEXT NOT NULL,
              access_token TEXT NOT NULL,
              business_name TEXT,
              connected BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })
        
        if (altError) {
          throw altError
        }
      }
      
      results.push({ statement: 'Create user_connections table', success: true })
      console.log('user_connections table created successfully')
    } catch (e) {
      console.error('Failed to create user_connections table:', e)
      results.push({ statement: 'Create user_connections table', success: false, error: e })
      success = false
    }

    // 2. Add Instagram columns to users table if they don't exist
    try {
      console.log('Adding Instagram columns to users table...')
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'instagram_username') THEN
              ALTER TABLE users ADD COLUMN instagram_username TEXT;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'instagram_connected') THEN
              ALTER TABLE users ADD COLUMN instagram_connected BOOLEAN DEFAULT false;
            END IF;
          END $$;
        `
      })
      
      if (error) {
        console.log('Error adding Instagram columns to users table:', error)
        // Try alternative method
        const { error: altError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_username TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_connected BOOLEAN DEFAULT false;
          `
        })
        
        if (altError) {
          throw altError
        }
      }
      
      results.push({ statement: 'Add Instagram columns to users table', success: true })
      console.log('Instagram columns added to users table successfully')
    } catch (e) {
      console.error('Failed to add Instagram columns to users table:', e)
      results.push({ statement: 'Add Instagram columns to users table', success: false, error: e })
      success = false
    }

    // 3. Add platform column to messages table if it doesn't exist
    try {
      console.log('Adding platform column to messages table...')
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'platform') THEN
              ALTER TABLE messages ADD COLUMN platform TEXT DEFAULT 'general';
            END IF;
          END $$;
        `
      })
      
      if (error) {
        console.log('Error adding platform column to messages table:', error)
        // Try alternative method
        const { error: altError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE messages ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'general';
          `
        })
        
        if (altError) {
          throw altError
        }
      }
      
      results.push({ statement: 'Add platform column to messages table', success: true })
      console.log('Platform column added to messages table successfully')
    } catch (e) {
      console.error('Failed to add platform column to messages table:', e)
      results.push({ statement: 'Add platform column to messages table', success: false, error: e })
      success = false
    }

    // 4. Create basic RLS policies for user_connections
    try {
      console.log('Creating RLS policies for user_connections...')
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can view their own connections" ON user_connections;
          CREATE POLICY "Users can view their own connections" ON user_connections
            FOR SELECT USING (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Users can insert their own connections" ON user_connections;
          CREATE POLICY "Users can insert their own connections" ON user_connections
            FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Users can update their own connections" ON user_connections;
          CREATE POLICY "Users can update their own connections" ON user_connections
            FOR UPDATE USING (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Users can delete their own connections" ON user_connections;
          CREATE POLICY "Users can delete their own connections" ON user_connections
            FOR DELETE USING (auth.uid() = user_id);
        `
      })
      
      if (error) {
        console.log('Error creating RLS policies:', error)
        // This is not critical, so we won't fail the setup
        results.push({ statement: 'Create RLS policies', success: false, error: error.message, warning: true })
      } else {
        results.push({ statement: 'Create RLS policies', success: true })
        console.log('RLS policies created successfully')
      }
    } catch (e) {
      console.error('Failed to create RLS policies:', e)
      results.push({ statement: 'Create RLS policies', success: false, error: e, warning: true })
    }

    // 5. Verify the setup
    try {
      console.log('Verifying setup...')
      
      // Check if user_connections table exists
      const { data: connections, error: connError } = await supabase
        .from('user_connections')
        .select('*')
        .limit(1)
      
      if (connError) {
        throw new Error(`user_connections table not accessible: ${connError.message}`)
      }
      
      // Check if Instagram columns exist in users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, instagram_username, instagram_connected')
        .limit(1)
      
      if (usersError) {
        throw new Error(`Instagram columns not accessible: ${usersError.message}`)
      }
      
      results.push({ statement: 'Verify setup', success: true })
      console.log('Setup verification successful')
    } catch (e) {
      console.error('Setup verification failed:', e)
      results.push({ statement: 'Verify setup', success: false, error: e })
      success = false
    }

    return NextResponse.json({
      success,
      message: success ? 'Instagram setup completed successfully' : 'Instagram setup completed with errors',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Instagram setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
