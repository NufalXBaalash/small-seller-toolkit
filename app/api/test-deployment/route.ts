import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Test deployment endpoint is working",
    timestamp: new Date().toISOString(),
    endpoint: "/api/test-deployment",
    method: "GET"
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: "Test deployment POST method is working",
      receivedData: body,
      timestamp: new Date().toISOString(),
      endpoint: "/api/test-deployment",
      method: "POST"
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to parse request body",
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}
