"use client"
import React, { useState, useEffect, useRef } from 'react'
import SearchBox from './SearchBox'
import DataTable from './DataTable'
import { useRouter } from 'next/navigation'
import { getAllShippingByQuery, searchShipping } from '@/lib/api/shipping'
import {  DownloadSimpleIcon, EyeIcon, PrinterIcon, CaretDownIcon } from '@phosphor-icons/react/dist/ssr'

const ShippingManifest = () => {
  const router = useRouter();
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dropdown states
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  const [isCourierDropdownOpen, setIsCourierDropdownOpen] = useState(false);
  const [isBuyerDropdownOpen, setIsBuyerDropdownOpen] = useState(false);
  
  // Options arrays
  const [courierOptions, setCourierOptions] = useState<string[]>([]);
  const [buyerOptions, setBuyerOptions] = useState<string[]>([]);
  
  // Refs for dropdown outside click detection
  const courierDropdownRef = useRef<HTMLDivElement>(null);
  const buyerDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch dropdown data on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch couriers

        // Fetch buyers
        // const buyersResponse = await getBuyers();
        // const buyersList = (buyersResponse as any)?.buyers || [];
        const buyersList = ['blinkit', 'swiggy', 'more'];
        setBuyerOptions(buyersList);
        // console.log('Fetched buyers:', buyersList);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        setCourierOptions([]);
        setBuyerOptions([]);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch data on component mount with pagination
  useEffect(() => {
    const fetchPaginatedShippingManifests = async () => {
      try {
        setIsLoading(true);
        const query = new URLSearchParams();
        query.set('page', currentPage.toString());
        query.set('limit', pageLimit.toString());

        if (selectedCouriers.length > 0) query.set('couriers', selectedCouriers.join(','));
        if (selectedBuyers.length > 0) query.set('buyers', selectedBuyers.join(','));

        const response = await getAllShippingByQuery(`?${query.toString()}`);
        // console.log('Fetched shipping manifest data:', response);
        
        // Transform API data to match table structure
        const transformedData = response.orders?.map((order: any) => ({
          id: order._id,
          manifestId: order.manifestId || 'N/A',
          poNumber: order.po_number || 'N/A',
          date: formatDate(order.poDate) || 'N/A',
          awbNumber: order.awbNumber || 'N/A',
          invoice: order.invoiceNumber || 'N/A',
          courier: order.courier || 'N/A',
          buyer: capitalizeFirstLetter(order.source || ''),
          location: order.location || 'N/A',
          warehouse: order.warehouseCode || '-',
          cartons: order.noOfCartons?.toString() || '0',
          docketId: order.docketId, // Add docketId to transformed data
          // Store original data for reference
          _originalData: order
        })) || [];
        
        // Group orders by docketId similar to LabelMaker
        const groupedData = groupOrdersByDocket(transformedData);
        
        setTableData(groupedData);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error('Error fetching shipping manifests:', error);
        setTableData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSearchActive) {
      fetchPaginatedShippingManifests();
    }
  }, [selectedCouriers, selectedBuyers, currentPage, isSearchActive]);

  // Function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Function to format date to "June 17, 2025" format
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Group orders by docketId similar to LabelMaker
  const groupOrdersByDocket = (orders: any[]) => {
    const grouped: Record<string, any[]> = {};
    const ungrouped: any[] = [];

    orders.forEach(order => {
      if (order.docketId) {
        if (!grouped[order.docketId]) {
          grouped[order.docketId] = [];
        }
        grouped[order.docketId].push(order);
      } else {
        ungrouped.push(order);
      }
    });

    // Convert grouped orders into single rows
    const groupedRows = Object.entries(grouped).map(([docketId, docketOrders]) => {
      const firstOrder = docketOrders[0];
      // Get manifest ID (should be same for all orders in docket)
      const manifestIds = docketOrders.map(order => order.manifestId).filter(Boolean);
      const manifestId = manifestIds.length > 0 ? manifestIds[0] : 'N/A';
      // Sum up cartons
      const totalCartons = docketOrders.reduce((sum, order) => {
        const cartons = parseInt(order.cartons) || 0;
        return sum + cartons;
      }, 0);
      // Get AWB number (should be same for all orders in docket)
      const awbNumbers = docketOrders.map(order => order.awbNumber).filter(Boolean);
      const awbNumber = awbNumbers.length > 0 ? awbNumbers[0] : 'N/A';
      // Combine all poNumbers for the docket, comma-separated
      const poNumbers = docketOrders.map(order => order.poNumber).filter(Boolean).join(',');
      return {
        id: `docket-${docketId}`,
        manifestId: manifestId,
        poNumber: poNumbers,
        date: firstOrder.date,
        awbNumber: awbNumber,
        courier: firstOrder.courier,
        buyer: firstOrder.buyer,
        location: firstOrder.location,
        invoice: firstOrder.invoiceNumber,
        warehouse: firstOrder.warehouseCode,
        cartons: totalCartons.toString(),
        docketId: docketId,
        isDocket: true,
        docketOrders: docketOrders,
        _originalData: docketOrders.map(order => order._originalData)
      };
    });

    return [...groupedRows, ...ungrouped];
  };

  // Dropdown toggle functions
  const handleCourierToggle = (courier: string) => {
    setSelectedCouriers(prev => 
      prev.includes(courier)
        ? prev.filter(c => c !== courier)
        : [...prev, courier]
    );
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handleBuyerToggle = (buyer: string) => {
    setSelectedBuyers(prev => 
      prev.includes(buyer)
        ? prev.filter(b => b !== buyer)
        : [...prev, buyer]
    );
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  // Clear functions
  const handleClearCouriers = () => {
    setSelectedCouriers([]);
    setCurrentPage(1); // Reset to page 1
  };

  const handleClearBuyers = () => {
    setSelectedBuyers([]);
    setCurrentPage(1); // Reset to page 1
  };

  // Display text functions
  const getCourierDisplayText = () => {
    if (selectedCouriers.length === 0) return 'Courier';
    if (selectedCouriers.length === 1) return selectedCouriers[0];
    return `${selectedCouriers.length} couriers selected`;
  };

  const getBuyerDisplayText = () => {
    if (selectedBuyers.length === 0) return 'Buyer';
    if (selectedBuyers.length === 1) return capitalizeFirstLetter(selectedBuyers[0]);
    return `${selectedBuyers.length} buyers selected`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courierDropdownRef.current && !courierDropdownRef.current.contains(event.target as Node)) {
        setIsCourierDropdownOpen(false);
      }
      if (buyerDropdownRef.current && !buyerDropdownRef.current.contains(event.target as Node)) {
        setIsBuyerDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Pagination function
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


  const columns = [
    { key: 'manifestId', label: 'Manifest ID', width: '130px', type: 'text' as const, sortable: true },
    { key: 'poNumber', label: 'PO Number', width: '150px', type: 'text' as const, sortable: true },
    { key: 'date', label: 'Date', width: '150px', type: 'text' as const, sortable: true },
    { key: 'awbNumber', label: 'AWB Number', width: '150px', type: 'text' as const, sortable: true },
    { key: 'invoice', label: 'Invoice Number', width: '170px', type: 'text' as const, },
    { key: 'courier', label: 'Courier', width: '150px', type: 'text' as const, sortable: true },
    { key: 'buyer', label: 'Buyer', width: '150px', type: 'text' as const, sortable: true },
    { key: 'location', label: 'Location', width: '200px', type: 'text' as const },
    { key: 'warehouse', label: 'Warehouse Code', width: '200px', type: 'text' as const },
    { key: 'cartons', label: 'Cartons', width: '120px', type: 'text' as const, sortable: true },
  ];



  const handleRowSelect = (selectedIds: string[]) => {
    // console.log('Selected rows:', selectedIds);
    // Add your row selection logic here
  };

  const handleDropdownChange = (rowId: string, columnKey: string, value: string) => {
    // console.log('Dropdown changed:', { rowId, columnKey, value });
    
    // Update the table data with the new dropdown value
    setTableData(prevData => 
      prevData.map(row => 
        row.id === rowId 
          ? { ...row, [columnKey]: value }
          : row
      )
    );
  };

  const handleRowClick = (rowId: string, rowData: any) => {
    // console.log('Navigating to shipping manifest:', rowId, rowData);
    
    // Navigate to docket page if it's a docket row
    if (rowData?.isDocket) {
      // console.log('Navigating to docket:', rowData.docketId);
      router.push(`/shipping-manifest/docket/${rowData.docketId}`);
      return;
    }
    
    // Navigate to single manifest page
    router.push(`/shipping-manifest/${rowId}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    
    // If search is cleared, exit search mode and reload all shipping manifests
    if (!value.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
      setCurrentPage(1); // Reset to page 1
      return;
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true); // Show loading during search
      setIsSearchActive(true);
      
      // console.log('Searching for:', searchText.trim());
      const results = await searchShipping(searchText.trim());
      
      // console.log('Raw search results:', results);
      
      // Transform search results for display (same as paginated fetch)
      const transformedResults = results.orders?.map((order: any) => ({
        id: order._id,
        manifestId: order.manifestId || 'N/A',
        poNumber: order.po_number || 'N/A',
        date: formatDate(order.poDate) || 'N/A',
        awbNumber: order.awbNumber || 'N/A',
        invoice: order.invoiceNumber || 'N/A',
        courier: order.courier || 'N/A',
        buyer: capitalizeFirstLetter(order.source || ''),
        location: order.location || 'N/A',
        warehouse: order.warehouseCode || '-',
        cartons: order.noOfCartons?.toString() || '0',
        docketId: order.docketId, // Add docketId to search results
        // Store original data for reference
        _originalData: order
      })) || [];
      
      // console.log('Transformed search results:', transformedResults);
      
      // Group search results by docketId
      const groupedResults = groupOrdersByDocket(transformedResults);
      
      setSearchResults(groupedResults);
      // console.log('Final grouped search results:', groupedResults.length, 'items');
      
    } catch (err) {
      console.error('Error searching shipping manifests:', err);
      setSearchResults([]);
      
      // Show user-friendly error message
      alert('Search failed. Please try again or contact support if the issue persists.');
    } finally {
      setIsLoading(false);
    }
  };

      const actions = [
      {
        id: 'view',
        label: 'View',
        icon: <EyeIcon size={16} />,
        color: '#191A1B',
        onClick: (rowId: string) => {
          // console.log('View row:', rowId);
          // Find the row data from tableData or searchResults
          const currentData = isSearchActive ? searchResults : tableData;
          const rowData = currentData.find(row => row.id === rowId);
          handleRowClick(rowId, rowData);
        }
      },
      {
        id: 'pdf',
        label: 'PDF',
        icon: <DownloadSimpleIcon size={16} />,
        color: '#191A1B',
        onClick: (rowId: string) => {
          // console.log('PDF row:', rowId);
          // Find the row data from tableData or searchResults
          const currentData = isSearchActive ? searchResults : tableData;
          const rowData = currentData.find(row => row.id === rowId);
          handleRowClick(rowId, rowData);
        }
      },
      {
        id: 'print',
        label: 'Print',
        icon: <PrinterIcon size={16} />,
        color: '#191A1B',
        onClick: (rowId: string) => {
          // console.log('Print row:', rowId);
          // Find the row data from tableData or searchResults
          const currentData = isSearchActive ? searchResults : tableData;
          const rowData = currentData.find(row => row.id === rowId);
          handleRowClick(rowId, rowData);
        }
      }
    ];

  return (
             <div className='w-full bg-white p-5 min-h-screen'>
        <div className='flex justify-between mb-4'>
            <div className='text-xl font-medium text-[#191A1B]'>Shipping Manifest</div>
            <div className='flex gap-3'>


            </div>
        </div>
       {
         (
        <div className='mb-4 flex justify-between items-center'>
          <SearchBox
            searchText={searchText}
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
            placeholder="Search by Manifest ID, AWB Number, PO Number, Courier, or Buyer..."
          />

          <div className='flex gap-2'>
            <div className='relative' ref={courierDropdownRef}>
              <button 
                className='w-fit text-sm text-[#545659] flex gap-1 cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs bg-white'
                onClick={() => setIsCourierDropdownOpen(!isCourierDropdownOpen)}
              >
                {getCourierDisplayText()}
                <CaretDownIcon
                  size={16} 
                  color='#545659' 
                  className={`transition-transform ${isCourierDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              {isCourierDropdownOpen && (
                <div className='absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-[1000] min-w-[200px] max-h-[300px] overflow-y-auto'>
                  {courierOptions.map((courier, index) => (
                    <div
                    onClick={() => handleCourierToggle(courier)}
                      key={`courier-${index}-${courier}`}
                      className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${
                        index === 0 ? 'rounded-t-lg' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCouriers.includes(courier)}
                        onChange={(e) => {
                          e.stopPropagation();
                      
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#191A1B] focus:ring-[#191A1B]"
                      />
                      <span 
                        className='text-[#191A1B] text-sm cursor-pointer'
                        
                      >
                        {courier}
                      </span>
                    </div>
                  ))}
                  
                  {selectedCouriers.length > 0 && (
                    <>
                      <div className='border-t border-[#F5F5F5] mx-3'></div>
                      <div
                        onClick={handleClearCouriers}
                        className='p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer text-[#F04438] rounded-b-lg font-medium'
                      >
                        Clear all
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
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
                    onClick={() => handleBuyerToggle(buyer)}
                      key={`buyer-${index}-${buyer}`}
                      className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${
                        index === 0 ? 'rounded-t-lg' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBuyers.includes(buyer)}
                        onChange={(e) => {
                          e.stopPropagation();
                        
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#191A1B] focus:ring-[#191A1B]"
                      />
                      <span 
                        className='text-[#191A1B] text-sm cursor-pointer'
                        
                      >
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
          </div>
        </div>
      )}

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        ) : (isSearchActive ? searchResults : tableData).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-lg">
            <div className="text-lg font-medium text-gray-900 mb-2">
              {isSearchActive ? 'No shipping manifests found' : 'No shipping manifest found'}
            </div>
            <div className="text-sm text-gray-500">
              {isSearchActive 
                ? `No results match your search for "${searchText}". Try searching by Manifest ID, AWB Number, PO Number, Courier, or Buyer name.`
                : 'No manifests available'
              }
            </div>
            {isSearchActive && (
              <button
                onClick={() => {
                  setSearchText('');
                  setIsSearchActive(false);
                  setSearchResults([]);
                }}
                className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear search and show all manifests
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Search results count */}
            {isSearchActive && searchResults.length > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                Found {searchResults.length} shipping manifest{searchResults.length !== 1 ? 's' : ''} 
                {searchText && ` for "${searchText}"`}
                <button
                  onClick={() => {
                    setSearchText('');
                    setIsSearchActive(false);
                    setSearchResults([]);
                  }}
                  className="ml-3 text-blue-600 hover:text-blue-800 underline"
                >
                  Clear search
                </button>
              </div>
            )}
            
            <DataTable
              data={isSearchActive ? searchResults : tableData}
              columns={columns}
              clickableRows={true}
              showCheckbox={false} 
              onRowSelect={handleRowSelect}
              onRowClick={handleRowClick}
              onDropdownChange={handleDropdownChange}
              showActions={false}
              enableSorting={true}
              actions={actions}
              // Server-side pagination props
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disableClientPagination={!isSearchActive} // Enable server-side pagination only when not searching
            />
          </>
        )}

    </div>
  )
}

export default ShippingManifest
