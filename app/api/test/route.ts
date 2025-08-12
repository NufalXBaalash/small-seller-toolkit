import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "API routing is working",
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json({
    success: true,
    message: "POST request received",
    data: body,
    timestamp: new Date().toISOString()
  })
}
