"use client"
import React, { useState, useEffect, useRef } from 'react'
import SearchBox from './SearchBox'
import Button from './Button'
import { useModal } from '@/contexts/ModalContext'
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr'
import OrderDataTable from './OrderDataTable'
import { useRouter } from 'next/navigation'
import { getAllBuyers,  getAllOrdersbyQuery, Orders as OrderType, searchOrders, updateOrder, approveOrder } from '@/lib/api/orders'
import { sendOrderStatusNotification } from '@/lib/notifications'
import DateButton from './DateButton'

// Action types for button clicks
type ActionType = 'approve' | 'hold' | 'release';

// Table row interface
interface TableRow {
  id: string;
  status: string;
  isActionLoading?: boolean;
  [key: string]: any;
}

// Skeleton component for loading state
const OrdersSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Search and Filter Skeleton */}
      <div className='mb-4 flex justify-between items-center'>
        <div className='h-10 bg-gray-200 rounded-lg w-80'></div>
        <div className='flex gap-2'>
          <div className='h-10 bg-gray-200 rounded-lg w-24'></div>
          <div className='h-10 bg-gray-200 rounded-lg w-24'></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className='border border-gray-200 rounded-lg overflow-hidden'>
        {/* Table Header */}
        <div className='bg-gray-50 p-4 border-b border-gray-200'>
          <div className='grid grid-cols-11 gap-4'>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
            <div className='h-4 bg-gray-200 rounded'></div>
          </div>
        </div>

        {/* Table Rows */}
        {[...Array(8)].map((_, index) => (
          <div key={`skeleton-row-${index}`} className='p-4 border-b border-gray-100 last:border-b-0'>
            <div className='grid grid-cols-11 gap-4 items-center'>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-6 bg-gray-200 rounded w-16'></div>
              <div className='h-6 bg-gray-200 rounded-full w-20'></div>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-4 bg-gray-200 rounded'></div>
              <div className='h-6 bg-gray-200 rounded w-16'></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Orders = () => {
  const { openModal } = useModal();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isBuyerDropdownOpen, setIsBuyerDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which button is loading
  const buyerDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [buyerOptions, setBuyerOptions] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<OrderType[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10); // or make this dynamic
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await getAllBuyers();
        setBuyerOptions(response.buyers || []);
      } catch (err) {
        console.error('Error fetching buyer options:', err);
      }
    };
    fetchBuyers();
  }, []);

  const statusKeys = [
    'new-order',
    'approved',
    'error',
    'on-hold',
    'completed',
    'expired'
  ];

  const statusLabels: Record<string, string> = {
    'new-order': 'New Order',
    'approved': 'Approved',
    'error': 'Error',
    'on-hold': 'On Hold',
    'completed': 'Completed',
    'expired': 'Expired'
  };

  // Mapping for status transitions
  const getNewStatus = (currentStatus: string, actionType: ActionType): string => {
    const normalizedStatus = currentStatus.toLowerCase().replace(/\s+/g, '-');
    
    switch (actionType) {
      case 'approve':
        return 'approved';
      case 'hold':
        return 'on-hold';
      case 'release':
        return 'approved'; // Released orders go back to approved
      default:
        return normalizedStatus;
    }
  };

  const handleBuyerToggle = (buyer: string) => {
    setSelectedBuyers(prev =>
      prev.includes(buyer)
        ? prev.filter(b => b !== buyer)
        : [...prev, buyer]
    );
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handleClearBuyers = () => {
    setSelectedBuyers([]);
    setCurrentPage(1); // Reset to page 1
  };

  const handleClearStatuses = () => {
    setSelectedStatuses([]);
    setCurrentPage(1); // Reset to page 1
  };

  const handleDateRangeSelect = (startDate: Date | null, endDate: Date | null) => {
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const getBuyerDisplayText = () => {
    if (selectedBuyers.length === 0) return 'Buyer';
    if (selectedBuyers.length === 1) return capitalizeFirstLetter(selectedBuyers[0]);
    return `${selectedBuyers.length} buyers selected`;
  };

  const getStatusDisplayText = () => {
    if (selectedStatuses.length === 0) return 'Status';
    if (selectedStatuses.length === 1) return selectedStatuses[0];
    return `${selectedStatuses.length} statuses selected`;
  };


  const handleActionClick = async (rowId: string, actionType: ActionType, rowData: any) => {
  // Prevent multiple simultaneous requests
  if (actionLoading === rowId) {
    // console.log('Action already in progress for row:', rowId);
    return;
  }
  
  
  try {
    setActionLoading(rowId);
    
    const currentStatusLabel = rowData.status;
    const currentStatusKey = Object.keys(statusLabels).find(
      key => statusLabels[key] === currentStatusLabel
    ) || currentStatusLabel.toLowerCase().replace(/\s+/g, '-');
    
    const newStatus = getNewStatus(currentStatusKey, actionType);
    
    // console.log(`Updating status from ${currentStatusKey} to ${newStatus}`);
    
    let response;
    
    // Main order update
    if (actionType === 'approve') {
      response = await approveOrder(rowId);
    } else {
      const updateData: any = { status: newStatus };
      
      // Handle picklistStatus based on action type
      if (actionType === 'hold') {
        // When putting on hold, clear the picklistStatus
        updateData.picklistStatus = '';
      } else if (actionType === 'release' || newStatus === 'approved') {
        // When releasing or approving, set picklistStatus to approved
        updateData.picklistStatus = 'approved';
        updateData.courier = '';
      }
      
      response = await updateOrder(rowId, updateData);
    }
    
    // console.log('Order updated successfully:', response);
    
    // Update local state immediately after successful API call
    const updateOrdersList = (ordersList: OrderType[]) => 
      ordersList.map(order => {
        if (order._id === rowId) {
          const updatedOrder: any = { ...order, status: newStatus };
          
          // Update picklistStatus based on action type
          if (actionType === 'hold') {
            updatedOrder.picklistStatus = '';
          } else if (actionType === 'release' || newStatus === 'approved') {
            updatedOrder.picklistStatus = 'approved';
          }
          
          return updatedOrder;
        }
        return order;
      });
    
    setOrders(prevOrders => updateOrdersList(prevOrders));
    if (isSearchActive) {
      setSearchResults(prevResults => updateOrdersList(prevResults));
    }
    
    // Handle notifications separately - don't let them fail the main operation
    try {
      if (actionType === 'approve' && newStatus === 'approved') {
        await sendOrderStatusNotification(rowData.poNumber, rowId, 'approve', newStatus);
      } else if (actionType === 'hold' && newStatus === 'on-hold') {
        await sendOrderStatusNotification(rowData.poNumber, rowId, 'hold', newStatus);
      } else if (actionType === 'release' && newStatus === 'approved') {
        await sendOrderStatusNotification(rowData.poNumber, rowId, 'release', newStatus);
      }
    } catch (notificationError) {
      console.warn('Notification failed but order was updated successfully:', notificationError);
      // Don't set error state since the main operation succeeded
    }
    
  } catch (err) {
    console.error('Error updating order status:', err);
    setError('Failed to update order status. Please try again.');
    
    setTimeout(() => {
      setError(null);
    }, 5000);
    
  } finally {
    setActionLoading(null);
  }
};

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buyerDropdownRef.current && !buyerDropdownRef.current.contains(event.target as Node)) {
        setIsBuyerDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchPaginatedOrders = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.set('page', currentPage.toString());
        query.set('limit', pageLimit.toString());

        if (selectedBuyers.length > 0) query.set('buyers', selectedBuyers.join(','));
        if (selectedStatuses.length > 0) query.set('statuses', selectedStatuses.join(','));
        
        // Add date range parameters if selected
        if (selectedStartDate) {
          const startDateStr = selectedStartDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          query.set('startDate', startDateStr);
        }
        if (selectedEndDate) {
          const endDateStr = selectedEndDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          query.set('endDate', endDateStr);
        }

        const response = await getAllOrdersbyQuery(`?${query.toString()}`);
        setOrders(response.orders || []);
        setTotalPages(response.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error('Error fetching paginated orders:', err);
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (!isSearchActive) {
      fetchPaginatedOrders();
    }
  }, [selectedBuyers, selectedStatuses, currentPage, isSearchActive, selectedStartDate, selectedEndDate]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleUploadPOClick = () => {
    openModal('upload-po', { onUploadSuccess: refreshOrders });
  };

  // Function to refresh orders after upload
  const refreshOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If search is active, maintain search results
      if (isSearchActive && searchText.trim()) {
        const results = await searchOrders(searchText.trim());
        setSearchResults(results.orders || results || []);
      } else {
        // Use paginated fetch with current filters
        const query = new URLSearchParams();
        query.set('page', currentPage.toString());
        query.set('limit', pageLimit.toString());
        
        if (selectedBuyers.length > 0) {
          query.set('buyers', selectedBuyers.join(','));
        }
        
        if (selectedStatuses.length > 0) {
          query.set('statuses', selectedStatuses.join(','));
        }
        
        // Add date range parameters if selected
        if (selectedStartDate) {
          const startDateStr = selectedStartDate.toISOString().split('T')[0];
          query.set('startDate', startDateStr);
        }
        if (selectedEndDate) {
          const endDateStr = selectedEndDate.toISOString().split('T')[0];
          query.set('endDate', endDateStr);
        }
        
        const response = await getAllOrdersbyQuery(`?${query.toString()}`);
        setOrders(response.orders || []);
        setTotalPages(response.totalPages || 1);
      }
      
      // console.log('Orders refreshed after PO upload');
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setError('Failed to refresh orders');
    } finally {
      setLoading(false);
    }
  };

  // Function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Function to format date from ISO string to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if formatting fails
    }
  };

  const tableData = (isSearchActive ? searchResults : orders).map((order: any, index: number) => ({
    id: order._id || `order-${index}`, // Ensure unique ID with fallback
    poDate: formatDate(order.poDate) || '',
    poNumber: order.poNumber || order.po_number || '',
    buyer: capitalizeFirstLetter(order.source || ''),
    warehouseCode: order.warehouse || '-',
    location: order.location || '-',
    items: `${order.noOfItems || 0} SKUs`,
    status: statusLabels[order.status] || order.status || '', // Use readable status labels
    poExpiryDate: formatDate(order.poExpiryDate) || '',
    totalQuantity: order.totalQuantity || 0,
    value: order.totalValue || 0,
    file: order.s3_url || '',
    fileAvailable: !!order.s3_url,
    // Add loading state to row data
    isActionLoading: actionLoading === order._id,
  }));

  // Handle file download
  const handleFileDownload = (fileUrl: string, fileName?: string) => {
    if (!fileUrl) return;

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'order-file.pdf'; // Default filename
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Table columns configuration
  const columns = [
    { key: 'poDate', label: 'PO Date', width: '120px', sortable: true },
    { key: 'poNumber', label: 'PO Number', width: '144px' },
    { key: 'buyer', label: 'Buyer', width: '152px' },
    { key: 'warehouseCode', label: 'Warehouse Code', width: '172px' },
    { key: 'location', label: 'Location', width: '200px' },
    { key: 'items', label: 'Items', width: '88px' },
    { key: 'status', label: 'Status', width: '138px' },
    { key: 'poExpiryDate', label: 'PO Expiry Date', width: '152px' },
    { key: 'totalQuantity', label: 'Total quantity', width: '130px' },
    { key: 'value', label: 'Value ₹', width: '108px', sortable: true },
    {
      key: 'file',
      label: 'File',
      width: '80px',
      isFileColumn: true, // Add flag to identify file column
      onFileClick: handleFileDownload // Pass download handler
    },
  ];


  // Handle row click (if clickable rows are enabled)
  const handleRowClick = (rowId: string, rowData: any) => {

    
    // Navigate using Order ID
    if (rowId) {
      router.push(`/orders/${rowId}`);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    
    // If search is cleared, exit search mode and reload all orders
    if (!value.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
      setCurrentPage(1); // Reset to page 1
      
      // The useEffect will automatically fetch paginated orders
      // No need to manually fetch here as useEffect will trigger
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true); // Show skeleton during search
      setIsSearchActive(true);
      const results = await searchOrders(searchText.trim());
      setSearchResults(results.orders || results || []); // Handle different response formats
      // console.log('Search results:', results);
      setError(null);
    } catch (err) {
      console.error('Error searching orders:', err);
      setError('Failed to search orders');
      setSearchResults([]); // Clear results on error
    } finally {
      setLoading(false); // Hide skeleton after search completes
    }
  };

  return (
    <div className='w-full bg-white p-5 min-h-screen'>
      <div className='flex justify-between mb-4'>
        <div className='flex items-center gap-4'>
          <div className='text-xl font-medium text-[#191A1B]'>Orders</div>
        </div>
        
        <div className='flex gap-3'>
          <Button text='Upload PO' white={false} error={false} onClick={handleUploadPOClick} />
        </div>
      </div>

      {/* Show skeleton or actual content based on loading state */}
      {loading ? (
        <OrdersSkeleton />
      ) : (
        <>



          <div className='mb-4 flex justify-between items-center'>
            <SearchBox 
              searchText={searchText}
              onSearchChange={handleSearchChange}
              onSearch={handleSearch}
              placeholder="Search orders..."
            />
            <div className='flex gap-2'>
                      <DateButton
                        onDateRangeSelect={handleDateRangeSelect}
                        selectedStartDate={selectedStartDate}
                        selectedEndDate={selectedEndDate}
                      />
              <div className='relative' ref={buyerDropdownRef}>
                <button
                  className='w-fit text-sm text-[#545659] flex gap-1 cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs bg-white'
                  onClick={() => setIsBuyerDropdownOpen(!isBuyerDropdownOpen)}
                >
                  {getBuyerDisplayText()}
                  <CaretDownIcon
                    size={16}
                    color='#545659'
                    className={`transition-transform ${isBuyerDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isBuyerDropdownOpen && (
                  <div className='absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-[1000] min-w-[200px] max-h-[300px] overflow-y-auto'>
                    {buyerOptions.map((buyer, index) => (
                      <div
                        key={`buyer-${index}-${buyer}`}
                        className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${index === 0 ? 'rounded-t-lg' : ''
                          }`}
                        onClick={() => handleBuyerToggle(buyer)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBuyers.includes(buyer)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleBuyerToggle(buyer);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-[#191A1B] focus:ring-[#191A1B]"
                        />
                        <span className='text-[#191A1B] text-sm'>
                          {capitalizeFirstLetter(buyer)}
                        </span>
                      </div>
                    ))}

                    {selectedBuyers.length > 0 && (
                      <>
                        <div className='border-t border-[#F5F5F5] mx-3'></div>
                        <div
                          onClick={handleClearBuyers}
                          className='p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer text-[#F04438] rounded-b-lg font-medium'
                        >
                          Clear all
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className='relative' ref={statusDropdownRef}>
                <button
                  className='w-fit text-sm text-[#545659] flex gap-1 cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs bg-white'
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                >
                  {getStatusDisplayText()}
                  <CaretDownIcon
                    size={16}
                    color='#545659'
                    className={`transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isStatusDropdownOpen && (
                  <div className='absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-[1000] min-w-[200px] max-h-[300px] overflow-y-auto'>
                   {statusKeys.map((status, index) => (
                    <div
                      key={`status-${index}-${status}`}
                      className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${index === 0 ? 'rounded-t-lg' : ''}`}
                      onClick={() => handleStatusToggle(status)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(status);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-[#191A1B] focus:ring-[#191A1B]"
                      />
                      <span className='text-[#191A1B] text-sm'>
                        {statusLabels[status]}
                      </span>
                    </div>
                  ))}
                    {selectedStatuses.length > 0 && (
                      <>
                        <div className='border-t border-[#F5F5F5] mx-3'></div>
                        <div
                          onClick={handleClearStatuses}
                          className='p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer text-[#F04438] rounded-b-lg font-medium'
                        >
                          Clear all
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Error State */}
          {error && (
            <div className='flex justify-center items-center py-8'>
              <div className='text-red-600'>Error: {error}</div>
            </div>
          )}

          {/* Orders Table */}
          {!error && tableData.length !== 0 && (
            <>
              <OrderDataTable
                data={tableData}
                columns={columns}
                clickableRows={true}
                enableSorting={true}
                onRowClick={handleRowClick}
                onActionClick={handleActionClick}
                className="mb-8"
                action={true}
                // Server-side pagination props
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                disableClientPagination={true}
              />
            </>
          )}

          {/* No Data State - Only show when not loading and no data */}
          {!error && !loading && tableData.length === 0 && (
            <div className='flex flex-col justify-center items-center py-12'>
              <div className='text-[#545659] text-lg mb-2'>No orders found</div>
              <div className='text-[#90919B] text-sm'>
                {isSearchActive 
                  ? 'Try adjusting your search terms or clear the search to see all orders'
                  : 'Start by uploading a PO to create your first order'
                }
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Orders