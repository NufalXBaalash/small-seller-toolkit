import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pageId, accessToken } = await request.json()

    if (!pageId || !accessToken) {
      return NextResponse.json({ 
        error: "Page ID and access token are required" 
      }, { status: 400 })
    }

    // Test the Facebook Page API connection
    const testResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=id,name,access_token&access_token=${accessToken}`)

    if (!testResponse.ok) {
      const errorData = await testResponse.text()
      console.error("Facebook API error:", errorData)
      return NextResponse.json(
        {
          error: "Failed to connect to Facebook Page API",
          details: errorData,
        },
        { status: 400 },
      )
    }

    const pageData = await testResponse.json()
    console.log("Facebook Page API test successful:", pageData)

    // Test sending a message (this will fail in development mode, but we can test the connection)
    try {
      const messageResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: pageId }, // This will fail, but tests the endpoint
          message: { text: "Test message from Sellio" },
          access_token: accessToken,
        }),
      })

      if (messageResponse.ok) {
        console.log("Facebook message API test successful")
      } else {
        console.log("Facebook message API test failed (expected in development mode)")
      }
    } catch (messageError) {
      console.log("Facebook message API test error (expected in development mode):", messageError)
    }

    return NextResponse.json({
      success: true,
      message: "Facebook connection test successful",
      data: {
        page_id: pageData.id,
        page_name: pageData.name,
        connection_status: "connected"
      }
    })
  } catch (error) {
    console.error("Error testing Facebook connection:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
