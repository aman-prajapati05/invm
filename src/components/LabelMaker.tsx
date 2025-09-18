// "use client"
// import React, { useState, useEffect, useRef } from 'react'
// import { useRouter } from 'next/navigation'
// import SearchBox from './SearchBox'
// import { CaretDownIcon, CheckCircleIcon, PencilSimpleIcon, XCircleIcon } from '@phosphor-icons/react/dist/ssr'
// import DataTable from './DataTable'
// import {  getAllLabelsByQuery, searchLabels, updateLabel } from '@/lib/api/label'

// const LabelMaker = () => {
//   const router = useRouter();
  
//   // State to manage the table data
//   const [tableData, setTableData] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchText, setSearchText] = useState('');
//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [isSearchActive, setIsSearchActive] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageLimit] = useState(20); // or make this dynamic
//   const [totalPages, setTotalPages] = useState(1);
//   const [error, setError] = useState<string | null>(null);
  
//   // Dropdown states
//   const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
//   const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
//   const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
//   const [selectedManifestStatuses, setSelectedManifestStatuses] = useState<string[]>([]);
//   const [isCourierDropdownOpen, setIsCourierDropdownOpen] = useState(false);
//   const [isBuyerDropdownOpen, setIsBuyerDropdownOpen] = useState(false);
//   const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
//   const [isMainfestStatusDropdownOpen, setIsMainfestStatusDropdownOpen] = useState(false);

//   // Options arrays
//   const [courierOptions, setCourierOptions] = useState<string[]>([]);
//   const [buyerOptions, setBuyerOptions] = useState<string[]>([]);
//   const statusOptions = ['awaiting-invoice', 'ready-to-print', 'printed'];
//   const manifestStatusOptions = ['not-generated', 'generated'];
  
//   // Refs for dropdown outside click detection
//   const courierDropdownRef = useRef<HTMLDivElement>(null);
//   const buyerDropdownRef = useRef<HTMLDivElement>(null);
//   const statusDropdownRef = useRef<HTMLDivElement>(null);
//   const mainfestStatusDropdownRef = useRef<HTMLDivElement>(null);

//   // Fetch data on component mount - separated into two useEffects like Orders
//   useEffect(() => {
//     const fetchDropdownData = async () => {
//       try {
//         // Fetch couriers
//         // console.log('Fetched couriers:', couriersList);

//         // Fetch buyers
//         // const buyersResponse = await getBuyers();
//         // const buyersList = (buyersResponse as any)?.buyers || [];
//         const buyersList =  ['blinkit','swiggy','more'];
//         setBuyerOptions(buyersList);
//         // console.log('Fetched buyers:', buyersList);
//       } catch (error) {
//         console.error('Error fetching dropdown data:', error);
//         setCourierOptions([]);
//         setBuyerOptions([]);
//       }
//     };

//     fetchDropdownData();
//   }, []);

//   // Paginated data fetching with filters like Orders component
//   useEffect(() => {
//     const fetchPaginatedLabels = async () => {
//       try {
//         setIsLoading(true);
//         const query = new URLSearchParams();
//         query.set('page', currentPage.toString());
//         query.set('limit', pageLimit.toString());

//   if (selectedCouriers.length > 0) query.set('courier', selectedCouriers.join(','));
//   if (selectedBuyers.length > 0) query.set('buyers', selectedBuyers.join(','));
//   if (selectedStatuses.length > 0) query.set('labelStatus', selectedStatuses.join(','));
//   if (selectedManifestStatuses.length > 0) query.set('manifestStatus', selectedManifestStatuses.join(','));

//         const response = await getAllLabelsByQuery(`?${query.toString()}`);
        
//         // Transform API data to match table structure
//         const transformedData = response.orders?.map((order: any) => ({
//           id: order._id,
//           orderNumber: order.po_number,
//           buyer: capitalizeFirstLetter(order.source || ''),
//           warehouse: order.warehouseCode || '-',
//           courier: order.noOfItems?.toString() || '0', // Items
//           status: order.totalQuantity?.toString() || '0', // Total Qty
//           items: order.noOfCartons?.toString() || '0', // Total Cartons
//           weight: order.labelStatus || '', // Status
//           destination: order.manifestStatus || '', // Manifest Status
//           courier2: order.courier || null, // Courier dropdown
//           // Store docketId for grouping
//           docketId: order.docketId,
//           // Store original data for reference
//           _originalData: order
//         })) || [];
        
//         // Group orders by docketId if any exist
//         const groupedData = groupOrdersByDocket(transformedData);
        
//         setTableData(groupedData);
//         setTotalPages(response.totalPages || 1);
//         setError(null);
//       } catch (error) {
//         console.error('Error fetching paginated labels:', error);
//         setError('Failed to fetch labels');
//         setTableData([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     if (!isSearchActive) {
//       fetchPaginatedLabels();
//     }
//   }, [selectedCouriers, selectedBuyers, selectedStatuses, selectedManifestStatuses, currentPage, isSearchActive]);

//   // Function to capitalize the first letter of a string
//   const capitalizeFirstLetter = (string: string) => {
//     return string.charAt(0).toUpperCase() + string.slice(1);
//   };

//   // Function to get status priority (lower number = higher priority)
//   const getStatusPriority = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'awaiting-invoice':
//         return 1;
//       case 'ready-to-print':
//         return 2;
//       case 'printed':
//         return 3;
//       default:
//         return 4;
//     }
//   };

//   // Group orders by docketId
//   const groupOrdersByDocket = (orders: any[]) => {
//     const grouped: Record<string, any[]> = {};
//     const ungrouped: any[] = [];

//     orders.forEach(order => {
//       if (order.docketId) {
//         if (!grouped[order.docketId]) {
//           grouped[order.docketId] = [];
//         }
//         grouped[order.docketId].push(order);
//       } else {
//         ungrouped.push(order);
//       }
//     });

//     // Convert grouped orders into single rows
//     const groupedRows = Object.entries(grouped).map(([docketId, docketOrders]) => {
//       const firstOrder = docketOrders[0];
      
//       // Combine PO numbers
//       const poNumbers = docketOrders.map(order => order.orderNumber).filter(Boolean);
//       const combinedPoNumbers = `${poNumbers.join(', ')}`;
      
//       // Sum up numeric values
//       const combinedItems = docketOrders.reduce((sum, order) => {
//         return sum + (parseInt(order.courier) || 0);
//       }, 0);
      
//       const combinedTotalQty = docketOrders.reduce((sum, order) => {
//         return sum + (parseInt(order.status) || 0);
//       }, 0);
      
//       const combinedCartons = docketOrders.reduce((sum, order) => {
//         return sum + (parseInt(order.items) || 0);
//       }, 0);
      
//       // Get the highest priority status (lowest priority number)
//       const statuses = docketOrders.map(order => order.weight).filter(Boolean);
//       const priorityStatus = statuses.reduce((highest, current) => {
//         return getStatusPriority(current) < getStatusPriority(highest) ? current : highest;
//       }, statuses[0] || '');
      
//       // Get the highest priority manifest status
//       const manifestStatuses = docketOrders.map(order => order.destination).filter(Boolean);
//       const priorityManifestStatus = manifestStatuses.reduce((highest, current) => {
//         return getStatusPriority(current) < getStatusPriority(highest) ? current : highest;
//       }, manifestStatuses[0] || '');
      
//       // Combine order IDs for operations
//       const combinedOrderIds = docketOrders.map(order => order.id);

//       return {
//         id: `docket-${docketId}`,
//         orderNumber: combinedPoNumbers,
//         buyer: firstOrder.buyer,
//         warehouse: firstOrder.warehouse,
//         courier: combinedItems.toString(),
//         status: combinedTotalQty.toString(),
//         items: combinedCartons.toString(),
//         weight: priorityStatus,
//         destination: priorityManifestStatus,
//         courier2: firstOrder.courier2,
//         docketId: docketId,
//         isDocket: true, // Flag to identify docket rows
//         docketOrders: docketOrders, // Store original orders for reference
//         _originalData: docketOrders.map(order => order._originalData)
//       };
//     });

//     return [...groupedRows, ...ungrouped];
//   };

//   // Dropdown toggle functions
//   const handleCourierToggle = (courier: string) => {
//     setSelectedCouriers(prev => 
//       prev.includes(courier)
//         ? prev.filter(c => c !== courier)
//         : [...prev, courier]
//     );
//     setCurrentPage(1); // Reset to page 1 when filter changes
//   };

//   const handleBuyerToggle = (buyer: string) => {
//     setSelectedBuyers(prev => 
//       prev.includes(buyer)
//         ? prev.filter(b => b !== buyer)
//         : [...prev, buyer]
//     );
//     setCurrentPage(1); // Reset to page 1 when filter changes
//   };

//   const handleStatusToggle = (status: string) => {
//     setSelectedStatuses(prev => 
//       prev.includes(status)
//         ? prev.filter(s => s !== status)
//         : [...prev, status]
//     );
//     setCurrentPage(1); // Reset to page 1 when filter changes
//   };

//   const handleManifestStatusToggle = (status: string) => {
//     setSelectedManifestStatuses(prev => 
//       prev.includes(status)
//         ? prev.filter(s => s !== status)
//         : [...prev, status]
//     );
//     setCurrentPage(1); // Reset to page 1 when filter changes
//   };

//   // Clear functions
//   const handleClearCouriers = () => {
//     setSelectedCouriers([]);
//     setCurrentPage(1); // Reset to page 1
//   };

//   const handleClearBuyers = () => {
//     setSelectedBuyers([]);
//     setCurrentPage(1); // Reset to page 1
//   };

//   const handleClearStatuses = () => {
//     setSelectedStatuses([]);
//     setCurrentPage(1); // Reset to page 1
//   };

//   const handleClearManifestStatuses = () => {
//     setSelectedManifestStatuses([]);
//     setCurrentPage(1); // Reset to page 1
//   };

//   // Pagination function
//   const handlePageChange = (newPage: number) => {
//     if (newPage >= 1 && newPage <= totalPages) {
//       setCurrentPage(newPage);
//     }
//   };

//   // Display text functions
//   const getCourierDisplayText = () => {
//     if (selectedCouriers.length === 0) return 'Courier';
//     if (selectedCouriers.length === 1) return selectedCouriers[0];
//     return `${selectedCouriers.length} couriers selected`;
//   };

//   const getBuyerDisplayText = () => {
//     if (selectedBuyers.length === 0) return 'Buyer';
//     if (selectedBuyers.length === 1) return capitalizeFirstLetter(selectedBuyers[0]);
//     return `${selectedBuyers.length} buyers selected`;
//   };

//   const getStatusDisplayText = () => {
//     if (selectedStatuses.length === 0) return 'Status';
//     if (selectedStatuses.length === 1) {
//       // Convert database value to display value
//       const statusDisplayMap: Record<string, string> = {
//         'awaiting-invoice': 'Awaiting invoice',
//         'ready-to-print': 'Ready to print',
//         'printed': 'Printed'
//       };
//       return statusDisplayMap[selectedStatuses[0]] || selectedStatuses[0];
//     }
//     return `${selectedStatuses.length} statuses selected`;
//   };

//   const getManifestStatusDisplayText = () => {
//     if (selectedManifestStatuses.length === 0) return 'Manifest Status';
//     if (selectedManifestStatuses.length === 1) {
//       // Convert database value to display value
//       const statusDisplayMap: Record<string, string> = {
//         'not-generated': 'Not generated',
//         'generated': 'Generated',
//       };
//       return statusDisplayMap[selectedManifestStatuses[0]] || selectedManifestStatuses[0];
//     }
//     return `${selectedManifestStatuses.length} statuses selected`;
//   };

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (courierDropdownRef.current && !courierDropdownRef.current.contains(event.target as Node)) {
//         setIsCourierDropdownOpen(false);
//       }
//       if (buyerDropdownRef.current && !buyerDropdownRef.current.contains(event.target as Node)) {
//         setIsBuyerDropdownOpen(false);
//       }
//       if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
//         setIsStatusDropdownOpen(false);
//       }
//       if (mainfestStatusDropdownRef.current && !mainfestStatusDropdownRef.current.contains(event.target as Node)) {
//         setIsMainfestStatusDropdownOpen(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // Table columns configuration
//   const columns = [
//     { key: 'orderNumber', label: 'PO Number', width: '180px', type: 'text' as const },
//     { key: 'buyer', label: 'Buyer', width: '120px', type: 'text' as const },
//     { key: 'warehouse', label: 'Warehouse Code', width: '200px', type: 'text' as const },
//     { key: 'courier', label: 'Items', width: '88px', type: 'text' as const },
//     { key: 'status', label: 'Total Qty', width: '100px', type: 'text' as const },
//     { key: 'items', label: 'Total Cartons', width: '124px', type: 'text' as const },
//     { key: 'weight', label: 'Status', width: '142px', type: 'text' as const, isStatus: true },
//     { key: 'destination', label: 'Manifest Status', width: '150px', type: 'text' as const, isStatus: true },
//     { 
//       key: 'courier2', 
//       label: 'Courier', 
//       width: '142px', 
//       type: 'dropdown' as const,
//       placeholder: 'Select Courier',
//       dropdownOptions: courierOptions.map(courier => ({
//         label: courier,
//         value: courier
//       }))
//     },
//   ];

//   const handleRowClick = (rowId: string, rowData: any) => {
//     // Navigate to docket page if it's a docket row
//     if (rowData?.isDocket) {
//       // console.log('Navigating to docket:', rowData.docketId);
//       router.push(`/label-maker/docket/${rowData.docketId}`);
//       return;
//     }
    
//     // Only navigate if not interacting with dropdowns and not a docket
//     // console.log('Navigating to label:', rowId);
//     router.push(`/label-maker/${rowId}`);
//   };

//   const handleDropdownChange = async (rowId: string, columnKey: string, value: string) => {
//     // console.log('Dropdown changed:', { rowId, columnKey, value });
    
//     try {
//       const currentRow = (isSearchActive ? searchResults : tableData).find(row => row.id === rowId);
      
//       if (columnKey === 'courier2') {
//         if (currentRow?.isDocket) {
//           // If it's a docket row, update all orders in the docket
//           const orderIds = currentRow._originalData.map((order: any) => order._id);
          
//           // Update all orders in the docket
//           const updatePromises = orderIds.map((orderId: string) => 
//             updateLabel(orderId, { courier: value })
//           );
          
//           await Promise.all(updatePromises);
//           // console.log('Successfully updated courier for all orders in docket');
//         } else {
//           // Regular single order update
//           await updateLabel(rowId, { courier: value });
//           // console.log('Successfully updated courier in database');
//         }
//       }
      
//       // Update the table data locally after successful API call
//       const updateData = (data: any[]) => 
//         data.map(row => 
//           row.id === rowId 
//             ? { ...row, [columnKey]: value }
//             : row
//         );
      
//       // Update both main data and search results if applicable
//       setTableData(prevData => updateData(prevData));
//       if (isSearchActive) {
//         setSearchResults(prevResults => updateData(prevResults));
//       }
//     } catch (error) {
//       console.error('Error updating courier:', error);
//       // You could add a toast notification here to show the error to the user
//     }
//   };

//   const handleSearchChange = (value: string) => {
//     setSearchText(value);
    
//     // If search is cleared, exit search mode and reload all labels
//     if (!value.trim()) {
//       setIsSearchActive(false);
//       setSearchResults([]);
//       setCurrentPage(1); // Reset to page 1
//     }
//   };

//   const handleSearch = async () => {
//     if (!searchText.trim()) {
//       setIsSearchActive(false);
//       setSearchResults([]);
//       return;
//     }

//     try {
//       setIsLoading(true); // Show loading during search
//       setIsSearchActive(true);
//       const results = await searchLabels(searchText.trim());
      
//       // Transform search results for display (same as load function)
//       const transformedResults = results.orders?.map((order: any) => ({
//         id: order._id,
//         orderNumber: order.po_number,
//         buyer: capitalizeFirstLetter(order.source || ''),
//         courier: order.noOfItems?.toString() || '0', // Items
//         status: order.totalQuantity?.toString() || '0', // Total Qty
//         items: order.noOfCartons?.toString() || '0', // Total Cartons
//         weight: order.labelStatus || '', // Status
//         destination: order.manifestStatus || '', // Manifest Status
//         courier2: order.courier || null, // Courier dropdown
//         // Store docketId for grouping
//         docketId: order.docketId,
//         // Store original data for reference
//         _originalData: order,
//         warehouse:order.warehouseCode
//       })) || [];
      
//       // Group search results by docketId if any exist
//       const groupedResults = groupOrdersByDocket(transformedResults);
      
//       setSearchResults(groupedResults);
//       // console.log('Search results:', results);
//       setError(null);
//     } catch (err) {
//       console.error('Error searching labels:', err);
//       setError('Failed to search labels');
//       setSearchResults([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   return (
//                 <div className='w-full bg-white p-5 min-h-screen'>
//         <div className='flex justify-between mb-4'>
//             <div className='text-xl font-medium text-[#191A1B]'>Label Maker</div>
//             <div className='flex gap-3'>

//             </div>
//         </div>
//         {
//            (
//            <div className='mb-4 flex justify-between items-center'>
//         <SearchBox 
//           searchText={searchText}
//           onSearchChange={handleSearchChange}
//           onSearch={handleSearch}
//           placeholder="Search labels..."
//         />

//         <div className='flex gap-2'>
//           <div className='relative' ref={courierDropdownRef}>
//             <button 
//               className='w-fit text-sm text-[#545659] flex gap-1 cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs bg-white'
//               onClick={() => setIsCourierDropdownOpen(!isCourierDropdownOpen)}
//             >
//               {getCourierDisplayText()}
//               <CaretDownIcon
//                 size={16} 
//                 color='#545659' 
//                 className={`transition-transform ${isCourierDropdownOpen ? 'rotate-180' : ''}`}
//               />
//             </button>
            
//             {isCourierDropdownOpen && (
//               <div className='absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-[1000] min-w-[200px] max-h-[300px] overflow-y-auto'>
//                 {courierOptions.map((courier, index) => (
//                   <div
//                                         onClick={() => handleCourierToggle(courier)}
//                     key={`courier-${index}-${courier}`}
//                     className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${
//                       index === 0 ? 'rounded-t-lg' : ''
//                     }`}
//                   >
//                     <input
//                       type="checkbox"
//                       checked={selectedCouriers.includes(courier)}
//                       onChange={(e) => {
//                         e.stopPropagation();
//                       }}
//                       className="w-4 h-4 rounded border-gray-300 text-[#191A1B] focus:ring-[#191A1B]"
//                     />
//                     <span 
//                       className='text-[#191A1B] text-sm cursor-pointer'

//                     >
//                       {courier}
//                     </span>
//                   </div>
//                 ))}
                
//                 {selectedCouriers.length > 0 && (
//                   <>
//                     <div className='border-t border-[#F5F5F5] mx-3'></div>
//                     <div
//                       onClick={handleClearCouriers}
//                       className='p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer text-[#F04438] rounded-b-lg font-medium'
//                     >
//                       Clear all
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
          
//           <div className='relative' ref={buyerDropdownRef}>
//             <button 
//               className='w-fit text-sm text-[#545659] flex gap-1 cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs bg-white'
//               onClick={() => setIsBuyerDropdownOpen(!isBuyerDropdownOpen)}
//             >
//               {getBuyerDisplayText()}
//               <CaretDownIcon
//                 size={16} 
//                 color='#545659' 
//                 className={`transition-transform ${isBuyerDropdownOpen ? 'rotate-180' : ''}`}
//               />
//             </button>
            
//             {isBuyerDropdownOpen && (
//               <div className='absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-[1000] min-w-[200px] max-h-[300px] overflow-y-auto'>
//                 {buyerOptions.map((buyer, index) => (
//                   <div
//                     key={`buyer-${index}-${buyer}`}
//                     className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${
//                       index === 0 ? 'rounded-t-lg' : ''
//                     }`}
//                     onClick={() => handleBuyerToggle(buyer)}
//                   >
//                     <input
//                       type="checkbox"
//                       checked={selectedBuyers.includes(buyer)}
//                       onChange={(e) => {
//                           e.stopPropagation();
                      
//                         }}
//                       className="w-4 h-4 rounded border-gray-300 text-[#191A1B] focus:ring-[#191A1B] cursor-pointer"
//                     />
//                     <span 
//                       className='text-[#191A1B] text-sm cursor-pointer'
//                     >
//                       {capitalizeFirstLetter(buyer)}
//                     </span>
//                   </div>
//                 ))}
                
//                 {selectedBuyers.length > 0 && (
//                   <>
//                     <div className='border-t border-[#F5F5F5] mx-3'></div>
//                     <div
//                       onClick={handleClearBuyers}
//                       className='p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer text-[#F04438] rounded-b-lg font-medium'
//                     >
//                       Clear all
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
          
//           <div className='relative' ref={statusDropdownRef}>
//             <button 
//               className='w-fit text-sm text-[#545659] flex gap-1 cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs bg-white'
//               onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
//             >
//               {getStatusDisplayText()}
//               <CaretDownIcon
//                 size={16} 
//                 color='#545659' 
//                 className={`transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
//               />
//             </button>
            
//             {isStatusDropdownOpen && (
//               <div className='absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-[1000] min-w-[200px] max-h-[300px] overflow-y-auto'>
//                 {statusOptions.map((status, index) => {
//                   // Map database values to display values
//                   const statusDisplayMap: Record<string, string> = {
//                     'awaiting-invoice': 'Awaiting invoice',
//                     'ready-to-print': 'Ready to print',
//                     'printed': 'Printed'
//                   };
//                   const displayText = statusDisplayMap[status] || status;
                  
//                   return (
//                     <div
//                        onClick={() => handleStatusToggle(status)}
//                       key={`status-${index}-${status}`}
//                       className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${
//                         index === 0 ? 'rounded-t-lg' : ''
//                       }`}
//                     >
//                       <input
//                         type="checkbox"
//                         checked={selectedStatuses.includes(status)}
//                         onChange={(e) => {
//                           e.stopPropagation();
                      
//                         }}
//                         className="w-4 h-4 rounded border-gray-300 text-[#191A1B] focus:ring-[#191A1B]"
//                       />
//                       <span 
//                         className='text-[#191A1B] text-sm cursor-pointer'
                     
//                       >
//                         {displayText}
//                       </span>
//                     </div>
//                   );
//                 })}
                
//                 {selectedStatuses.length > 0 && (
//                   <>
//                     <div className='border-t border-[#F5F5F5] mx-3'></div>
//                     <div
//                       onClick={handleClearStatuses}
//                       className='p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer text-[#F04438] rounded-b-lg font-medium'
//                     >
//                       Clear all
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//           <div className='relative' ref={mainfestStatusDropdownRef}>
//             <button 
//               className='w-fit text-sm text-[#545659] flex gap-1 cursor-pointer items-center border-[#EAEAEA] rounded-lg border px-4 py-2 shadow-xs bg-white'
//               onClick={() => setIsMainfestStatusDropdownOpen(!isMainfestStatusDropdownOpen)}
//             >
//               {getManifestStatusDisplayText()}
//               <CaretDownIcon
//                 size={16} 
//                 color='#545659' 
//                 className={`transition-transform ${isMainfestStatusDropdownOpen ? 'rotate-180' : ''}`}
//               />
//             </button>


//             {isMainfestStatusDropdownOpen && (
//               <div className='absolute top-full right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-[1000] min-w-[200px] max-h-[300px] overflow-y-auto'>
//                 {manifestStatusOptions.map((status, index) => {
//                   const statusDisplayMap: Record<string, string> = {
//                     'not-generated': 'Not generated',
//                     'generated': 'Generated',
//                   };
//                   const displayText = statusDisplayMap[status] || status;
//                   return (
//                     <div
//                       onClick={() => handleManifestStatusToggle(status)}
//                       key={`manifest-status-${index}-${status}`}
//                       className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${
//                         index === 0 ? 'rounded-t-lg' : ''
//                       }`}
//                     >
//                       <input
//                         type="checkbox"
//                         checked={selectedManifestStatuses.includes(status)}
//                         onChange={(e) => {
//                           e.stopPropagation();
//                         }}
//                         className="w-4 h-4 rounded border-gray-300 text-[#191A1B] focus:ring-[#191A1B]"
//                       />
//                       <span
//                         className='text-[#191A1B] text-sm cursor-pointer'
//                       >
//                         {displayText}
//                       </span>
//                     </div>
//                   );
//                 })}

//                 {selectedManifestStatuses.length > 0 && (
//                   <>
//                     <div className='border-t border-[#F5F5F5] mx-3'></div>
//                     <div
//                       onClick={handleClearManifestStatuses}
//                       className='p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer text-[#F04438] rounded-b-lg font-medium'
//                     >
//                       Clear all
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         </div> 

     
//       </div>
//           )
// }
//    {isLoading ? (
//      <div className="animate-pulse">
//        <div className="h-64 bg-gray-200 rounded-lg"></div>
//      </div>
//    ) : (isSearchActive ? searchResults : tableData).length === 0 ? (
//      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg">
//        <div className="text-lg font-medium text-[#545659] mb-2">No label found</div>
//        <div className="text-sm text-[#AFAFAF]">
//          {isSearchActive ? 'No results match your search criteria' : 'No labels available'}
//        </div>
//      </div>
//    ) : (
//      <DataTable
//        data={isSearchActive ? searchResults : tableData}
//        columns={columns}
//        clickableRows={true}
//        onRowClick={handleRowClick}
//        onDropdownChange={handleDropdownChange}
//        height={true}
//        showCheckbox={false} 
//        enableSorting={true}
//        // Server-side pagination props
//        currentPage={currentPage}
//        totalPages={totalPages}
//        onPageChange={handlePageChange}
//        disableClientPagination={!isSearchActive} // Enable server-side pagination only when not searching
//      />
//    )}

//     </div>
//   )
// }

// export default LabelMaker
import React from 'react'

const LabelMaker = () => {
  return (
    <div>
      hello
    </div>
  )
}

export default LabelMaker
