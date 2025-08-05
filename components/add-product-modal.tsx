"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

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

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductAdded: () => void
  editingProduct?: Product | null
  onProductUpdated?: () => void
  onClose?: () => void
}

// Memoized form field component
const FormField = React.memo(({ 
  label, 
  id, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false,
  min,
  step
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
  min?: string
  step?: string
}) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <Label htmlFor={id} className="text-right">
      {label} {required && "*"}
    </Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="col-span-3"
      placeholder={placeholder}
      required={required}
      min={min}
      step={step}
    />
  </div>
))

FormField.displayName = "FormField"

// Memoized textarea field component
const TextareaField = React.memo(({ 
  label, 
  id, 
  value, 
  onChange, 
  placeholder, 
  rows = 3
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
}) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <Label htmlFor={id} className="text-right">
      {label}
    </Label>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="col-span-3"
      placeholder={placeholder}
      rows={rows}
    />
  </div>
))

TextareaField.displayName = "TextareaField"

export function AddProductModal({ 
  open, 
  onOpenChange, 
  onProductAdded, 
  editingProduct,
  onProductUpdated,
  onClose 
}: AddProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    stock: "",
    price: "",
    description: "",
    image_url: ""
  })

  // Update form data when editing product changes
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        sku: editingProduct.sku || "",
        category: editingProduct.category || "",
        stock: editingProduct.stock?.toString() || "",
        price: editingProduct.price?.toString() || "",
        description: editingProduct.description || "",
        image_url: editingProduct.image_url || ""
      })
    } else {
      // Reset form when not editing
      setFormData({
        name: "",
        sku: "",
        category: "",
        stock: "",
        price: "",
        description: "",
        image_url: ""
      })
    }
  }, [editingProduct])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.stock.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name and stock are required.",
        variant: "destructive",
      })
      return
    }

    if (parseInt(formData.stock) < 0) {
      toast({
        title: "Validation Error",
        description: "Stock must be a non-negative number.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        category: formData.category.trim() || null,
        stock: parseInt(formData.stock),
        price: formData.price.trim() ? parseFloat(formData.price) : null,
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
      }

      const url = editingProduct 
        ? `/api/products/${editingProduct.id}` 
        : "/api/products"
      
      const method = editingProduct ? "PUT" : "POST"

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error("No authentication token available")
      }

      console.log("Using token:", token.substring(0, 20) + "...")
      console.log("Making request to:", url)
      console.log("Request data:", productData)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        console.error("API Error Response:", errorData)
        console.error("Response status:", response.status)
        console.error("Response headers:", Object.fromEntries(response.headers.entries()))
        
        throw new Error((errorData as any).error || (errorData as any).details || `HTTP ${response.status}: ${response.statusText}`)
      }

      const { product } = await response.json()

      toast({
        title: editingProduct ? "Product Updated" : "Product Created",
        description: `${product.name} has been ${editingProduct ? 'updated' : 'added to your inventory'}.`,
      })

      // Reset form
      setFormData({
        name: "",
        sku: "",
        category: "",
        stock: "",
        price: "",
        description: "",
        image_url: ""
      })

      // Close modal and refresh products
      onOpenChange(false)
      if (editingProduct && onProductUpdated) {
        onProductUpdated()
      } else {
        onProductAdded()
      }
      
      // Call onClose if provided
      if (onClose) {
        onClose()
      }

    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [formData, editingProduct, onOpenChange, onProductAdded, onProductUpdated, onClose])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    if (onClose) {
      onClose()
    }
  }, [onOpenChange, onClose])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {editingProduct 
              ? "Update the product information below." 
              : "Add a new product to your inventory."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <FormField
              label="Name"
              id="name"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              placeholder="Product name"
              required
            />
            <FormField
              label="SKU"
              id="sku"
              value={formData.sku}
              onChange={(value) => handleInputChange("sku", value)}
              placeholder="Stock keeping unit"
            />
            <FormField
              label="Category"
              id="category"
              value={formData.category}
              onChange={(value) => handleInputChange("category", value)}
              placeholder="Product category"
            />
            <FormField
              label="Stock"
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(value) => handleInputChange("stock", value)}
              placeholder="0"
              required
              min="0"
            />
            <FormField
              label="Price"
              id="price"
              type="number"
              value={formData.price}
              onChange={(value) => handleInputChange("price", value)}
              placeholder="0.00"
              step="0.01"
            />
            <TextareaField
              label="Description"
              id="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              placeholder="Product description"
            />
            <FormField
              label="Image URL"
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(value) => handleInputChange("image_url", value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProduct ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 