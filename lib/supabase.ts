import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'sellio-web-app'
    }
  }
})

// Enhanced in-memory cache with TTL and size limits
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes default
const MAX_CACHE_SIZE = 100 // Maximum number of cached items

const getCachedData = (key: string) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  if (cached) {
    cache.delete(key) // Remove expired cache
  }
  return null
}

const setCachedData = (key: string, data: any, ttl: number = CACHE_DURATION) => {
  // Implement LRU cache eviction
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value
    if (firstKey) {
      cache.delete(firstKey)
    }
  }
  cache.set(key, { data, timestamp: Date.now(), ttl })
}

// Optimized dashboard data fetching with new functions
export const fetchUserDashboardData = async (userId: string, retryCount = 0): Promise<{
  orders: any[]
  chats: any[]
  customers: any[]
  products: any[]
  dailyStats: any[]
  errors: any
}> => {
  const cacheKey = `dashboard-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    console.log('[fetchUserDashboardData] Starting fetch for user:', userId, 'retry:', retryCount)
    
    // Try to use the new optimized function first
    try {
      const { data: dashboardData, error } = await supabase
        .rpc('get_user_dashboard_data', { user_id_param: userId })

      if (!error && dashboardData) {
        console.log('[fetchUserDashboardData] Optimized function succeeded')
        const result = {
          orders: dashboardData?.recent_orders || [],
          chats: dashboardData?.active_chats || [],
          customers: [], // Will be fetched separately if needed
          products: dashboardData?.low_stock_products || [],
          dailyStats: [],
          errors: { dashboard: error }
        }

        setCachedData(cacheKey, result)
        return result
      }
    } catch (e) {
      console.log('[fetchUserDashboardData] Optimized dashboard function not available, using fallback:', e)
    }

    console.log('[fetchUserDashboardData] Using fallback queries')
    
    // Optimized fallback queries - fetch only what's needed for dashboard
    const [ordersResult, chatsResult, customersResult, productsResult] = await Promise.all([
      supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          created_at,
          status,
          customers (
            name
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3), // Only need 3 for dashboard
      
      supabase
        .from("chats")
        .select(`
          id,
          platform,
          last_message,
          unread_count,
          status,
          created_at,
          customers (
            name
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(3), // Only need 3 for dashboard
      
      supabase
        .from("customers")
        .select(`
          id,
          name,
          email,
          phone_number,
          platform,
          total_orders,
          total_spent,
          status,
          created_at
        `)
        .eq("user_id", userId)
        .limit(5), // Only need 5 for dashboard
      
      supabase
        .from("products")
        .select(`
          id,
          name,
          stock
        `)
        .eq("user_id", userId)
        .lte("stock", 5)
        .gt("stock", 0)
        .limit(3) // Only need 3 for dashboard
    ])

    console.log('[fetchUserDashboardData] Fallback queries completed')

    const result = {
      orders: ordersResult.data || [],
      chats: chatsResult.data || [],
      customers: customersResult.data || [],
      products: productsResult.data || [],
      dailyStats: [],
      errors: { 
        orders: ordersResult.error,
        chats: chatsResult.error,
        customers: customersResult.error,
        products: productsResult.error
      }
    }

    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("[fetchUserDashboardData] Error:", error)
    
    // Retry once if it's the first attempt
    if (retryCount === 0) {
      console.log('[fetchUserDashboardData] Retrying...')
      return fetchUserDashboardData(userId, retryCount + 1)
    }
    
    throw error
  }
}

// Optimized customer fetching with pagination
export const fetchUserCustomers = async (userId: string): Promise<any[]> => {
  const cacheKey = `customers-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    console.log('[fetchUserCustomers] Starting fetch for user:', userId)
    
    // Try to use the new optimized function first
    try {
      const { data: customersData, error } = await supabase
        .rpc('get_customers_optimized', { 
          user_id_param: userId,
          page_size: 50, // Limit for faster loading
          page_number: 1
        })

      if (!error && customersData) {
        console.log('[fetchUserCustomers] Optimized function succeeded')
        setCachedData(cacheKey, customersData)
        return customersData
      }
    } catch (e) {
      console.log('[fetchUserCustomers] Optimized customers function not available, using fallback:', e)
    }

    console.log('[fetchUserCustomers] Using fallback query')
    
    // Optimized fallback query - fetch only essential fields
    const { data: customers, error } = await supabase
      .from("customers")
      .select(`
        id,
        name,
        email,
        phone_number,
        platform,
        total_orders,
        total_spent,
        status,
        created_at,
        updated_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50) // Limit for faster loading

    if (error) {
      console.error("[fetchUserCustomers] Error:", error)
      throw error
    }

    console.log('[fetchUserCustomers] Fallback query completed')
    setCachedData(cacheKey, customers || [])
    return customers || []
  } catch (error) {
    console.error("[fetchUserCustomers] Error:", error)
    throw error
  }
}

// Optimized product fetching with pagination
export const fetchUserProducts = async (userId: string): Promise<any[]> => {
  const cacheKey = `products-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    console.log('[fetchUserProducts] Starting fetch for user:', userId)
    
    // Try to use the new optimized function first
    try {
      const { data: productsData, error } = await supabase
        .rpc('get_products_optimized', { 
          user_id_param: userId,
          page_size: 50, // Limit for faster loading
          page_number: 1
        })

      if (!error && productsData) {
        console.log('[fetchUserProducts] Optimized function succeeded')
        setCachedData(cacheKey, productsData)
        return productsData
      }
    } catch (e) {
      console.log('[fetchUserProducts] Optimized products function not available, using fallback:', e)
    }

    console.log('[fetchUserProducts] Using fallback query')
    
    // Optimized fallback query - fetch only essential fields
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        category,
        stock,
        price,
        status,
        description,
        image_url,
        created_at,
        updated_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50) // Limit for faster loading

    if (error) {
      console.error("[fetchUserProducts] Error:", error)
      throw error
    }

    console.log('[fetchUserProducts] Fallback query completed')
    setCachedData(cacheKey, products || [])
    return products || []
  } catch (error) {
    console.error("[fetchUserProducts] Error:", error)
    throw error
  }
}

// Optimized order fetching with new database functions
export const fetchUserOrders = async (userId: string): Promise<any[]> => {
  const cacheKey = `orders-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    console.log('[fetchUserOrders] Starting fetch for user:', userId)
    
    // Try to use the new optimized function first
    try {
      const { data: ordersData, error } = await supabase
        .rpc('get_orders_optimized', { 
          user_id_param: userId,
          page_size: 50, // Limit for faster loading
          page_number: 1
        })

      if (!error && ordersData) {
        console.log('[fetchUserOrders] Optimized function succeeded')
        setCachedData(cacheKey, ordersData)
        return ordersData
      }
    } catch (e) {
      console.log('[fetchUserOrders] Optimized orders function not available, using fallback:', e)
    }

    console.log('[fetchUserOrders] Using fallback query')
    
    // Optimized fallback query - fetch only essential fields
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        status,
        payment_status,
        platform,
        created_at,
        customer_id,
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
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50) // Limit for faster loading

    if (error) {
      console.error("[fetchUserOrders] Error:", error)
      throw error
    }

    console.log('[fetchUserOrders] Fallback query completed')
    setCachedData(cacheKey, orders || [])
    return orders || []
  } catch (error) {
    console.error("[fetchUserOrders] Error:", error)
    throw error
  }
}

// Optimized analytics fetching with new database functions
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
    // Use optimized functions where available, fallback to direct queries
    const [orders, customers, dailyStats, productStats] = await Promise.all([
      // Use optimized order fetching if available, otherwise fallback
      (async () => {
        try {
          const { data, error } = await supabase
            .rpc('get_orders_optimized', { user_id_param: userId })
          if (!error && data) return { data, error: null }
        } catch (e) {
          console.log('Optimized orders function not available, using fallback')
        }
        
        // Fallback to direct query
        return await supabase
          .from("orders")
          .select("id, total_amount, created_at, status")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
      })(),

      // Use optimized customer fetching
      (async () => {
        try {
          const { data, error } = await supabase
            .rpc('get_customers_optimized', { 
              user_id_param: userId, 
              limit_param: 1000, 
              offset_param: 0 
            })
          if (!error && data) return { data, error: null }
        } catch (e) {
          console.log('Optimized customers function not available, using fallback')
        }
        
        // Fallback to direct query
        return await supabase
          .from("customers")
          .select("id, created_at, total_orders, total_spent")
          .eq("user_id", userId)
      })(),

      // Use materialized view for daily stats if available
      (async () => {
        try {
          const { data, error } = await supabase
            .from("daily_stats_mv")
            .select("*")
            .eq("user_id", userId)
            .gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order("date", { ascending: true })
          if (!error && data) return { data, error: null }
        } catch (e) {
          console.log('Materialized view not available, using fallback')
        }
        
        // Fallback to direct query
        return await supabase
          .from("daily_stats")
          .select("*")
          .eq("user_id", userId)
          .gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order("date", { ascending: true })
      })(),

      // Use optimized product stats if available
      (async () => {
        try {
          const { data, error } = await supabase
            .rpc('get_product_stats', { user_id_param: userId })
          if (!error && data) return { data, error: null }
        } catch (e) {
          console.log('Optimized product stats function not available, using fallback')
        }
        
        // Fallback to direct query
        return await supabase
          .from("order_items")
          .select(`
            quantity, 
            total_price,
            products (
              name,
              sku
            )
          `)
          .order("created_at", { ascending: false })
      })()
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

// Optimized chat fetching
export const fetchUserChats = async (userId: string): Promise<any[]> => {
  const cacheKey = `chats-${userId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }

  try {
    console.log('[fetchUserChats] Starting fetch for user:', userId)
    
    // Optimized query - fetch only essential fields
    const { data: chats, error } = await supabase
      .from("chats")
      .select(`
        id,
        platform,
        last_message,
        unread_count,
        status,
        created_at,
        updated_at,
        customers (
          id,
          name,
          email,
          phone_number
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50) // Limit for faster loading

    if (error) {
      console.error("[fetchUserChats] Error:", error)
      throw error
    }

    console.log('[fetchUserChats] Query completed')
    setCachedData(cacheKey, chats || [])
    return chats || []
  } catch (error) {
    console.error("[fetchUserChats] Error:", error)
    throw error
  }
}

// Optimized message fetching
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

// Enhanced cache clearing with pattern matching
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

// Optimized product creation with better error handling
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
    
    // Clear related cache
    clearCache(`products-${userId}`)
    clearCache(`dashboard-${userId}`)
    
    return data
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

// Optimized product update
export const updateProduct = async (productId: string, productData: Partial<Product>) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .update({
        ...productData,
        updated_at: new Date().toISOString()
      })
      .eq("id", productId)
      .select()
      .single()

    if (error) throw error
    
    // Clear related cache
    clearCache(`products-`)
    clearCache(`dashboard-`)
    
    return data
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

// Optimized product deletion
export const deleteProduct = async (productId: string) => {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)

    if (error) throw error
    
    // Clear related cache
    clearCache(`products-`)
    clearCache(`dashboard-`)
    
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Optimized customer creation
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
    
    // Clear related cache
    clearCache(`customers-${userId}`)
    clearCache(`dashboard-${userId}`)
    
    return data
  } catch (error) {
    console.error("Error creating customer:", error)
    throw error
  }
}

// Optimized customer update
export const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .update({
        ...customerData,
        updated_at: new Date().toISOString()
      })
      .eq("id", customerId)
      .select()
      .single()

    if (error) throw error
    
    // Clear related cache
    clearCache(`customers-`)
    clearCache(`dashboard-`)
    
    return data
  } catch (error) {
    console.error("Error updating customer:", error)
    throw error
  }
}

// Optimized order creation with transaction-like behavior
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
    // Start transaction by creating order first
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_id: orderData.customer_id,
        total_amount: orderData.total_amount,
        platform: orderData.platform || 'manual',
        shipping_address: orderData.shipping_address,
        payment_method: orderData.payment_method,
        notes: orderData.notes,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    if (orderData.items && orderData.items.length > 0) {
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
    }

    // Clear related cache
    clearCache(`orders-${userId}`)
    clearCache(`customers-${userId}`)
    clearCache(`dashboard-${userId}`)
    
    return order
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

// Enhanced database connection test
export const testDatabaseConnection = async () => {
  try {
    const startTime = Date.now()
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from("products")
      .select("count")
      .limit(1)

    if (testError) {
      return {
        success: false,
        error: testError.message,
        code: testError.code,
        responseTime: Date.now() - startTime
      }
    }

    // Test optimized function
    let functionTest = "Function not available"
    try {
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_user_dashboard_data', { user_id_param: '00000000-0000-0000-0000-000000000000' })
      
      if (!functionError) {
        functionTest = "Function available"
      }
    } catch (error) {
      functionTest = "Function not available"
    }

    return {
      success: true,
      message: "Database connection successful",
      responseTime: Date.now() - startTime,
      functionTest: functionTest
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: 0
    }
  }
}

// Search functions using optimized database functions
export const searchProducts = async (userId: string, searchTerm: string) => {
  try {
    // Try to use optimized search function first
    try {
      const { data, error } = await supabase
        .rpc('search_products', { 
          search_term: searchTerm, 
          user_id_param: userId 
        })

      if (!error && data) {
        return data || []
      }
    } catch (e) {
      console.log('Optimized search products function not available, using fallback')
    }

    // Fallback to direct query with search
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        category,
        stock,
        price,
        status,
        description,
        image_url,
        created_at,
        updated_at
      `)
      .eq("user_id", userId)
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error searching products:", error)
    throw error
  }
}

export const searchCustomers = async (userId: string, searchTerm: string) => {
  try {
    // Try to use optimized search function first
    try {
      const { data, error } = await supabase
        .rpc('search_customers', { 
          search_term: searchTerm, 
          user_id_param: userId 
        })

      if (!error && data) {
        return data || []
      }
    } catch (e) {
      console.log('Optimized search customers function not available, using fallback')
    }

    // Fallback to direct query with search
    const { data, error } = await supabase
      .from("customers")
      .select(`
        id,
        name,
        email,
        phone_number,
        platform,
        total_orders,
        total_spent,
        status,
        last_order_date,
        created_at
      `)
      .eq("user_id", userId)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error searching customers:", error)
    throw error
  }
}

// Interface definitions
interface Chat {
  id: string
  platform: string
  last_message: string | null
  unread_count: number
  status: string
  created_at: string
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
  order_number: string
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

// Server-side client for API routes
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

// Instagram integration functions
export const getInstagramConnectionStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_instagram_status', { user_id_param: userId })
    
    if (error) {
      console.error('Error fetching Instagram status:', error)
      return null
    }
    
    return data?.[0] || null
  } catch (error) {
    console.error('Error in getInstagramConnectionStatus:', error)
    return null
  }
}

export const getInstagramChats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_instagram_chats', { user_id_param: userId })
    
    if (error) {
      console.error('Error fetching Instagram chats:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getInstagramChats:', error)
    return []
  }
}
