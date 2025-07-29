import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, phoneNumber, businessName, connected } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Update user profile
    const { error: userError } = await supabase
      .from("users")
      .update({
        phone_number: phoneNumber,
        business_name: businessName || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (userError) {
      console.error("Error updating user:", userError)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    // Update or create business record
    const { data: existingBusiness } = await supabase.from("businesses").select("id").eq("user_id", userId).single()

    if (existingBusiness) {
      // Update existing business
      const { error: businessError } = await supabase
        .from("businesses")
        .update({
          phone_number: phoneNumber,
          name: businessName || "My Business",
          whatsapp_connected: connected,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (businessError) {
        console.error("Error updating business:", businessError)
      }
    } else {
      // Create new business
      const { error: businessError } = await supabase.from("businesses").insert({
        user_id: userId,
        name: businessName || "My Business",
        phone_number: phoneNumber,
        whatsapp_connected: connected,
      })

      if (businessError) {
        console.error("Error creating business:", businessError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating WhatsApp connection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
