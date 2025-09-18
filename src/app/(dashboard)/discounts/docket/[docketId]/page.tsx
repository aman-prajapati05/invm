"use client"
import EnhancedDataTable from '@/components/EnhancedDataTable';
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, CopyIcon, DownloadSimpleIcon, PlusIcon, PrinterIcon } from '@phosphor-icons/react/dist/ssr';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import React, { useState, useEffect } from 'react'
import { getDocketShippingManifests } from '@/lib/api/shipping';
import { useModal } from '@/contexts/ModalContext';
import { useReactToPrint } from 'react-to-print';
import useProtectedRoute from '@/lib/useProtectedRoute';

interface ShippingOrder {
  _id: string;
  source: string;
  poNumber: string;
  labelStatus: string;
  invoiceNumber?: string;
  manifestStatus?: string;
  awbNumber?: string;
  courier?: string;
  docketId: string;
  manifestId?: string;
  deliveredTo: string;
  buyerId?: string; // Optional buyer ID
  warehouseCode?: string; // Optional warehouse code
  dispatchDate?: string;
  items: any[];
}

interface DocketData {
  docketId: string;
  orders: ShippingOrder[];
}

const page = () => {
  const permissionLoading = useProtectedRoute(['shipping']);
  const params = useParams<{ docketId: string }>();
  const docketId = params?.docketId;
  const router = useRouter();
  const { openModal } = useModal();
  const toast = useToast();
  // Copy to clipboard with confirmation
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  // State for docket data
  const [docketData, setDocketData] = useState<DocketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allOrdersData, setAllOrdersData] = useState<any[]>([]);

  // Ref for printable component
  const componentRef = React.useRef<HTMLDivElement>(null);



  // Fetch docket data on component mount
  useEffect(() => {
    const loadDocketData = async () => {
      // console.log('Loading shipping docket data for docketId:', docketId);
      if (!docketId) return;
      
      try {
        setIsLoading(true);

        const response = await getDocketShippingManifests(docketId);
        // console.log('Fetched shipping docket data:', response);
        
        setDocketData(response);
        
        // Transform items data for all orders into a single array
        const allItems: any[] = [];
        response.orders.forEach((order: ShippingOrder) => {
          const transformedItems = order.items?.map((item: any, index: number) => {
            // Calculate volumetric weight: (L × W × H) / 4500
            const volumetricWeight = item.dimensions 
              ? (item.dimensions.length * item.dimensions.breadth * item.dimensions.height) / 4500
              : 0;
            
            const totalVolumetricWeight = volumetricWeight * (item.cartons );
            
            return {
              id: `${order._id}-item-${index}`,
              poNumber: order.poNumber || 'N/A',
              itemCode: item.itemCode,
              productName: item.internalSku || 'N/A',
              quantity: item.cartons ? Math.round(parseInt(String(item.quantity).replace(/,/g, '')) / item.cartons) : 0, 
              dimensions: item.dimensions 
                ? `${item.dimensions.length}×${item.dimensions.breadth}×${item.dimensions.height} cm`
                : 'N/A',
              volumetricWeight: volumetricWeight.toFixed(2),
              cartons: item.cartons || 0,
              totalWeight: totalVolumetricWeight.toFixed(2),
            };
          }) || [];
          allItems.push(...transformedItems);
        });
        
        setAllOrdersData(allItems);
      } catch (error) {
        console.error('Error fetching shipping docket data:', error);
        setDocketData(null);
        setAllOrdersData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocketData();
  }, [docketId]);

  const ordersColumns = [
    { 
      key: 'poNumber', 
      label: 'PO Number', 
      width: '190px',
      sortable: true 
    },
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
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Handler for opening the add invoice modal for a specific order
  const handleAddInvoice = (orderId: string) => {
    openModal('add-invoice', {
      labelId: orderId,
      onInvoiceAdded: (invoiceNumber: string) => {
        // Refresh the data after invoice is added
        const loadDocketData = async () => {
          if (!docketId) return;
          
          try {
            setIsLoading(true);
            const response = await getDocketShippingManifests(docketId);
            // console.log('Refreshed shipping docket data after invoice addition:', response);
            
            setDocketData(response);
            
            // Transform items data for all orders into a single array
            const allItems: any[] = [];
            response.orders.forEach((order: ShippingOrder) => {
              const transformedItems = order.items?.map((item: any, index: number) => {
                // Calculate volumetric weight: (L × W × H) / 4500
                const volumetricWeight = item.dimensions 
                  ? (item.dimensions.length * item.dimensions.breadth * item.dimensions.height) / 4500
                  : 0;
                
                const totalVolumetricWeight = volumetricWeight * (item.cartons || 1);
                
                return {
                  id: `${order._id}-item-${index}`,
                  poNumber: order.poNumber || 'N/A',
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
              allItems.push(...transformedItems);
            });
            
            setAllOrdersData(allItems);
          } catch (error) {
            console.error('Error refreshing shipping docket data:', error);
          } finally {
            setIsLoading(false);
          }
        };
        
        loadDocketData();
      }
    });
  };

  // Get combined manifest ID (should be same for all orders in docket)
  const getCombinedManifestId = () => {
    if (!docketData || docketData.orders.length === 0) return 'N/A';
    return docketData.orders[0].docketId || 'N/A';
  };

  // Get combined AWB number (should be same for all orders in docket)
  const getCombinedAwbNumber = () => {
    if (!docketData || docketData.orders.length === 0) return 'N/A';
    return docketData.orders[0].awbNumber || 'N/A';
  };

  // Get combined dispatch date (should be same for all orders in docket)
  const getCombinedDispatchDate = () => {
    if (!docketData || docketData.orders.length === 0) return 'N/A';
    return docketData.orders[0].dispatchDate || 'N/A';
  };

  // Get combined courier (should be same for all orders in docket)
  const getCombinedCourier = () => {
    if (!docketData || docketData.orders.length === 0) return 'N/A';
    return docketData.orders[0].courier || 'N/A';
  };

  // Get combined buyer (should be same for all orders in docket)
  const getCombinedBuyer = () => {
    if (!docketData || docketData.orders.length === 0) return 'N/A';
    return docketData.orders[0].source || 'N/A';
  };

  // Get combined delivery address (should be same for all orders in docket)
  const getCombinedDeliveryAddress = () => {
    if (!docketData || docketData.orders.length === 0) return 'N/A';
    return docketData.orders[0].deliveredTo || 'N/A';
  };

  // Calculate total cartons from all items
  const getTotalCartons = () => {
    return allOrdersData.reduce((sum, item) => sum + (item.cartons || 0), 0);
  };

  // Printable component for docket shipping manifest
  const PrintableComponent = React.forwardRef<HTMLDivElement>((props, ref) => (
    <div ref={ref} className="p-8 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Docket Shipping Manifest</h1>
        <div className="text-lg text-gray-600">Docket ID: {docketId}</div>
        <div className="text-md text-gray-500">Manifest ID: {getCombinedManifestId()}</div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Docket Summary</h3>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <div><strong>AWB Number:</strong> {getCombinedAwbNumber()}</div>
            <div><strong>Dispatch Date:</strong> {formatDate(getCombinedDispatchDate())}</div>
            <div><strong>Courier:</strong> {getCombinedCourier()}</div>
            <div><strong>Total Cartons:</strong> {getTotalCartons()}</div>
          </div>
          <div className="space-y-3">
            <div><strong>Buyer:</strong> {capitalizeFirstLetter(getCombinedBuyer())}</div>
            <div><strong>Shipping Address:</strong> {getCombinedDeliveryAddress()}</div>
            <div><strong>Number of Orders:</strong> {docketData?.orders.length || 0}</div>
            <div><strong>Total Weight:</strong> {allOrdersData.reduce((sum, item) => sum + (parseFloat(item.totalWeight) || 0), 0).toFixed(2)} kg</div>
          </div>
        </div>
      </div>

      {/* Individual Order Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Details</h3>
        {docketData?.orders.map((order, index) => (
          <div key={order._id} className="mb-4 p-4 border border-gray-200 rounded">
            <h4 className="font-medium mb-2">Order {index + 1}: {order.poNumber}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Invoice Number:</strong> {order.invoiceNumber || 'N/A'}</div>
              <div><strong>Source:</strong> {capitalizeFirstLetter(order.source)}</div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Combined Items</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left">PO Number</th>
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
            {allOrdersData.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">{item.poNumber}</td>
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
              <td className="border border-gray-300 px-4 py-2" colSpan={6}><strong>Total</strong></td>
              <td className="border border-gray-300 px-4 py-2">
                <strong>{allOrdersData.reduce((sum, item) => sum + (item.cartons || 0), 0)}</strong>
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <strong>{allOrdersData.reduce((sum, item) => sum + (parseFloat(item.totalWeight) || 0), 0).toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ));

  PrintableComponent.displayName = 'PrintableComponent';

  // Setup react-to-print hook
  const handlePrintClick = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `DocketShippingManifest-${docketId}`,
  });

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
          <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
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
                <div className='text-xl font-medium text-[#191A1B]'>
                  Docket: {getCombinedManifestId()}
                </div>
              </div>
            </div>
            <div className='flex gap-3'>
              <button 
                onClick={handlePrintClick} 
                className='w-fit flex gap-1 text-sm text-[#545659] cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs'
              >
                Pdf
                <DownloadSimpleIcon size={16} color='#545659' />
              </button>
              <button 
                onClick={handlePrintClick} 
                className='w-fit flex gap-1 text-sm text-[#545659] cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs'
              >
                Print
                <PrinterIcon size={16} color='#545659' />
              </button>
            </div>
          </div>

          {/* Render each order's metadata separately */}
          {docketData?.orders.map((order, orderIndex) => (
            <div key={order._id} className='mb-6'>
              <div className='flex flex-col gap-3'>
                <div className='text-[#545659] text-base font-medium'>
                  Manifest Details - Order {orderIndex + 1} (PO: {order.poNumber})
                </div>
                <div className='w-full rounded-lg border border-[#EAEAEA] p-6 shadow-sm flex justify-between'>
                  <div className='flex flex-col gap-4 w-[48%]'>
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>PO Number</div>
                      <div className='flex items-center gap-1.5 text-[#90919B] text-sm cursor-pointer'>
                        {order.poNumber || 'N/A'}
                        <CopyIcon size={16} className="cursor-pointer hover:text-gray-600" onClick={() => handleCopy(order.poNumber || 'N/A')} />
                      </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>Dispatch Date</div>
                      <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                        {formatDate(order.dispatchDate || '')}
                      </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>Buyer</div>
                      <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                        {capitalizeFirstLetter(order.source || 'N/A')}
                      </div>
                    </div>
                     <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>Warehouse Code</div>
                      <div className='flex items-center gap-1.5 text-[#90919B] text-sm w-[40%] justify-end'>
                        {order.warehouseCode || 'N/A'}
                      </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>Shipping Address</div>
                      <div className='flex items-center gap-1.5 text-[#90919B] text-sm w-[40%] justify-end'>
                        {order.deliveredTo || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col gap-4 w-[48%]'>
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>Manifest ID</div>
                      <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                        {order.manifestId || 'N/A'}
                      </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>AWB Number</div>
                      <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                        {order.awbNumber || 'N/A'}
                      </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>Courier</div>
                      <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                        {order.courier || 'N/A'}
                      </div>
                    </div>
                    <div className='flex gap-2 items-center justify-between'>
                      <div className='text-[#191A1B] text-base font-medium'>Invoice Number</div>
                      {order.invoiceNumber ? (
                        <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                          {order.invoiceNumber}
                        </div>
                      ) : (
                        <button 
                          className='flex items-center gap-1.5 text-[#90919B] text-sm border px-4 py-2 rounded-lg border-[#EAEAEA] cursor-pointer'
                          onClick={() => handleAddInvoice(order._id)}
                        >
                          Add Invoice number
                          <PlusIcon size={16} color='#545659' />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Summary Section */}
          {/* <div className='mb-6'>
            <div className='flex flex-col gap-3'>
              <div className='text-[#545659] text-base font-medium'>Docket Summary</div>
              <div className='w-full rounded-lg border border-[#EAEAEA] p-6 shadow-sm bg-blue-50'>
                <div className='flex justify-between items-center'>
                  <div className='text-[#191A1B] text-base font-medium'>Total Cartons in Docket</div>
                  <div className='text-[#191A1B] text-lg font-bold'>
                    {getTotalCartons()}
                  </div>
                </div>
              </div>
            </div>
          </div> */}
          
          {/* Single Data Table for All Orders */}
          <div className='pt-4'>
            <div className='text-[#545659] text-base font-medium mb-4'>Combined Items</div>
            <EnhancedDataTable
              data={allOrdersData}
              columns={ordersColumns}
              enablePagination={false}
              maxVisibleRows={10}
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
  );
};

export default page;
