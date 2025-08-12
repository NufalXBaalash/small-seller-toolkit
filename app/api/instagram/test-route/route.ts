import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Instagram test route is working",
    timestamp: new Date().toISOString(),
    endpoint: "/api/instagram/test-route"
  })
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Instagram test route POST is working",
    timestamp: new Date().toISOString(),
    endpoint: "/api/instagram/test-route"
  })
}
