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

    console.log("Fetching orders for user:", user.id)

    // Get query parameters for pagination and search
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    let orders
    let error

    if (search) {
      // Use optimized search function if available
      try {
        const { data, error: searchError } = await supabase
          .rpc('search_orders', { 
            search_term: search, 
            user_id_param: user.id 
          })
        orders = data
        error = searchError
      } catch (e) {
        console.log('Search orders function not available, using fallback')
        // Fallback to direct query with search
        const { data, error: fallbackError } = await supabase
          .from("orders")
          .select(`
            id,
            total_amount,
            created_at,
            status,
            customer_id,
            platform,
            payment_status,
            customers (
              name,
              email,
              phone_number
            ),
            order_items (
              quantity,
              unit_price,
              total_price,
              products (
                name,
                sku
              )
            )
          `)
          .eq("user_id", user.id)
          .or(`order_number.ilike.%${search}%,customers.name.ilike.%${search}%`)
          .order("created_at", { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1)
        
        orders = data
        error = fallbackError
      }
    } else {
      // Use optimized pagination function if available
      try {
        const { data, error: paginationError } = await supabase
          .rpc('get_orders_optimized', { 
            user_id_param: user.id,
            limit_param: limit,
            offset_param: offset
          })
        orders = data
        error = paginationError
      } catch (e) {
        console.log('Optimized orders function not available, using fallback')
        // Fallback to direct query
        const { data, error: fallbackError } = await supabase
          .from("orders")
          .select(`
            id,
            total_amount,
            created_at,
            status,
            customer_id,
            platform,
            payment_status,
            customers (
              name,
              email,
              phone_number
            ),
            order_items (
              quantity,
              unit_price,
              total_price,
              products (
                name,
                sku
              )
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1)
        
        orders = data
        error = fallbackError
      }
    }

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedOrders = (orders || []).map((order: any) => ({
      ...order,
      customers: Array.isArray(order.customers) ? order.customers[0] || null : order.customers,
      order_items: order.order_items?.map((item: any) => ({
        ...item,
        products: Array.isArray(item.products) ? item.products[0] || null : item.products
      })) || []
    }))

    console.log("Successfully fetched", transformedOrders.length, "orders")
    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error("Error in orders GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== ORDERS API POST START ===")
    
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
    const { customer_id, total_amount, platform, shipping_address, payment_method, notes, items } = body

    console.log("Creating order for user:", user.id)
    console.log("Order data:", { customer_id, total_amount, platform, items })

    // Validate required fields
    if (!customer_id || !total_amount || !items || items.length === 0) {
      console.log("Validation failed")
      return NextResponse.json({ 
        error: "Customer ID, total amount, and items are required." 
      }, { status: 400 })
    }

    console.log("Attempting to insert order...")
    
    // Create the order
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        customer_id,
        total_amount: parseFloat(total_amount),
        platform: platform || "direct",
        shipping_address,
        payment_method,
        notes,
        status: "pending",
        payment_status: "pending"
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating order:", error)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Create order items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.quantity) * parseFloat(item.unit_price)
      }))

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

      if (itemsError) {
        console.error("Error creating order items:", itemsError)
        // Note: We might want to delete the order if items fail to create
        return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
      }
    }

    console.log("Order created successfully:", order.id)
    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error in orders POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
