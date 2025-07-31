import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("=== TESTING TABLE STRUCTURE ===")
    
    // Test 1: Check if products table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from("products")
      .select("*")
      .limit(0) // This will return column info without data

    if (tableError) {
      return NextResponse.json({ 
        error: "Cannot access products table",
        details: tableError.message,
        code: tableError.code
      }, { status: 500 })
    }

    // Test 2: Try to get column information
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'products' })
      .catch(() => ({ data: null, error: { message: "RPC not available" } }))

    // Test 3: Check if required columns exist by trying to select them
    const { data: testSelect, error: selectError } = await supabase
      .from("products")
      .select("id, user_id, name, sku, category, stock, price, description, image_url, status, created_at, updated_at")
      .limit(1)

    if (selectError) {
      return NextResponse.json({ 
        error: "Missing required columns",
        details: selectError.message,
        code: selectError.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Table structure test completed",
      tests: {
        tableExists: "✅ Success",
        columnAccess: selectError ? "❌ Failed" : "✅ Success",
        columnError: selectError?.message || null,
        columns: columns || "RPC not available"
      }
    })
  } catch (error) {
    console.error("Table Structure Test Error:", error)
    return NextResponse.json({ 
      error: "Table structure test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 