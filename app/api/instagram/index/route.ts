import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Instagram API index endpoint is working",
    timestamp: new Date().toISOString(),
    endpoint: "/api/instagram/index",
    available_endpoints: [
      "/api/instagram/connect",
      "/api/instagram/connect-instagram", 
      "/api/instagram/test-connection",
      "/api/instagram/test-db",
      "/api/instagram/test-db-structure",
      "/api/instagram/webhook",
      "/api/instagram/send-message"
    ]
  })
}
