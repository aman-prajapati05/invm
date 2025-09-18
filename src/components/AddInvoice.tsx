import { XIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useState } from 'react'
import Button from './Button'
import { updateLabel } from '@/lib/api/label'

interface AddInvoiceProps {
    onClose: () => void;
    labelId?: string;
    onInvoiceAdded?: (invoiceNumber: string) => void;
    mode?: 'add' | 'edit'; // New prop to distinguish between adding and editing
    currentInvoiceNumber?: string; // Current invoice number when editing
    poNumber?: string; // PO number associated with the label
}

const AddInvoice: React.FC<AddInvoiceProps> = ({ 
  onClose, 
  labelId, 
  onInvoiceAdded, 
  mode = 'add', 
  currentInvoiceNumber = '',
  poNumber
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState(currentInvoiceNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddInvoice = async () => {
    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number');
      return;
    }

    if (!labelId) {
      setError('Label ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const isAddingMode = mode === 'add';
      
      console.log(`${isAddingMode ? 'Adding' : 'Editing'} invoice for labelId:`, labelId);
      
      // Prepare update data based on mode
      const updateData: any = {
        invoiceNumber: invoiceNumber.trim(),
        poNumber: poNumber
      };
      
      // Only update status when adding (not when editing)
      if (isAddingMode) {
        updateData.labelStatus = 'ready-to-print';
      }
      
      console.log('Update data:', updateData);
      
      // Update the label
      const response = await updateLabel(labelId, updateData);
      
      console.log('Update response:', response);

      // Call the callback if provided
      if (onInvoiceAdded) {
        onInvoiceAdded(invoiceNumber.trim());
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} invoice:`, error);
      setError(`Failed to ${mode === 'add' ? 'add' : 'update'} invoice. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className='bg-white p-6 rounded-xl shadow-lg max-w-xl w-full'>
        <div className='flex justify-between items-center mb-4'>
            <div className='text-[#191A1B] font-medium text-base'>
              {mode === 'add' ? 'Add Invoice' : 'Edit Invoice'}
            </div>
            <div className='cursor-pointer' onClick={onClose}>
              <XIcon size={16} color='#191A1B'  />
            </div>
        </div>
        <div className='flex flex-col mb-4 gap-1.5'>
            <div className='text-[#545659] text-sm font-medium'>Invoice Number</div>
            <input 
              type="text" 
              className={`border rounded-md p-2 text-[#545659] focus:none ${error ? 'border-red-500' : 'border-[#EAEAEA]'}`}
              placeholder={mode === 'add' ? 'Enter Invoice Number' : 'Update Invoice Number'}
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
                if (error) setError(''); // Clear error when user starts typing
              }}
              disabled={isLoading}
            />
            {error && (
              <div className='text-red-500 text-xs'>{error}</div>
            )}
        </div>
        <div className='flex justify-end'>
            <div className='flex gap-2'>
                <Button 
                  text='Cancel' 
                  white={true} 
                  error={false} 
                  onClick={onClose}
                  disabled={isLoading}
                />
                <Button 
                  text={isLoading ? `${mode === 'add' ? 'Adding' : 'Updating'}...` : `${mode === 'add' ? 'Add' : 'Update'} Invoice`} 
                  white={false} 
                  error={false} 
                  onClick={handleAddInvoice}
                  disabled={isLoading || !invoiceNumber.trim()}
                />
            </div>
        </div>
    </div>
  )
}

export default AddInvoice
