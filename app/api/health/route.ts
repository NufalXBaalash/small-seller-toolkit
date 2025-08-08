import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || 'unknown'
    }

    // Test Supabase connection
    let supabaseStatus = 'unknown'
    let supabaseError = null
    
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)
      if (error) {
        supabaseStatus = 'error'
        supabaseError = error.message
      } else {
        supabaseStatus = 'connected'
      }
    } catch (error) {
      supabaseStatus = 'error'
      supabaseError = error instanceof Error ? error.message : 'Unknown error'
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      ...health,
      supabase: {
        status: supabaseStatus,
        error: supabaseError
      },
      responseTime: `${responseTime}ms`
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`
    }, { status: 500 })
  }
}
