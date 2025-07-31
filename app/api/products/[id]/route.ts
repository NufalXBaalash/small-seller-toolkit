import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { name, sku, category, stock, price, description, image_url } = body

    // Validate required fields
    if (!name || !stock || stock < 0) {
      return NextResponse.json({ 
        error: "Name and stock are required. Stock must be non-negative." 
      }, { status: 400 })
    }

    // Update the product (only if it belongs to the user)
    const { data: product, error } = await supabase
      .from("products")
      .update({
        name,
        sku,
        category,
        stock: parseInt(stock),
        price: price ? parseFloat(price) : null,
        description,
        image_url,
        status: "active"
      })
      .eq("id", params.id)
      .eq("user_id", user.id) // Ensure the product belongs to the user
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error in products PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete the product (only if it belongs to the user)
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id) // Ensure the product belongs to the user

    if (error) {
      console.error("Error deleting product:", error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error in products DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 