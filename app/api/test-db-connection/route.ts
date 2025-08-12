import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const startTime = Date.now()
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("count")
      .limit(1)

    const responseTime = Date.now() - startTime

    if (testError) {
      return NextResponse.json({
        success: false,
        error: testError.message,
        code: testError.code,
        responseTime
      }, { status: 500 })
    }

    // Test optimized function if available
    let functionTest = "Function not available"
    try {
      const functionStartTime = Date.now()
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_user_dashboard_data', { user_id_param: '00000000-0000-0000-0000-000000000000' })
      
      const functionResponseTime = Date.now() - functionStartTime
      
      if (!functionError) {
        functionTest = `Function available (${functionResponseTime}ms)`
      } else {
        functionTest = `Function error: ${functionError.message}`
      }
    } catch (error) {
      functionTest = "Function not available"
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      responseTime,
      functionTest,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: 0
    }, { status: 500 })
  }
}
