import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Test POST endpoint GET method works",
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: "Test POST endpoint works",
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to parse request body",
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}
