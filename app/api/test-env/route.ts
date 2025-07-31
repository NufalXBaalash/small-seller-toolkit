import { NextRequest, NextResponse } from "next/server"

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
        missing: missingVars
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Environment variables configured correctly",
      envCheck
    })
  } catch (error) {
    console.error("Env Check Error:", error)
    return NextResponse.json({ 
      error: "Environment check failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 