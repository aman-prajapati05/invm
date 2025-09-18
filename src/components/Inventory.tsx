
"use client"
import React, { useState, useEffect } from "react"
import Button from "./Button"
import SearchBox from "./SearchBox"
import DataTable from "./DataTable"
import { useModal } from "@/contexts/ModalContext"
import DataTableSkeletonExample from "./TableSkeleton"
import {
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr"
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
} from "@/lib/api/products"
import {
  createBatch,
  updateBatch,
  deleteBatch,
  getAllBatches
} from "@/lib/api/batches"
import { createSale } from "@/lib/api/sales"

const Inventory = () => {
  const { openModal } = useModal()

  const [activeTab, setActiveTab] = useState<"batches" | "products">("batches")
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchText, setSearchText] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchActive, setIsSearchActive] = useState(false)

  // Columns
  // Table columns
  const batchColumns = [
    { key: "name", label: "Product Name", width: "200px" },
    { key: "sku", label: "SKU", width: "120px" },
    { key: "batchCode", label: "Batch Code", width: "150px" },
    { key: "quantity", label: "Quantity", width: "100px" },
    { key: "expiryDisplay", label: "Expiry Date", width: "150px" },
    { key: "statusDisplay", label: "Status", width: "120px", isStatus: true },
  ];

  const productColumns = [
    { key: "name", label: "Product Name", width: "200px" },
    { key: "sku", label: "SKU", width: "120px" },
    { key: "brand", label: "Brand", width: "150px" },
    { key: "shelf_life_days", label: "Shelf Life (days)", width: "150px" },
    { key: "createdAtDisplay", label: "Created At", width: "180px" },
  ];

  useEffect(() => {
    loadInventory()
  }, [])


  const loadInventory = async () => {
  setIsLoading(true)
  setError(null)
  try {
    // Fetch products
    const products = await getAllProducts()
    const formattedProducts = products.map((p: any) => ({
      ...p,
      id: p._id,
      createdAtDisplay: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "-",
    }))
    setProducts(formattedProducts)

    // Fetch batches separately (joined with product info via API)
    const batches = await getAllBatches()
    const formattedBatches = batches.map((batch: any) => ({
      id: batch._id,
      productId: batch.productId,
      name: batch.productName,
      sku: batch.sku,
      brand: batch.product?.brand || "-", // if you add brand in API join
      batchCode: batch.batchCode,
      quantity: batch.quantity,
      mfg_date: batch.mfg_date,
      shelf_life_days: batch.shelf_life_days,
      expiryDisplay: batch.mfg_date
        ? new Date(
            new Date(batch.mfg_date).getTime() +
              batch.shelf_life_days * 24 * 60 * 60 * 1000
          ).toLocaleDateString()
        : "-",
      statusDisplay:
       batch.mfg_date? new Date(new Date(batch.mfg_date).getTime() +batch.shelf_life_days * 24 * 60 * 60 * 1000) < new Date()? "Expired":batch.quantity > 0? "In Stock": "Out of Stock"
        : "N/A",
    }))
    setBatches(formattedBatches)
  } catch (err) {
    console.error("Error loading inventory:", err)
    setError("Failed to load inventory")
  } finally {
    setIsLoading(false)
  }
}

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    if (!value.trim()) {
      setIsSearchActive(false)
      setSearchResults([])
    } else {
      const source = activeTab === "batches" ? batches : products
      const results = source.filter(
        (item) =>
          item.name.toLowerCase().includes(value.toLowerCase()) ||
          item.sku.toLowerCase().includes(value.toLowerCase())
      )
      setSearchResults(results)
      setIsSearchActive(true)
    }
  }

  const getCurrentDisplayData = () =>
    isSearchActive
      ? searchResults
      : activeTab === "batches"
      ? batches
      : products

  // ---- Handlers ----
  const handleAddProduct = () => {
    openModal("add-product", {
      onSave: async (data: Product) => {
        await createProduct(data)
        await loadInventory()
      },
    })
  }

  const handleAddBatch = () => {
    openModal("add-batch", {
      onSave: async (data: any) => {
        await createBatch(data)
        await loadInventory()
      },
    })
  }

  const handleEditProduct = (id: string) => {
    const product = products.find((p) => (p as any).id === id)
    if (product) {
      openModal("edit-product", {
        ...product,
        onSave: async (data: Product) => {
          await updateProduct(id, data)
          await loadInventory()
        },
      })
    }
  }

  const handleEditBatch = (id: string) => {
    const batch = batches.find((b) => b.id === id)
    if (batch) {
      openModal("edit-batch", {
        ...batch,
        onSave: async (data: any) => {
          await updateBatch(id, data, batch.productId)
          await loadInventory()
        },
      })
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id)
      await loadInventory()
    }
  }

  const handleDeleteBatch = async (id: string) => {
    const batch = batches.find((b) => b.id === id)
    if (confirm("Are you sure you want to delete this batch?") && batch) {
      await deleteBatch(id, batch.productId)
      await loadInventory()
    }
  }

  // ---- Actions arrays ----
  const productActions = [
    {
      id: "edit",
      label: "Edit Product",
      icon: <PencilSimpleIcon size={16} />,
      color: "#191A1B",
      onClick: (rowId: string) => handleEditProduct(rowId),
    },
    {
      id: "delete",
      label: "Delete Product",
      icon: <TrashIcon size={16} />,
      color: "#F04438",
      onClick: (rowId: string) => handleDeleteProduct(rowId),
    },
    {
      id: "addBatch",
      label: "Add Batch",
      icon: <PlusIcon size={16} />,
      color: "#007BFF",
      onClick: () => handleAddBatch(),
    },
  ]

  const batchActions = [
    {
      id: "edit",
      label: "Edit Batch",
      icon: <PencilSimpleIcon size={16} />,
      color: "#191A1B",
      onClick: (rowId: string) => handleEditBatch(rowId),
    },
    {
      id: "delete",
      label: "Delete Batch",
      icon: <TrashIcon size={16} />,
      color: "#F04438",
      onClick: (rowId: string) => handleDeleteBatch(rowId),
    },
    {
      id: "unitsSold",
      label: "Units Sold",
      icon: <PlusIcon size={16} />,
      color: "#007BFF",
      onClick: (rowId: string) => {
        const batch = batches.find((b) => b.id === rowId)
        if (batch) {
          openModal("units-sold", {
            productId: batch.productId,
            batchId: batch.id,
            productName: batch.name,
            batchCode: batch.batchCode,
            quantity: batch.quantity,
            onSave: async (data: any) => {
              try {
                await createSale(data)
                await loadInventory()
              } catch (err) {
                console.error("Error recording sale:", err)
                throw err
              }
            },
          })
        }
      },
    },

  ]

  return (
    <div className="w-full bg-white p-5 min-h-screen">
      {/* Header with Tabs */}
      <div className="flex justify-between mb-4 items-center">
        <div className="text-xl font-medium text-[#191A1B]">Inventory</div>
        <div className="flex gap-3">
          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "batches"
                ? "bg-[#191A1B] text-white"
                : "bg-gray-100"
            }`}
            onClick={() => setActiveTab("batches")}
          >
            Batches
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "products"
                ? "bg-[#191A1B] text-white"
                : "bg-gray-100"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
        </div>
      </div>

      {/* Search + Action */}
      <div className="mb-4 flex justify-between items-center">
        {/* <SearchBox
          searchText={searchText}
          onSearchChange={handleSearchChange}
          onSearch={() => {}}
          placeholder={`Search ${activeTab === "batches" ? "Batches" : "Products"}`}
        /> */}
        {activeTab === "products" ? (
          <Button text="Add Product" error={false} onClick={handleAddProduct} />
        ) : (
          <Button text="Add Batch" error={false} onClick={handleAddBatch} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Table */}
      <div>
        {isLoading ? (
          <DataTableSkeletonExample />
        ) : getCurrentDisplayData().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 bg-white border border-[#EAEAEA] rounded-lg">
            <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-6">
              📦
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[#191A1B] mb-2">
                {isSearchActive ? "No Results Found" : "No Data Available"}
              </h3>
              <p className="text-sm text-[#545659] mb-6 max-w-md">
                {isSearchActive
                  ? `No ${activeTab} match your search "${searchText}".`
                  : `You haven't added any ${activeTab} yet.`}
              </p>
              {!isSearchActive && activeTab === "products" && (
                <Button
                  text="Add Your First Product"
                  error={false}
                  onClick={handleAddProduct}
                />
              )}
              {!isSearchActive && activeTab === "batches" && (
                <Button
                  text="Add Your First Batch"
                  error={false}
                  onClick={handleAddBatch}
                />
              )}
            </div>
          </div>
        ) : (
          <DataTable
            data={getCurrentDisplayData()}
            columns={activeTab === "batches" ? batchColumns : productColumns}
            showActions={true}
            actions={activeTab === "batches" ? batchActions : productActions}
            height={true}
            showCheckbox={false}
            clickableRows={false}
            paginationThreshold={6}
          />
        )}
      </div>
    </div>
  )
}

export default Inventory
