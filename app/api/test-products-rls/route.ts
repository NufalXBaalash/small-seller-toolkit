import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("=== TESTING PRODUCTS RLS ===")
    
    // Test 1: Check if we can access the products table at all
    const { data: testData, error: testError } = await supabase
      .from("products")
      .select("count")
      .limit(1)

    if (testError) {
      return NextResponse.json({ 
        error: "Cannot access products table",
        details: testError.message,
        code: testError.code
      }, { status: 500 })
    }

    console.log("✅ Can access products table")

    // Test 2: Try to insert without auth (should fail)
    const { data: insertWithoutAuth, error: insertWithoutAuthError } = await supabase
      .from("products")
      .insert({
        name: "Test Product No Auth",
        stock: 1,
        status: "active"
      })
      .select()

    console.log("Insert without auth result:", {
      success: !insertWithoutAuthError,
      error: insertWithoutAuthError?.message
    })

    // Test 3: Check current RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'products' })
      .catch(() => ({ data: null, error: { message: "RPC not available" } }))

    return NextResponse.json({ 
      success: true,
      message: "RLS test completed",
      tests: {
        tableAccess: "✅ Success",
        insertWithoutAuth: insertWithoutAuthError ? "✅ Blocked (expected)" : "❌ Allowed (unexpected)",
        insertWithoutAuthError: insertWithoutAuthError?.message || null,
        policies: policies || "RPC not available"
      }
    })
  } catch (error) {
    console.error("RLS Test Error:", error)
    return NextResponse.json({ 
      error: "RLS test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 