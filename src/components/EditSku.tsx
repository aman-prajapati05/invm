"use client"
import { XIcon, CaretDownIcon, WarningCircleIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useState } from 'react'
import Button from './Button'

interface EditSkuProps {
  mode: 'add' | 'edit';
  skuData?: {
    _id?: string;
    internalSku: string;
    itemName: string;
    barcode: string;
    basicCost: number;
    dimensions: {
      length: number;
      breadth: number;
      height: number;
    };
    status?: 'active' | 'inactive';
  };
  onClose: () => void;
  onSave: (data: { 
    internalSku: string;
    itemName: string;
    barcode: string;
    basicCost: number;
    dimensions: {
      length: number;
      breadth: number;
      height: number;
    };
    status: 'active' | 'inactive';
  }) => void;
}

interface FieldErrors {
  internalSku?: string;
  itemName?: string;
  barcode?: string;
  length?: string;
  breadth?: string;
  height?: string;
  basicCost?: string;
}

// Helper component for input with error - moved outside to prevent focus loss
const InputWithError = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  error 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
}) => (
  <div className='flex flex-col gap-2'>
    <div className='flex gap-1 items-center'>
      <div className='text-[#545659] text-sm font-medium'>{label}</div>
    </div>
    <div className='relative'>
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg p-3 text-sm text-[#191A1B] bg-[#FAFAFA] w-full border outline-none ${
          error 
            ? 'border-red-500 bg-red-50' 
            : 'border-[#F5F5F5]'
        } ${error ? 'pr-10' : ''}`}
      />
      {error && (
        <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
          <WarningCircleIcon size={16} color='#F04438' weight='fill' />
        </div>
      )}
    </div>
    {error && (
      <div className='text-red-500 text-xs flex items-center gap-1'>
        {/* <WarningCircleIcon size={12} color='#F04438' weight='fill' /> */}
        {error}
      </div>
    )}
  </div>
);

// Helper component for dimension inputs - moved outside to prevent focus loss
const DimensionInput = ({ 
  label, 
  value, 
  onChange, 
  error 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => (
  <div className='flex flex-col gap-2 flex-1'>
    <div className='text-[#545659] text-sm font-medium'>{label}</div>
    <div className='relative'>
      <input 
        type='number' 
        placeholder='0' 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg p-3 text-sm text-[#191A1B] bg-[#FAFAFA] w-full border outline-none ${
          error 
            ? 'border-red-500 bg-red-50' 
            : 'border-[#F5F5F5]'
        } ${error ? 'pr-10' : ''}`}
      />
      {error && (
        <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
          <WarningCircleIcon size={16} color='#F04438' weight='fill' />
        </div>
      )}
    </div>
    {error && (
      <div className='text-red-500 text-xs flex items-center gap-1'>
        {/* <WarningCircleIcon size={12} color='#F04438' weight='fill' /> */}
        {error}
      </div>
    )}
  </div>
);

const EditSKU: React.FC<EditSkuProps> = ({  
    mode,
    skuData,
    onClose,
    onSave
}) => {
      const [internalSku, setInternalSku] = useState(skuData?.internalSku || '');
      const [itemName, setItemName] = useState(skuData?.itemName || '');
      const [barcode, setBarcode] = useState(skuData?.barcode || '');
      const [length, setLength] = useState(skuData?.dimensions?.length?.toString() || '');
      const [breadth, setBreadth] = useState(skuData?.dimensions?.breadth?.toString() || '');
      const [height, setHeight] = useState(skuData?.dimensions?.height?.toString() || '');
      const [basicCost, setBasicCost] = useState(skuData?.basicCost?.toString() || '');
      const [isLoading, setIsLoading] = useState(false);
      const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

      const handleSave = async () => {
        // Clear previous errors
        setFieldErrors({});
        
        const errors: FieldErrors = {};
        
        // Validate required fields
        if (!internalSku.trim()) {
          errors.internalSku = 'Please enter an internal SKU code';
        }
        
        if (!itemName.trim()) {
          errors.itemName = 'Please enter an item name';
        }
        
        if (!barcode.trim()) {
          errors.barcode = 'Please enter a barcode';
        }
        
        if (!length.trim() || isNaN(Number(length))) {
          errors.length = 'Please enter a valid length';
        }
        
        if (!breadth.trim() || isNaN(Number(breadth))) {
          errors.breadth = 'Please enter a valid breadth';
        }
        
        if (!height.trim() || isNaN(Number(height))) {
          errors.height = 'Please enter a valid height';
        }
        
        if (!basicCost.trim() || isNaN(Number(basicCost))) {
          errors.basicCost = 'Please enter a valid cost price';
        }

        // If there are validation errors, set them and return
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          return;
        }

        setIsLoading(true);
        try {
          const data = { 
            internalSku, 
            itemName, 
            barcode, 
            basicCost: Number(basicCost),
            dimensions: {
              length: Number(length), 
              breadth: Number(breadth), 
              height: Number(height)
            },
            status: 'active' as const
          };
          await onSave(data);
          onClose();
        } catch (error: any) {
          console.error('Error saving SKU:', error);
          
          const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save SKU. Please try again.';
          const newErrors: FieldErrors = {};
          
          // Map API errors to specific fields
          if (errorMessage.includes('SKU already exists') || errorMessage.includes('internalSku')) {
            newErrors.internalSku = 'This SKU code already exists';
          } else if (errorMessage.includes('Missing field: itemName')) {
            newErrors.itemName = 'Item name is required';
          } else if (errorMessage.includes('Missing field: barcode')) {
            newErrors.barcode = 'Barcode is required';
          } else if (errorMessage.includes('Missing field: basicCost')) {
            newErrors.basicCost = 'Basic cost is required';
          } else if (errorMessage.includes('Missing field: dimensions')) {
            newErrors.length = 'Length is required';
            newErrors.breadth = 'Breadth is required';
            newErrors.height = 'Height is required';
          } else {
            // For any other error, show it on the first field as a fallback
            newErrors.internalSku = errorMessage;
          }
          
          setFieldErrors(newErrors);
        } finally {
          setIsLoading(false);
        }
      };

  return (
    <div className='bg-white p-6 rounded-xl shadow-lg max-w-2xl w-full'>
        <div className='flex justify-between items-center mb-4'>
            <div className='text-[#191A1B] font-medium text-base'>
              {mode === 'add' ? 'Add SKU' : 'Edit SKU'}
            </div>
            <XIcon size={16} color='#191A1B' className='cursor-pointer' onClick={onClose} />
        </div>
        
        <div className='flex flex-col gap-4'>
          
          <InputWithError
            label="Internal SKU Code"
            value={internalSku}
            onChange={setInternalSku}
            placeholder="Enter Internal SKU Code"
            error={fieldErrors.internalSku}
          />

          <InputWithError
            label="Item Name"
            value={itemName}
            onChange={setItemName}
            placeholder="Enter Item Name"
            error={fieldErrors.itemName}
          />

          <InputWithError
            label="Barcode"
            value={barcode}
            onChange={setBarcode}
            placeholder="Enter Barcode"
            error={fieldErrors.barcode}
          />

          <div className='flex justify-between items-center gap-4'>
            <DimensionInput
              label="Length (cm)"
              value={length}
              onChange={setLength}
              error={fieldErrors.length}
            />
            <DimensionInput
              label="Breadth (cm)"
              value={breadth}
              onChange={setBreadth}
              error={fieldErrors.breadth}
            />
            <DimensionInput
              label="Height (cm)"
              value={height}
              onChange={setHeight}
              error={fieldErrors.height}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex gap-1 items-center'>
              <div className='text-[#545659] text-sm font-medium'>Basic Cost Price</div>
            </div>
            <div className='relative'>
              <input 
                type='number' 
                placeholder='₹35.00' 
                value={basicCost}
                onChange={(e) => setBasicCost(e.target.value)}
                className={`rounded-lg p-3 text-sm text-[#191A1B] bg-[#FAFAFA] w-full border outline-none ${
                  fieldErrors.basicCost 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-[#F5F5F5]'
                } ${fieldErrors.basicCost ? 'pr-10' : ''}`}
              />
              {fieldErrors.basicCost && (
                <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                  <WarningCircleIcon size={16} color='#F04438' weight='fill' />
                </div>
              )}
            </div>
            {fieldErrors.basicCost && (
              <div className='text-red-500 text-xs flex items-center gap-1'>
                {/* <WarningCircleIcon size={12} color='#F04438' weight='fill' /> */}
                {fieldErrors.basicCost}
              </div>
            )}
          </div>
      
          <div className='flex gap-3 justify-end'>
            <Button text="Cancel" white={true} error={false} onClick={onClose} disabled={isLoading} />
            <Button 
              text={isLoading ? 'Saving...' : (mode === 'add' ? 'Add SKU' : 'Save Changes')} 
              error={false} 
              onClick={handleSave}
              disabled={isLoading}
            />
          </div>
        </div>
    </div>
  )
}

export default EditSKU