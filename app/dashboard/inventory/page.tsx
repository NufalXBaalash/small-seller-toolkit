"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { fetchUserProducts, updateProduct, deleteProduct, clearCache, searchProducts } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Search, Plus, Edit, Trash2, AlertTriangle, Loader2, Eye } from "lucide-react"
import { AddProductModal } from "@/components/add-product-modal"
import { toast } from "@/components/ui/use-toast"
import { useRefetchOnVisibility } from "@/hooks/use-page-visibility"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"

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

// Memoized status color function
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
    case "inactive":
      return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200"
    case "discontinued":
      return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
    default:
      return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200"
  }
}

// Memoized stock status functions
const getStockStatus = (stock: number) => {
  if (stock === 0) return "Out of Stock"
  if (stock <= 5) return "Low Stock"
  return "In Stock"
}

const getStockStatusColor = (stock: number) => {
  if (stock === 0) return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
  if (stock <= 5) return "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200"
  return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
}

// Memoized product row component
const ProductRow = React.memo(({ 
  product, 
  onEdit, 
  onDelete 
}: { 
  product: Product
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
}) => (
  <TableRow>
    <TableCell>
      <div className="flex items-center space-x-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <div>
          <div className="font-medium">{product.name}</div>
          {product.description && (
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {product.description}
            </div>
          )}
        </div>
      </div>
    </TableCell>
    <TableCell>
      <span className="font-mono text-sm">
        {product.sku || "N/A"}
      </span>
    </TableCell>
    <TableCell>
      {product.category ? (
        <Badge variant="outline">{product.category}</Badge>
      ) : (
        <span className="text-muted-foreground">Uncategorized</span>
      )}
    </TableCell>
    <TableCell>
      <div className="flex items-center space-x-2">
        <span className="font-medium">{product.stock}</span>
        <Badge className={getStockStatusColor(product.stock)}>
          {getStockStatus(product.stock)}
        </Badge>
      </div>
    </TableCell>
    <TableCell>
      {product.price ? (
        <span className="font-medium">${product.price.toFixed(2)}</span>
      ) : (
        <span className="text-muted-foreground">Not set</span>
      )}
    </TableCell>
    <TableCell>
      <Badge className={getStatusColor(product.status)}>
        {product.status}
      </Badge>
    </TableCell>
    <TableCell className="text-right">
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(product)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
))

ProductRow.displayName = "ProductRow"

// Memoized stats card component
const StatsCard = React.memo(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  color = "text-muted-foreground"
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  color?: string
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
))

StatsCard.displayName = "StatsCard"

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [addProductModalOpen, setAddProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Debounce search term to reduce filtering operations
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchProducts = useCallback(async () => {
    console.log('[InventoryPage] fetchProducts: called');
    setPageLoading(true);
    
    try {
      if (!user?.id) {
        console.log('[InventoryPage] fetchProducts: No user, abort fetch');
        return;
      }
      setError(null);
      
      console.log('[InventoryPage] fetchProducts: Before fetchUserProducts');
      let data
      if (debouncedSearchTerm.trim()) {
        // Use optimized search function when search term is provided
        data = await searchProducts(user.id, debouncedSearchTerm.trim())
      } else {
        // Use optimized pagination function for regular fetching
        data = await fetchUserProducts(user.id)
      }
      console.log('[InventoryPage] fetchProducts: Products fetched successfully:', data.length, 'products');
      setProducts(data);
    } catch (err) {
      console.error('[InventoryPage] fetchProducts: Error fetching products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products. Please try again.';
      setError(errorMessage);
    } finally {
      setPageLoading(false);
      console.log('[InventoryPage] fetchProducts: setPageLoading(false)');
    }
  }, [user?.id, debouncedSearchTerm]);

  // Use the visibility hook to refetch data when page becomes visible
  useRefetchOnVisibility(() => {
    console.log('[InventoryPage] useRefetchOnVisibility: triggered');
    if (!loading && user?.id) {
      fetchProducts();
    }
  });

  useEffect(() => {
    clearCache();
  }, []);

  useEffect(() => {
    if (!loading && user?.id) {
      fetchProducts();
    }
  }, [user?.id, loading]);

  const handleProductUpdate = useCallback(async (productId: string, updates: Partial<Product>) => {
    try {
      await updateProduct(productId, updates)
      // Clear cache and refresh the list
      clearCache("products")
      await fetchProducts()
      toast({
        title: "Product updated",
        description: "Product has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    }
  }, [fetchProducts])

  const handleProductDelete = useCallback(async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await deleteProduct(productId)
      // Clear cache and refresh the list
      clearCache("products")
      await fetchProducts()
      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }, [fetchProducts])

  // Memoized filtered products
  const filteredProducts = useMemo(() => 
    products.filter(product =>
      product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ), [products, debouncedSearchTerm]
  )

  // Memoized stats
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.status === "active").length,
    lowStock: products.filter(p => p.stock <= 5 && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0)
  }), [products])

  // Memoized stats cards data
  const statsCards = useMemo(() => [
    {
      title: "Total Products",
      value: stats.total,
      subtitle: `${stats.active} active products`,
      icon: Package,
    },
    {
      title: "Low Stock",
      value: stats.lowStock,
      subtitle: "Products with ≤5 units",
      icon: AlertTriangle,
      color: "text-orange-500",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStock,
      subtitle: "Products with 0 units",
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      title: "Total Value",
      value: `$${stats.totalValue.toFixed(2)}`,
      subtitle: "At current prices",
      icon: Package,
    },
  ], [stats])

  if (loading || (!loading && !user)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    console.log('[InventoryPage] Render: Error', error)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Inventory</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchProducts}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products and track stock levels
          </p>
        </div>
        <Button onClick={() => setAddProductModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Manage your product inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {debouncedSearchTerm ? "No products found matching your search." : "No products yet. Add your first product to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductRow 
                      key={product.id} 
                      product={product}
                      onEdit={setEditingProduct}
                      onDelete={handleProductDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <AddProductModal
        open={addProductModalOpen}
        onOpenChange={setAddProductModalOpen}
        onProductAdded={fetchProducts}
        editingProduct={editingProduct}
        onProductUpdated={fetchProducts}
        onClose={() => setEditingProduct(null)}
      />
    </div>
  )
}
