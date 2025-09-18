"use client"
import EnhancedDataTable from '@/components/EnhancedDataTable';
import { ArrowLeftIcon, CopyIcon, DownloadSimpleIcon, PlusIcon, PrinterIcon, PencilIcon } from '@phosphor-icons/react/dist/ssr';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react'
import { fetchShippingManifestById, updateShippingManifest } from '@/lib/api/shipping';
import { useModal } from '@/contexts/ModalContext';
import { useReactToPrint } from 'react-to-print';
import useProtectedRoute from '@/lib/useProtectedRoute';
import { useToast } from '@/hooks/useToast';

const page = () => {
  const permissionLoading = useProtectedRoute(['shipping']);
  const params = useParams<{ id: string }>();
  const labelId = params?.id;
  const router = useRouter();
  const { openModal } = useModal();
  const toast = useToast();
  
  // State for order data
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<any[]>([]);

  // Ref for printable component
  const componentRef = React.useRef<HTMLDivElement>(null);

  // Fetch order data on component mount
  useEffect(() => {
    const loadOrderData = async () => {
      if (!labelId) return;
      
      try {
        setIsLoading(true);
        const response = await fetchShippingManifestById(labelId);
        // console.log('Fetched shipping manifest data:', response);
        
        // Transform items data for the table with volumetric weight calculation (do not filter here)
        const transformedItems = (response.items?.map((item: any, index: number) => {
          // Calculate volumetric weight: (L × W × H) / 4500
          const volumetricWeight = item.dimensions 
            ? (item.dimensions.length * item.dimensions.breadth * item.dimensions.height) / 4500
            : 0;
          const qtyPerCarton = item.cartons ? Math.round(Number(item.quantity?.toString().replace(/,/g, "")) / item.cartons) : 0;
          const totalVolumetricWeight = volumetricWeight * (item.cartons );
          return {
            id: `item-${index}`,
            itemCode: item.itemCode,
            productName: item.internalSku || 'N/A',
            quantity: qtyPerCarton, // Calculate qty per carton
            dimensions: item.dimensions 
              ? `${item.dimensions.length}×${item.dimensions.breadth}×${item.dimensions.height} cm`
              : 'N/A',
            volumetricWeight: volumetricWeight.toFixed(2),
            cartons: item.cartons || 0,
            totalWeight: totalVolumetricWeight.toFixed(2),
          };
        }) || []);
        // Calculate total cartons from all items
        const totalCartons = transformedItems.reduce((sum: number, item: any) => sum + (item.cartons || 0), 0);
        // Update order data with calculated total cartons
        setOrderData({
          ...response,
          totalCartons: totalCartons
        });
        setOrdersData(transformedItems);
      } catch (error) {
        console.error('Error fetching shipping manifest data:', error);
        setOrderData(null);
        setOrdersData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [labelId]);

  function extractPincode(address: string): string | null {
  if (!address || typeof address !== 'string') {
    return null;
  }

  // Clean the address - remove extra spaces and normalize
  const cleanAddress = address.trim().replace(/\s+/g, ' ');

  // Pattern 1: Standard format with hyphen (State - PINCODE)
  // Examples: "Uttar Pradesh - 226008", "Maharashtra - 410507"
  const pattern1 = /(?:^|[^0-9])(\d{6})(?:\s*,?\s*India)?(?:\s|$|,)/;
  
  // Pattern 2: Pincode followed by comma and location
  // Examples: "560083, Bangalore"
  const pattern2 = /(?:^|[^0-9])(\d{6})(?:\s*,\s*[A-Za-z])/;
  
  // Pattern 3: Pincode at the end of address
  // Examples: "Karnataka 562114."
  const pattern3 = /(?:^|[^0-9])(\d{6})(?:\s*[.,;]?\s*$)/;
  
  // Pattern 4: Pincode surrounded by commas or spaces
  // Examples: ", 560083,"
  const pattern4 = /(?:,\s*|^)(\d{6})(?:\s*,|\s*$)/;
  
  // Pattern 5: State name followed by pincode
  // Examples: "Karnataka 562114", "Tamil Nadu - 641664"
  const pattern5 = /(?:Karnataka|Tamil Nadu|Maharashtra|Uttar Pradesh|Punjab|Gujarat|Rajasthan|Haryana|Delhi|Bihar|West Bengal|Odisha|Madhya Pradesh|Chhattisgarh|Jharkhand|Assam|Himachal Pradesh|Uttarakhand|Goa|Kerala|Andhra Pradesh|Telangana|Manipur|Meghalaya|Mizoram|Nagaland|Sikkim|Tripura|Arunachal Pradesh|Jammu and Kashmir|Ladakh|Puducherry|Chandigarh|Dadra and Nagar Haveli and Daman and Diu|Lakshadweep|Andaman and Nicobar Islands)\s*-?\s*(\d{6})/i;

  // Try patterns in order of specificity
  const patterns = [pattern5, pattern1, pattern2, pattern3, pattern4];
  
  for (const pattern of patterns) {
    const match = cleanAddress.match(pattern);
    if (match) {
      const pincode = match[1] || match[2]; // pattern5 uses group 2, others use group 1
      
      // Validate pincode (should be exactly 6 digits and start with 1-9)
      if (pincode && /^[1-9]\d{5}$/.test(pincode)) {
        return pincode;
      }
    }
  }

  // Fallback: Look for any 6-digit number that starts with 1-9
  const fallbackPattern = /(?:^|[^0-9])([1-9]\d{5})(?:[^0-9]|$)/;
  const fallbackMatch = cleanAddress.match(fallbackPattern);
  
  if (fallbackMatch) {
    return fallbackMatch[1];
  }

  return null;
}

const ordersColumns = [
    { 
    key: 'productName', 
    label: 'Internal SKU', 
    width: '250px',
    sortable: true 
  },
  { 
    key: 'itemCode', 
    label: 'Item Code', 
    width: '142px',
    sortable: true 
  },

  { 
    key: 'quantity', 
    label: 'Qty/CTN', 
    width: '142px',
    sortable: true,

  },
    { 
    key: 'dimensions', 
    label: 'Dimensions (L×B×H cm)', 
    width: '204px',
    sortable: true,

  },
   { 
    key: 'volumetricWeight', 
    label: 'Vol. Wt.', 
    width: '142px',
    sortable: true,

  },
  { 
    key: 'cartons', 
    label: 'Cartons', 
    width: '142px',
    sortable: true,
    showTotal: true 
  },
    { 
    key: 'totalWeight', 
    label: 'Total Vol. Wt.', 
    width: '142px',
    sortable: true,
    showTotal: true 
  },
];
  
  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Function to format date to "June 17, 2025" format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Function to capitalize the first letter of a string
  const capitalizeFirstLetter = (value: string | number) => {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (!value || typeof value !== 'string') {
      return 'N/A';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  // Handler for opening the add invoice modal
  const handleAddInvoice = () => {
    openModal('add-invoice', {
      labelId: labelId,
      invoiceNumber: orderData?.invoiceNumber || '', // Pass current invoice number for editing
      onInvoiceAdded: (invoiceNumber: string) => {
        // Refresh the data after invoice is added
        const loadOrderData = async () => {
          if (!labelId) return;
          
          try {
            setIsLoading(true);
            const response = await fetchShippingManifestById(labelId);
            // console.log('Refreshed shipping manifest data after invoice addition:', response);
            
            // Transform items data for the table with volumetric weight calculation
            const transformedItems = response.items?.map((item: any, index: number) => {
              // Calculate volumetric weight: (L × W × H) / 4500
              const volumetricWeight = item.dimensions 
                ? (item.dimensions.length * item.dimensions.breadth * item.dimensions.height) / 4500
                : 0;
              
              const totalVolumetricWeight = volumetricWeight * (item.cartons || 1);
              
              return {
                id: `item-${index}`,
                itemCode: item.itemCode,
                productName: item.internalSku || 'N/A',
                quantity: item.cartons ? Math.round(item.quantity / item.cartons) : 0,
                dimensions: item.dimensions 
                  ? `${item.dimensions.length}×${item.dimensions.breadth}×${item.dimensions.height} cm`
                  : 'N/A',
                volumetricWeight: volumetricWeight.toFixed(2),
                cartons: item.cartons || 0,
                totalWeight: totalVolumetricWeight.toFixed(2),
              };
            }) || [];
            
            // Calculate total cartons from all items
            const totalCartons = transformedItems.reduce((sum: number, item: any) => sum + (item.cartons || 0), 0);
            
            // Update order data with calculated total cartons
            setOrderData({
              ...response,
              totalCartons: totalCartons
            });
            setOrdersData(transformedItems);
          } catch (error) {
            console.error('Error refreshing shipping manifest data:', error);
          } finally {
            setIsLoading(false);
          }
        };
        
        loadOrderData();
      }
    });
  };

  // Handler for editing AWB number
  const handleEditAwb = () => {
    openModal('add-manifest', {
      labelId: labelId,
      courier: orderData?.courier || '',
      awbNumber: orderData?.awbNumber || '', // Pass current AWB number for editing
      dispatchDate: orderData?.dispatchDate || '', // Pass current dispatch date for editing
      onManifestAdded: (awbNumber: string) => {
        // Refresh the data after AWB is updated
        const loadOrderData = async () => {
          if (!labelId) return;
          
          try {
            setIsLoading(true);
            const response = await fetchShippingManifestById(labelId);
            // console.log('Refreshed shipping manifest data after AWB update:', response);
            
            // Transform items data for the table with volumetric weight calculation
            const transformedItems = response.items?.map((item: any, index: number) => {
              // Calculate volumetric weight: (L × W × H) / 4500
              const volumetricWeight = item.dimensions 
                ? (item.dimensions.length * item.dimensions.breadth * item.dimensions.height) / 4500
                : 0;
              
              const totalVolumetricWeight = volumetricWeight * (item.cartons || 1);
              
              return {
                id: `item-${index}`,
                itemCode: item.itemCode,
                productName: item.internalSku || 'N/A',
                quantity: item.cartons ? Math.round(item.quantity / item.cartons) : 0,
                dimensions: item.dimensions 
                  ? `${item.dimensions.length}×${item.dimensions.breadth}×${item.dimensions.height} cm`
                  : 'N/A',
                volumetricWeight: volumetricWeight.toFixed(2),
                cartons: item.cartons || 0,
                totalWeight: totalVolumetricWeight.toFixed(2),
              };
            }) || [];
            
            // Calculate total cartons from all items
            const totalCartons = transformedItems.reduce((sum: number, item: any) => sum + (item.cartons || 0), 0);
            
            // Update order data with calculated total cartons
            setOrderData({
              ...response,
              totalCartons: totalCartons
            });
            setOrdersData(transformedItems);
          } catch (error) {
            console.error('Error refreshing shipping manifest data:', error);
          } finally {
            setIsLoading(false);
          }
        };
        
        loadOrderData();
      }
    });
  };

  // Printable component for manifest details and table
  const PrintableComponent = React.forwardRef<HTMLDivElement>((props, ref) => {
    // Extract pincode from deliveredTo
    const pincode = extractPincode(orderData?.deliveredTo || '');
    // Only show items with quantity > 0 in the printable manifest
    const printableItems = ordersData.filter((item: any) => Number(item.quantity) > 0);
    return (
      <div ref={ref} className="p-8 bg-white">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Shipping Manifest</h1>
          <div className="text-lg text-gray-600">Manifest ID: {orderData?.manifestId || labelId}</div>
        </div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Manifest Details</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div><strong>Invoice Number:</strong> {orderData?.invoiceNumber || 'N/A'}</div>
              <div><strong>PO Number:</strong> {orderData?.poNumber || 'N/A'}</div>
              <div><strong>Dispatch Date:</strong> {formatDate(orderData?.dispatchDate)}</div>
              <div><strong>Location:</strong> {orderData?.location|| 'N/A'}</div>
              <div><strong>Pincode:</strong> {pincode || 'N/A'}</div>
            </div>
            <div className="space-y-3">
              <div><strong>AWB Number:</strong> {capitalizeFirstLetter(orderData?.awbNumber || 'N/A')}</div>
              <div><strong>Courier Partner:</strong> {capitalizeFirstLetter(orderData?.courier || 'N/A')}</div>
              {/* <div><strong>Shipment Value:</strong> ₹{orderData?.totalValue || 'N/A'}</div> */}
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Items</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Internal SKU</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Item Code</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Qty/CTN</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Dimensions (L×B×H cm)</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Vol. Wt.</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Cartons</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Total Vol. Wt.</th>
              </tr>
            </thead>
            <tbody>
              {printableItems.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{item.productName}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.itemCode}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.dimensions}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.volumetricWeight}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.cartons}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.totalWeight}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="border border-gray-300 px-4 py-2" colSpan={5}><strong>Total</strong></td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>{printableItems.reduce((sum, item) => sum + (item.cartons || 0), 0)}</strong>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <strong>{printableItems.reduce((sum, item) => sum + (parseFloat(item.totalWeight) || 0), 0).toFixed(2)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  });

  PrintableComponent.displayName = 'PrintableComponent';

  // Setup react-to-print hook
  const handlePrintClick = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `ShippingManifest-${orderData?.manifestId || labelId}`,
  });






  // Show loading state while checking permissions
  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
          <div className='w-full bg-white p-5 min-h-screen'>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        ) : (
          <>
        <div className='flex justify-between mb-4'>
            <div className='flex items-center gap-2'>
                <div className='cursor-pointer' onClick={() => router.push('/shipping-manifest')}>
                     <ArrowLeftIcon size={16} color='#545659' weight="bold" />
                </div>

            <div className='flex gap-2 items-center'>
            <div className='text-xl font-medium text-[#191A1B]'>{orderData?.manifestId || labelId}</div>

            </div>
            </div>
            <div className='flex gap-3'>
             
              {/* <button onClick={handlePrintClick} className='w-fit flex gap-1 text-sm text-[#545659] cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs '>
                Pdf
                <DownloadSimpleIcon size={16} color='#545659' />
               </button> */}
               <button 
                 onClick={handlePrintClick} 
                 className='w-fit flex gap-1 text-sm text-[#545659] cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs'
               >
                Print
                <PrinterIcon size={16} color='#545659' />
               </button>
            </div>
        </div>
        <div className='flex flex-col gap-3'>
            <div className='text-[#545659] text-base font-medium'>Manifest Details</div>
            <div className='w-full rounded-lg border border-[#EAEAEA] p-6 shadow-sm flex justify-between'>
                <div className='flex flex-col gap-4 w-[48%]'>
                    <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>PO Number</div>
                        <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                          {orderData?.poNumber || 'N/A'}
                          <CopyIcon 
                            size={16} 
                            className="cursor-pointer hover:text-gray-700 transition-colors"
                            onClick={() => copyToClipboard(orderData?.poNumber || 'N/A')}
                          />
                        </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>Dispatch Date</div>
                        <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                          {formatDate(orderData?.dispatchDate)}
                  
                        </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>Warehouse Code</div>
                        <div className='flex items-center gap-1.5 text-[#90919B] text-sm w-[40%] text-right justify-end'>
                          {orderData?.warehouseCode || 'N/A'}

                        </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>Ship to Location</div>
                        <div className='flex items-center gap-1.5 text-[#90919B] text-sm w-[40%] text-right justify-end'>
                          {orderData?.location || 'N/A'}
                        
                        </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>Shipping Address</div>
                        <div className='flex items-center gap-1.5 text-[#90919B] text-sm w-[60%] text-right justify-end'>
                          {orderData?.deliveredTo || 'N/A'}
                        </div>
                    </div>
                </div>
               <div className='flex flex-col gap-4 w-[48%]'>
                 <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>AWB number</div>
                        {orderData?.awbNumber ? (
                          <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                            {capitalizeFirstLetter(orderData.awbNumber)}
                            <div className='cursor-pointer hover:bg-gray-100 p-1 rounded' onClick={handleEditAwb}>
                              <PencilIcon size={16} color='#545659' />
                            </div>
                          </div>
                        ) : (
                          <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                            N/A
                          </div>
                        )}
                    </div>
                    <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>Buyer</div>
                        <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                          {capitalizeFirstLetter(orderData?.source || 'N/A')}
                        </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>Invoice Number</div>
                        {orderData?.invoiceNumber ? (
                          <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                            {orderData.invoiceNumber}
                            <div className='cursor-pointer hover:bg-gray-100 p-1 rounded' onClick={handleAddInvoice}>
                              <PencilIcon size={16} color='#545659' />
                            </div>
                          </div>
                        ) : (
                          <button 
                              className='flex items-center gap-1.5 text-[#90919B] text-sm border px-4 py-2 rounded-lg border-[#EAEAEA] cursor-pointer'
                              onClick={handleAddInvoice}
                          >
                            Add Invoice number
                            <PlusIcon size={16} color='#545659'  />
                          </button>
                        )}
                    </div>
                    <div className='flex gap-2 items-center justify-between' >
                        <div className='text-[#191A1B] text-base font-medium'>Total Cartons</div>
                        <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                          {capitalizeFirstLetter(orderData?.totalCartons || 'N/A')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className='pt-8'>
            <EnhancedDataTable
              data={ordersData}
              columns={ordersColumns}
              enablePagination={false}
              maxVisibleRows={6}
              showSerialNumber={false}
            />
        </div>
        
        {/* Hidden printable component */}
        <div style={{ display: 'none' }}>
          <PrintableComponent ref={componentRef} />
        </div>
        </>
        )}
    </div>
  )
}

export default page
