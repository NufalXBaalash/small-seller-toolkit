import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() })
}

// Dashboard data fetching utilities with caching
export const fetchUserDashboardData = async (userId: string) => {
  const cacheKey = `dashboard-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const [orders, chats, customers, products, dailyStats] = await Promise.all([
      supabase
        .from("orders")
        .select("total_amount, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      
      supabase
        .from("chats")
        .select("unread_count, status, last_message, created_at, platform")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(10),
      
      supabase
        .from("customers")
        .select("id, name, status, created_at, total_orders, total_spent")
        .eq("user_id", userId),
      
      supabase
        .from("products")
        .select("name, stock, status, price")
        .eq("user_id", userId)
        .lte("stock", 5)
        .limit(5),

      supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", userId)
        .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("date", { ascending: false })
    ])

    const result = {
      orders: orders.data || [],
      chats: chats.data || [],
      customers: customers.data || [],
      products: products.data || [],
      dailyStats: dailyStats.data || [],
      errors: {
        orders: orders.error,
        chats: chats.error,
        customers: customers.error,
        products: products.error,
        dailyStats: dailyStats.error
      }
    }

    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw error
  }
}

export const fetchUserCustomers = async (userId: string): Promise<Customer[]> => {
  const cacheKey = `customers-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    
    const result = data || []
    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("Error fetching customers:", error)
    throw error
  }
}

export const fetchUserProducts = async (userId: string): Promise<Product[]> => {
  const cacheKey = `products-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    console.log("Fetching products for user:", userId)
    
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching products:", error)
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
    }
    
    console.log("Products fetched successfully:", data?.length || 0, "products")
    const result = data || []
    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("Error fetching products:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }
    throw new Error("Failed to fetch products: Unknown error")
  }
}

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const cacheKey = `orders-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    
    const result = data || []
    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("Error fetching orders:", error)
    throw error
  }
}

export const fetchUserAnalytics = async (userId: string): Promise<{
  orders: any[], 
  customers: any[], 
  dailyStats: any[],
  productStats: any[],
  errors: any
}> => {
  const cacheKey = `analytics-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const [orders, customers, dailyStats, productStats] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total_amount, created_at, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("customers")
        .select("id, created_at, total_orders, total_spent")
        .eq("user_id", userId),

      supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", userId)
        .gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("date", { ascending: true }),

      supabase
        .from("order_items")
        .select("quantity, total_price")
        .order("created_at", { ascending: false })
    ])

    const result = {
      orders: orders.data || [],
      customers: customers.data || [],
      dailyStats: dailyStats.data || [],
      productStats: productStats.data || [],
      errors: {
        orders: orders.error,
        customers: customers.error,
        dailyStats: dailyStats.error,
        productStats: productStats.error
      }
    }

    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("Error fetching analytics:", error)
    throw error
  }
}

export const fetchUserChats = async (userId: string): Promise<Chat[]> => {
  const cacheKey = `chats-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) throw error
    
    const result = data || []
    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("Error fetching chats:", error)
    throw error
  }
}

export const fetchChatMessages = async (chatId: string): Promise<Message[]> => {
  const cacheKey = `messages-${chatId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) throw error
    
    const result = data || []
    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("Error fetching messages:", error)
    throw error
  }
}

// Clear cache when data is modified
export const clearCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

export const createProduct = async (userId: string, productData: {
  name: string
  sku?: string | null
  category?: string | null
  stock: number
  price?: number | null
  description?: string | null
  image_url?: string | null
}) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        user_id: userId,
        ...productData,
        status: "active"
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export const updateProduct = async (productId: string, productData: Partial<Product>) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", productId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export const deleteProduct = async (productId: string) => {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

export const createCustomer = async (userId: string, customerData: {
  name: string
  email?: string | null
  phone_number?: string | null
  platform?: string
  notes?: string | null
}) => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: userId,
        ...customerData,
        status: "active"
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating customer:", error)
    throw error
  }
}

export const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .update(customerData)
      .eq("id", customerId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating customer:", error)
    throw error
  }
}

export const createOrder = async (userId: string, orderData: {
  customer_id: string
  total_amount: number
  platform?: string
  shipping_address?: string
  payment_method?: string
  notes?: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
}) => {
  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_id: orderData.customer_id,
        total_amount: orderData.total_amount,
        platform: orderData.platform,
        shipping_address: orderData.shipping_address,
        payment_method: orderData.payment_method,
        notes: orderData.notes,
        status: "pending",
        payment_status: "pending"
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) throw itemsError

    return order
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .limit(1)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

// Type definitions
interface Chat {
  id: string
  platform: string
  last_message: string | null
  unread_count: number
  status: string
  created_at: string
  updated_at: string
  customers: {
    id: string
    name: string
    email: string | null
    phone_number: string | null
  }
}

interface Message {
  id: string
  sender_type: string
  content: string
  message_type: string
  is_read: boolean
  created_at: string
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone_number: string | null
  platform: string
  total_orders: number
  total_spent: number
  status: string
  last_order_date: string | null
  created_at: string
}

interface Product {
  id: string
  name: string
  sku: string | null
  category: string | null
  stock: number
  price: number | null
  status: string
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

interface Order {
  id: string
  total_amount: number
  created_at: string
  status: string
  customer_id: string
  platform?: string
  payment_status?: string
  customers?: {
    name: string
    email: string | null
    phone_number: string | null
  }
  order_items?: Array<{
    quantity: number
    unit_price: number
    total_price: number
    products: {
      name: string
      sku: string | null
    }
  }>
}

export const createServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
