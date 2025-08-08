import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      // Don't expose actual values, just check if they exist
    }

    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => !value && key !== 'nodeEnv')
      .map(([key]) => key)

    if (missingVars.length > 0) {
      return NextResponse.json({ 
        error: "Missing environment variables",
        missing: missingVars,
        envCheck
      }, { status: 500 })
    }

    // Test Supabase connection with detailed error reporting
    let connectionTest = { success: false, error: null, details: null }
    try {
      console.log('[test-env] Testing Supabase connection...')
      
      // Test 1: Basic connection
      const { data, error } = await supabase.from("users").select("count").limit(1)
      
      if (error) {
        connectionTest = { 
          success: false, 
          error: error.message,
          details: {
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        }
      } else {
        connectionTest = { 
          success: true, 
          error: null,
          details: { data }
        }
      }
    } catch (error) {
      connectionTest = { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        details: { type: 'exception' }
      }
    }

    // Additional environment info
    const additionalInfo = {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host'),
      region: process.env.VERCEL_REGION || 'unknown'
    }

    return NextResponse.json({ 
      success: true,
      message: "Environment check completed",
      envCheck,
      connectionTest,
      additionalInfo
    })
  } catch (error) {
    console.error("Env Check Error:", error)
    return NextResponse.json({ 
      error: "Environment check failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 