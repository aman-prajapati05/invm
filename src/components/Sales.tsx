"use client"
import React, { useEffect, useState } from "react"
import DataTable from "./DataTable"
import DataTableSkeletonExample from "./TableSkeleton"
import SearchBox from "./SearchBox"
import { getAllSales } from "@/lib/api/sales"

const salesColumns = [
  { key: "productName", label: "Product Name", width: "200px" },
  { key: "batchCode", label: "Batch Code", width: "150px" },
  { key: "quantitySold", label: "Quantity Sold", width: "180px" },
  { key: "saleDateDisplay", label: "Sale Date", width: "180px" },
  { key: "createdAtDisplay", label: "Recorded At", width: "180px" },
]

const Sales = () => {
  const [sales, setSales] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchActive, setIsSearchActive] = useState(false)

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllSales()
      const formatted = data.map((s: any) => ({
        ...s,
        saleDateDisplay: s.saleDate ? new Date(s.saleDate).toLocaleDateString() : "-",
        createdAtDisplay: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-",
      }))
      setSales(formatted)
    } catch (err) {
      setError("Failed to load sales data")
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
      const results = sales.filter(
        (item) =>
          item.productName?.toLowerCase().includes(value.toLowerCase()) ||
          item.batchCode?.toLowerCase().includes(value.toLowerCase())
      )
      setSearchResults(results)
      setIsSearchActive(true)
    }
  }

  const getCurrentDisplayData = () =>
    isSearchActive ? searchResults : sales

  return (
    <div className="w-full bg-white p-5 min-h-screen">
      <div className="flex justify-between mb-4 items-center">
        <div className="text-xl font-medium text-[#191A1B]">Sales</div>
      </div>
      <div className="mb-4 flex justify-between items-center">
          {/* <SearchBox
            searchText={searchText}
            onSearchChange={handleSearchChange}
            onSearch={() => {}}
            placeholder="Search Sales"
          /> */}
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}
      <div>
        {isLoading ? (
          <DataTableSkeletonExample />
        ) : getCurrentDisplayData().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 bg-white border border-[#EAEAEA] rounded-lg">
            <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-6">
              💸
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[#191A1B] mb-2">
                {isSearchActive ? "No Results Found" : "No Sales Data Available"}
              </h3>
              <p className="text-sm text-[#545659] mb-6 max-w-md">
                {isSearchActive
                  ? `No sales match your search "${searchText}".`
                  : `No sales have been recorded yet.`}
              </p>
            </div>
          </div>
        ) : (
          <DataTable
            data={getCurrentDisplayData()}
            columns={salesColumns}
            showActions={false}
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

export default Sales
