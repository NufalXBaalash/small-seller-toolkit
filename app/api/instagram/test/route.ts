import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Instagram API is working!",
    timestamp: new Date().toISOString(),
    endpoints: {
      test_connection: "/api/instagram/test-connection",
      send_message: "/api/instagram/send-message",
      webhook: "/api/instagram/webhook"
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: "Test POST request received",
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Invalid JSON in request body",
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}
