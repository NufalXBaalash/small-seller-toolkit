import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching customers for user:", user.id)

    // Get query parameters for pagination and search
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    let customers
    let error

    if (search) {
      // Use optimized search function
      const { data, error: searchError } = await supabase
        .rpc('search_customers', { 
          search_term: search, 
          user_id_param: user.id 
        })
      customers = data
      error = searchError
    } else {
      // Use optimized pagination function
      const { data, error: paginationError } = await supabase
        .rpc('get_customers_optimized', { 
          user_id_param: user.id, 
          limit_param: limit, 
          offset_param: offset 
        })
      customers = data
      error = paginationError
    }

    if (error) {
      console.error("Error fetching customers:", error)
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    console.log("Successfully fetched", customers?.length || 0, "customers")
    return NextResponse.json({ customers: customers || [] })
  } catch (error) {
    console.error("Error in customers GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== CUSTOMERS API POST START ===")
    
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('authorization')
    console.log("Auth header present:", !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No valid auth header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log("Token length:", token.length)
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error("Auth error:", authError)
      console.error("User:", user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User authenticated:", user.id)

    const body = await request.json()
    const { name, email, phone_number, platform, notes } = body

    console.log("Creating customer for user:", user.id)
    console.log("Customer data:", { name, email, phone_number, platform, notes })

    // Validate required fields
    if (!name) {
      console.log("Validation failed")
      return NextResponse.json({ 
        error: "Name is required." 
      }, { status: 400 })
    }

    console.log("Attempting to insert customer...")
    
    // Create the customer
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        user_id: user.id,
        name,
        email,
        phone_number,
        platform: platform || "direct",
        notes,
        status: "active"
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating customer:", error)
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    console.log("Customer created successfully:", customer.id)
    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Error in customers POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
