import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('Instagram setup API called')
    
    const supabase = createServerClient()
    
    // Read the SQL script
    const scriptPath = path.join(process.cwd(), 'scripts', 'fix-instagram-integration.sql')
    const sqlScript = fs.readFileSync(scriptPath, 'utf8')
    
    console.log('Executing Instagram setup script...')
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript })
    
    if (error) {
      console.error('Error executing setup script:', error)
      
      // Try executing the script in parts
      const statements = sqlScript.split(';').filter(stmt => stmt.trim())
      
      const results = []
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { data: stmtData, error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
            results.push({ statement: statement.substring(0, 50) + '...', success: !stmtError, error: stmtError })
          } catch (e) {
            results.push({ statement: statement.substring(0, 50) + '...', success: false, error: e })
          }
        }
      }
      
      return NextResponse.json({
        success: false,
        message: "Setup completed with some errors",
        results
      })
    }
    
    console.log('Instagram setup completed successfully')
    
    return NextResponse.json({
      success: true,
      message: "Instagram integration setup completed successfully",
      data
    })
    
  } catch (error) {
    console.error("Instagram setup error:", error)
    return NextResponse.json(
      { error: "Internal server error during setup" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Instagram setup status check')
    
    const supabase = createServerClient()
    
    // Check if the required tables and columns exist
    const checks = await Promise.all([
      // Check user_connections table
      supabase.from('user_connections').select('count').limit(1).then(result => ({
        name: 'user_connections table',
        exists: !result.error,
        error: result.error
      })),
      
      // Check users table Instagram columns
      supabase.rpc('check_column_exists', { 
        table_name: 'users', 
        column_name: 'instagram_username' 
      }).then(result => ({
        name: 'users.instagram_username column',
        exists: result.data,
        error: result.error
      })),
      
      // Check messages table platform column
      supabase.rpc('check_column_exists', { 
        table_name: 'messages', 
        column_name: 'platform' 
      }).then(result => ({
        name: 'messages.platform column',
        exists: result.data,
        error: result.error
      }))
    ])
    
    const allReady = checks.every(check => check.exists)
    
    return NextResponse.json({
      success: true,
      ready: allReady,
      checks
    })
    
  } catch (error) {
    console.error("Instagram setup status check error:", error)
    return NextResponse.json(
      { error: "Internal server error during status check" },
      { status: 500 }
    )
  }
}
