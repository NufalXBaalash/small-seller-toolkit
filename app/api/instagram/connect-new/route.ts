import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// Handle all HTTP methods
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Instagram connect-new endpoint is accessible",
    timestamp: new Date().toISOString(),
    endpoint: "/api/instagram/connect-new"
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Instagram connect-new POST method works",
    timestamp: new Date().toISOString(),
    method: "POST"
  })
}

// Alternative approach - handle all methods in one function
export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Instagram connect-new PUT method works",
    timestamp: new Date().toISOString(),
    method: "PUT"
  })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Instagram connect-new PATCH method works",
    timestamp: new Date().toISOString(),
    method: "PATCH"
  })
}
