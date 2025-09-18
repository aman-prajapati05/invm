// "use client"
// import { XIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr"
// import React, { useEffect, useState } from "react"
// import Button from "./Button"
// import { createBatch, updateBatch } from "@/lib/api/batches"
// import { getAllProducts } from "@/lib/api/products"

// interface AddBatchProps {
//   onClose: () => void
//   onSave: () => void // refresh parent after success
//   // Edit mode props
//   batchId?: string
//   productId?: string
//   batchCode?: string
//   quantity?: number
//   mfg_date?: string
//   shelf_life_days?: number
// }

// const AddBatch: React.FC<AddBatchProps> = ({
//   onClose,
//   onSave,
//   batchId,
//   productId: initialProductId = "",
//   batchCode: initialBatchCode = "",
//   quantity: initialQuantity = undefined,
//   mfg_date: initialMfgDate = "",
//   shelf_life_days: initialShelfLife = undefined,
// }) => {
//   const [products, setProducts] = useState<any[]>([])
//   const [selectedProduct, setSelectedProduct] = useState(initialProductId)
//   const [batchCode, setBatchCode] = useState(initialBatchCode)
//   const [quantity, setQuantity] = useState(initialQuantity !== undefined ? initialQuantity.toString() : "")
//   const [mfgDate, setMfgDate] = useState(initialMfgDate ? initialMfgDate.slice(0, 10) : "")
//   const [shelfLife, setShelfLife] = useState(initialShelfLife !== undefined ? initialShelfLife.toString() : "")
//   const [fieldErrors, setFieldErrors] = useState<any>({})
//   const [isLoading, setIsLoading] = useState(false)

//   // Fetch products (needed for Add mode and also to show product in Edit mode)
//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const data = await getAllProducts()
//         setProducts(data)
//       } catch (err) {
//         console.error("Error fetching products:", err)
//       }
//     }
//     fetchProducts()
//   }, [])

//   const validateFields = () => {
//     const errors: any = {}
//     if (!selectedProduct) errors.productId = "Product is required"
//     if (!batchCode.trim()) errors.batchCode = "Batch Code is required"
//     if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
//       errors.quantity = "Valid Quantity is required"
//     }
//     if (!mfgDate) errors.mfg_date = "Manufacture Date is required"
//     if (!shelfLife || isNaN(Number(shelfLife)) || Number(shelfLife) <= 0) {
//       errors.shelf_life_days = "Valid Shelf Life is required"
//     }
//     return errors
//   }

//   const handleSave = async () => {
//     const errors = validateFields()
//     if (Object.keys(errors).length > 0) {
//       setFieldErrors(errors)
//       return
//     }

//     setIsLoading(true)
//     try {
//       if (!batchId) {
//         // Add mode
//         await createBatch({
//           productId: selectedProduct,
//           batchCode,
//           quantity: Number(quantity),
//           mfg_date: mfgDate,
//           shelf_life_days: Number(shelfLife),
//         })
//       } else {
//         // Edit mode
//         await updateBatch({
//           batchId,
//           productId: selectedProduct, // always required
//           batchCode,
//           quantity: Number(quantity),
//           mfg_date: mfgDate,
//           shelf_life_days: Number(shelfLife),
//         })
//       }

//       await onSave()
//       onClose()
//     } catch (err: any) {
//       console.error("Error saving batch:", err)
//       setFieldErrors({
//         batchCode: err?.response?.data?.message || "Failed to save batch",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="text-[#191A1B] font-medium text-base">{batchId ? "Edit Batch" : "Add Batch"}</div>
//         <XIcon size={16} color="#191A1B" className="cursor-pointer" onClick={onClose} />
//       </div>

//       <div className="flex flex-col gap-4">
//         {/* Product Dropdown */}
//         <div>
//           <label className="text-sm text-[#545659] font-medium">Select Product</label>
//           <select
//             value={selectedProduct}
//             onChange={(e) => setSelectedProduct(e.target.value)}
//             disabled={!!batchId} // lock product in edit mode
//             className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
//           >
//             <option value="">-- Select Product --</option>
//             {products.map((p) => (
//               <option key={p._id} value={p._id}>
//                 {p.name} ({p.sku})
//               </option>
//             ))}
//           </select>
//           {fieldErrors.productId && (
//             <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
//               <WarningCircleIcon size={12} /> {fieldErrors.productId}
//             </div>
//           )}
//         </div>

//         {/* Batch Code */}
//         <div>
//           <label className="text-sm text-[#545659] font-medium">Batch Code</label>
//           <input
//             type="text"
//             value={batchCode}
//             onChange={(e) => setBatchCode(e.target.value)}
//             className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
//           />
//           {fieldErrors.batchCode && (
//             <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
//               <WarningCircleIcon size={12} /> {fieldErrors.batchCode}
//             </div>
//           )}
//         </div>

//         {/* Quantity */}
//         <div>
//           <label className="text-sm text-[#545659] font-medium">Quantity</label>
//           <input
//             type="number"
//             min="1"
//             value={quantity}
//             onChange={(e) => setQuantity(e.target.value)}
//             className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
//           />
//           {fieldErrors.quantity && (
//             <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
//               <WarningCircleIcon size={12} /> {fieldErrors.quantity}
//             </div>
//           )}
//         </div>

//         {/* Manufacture Date */}
//         <div>
//           <label className="text-sm text-[#545659] font-medium">Manufacture Date</label>
//           <input
//             type="date"
//             value={mfgDate}
//             onChange={(e) => setMfgDate(e.target.value)}
//             className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
//           />
//           {fieldErrors.mfg_date && (
//             <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
//               <WarningCircleIcon size={12} /> {fieldErrors.mfg_date}
//             </div>
//           )}
//         </div>

//         {/* Shelf Life */}
//         <div>
//           <label className="text-sm text-[#545659] font-medium">Shelf Life (days)</label>
//           <input
//             type="number"
//             min="1"
//             value={shelfLife}
//             onChange={(e) => setShelfLife(e.target.value)}
//             className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
//           />
//           {fieldErrors.shelf_life_days && (
//             <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
//               <WarningCircleIcon size={12} /> {fieldErrors.shelf_life_days}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Actions */}
//       <div className="flex justify-end gap-3 mt-6">
//         <Button text="Cancel" white={true} onClick={onClose} disabled={isLoading} error={false} />
//         <Button
//           text={isLoading ? (batchId ? "Saving..." : "Saving...") : batchId ? "Save Changes" : "Add Batch"}
//           onClick={handleSave}
//           disabled={isLoading}
//           error={false}
//         />
//       </div>
//     </div>
//   )
// }

// export default AddBatch

"use client"
import { XIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr"
import React, { useEffect, useState } from "react"
import Button from "./Button"
import { getAllProducts } from "@/lib/api/products"

interface AddBatchProps {
  onClose: () => void
  onSave: (data: any) => Promise<void> // parent handles API call + refresh
  // Edit mode props
  batchId?: string
  productId?: string
  batchCode?: string
  quantity?: number
  mfg_date?: string
  shelf_life_days?: number
}

const AddBatch: React.FC<AddBatchProps> = ({
  onClose,
  onSave,
  batchId,
  productId: initialProductId = "",
  batchCode: initialBatchCode = "",
  quantity: initialQuantity = undefined,
  mfg_date: initialMfgDate = "",
  shelf_life_days: initialShelfLife = undefined,
}) => {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState(initialProductId)
  const [batchCode, setBatchCode] = useState(initialBatchCode)
  const [quantity, setQuantity] = useState(initialQuantity !== undefined ? initialQuantity.toString() : "")
  const [mfgDate, setMfgDate] = useState(initialMfgDate ? initialMfgDate.slice(0, 10) : "")
  const [shelfLife, setShelfLife] = useState(initialShelfLife !== undefined ? initialShelfLife.toString() : "")
  const [fieldErrors, setFieldErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  // Fetch products (needed for Add mode and also to show product in Edit mode)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts()
        setProducts(data)
      } catch (err) {
        console.error("Error fetching products:", err)
      }
    }
    fetchProducts()
  }, [])

  const validateFields = () => {
    const errors: any = {}
    if (!selectedProduct) errors.productId = "Product is required"
    if (!batchCode.trim()) errors.batchCode = "Batch Code is required"
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      errors.quantity = "Valid Quantity is required"
    }
    if (!mfgDate) errors.mfg_date = "Manufacture Date is required"
    if (!shelfLife || isNaN(Number(shelfLife)) || Number(shelfLife) <= 0) {
      errors.shelf_life_days = "Valid Shelf Life is required"
    }
    return errors
  }

  const handleSave = async () => {
    const errors = validateFields()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)
    try {
      if (!batchId) {
        // Add mode → pass form values to parent
        await onSave({
          productId: selectedProduct,
          batchCode,
          quantity: Number(quantity),
          mfg_date: mfgDate,
          shelf_life_days: Number(shelfLife),
        })
      } else {
        // Edit mode → pass form values with batchId
        await onSave({
          batchId,
          productId: selectedProduct,
          batchCode,
          quantity: Number(quantity),
          mfg_date: mfgDate,
          shelf_life_days: Number(shelfLife),
        })
      }
      onClose()
    } catch (err: any) {
      console.error("Error saving batch:", err)
      setFieldErrors({
        batchCode: err?.response?.data?.message || "Failed to save batch",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-[#191A1B] font-medium text-base">{batchId ? "Edit Batch" : "Add Batch"}</div>
        <XIcon size={16} color="#191A1B" className="cursor-pointer" onClick={onClose} />
      </div>

      <div className="flex flex-col gap-4">
        {/* Product Dropdown */}
        <div>
          <label className="text-sm text-[#545659] font-medium">Select Product</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            disabled={!!batchId} // lock product in edit mode
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
          >
            <option value="">-- Select Product --</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
          {fieldErrors.productId && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <WarningCircleIcon size={12} /> {fieldErrors.productId}
            </div>
          )}
        </div>

        {/* Batch Code */}
        <div>
          <label className="text-sm text-[#545659] font-medium">Batch Code</label>
          <input
            type="text"
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
          />
          {fieldErrors.batchCode && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <WarningCircleIcon size={12} /> {fieldErrors.batchCode}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="text-sm text-[#545659] font-medium">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
          />
          {fieldErrors.quantity && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <WarningCircleIcon size={12} /> {fieldErrors.quantity}
            </div>
          )}
        </div>

        {/* Manufacture Date */}
        <div>
          <label className="text-sm text-[#545659] font-medium">Manufacture Date</label>
          <input
            type="date"
            value={mfgDate}
            onChange={(e) => setMfgDate(e.target.value)}
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
          />
          {fieldErrors.mfg_date && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <WarningCircleIcon size={12} /> {fieldErrors.mfg_date}
            </div>
          )}
        </div>

        {/* Shelf Life */}
        <div>
          <label className="text-sm text-[#545659] font-medium">Shelf Life (days)</label>
          <input
            type="number"
            min="1"
            value={shelfLife}
            onChange={(e) => setShelfLife(e.target.value)}
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
          />
          {fieldErrors.shelf_life_days && (
            <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <WarningCircleIcon size={12} /> {fieldErrors.shelf_life_days}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button text="Cancel" white={true} onClick={onClose} disabled={isLoading} error={false} />
        <Button
          text={isLoading ? (batchId ? "Saving..." : "Saving...") : batchId ? "Save Changes" : "Add Batch"}
          onClick={handleSave}
          disabled={isLoading}
          error={false}
        />
      </div>
    </div>
  )
}

export default AddBatch
