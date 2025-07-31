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

    console.log("Fetching products for user:", user.id)

    // Test database connection first
    const { data: testData, error: testError } = await supabase
      .from("products")
      .select("count")
      .limit(1)

    if (testError) {
      console.error("Database connection test failed:", testError)
      return NextResponse.json({ 
        error: "Database connection failed",
        details: testError.message
      }, { status: 500 })
    }

    // Fetch products for the authenticated user
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    console.log("Successfully fetched", products?.length || 0, "products")
    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error("Error in products GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== PRODUCTS API POST START ===")
    
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
    const { name, sku, category, stock, price, description, image_url } = body

    console.log("Creating product for user:", user.id)
    console.log("Product data:", { name, sku, category, stock, price, description, image_url })

    // Validate required fields
    if (!name || !stock || stock < 0) {
      console.log("Validation failed")
      return NextResponse.json({ 
        error: "Name and stock are required. Stock must be non-negative." 
      }, { status: 400 })
    }

    console.log("Attempting to insert product...")
    
    // Create the product
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        name,
        sku,
        category,
        stock: parseInt(stock),
        price: price ? parseFloat(price) : null,
        description,
        image_url,
        status: "active"
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating product:", error)
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: "Failed to create product",
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log("Product created successfully:", product)
    console.log("=== PRODUCTS API POST END ===")
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("=== PRODUCTS API POST ERROR ===")
    console.error("Error in products POST:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 