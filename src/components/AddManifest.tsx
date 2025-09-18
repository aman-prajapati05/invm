import { XIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useState } from 'react'
import Button from './Button'
import { addManifest } from '@/lib/api/label'

interface AddManifestProps {
    onClose: () => void;
    labelId?: string;
    onManifestAdded?: (awbNumber: string) => void;
    status?: string; // Optional status prop
    courier?: string; // Optional courier prop
    isDocket?: boolean; // Flag to indicate if this is a docket operation
    docketId?: string; // Docket ID for docket operations
    awbNumber?: string; // Optional AWB number for editing
    dispatchDate?: string; // Optional dispatch date for editing
}

const AddManifest: React.FC<AddManifestProps> = ({ onClose, labelId, onManifestAdded, status, courier, isDocket, docketId, awbNumber: initialAwbNumber, dispatchDate: initialDispatchDate }) => {
  console.log('AddManifest - initialAwbNumber:', initialAwbNumber);
  console.log('AddManifest - initialDispatchDate:', initialDispatchDate);
  
  const [awbNumber, setAwbNumber] = useState(initialAwbNumber || '');
  
  // Format dispatch date for input field (convert from ISO to YYYY-MM-DD)
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const formatted = date.toISOString().split('T')[0];
      console.log('formatDateForInput - input:', dateString, 'output:', formatted);
      return formatted;
    } catch (error) {
      console.error('formatDateForInput - error:', error);
      return '';
    }
  };
  
  const [dispatchDate, setDispatchDate] = useState(formatDateForInput(initialDispatchDate));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Function to open date picker
  const openDatePicker = (inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      try {
        input.showPicker();
      } catch (error) {
        // Fallback for browsers that don't support showPicker
        input.focus();
        input.click();
      }
    }
  };

  const courierOptions = [
    { label: 'Blue Dart', value: 'Blue Dart' },
    { label: 'Orom Logistics', value: 'Orom Logistics' },
    { label: 'FedEx', value: 'FedEx' },
    { label: 'DHL', value: 'DHL' },
    { label: 'UPS', value: 'UPS' },
    { label: 'DTDC', value: 'DTDC' },
  ];

  const handleAddManifest = async () => {
    if (!awbNumber.trim()) {
      setError('Please enter an AWB number');
      return;
    }

    if (!dispatchDate.trim()) {
      setError('Please select a dispatch date');
      return;
    }

    // Check if dispatch date is in the past
    const selectedDate = new Date(dispatchDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // if (selectedDate < today) {
    //   setError('Dispatch date cannot be in the past');
    //   return;
    // }

    if (!labelId) {
      setError('Label ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Debug logging
      console.log('AddManifest - API call parameters:', {
        labelId,
        awbNumber: awbNumber.trim(),
        dispatchDate,
        courier,
        isDocket,
        docketId
      });
      
      // Add manifest with AWB number and dispatch date
      // Include docket-specific parameters if this is a docket operation
      await addManifest(labelId!, awbNumber.trim(), dispatchDate, courier, isDocket, docketId);

      console.log('AddManifest - API call completed successfully');

      // Call the callback if provided
      if (onManifestAdded) {
        onManifestAdded(awbNumber.trim());
      }

      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error adding manifest:', error);
      // Check if it's an AWB uniqueness error
      if (error.response?.data?.message?.includes('AWB number already exists')) {
        setError('AWB number already exists. Please use a unique AWB number.');
      } else {
        setError('Failed to add manifest. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className='bg-white p-6 rounded-xl shadow-lg max-w-xl w-full'>
        <div className='flex justify-between items-center mb-4'>
            <div className='text-[#191A1B] font-medium text-base'>
              {isDocket ? 'Enter AWB number for Docket' : 'Enter AWB number'}
            </div>
            <div className='cursor-pointer' onClick={onClose}>
              <XIcon size={16} color='#191A1B' />
            </div>
        </div>
        <div className='mb-4'>
            <div className='text-sm text-[#545659] mb-2 font-medium'>
                AWB Number
            </div>
            <input 
              type='text' 
              placeholder='Enter AWB Number' 
              className={`border text-[#545659] rounded-md px-3 py-2 w-full ${error ? 'border-red-500' : 'border-[#EAEAEA]'}`}
              value={awbNumber}
              onChange={(e) => {
                setAwbNumber(e.target.value);
                if (error) setError(''); // Clear error when user starts typing
              }}
              disabled={isLoading}
            />
            {error && (
              <div className='text-red-500 text-xs mt-1'>{error}</div>
            )}
        </div>
          <div className='mb-4'>
            <div className='text-sm text-[#545659] mb-2 font-medium'>
                Select Dispatch Date
            </div>
            <div 
              className={`border text-[#545659] rounded-md px-3 py-2 w-full cursor-pointer relative ${error ? 'border-red-500' : 'border-[#EAEAEA]'} ${isLoading ? 'opacity-50' : 'hover:border-gray-400'}`}
              onClick={() => openDatePicker('dispatch-date-input')}
            >
              <input 
                id="dispatch-date-input"
                type='date' 
                className="w-full bg-transparent cursor-pointer outline-none pointer-events-none"
                value={dispatchDate}
                onChange={(e) => {
                  setDispatchDate(e.target.value);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                disabled={isLoading}
              />
            </div>
        </div>

        <div className='flex justify-end gap-2'>
            <Button 
              text='Cancel' 
              white={true} 
              error={false} 
              onClick={onClose}
              disabled={isLoading}
            />
            <Button 
              text={isLoading ? 'Generating...' : 'Generate Manifest'} 
              white={false} 
              error={false} 
              onClick={handleAddManifest}
              disabled={isLoading || !awbNumber.trim() || !dispatchDate.trim()}
            />
        </div>
    </div>
  )
}

export default AddManifest
