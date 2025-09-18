"use client"
import { XIcon, WarningCircleIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useState } from 'react'
import Button from './Button'
import { createProduct, updateProduct } from '@/lib/api/products';

interface EditProductProps {
  mode: 'add' | 'edit';
  productData?: {
    _id?: string;
    name: string;
    sku: string;
    brand?: string;
    shelf_life_days: number;
    description?: string;
  };
  onClose: () => void;
  onSave: (data: {
    name: string;
    sku: string;
    brand?: string;
    shelf_life_days: number;
    description?: string;
  }) => void;
}

interface FieldErrors {
  name?: string;
  sku?: string;
  shelf_life_days?: string;
}

const InputWithError = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  error?: string
}) => (
  <div className="flex flex-col gap-2">
    <div className="text-[#545659] text-sm font-medium">{label}</div>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg p-3 text-sm text-[#191A1B] bg-[#FAFAFA] w-full border outline-none ${
          error ? 'border-red-500 bg-red-50' : 'border-[#F5F5F5]'
        } ${error ? 'pr-10' : ''}`}
      />
      {error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <WarningCircleIcon size={16} color="#F04438" weight="fill" />
        </div>
      )}
    </div>
    {error && <div className="text-red-500 text-xs">{error}</div>}
  </div>
)

const EditProduct: React.FC<EditProductProps> = ({ mode, productData, onClose, onSave }) => {
  const [name, setName] = useState(productData?.name || '')
  const [sku, setSku] = useState(productData?.sku || '')
  const [brand, setBrand] = useState(productData?.brand || '')
  const [shelfLife, setShelfLife] = useState(productData?.shelf_life_days?.toString() || '')
  const [description, setDescription] = useState(productData?.description || '')
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

const handleSave = async () => {
  setFieldErrors({})
  const errors: FieldErrors = {}

  if (!name.trim()) errors.name = 'Product name is required'
  if (!sku.trim()) errors.sku = 'SKU is required'
  if (!shelfLife.trim() || isNaN(Number(shelfLife))) errors.shelf_life_days = 'Enter valid shelf life (days)'

  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors)
    return
  }

  setIsLoading(true)
  try {
    const data: Product = {
      name,
      sku,
      brand,
      shelf_life_days: Number(shelfLife),
      description,
    }

    if (mode === 'add') {
      await createProduct(data)
    } else if (mode === 'edit' && productData?._id) {
      await updateProduct(productData._id, data)
    }

    onSave(data) // callback to refresh parent
    onClose()
  } catch (err: any) {
    console.error('Error saving product:', err)
    setFieldErrors({ name: err?.response?.data?.message || 'Failed to save product' })
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="text-[#191A1B] font-medium text-base">
          {mode === 'add' ? 'Add Product' : 'Edit Product'}
        </div>
        <XIcon size={16} color="#191A1B" className="cursor-pointer" onClick={onClose} />
      </div>

      <div className="flex flex-col gap-4">
        <InputWithError
          label="Product Name"
          value={name}
          onChange={setName}
          placeholder="Enter Product Name"
          error={fieldErrors.name}
        />

        <InputWithError
          label="SKU"
          value={sku}
          onChange={setSku}
          placeholder="Enter SKU"
          error={fieldErrors.sku}
        />

        <InputWithError
          label="Brand (optional)"
          value={brand}
          onChange={setBrand}
          placeholder="Enter Brand"
        />

        <InputWithError
          label="Shelf Life (days)"
          value={shelfLife}
          onChange={setShelfLife}
          placeholder="e.g. 10"
          type="number"
          error={fieldErrors.shelf_life_days}
        />

        <InputWithError
          label="Description (optional)"
          value={description}
          onChange={setDescription}
          placeholder="Short description"
        />

        <div className="flex gap-3 justify-end mt-4">
          <Button text="Cancel" white={true} error={false} onClick={onClose} disabled={isLoading} />
          <Button
            text={isLoading ? 'Saving...' : mode === 'add' ? 'Add Product' : 'Save Changes'}
            error={false}
            onClick={handleSave}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}

export default EditProduct
