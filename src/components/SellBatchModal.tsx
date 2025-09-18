"use client"
import { XIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr"
import React, { useState } from "react"
import Button from "./Button"

interface SellBatchModalProps {
  onClose: () => void
  onSave: (data: {
    productId: string
    batchId: string
    productName: string
    batchCode: string
    quantitySold: number
    saleDate: string
  }) => void
  productId: string
  batchId: string
  productName: string
  batchCode: string
  quantity: number
}

const SellBatchModal: React.FC<SellBatchModalProps> = ({
  onClose,
  onSave,
  productId,
  batchId,
  productName,
  batchCode,
  quantity,
}) => {
  const [quantitySold, setQuantitySold] = useState("")
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]) // default today
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setFieldError(null)
    const sold = Number(quantitySold)

    if (!quantitySold || isNaN(sold)) {
      setFieldError("Please enter a valid quantity")
      return
    }
    if (sold <= 0) {
      setFieldError("Quantity must be greater than 0")
      return
    }
    if (sold > quantity) {
      setFieldError(`Cannot sell more than available (${quantity})`)
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        productId,
        batchId,
        productName,
        batchCode,
        quantitySold: sold,
        saleDate,
      })
      onClose()
    } catch (err) {
      console.error("Error saving sale:", err)
      setFieldError("Failed to save sale. Try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="text-[#191A1B] font-medium text-base">Record Units Sold</div>
        <XIcon size={16} color="#191A1B" className="cursor-pointer" onClick={onClose} />
      </div>

      <div className="flex flex-col gap-4">
        {/* Product Name */}
        <div>
          <label className="text-sm text-[#545659] font-medium">Product Name</label>
          <input
            type="text"
            value={productName}
            readOnly
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-gray-100"
          />
        </div>

        {/* Batch Code */}
        <div>
          <label className="text-sm text-[#545659] font-medium">Batch Code</label>
          <input
            type="text"
            value={batchCode}
            readOnly
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-gray-100"
          />
        </div>

        {/* Quantity Sold */}
        <div>
          <label className="text-sm text-[#545659] font-medium">
            Quantity Sold (Available: {quantity})
          </label>
          <input
            type="number"
            value={quantitySold}
            onChange={(e) => setQuantitySold(e.target.value)}
            max={quantity}
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
          />
        </div>

        {/* Sale Date */}
        <div>
          <label className="text-sm text-[#545659] font-medium">Sale Date</label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full p-3 rounded-lg border border-[#EAEAEA] bg-[#FAFAFA]"
          />
        </div>

        {/* Error */}
        {fieldError && (
          <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <WarningCircleIcon size={12} /> {fieldError}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <Button text="Cancel" white={true} onClick={onClose} disabled={isLoading} error={false} />
        <Button
          text={isLoading ? "Saving..." : "Save"}
          onClick={handleSave}
          disabled={isLoading}
          error={false}
        />
      </div>
    </div>
  )
}

export default SellBatchModal
