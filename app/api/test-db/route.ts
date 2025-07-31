import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Test basic database connection
    const { data: testData, error: testError } = await supabase
      .from("products")
      .select("count")
      .limit(1)

    if (testError) {
      return NextResponse.json({ 
        error: "Database connection failed",
        details: testError.message,
        code: testError.code
      }, { status: 500 })
    }

    // Test if products table exists and has correct structure
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .limit(1)

    if (productsError) {
      return NextResponse.json({ 
        error: "Products table access failed",
        details: productsError.message,
        code: productsError.code
      }, { status: 500 })
    }

    // Test RLS policies by trying to insert a product (this should fail without auth)
    const { data: insertTest, error: insertError } = await supabase
      .from("products")
      .insert({
        name: "Test Product",
        stock: 1,
        status: "active"
      })
      .select()

    return NextResponse.json({ 
      success: true,
      message: "Database connection successful",
      productsTableExists: true,
      sampleProduct: products?.[0] || null,
      rlsTest: {
        insertAttempted: true,
        insertError: insertError ? {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details
        } : null,
        insertSuccess: !insertError
      }
    })
  } catch (error) {
    console.error("Test DB Error:", error)
    return NextResponse.json({ 
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 