"use client"
import { CaretLeftIcon, CaretRightIcon, CaretUpIcon, CaretDownIcon, DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import React, { useState, useEffect } from 'react';

// Generic interface for table columns
interface TableColumn {
  key: string;
  label: string;
  width?: string; // e.g., "260px", "150px", "1fr", etc.
  sortable?: boolean; // New prop for sortable columns
  isFileColumn?: boolean; // New prop to identify file columns
  onFileClick?: (fileUrl: string, fileName?: string) => void; // File click handler
}

// Generic interface for table data
interface TableRow {
  id: string;
  isActionLoading?: boolean; // Add loading state for action buttons
  [key: string]: any; // Allow any additional properties
}

// Action types for button clicks
type ActionType = 'approve' | 'hold' | 'release';

interface OrderDataTableProps {
  data: TableRow[];
  columns: TableColumn[];
  className?: string;
  clickableRows?: boolean; // New prop for clickable functionality
  onRowClick?: (rowId: string, rowData: TableRow) => void; // New prop for row click handler
  height?: boolean; // New prop for auto height functionality
  enableSorting?: boolean; // New prop to enable/disable sorting functionality
  paginationThreshold?: number; // New prop: pagination enabled after this many rows (default: 8)
  action?: boolean; // New prop to enable action column
  onActionClick?: (rowId: string, actionType: ActionType, rowData: TableRow) => void; // New prop for action button clicks
  // Server-side pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  disableClientPagination?: boolean; // New prop to disable client-side pagination
}

const OrderDataTable: React.FC<OrderDataTableProps> = ({
  data,
  columns,
  className = "",
  clickableRows = false, // Default to false
  onRowClick,
  height = false, // Default to false (fixed height)
  enableSorting = false, // Default to false
  paginationThreshold = 8, // Default to 8 rows
  action = false, // Default to false
  onActionClick, // New prop for handling action button clicks
  // Server-side pagination props
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange: externalOnPageChange,
  disableClientPagination = false,
}) => {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Determine if we should use server-side pagination
  const shouldUseServerPagination = disableClientPagination && externalCurrentPage && externalTotalPages && externalOnPageChange;
  
  // Use external pagination values if server-side, otherwise use internal values
  const currentPage = shouldUseServerPagination ? externalCurrentPage : internalCurrentPage;
  const itemsPerPage = paginationThreshold;
  
  // Calculate pagination settings
  const isPaginationEnabled = shouldUseServerPagination || data.length > paginationThreshold;
  const totalPages = shouldUseServerPagination ? externalTotalPages : Math.ceil(data.length / itemsPerPage);
  
  // Status formatting function
  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { text: string; textColor: string; bgColor: string } } = {
      'awaiting-invoice': {
        text: 'Awaiting Invoice',
        textColor: '#6B21A8',
        bgColor: '#EBD6FF'
      },
      'ready-to-print': {
        text: 'Ready to Print',
        textColor: '#059669',
        bgColor: '#D1FAE5'
      },
      'printed': {
        text: 'Printed',
        textColor: '#00527C',
        bgColor: '#E0F0FF'
      },
      'not-generated': {
        text: 'Not Generated',
        textColor: '#DC2626',
        bgColor: '#FEE2E2'
      },
      'generated': {
        text: 'Generated',
        textColor: '#059669',
        bgColor: '#D1FAE5'
      },
      'active': {
        text: 'Active',
        textColor: '#0C5132',
        bgColor: '#CDFEE1'
      },
      'inactive': {
        text: 'Inactive',
        textColor: '#545659',
        bgColor: '#EAEAEA'
      },
      'invited': {
        text: 'Invited',
        textColor: '#00527C',
        bgColor: '#E0F0FF'
      },
      'new-order': {
        text: 'New Order',
        textColor: '#6B21A8',
        bgColor: '#EBD6FF'
      },
      'approved': {
        text: 'Approved',
        textColor: '#00527C',
        bgColor: '#E0F0FF'
      },
      'completed': {
        text: 'Completed',
        textColor: '#0C5132',
        bgColor: '#CDFEE1'
      },
      'error': {
        text: 'Error',
        textColor: '#8E1F0B',
        bgColor: '#FEDAD9'
      },
      'on hold': {
        text: 'On Hold',
        textColor: '#92400E',
        bgColor: '#FFEDD5'
      },
      'on-hold': {
        text: 'On Hold',
        textColor: '#92400E',
        bgColor: '#FFEDD5'
      },
      'expired': {
        text: 'Expired',
        textColor: '#545659',
        bgColor: '#EAEAEA'
      },
      'new order': {
        text: 'New Order',
        textColor: '#6B21A8',
        bgColor: '#EBD6FF'
      },
      
      // Add more status mappings here as needed
    };

    const defaultStatus = {
      text: status || 'N/A',
      textColor: '#6B7280',
      bgColor: '#F3F4F6'
    };

    return statusMap[status?.toLowerCase()] || defaultStatus;
  };
  
  // Sort data based on current sort configuration
  const getSortedData = () => {
    if (!enableSorting || !sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      
      // Check if values are numbers
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      const bothNumbers = !isNaN(aNum) && !isNaN(bNum);
      
      let comparison = 0;
      
      if (bothNumbers) {
        // Numerical comparison
        comparison = aNum - bNum;
      } else {
        // String comparison (case-insensitive)
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };
  
  const sortedData = getSortedData();
  
  // Get current page data or all data based on pagination type
  const getCurrentPageData = () => {
    if (shouldUseServerPagination) {
      // For server-side pagination, return all data as server already paginated it
      return sortedData;
    }
    
    // For client-side pagination
    if (!isPaginationEnabled) return sortedData; // Show all data if below threshold
    if (sortedData.length <= itemsPerPage) return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const currentData = getCurrentPageData();

  // Handle column sort
  const handleSort = (columnKey: string) => {
    if (!enableSorting) return;
    
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;
    
    setSortConfig(prevConfig => {
      if (prevConfig?.key === columnKey) {
        // Toggle direction if same column
        return {
          key: columnKey,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New column, start with ascending
        return {
          key: columnKey,
          direction: 'asc'
        };
      }
    });
    
    // Reset to first page when sorting (only if pagination is enabled)
    if (isPaginationEnabled) {
      if (shouldUseServerPagination && externalOnPageChange) {
        externalOnPageChange(1);
      } else {
        setInternalCurrentPage(1);
      }
    }
  };

  // Handle row click
  const handleRowClick = (rowId: string, rowData: TableRow, event: React.MouseEvent) => {
    if (clickableRows && onRowClick) {
      onRowClick(rowId, rowData);
    }
  };

  // Handle action button click
  const handleActionClick = (row: TableRow, actionType: ActionType, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    if (onActionClick) {
      onActionClick(row.id, actionType, row);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (shouldUseServerPagination && externalOnPageChange) {
      externalOnPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than or equal to max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Function to get action button based on status
  const getActionButton = (row: TableRow) => {
    const status = row.status || row.Status; // Handle both cases
    const normalizedStatus = status?.toLowerCase();
    const isLoading = row.isActionLoading; // Check if this specific row is loading
    
    switch (normalizedStatus) {
      case 'new order':
        return (
          <button 
            className={`px-4 py-1.5 w-[94px] text-white text-sm rounded-lg font-medium transition-colors ${
              isLoading 
                ? 'bg-[#AFAFAF] cursor-not-allowed' 
                : 'bg-[#3B82F6] hover:bg-[#5A6EFF]'
            }`}
            onClick={(e) => !isLoading && handleActionClick(row, 'approve', e)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Approve'}
          </button>
        );
      case 'approved':
        return (
          <button 
            className={`px-4 py-1.5 w-[94px] text-white text-sm rounded-lg font-medium transition-colors ${
              isLoading 
                ? 'bg-[#AFAFAF] cursor-not-allowed' 
                : 'bg-[#F1BA17] hover:bg-[#E4951A]'
            }`}
            onClick={(e) => !isLoading && handleActionClick(row, 'hold', e)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Hold'}
          </button>
        );
      case 'on hold':
        return (
          <button 
            className={`px-4 py-1.5 w-[94px] text-white text-sm rounded-lg font-medium transition-colors ${
              isLoading 
                ? 'bg-[#AFAFAF] cursor-not-allowed' 
                : 'bg-[#FB923C] hover:bg-[#FF7A33]'
            }`}
            onClick={(e) => !isLoading && handleActionClick(row, 'release', e)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Release'}
          </button>
        );
      case 'error':
      case 'expired':
        return (
          <button 
            className="px-4 py-1.5 bg-[#AFAFAF] w-[94px] text-white text-sm rounded-lg font-medium cursor-not-allowed"
            disabled
          >
            Approve
          </button>
        );
      default:
        return (
          <button 
            className="px-4 py-1.5 bg-[#AFAFAF] w-[94px] text-white text-sm rounded-lg font-medium cursor-not-allowed"
            disabled
          >
            Approve
          </button>
        );
    }
  };

  // Reset to first page when data changes (only for client-side pagination)
  useEffect(() => {
    if (!shouldUseServerPagination) {
      setInternalCurrentPage(1);
      setSortConfig(null); // Clear sort when data changes
    }
  }, [data, shouldUseServerPagination]);

  // Create grid template columns string
  const gridTemplateColumns = columns.map(col => col.width || 'minmax(150px, 1fr)').join(' ');
  
  // Calculate minimum width for horizontal scrolling
  const minTableWidth = columns.reduce((acc, col) => {
    if (col.width && col.width.includes('px')) {
      return acc + parseInt(col.width);
    }
    return acc + 150; // Default minimum width
  }, 0);



  return (
    <div className={`w-full ${className}`}>
      {/* Table Container */}
      <div className="w-full bg-white overflow-hidden relative">
        <div className="flex">
          {/* Scrollable table content */}
          <div className="flex-1 overflow-x-auto">
            <div 
              className="bg-white overflow-visible"
              style={{ 
                minWidth: `${minTableWidth}px`, // Ensure minimum width for horizontal scroll
                maxHeight: isPaginationEnabled ? 'auto' : '500px',
                minHeight: 'auto',
                overflowY: isPaginationEnabled ? 'visible' : 'auto'
              }}
            >
              <div className="w-full bg-white overflow-visible">
                {/* Table Header */}
                <div 
                  className="grid gap-0 rounded-lg bg-[#F5F5F5] w-full relative" 
                  style={{ 
                    gridTemplateColumns, 
                    height: height ? 'auto' : '40px',
                    minHeight: height ? '40px' : undefined,
                    minWidth: '100%' // Ensure header spans full width
                  }}
                >
                  {columns.map((column) => {
                    const isSortable = enableSorting && column.sortable;
                    const isSorted = sortConfig?.key === column.key;
                    const sortDirection = isSorted ? sortConfig.direction : null;
                    
                    return (
                      <div 
                        key={column.key} 
                        className={`flex items-center rounded-lg justify-between bg-[#F5F5F5] px-4 ${
                          isSortable ? 'cursor-pointer hover:bg-gray-200' : ''
                        }`}
                        onClick={() => isSortable && handleSort(column.key)}
                      >
                        <span className="text-sm font-medium text-[#191A1B] truncate">
                          {column.label}
                        </span>
                        {isSortable && (
                          <div className="flex flex-col ml-1">
                            <CaretUpIcon 
                              size={12} 
                              color={sortDirection === 'asc' ? '#191A1B' : '#AFAFAF'} 
                              className="mb-[-2px]"
                            />
                            <CaretDownIcon 
                              size={12} 
                              color={sortDirection === 'desc' ? '#191A1B' : '#AFAFAF'}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                  
                {/* Table Rows */}
                <div className="w-full">
                  {currentData.map((row) => (
                    <div
                      key={row.id}
                      className={`grid gap-0 border-b border-gray-100 transition-colors bg-white relative w-full ${
                        clickableRows ? 'cursor-pointer ' : ''
                      }`}
                      style={{ 
                        gridTemplateColumns, 
                        height: height ? 'auto' : '52px',
                        minHeight: height ? '52px' : undefined,
                        minWidth: '100%' // Ensure row spans full width
                      }}
                      onClick={(e) => handleRowClick(row.id, row, e)}
                    >
                      {columns.map((column) => {
                        // Check if this is a status column and apply special styling
                        const isStatusColumn = column.key.toLowerCase().includes('status');
                        const cellValue = row[column.key];
                        
                        return (
                          <div key={column.key} className={`flex bg-white px-4 ${
                            column.key === 'address' ? 'items-start py-3' : 
                            column.key === 'itemName' ? 'items-start py-3' : 'items-center'
                          }`}>
                            {column.isFileColumn ? (
                              <div className="flex items-center justify-center w-full">
                                {cellValue ? (
                                  <DownloadSimpleIcon 
                                    size={20} 
                                    color="#22C55E" 
                                    className="cursor-pointer hover:opacity-80 transition-opacity" 
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row click
                                      column.onFileClick?.(cellValue, `${row.poNumber || 'order'}.pdf`);
                                    }}
                                  />
                                ) : (
                                  <span className="text-sm text-[#AFAFAF]">N/A</span>
                                )}
                              </div>
                            ) : isStatusColumn ? (
                              <span 
                                className="text-xs px-1.5 py-1 rounded-lg font-medium"
                                style={{
                                  color: getStatusDisplay(cellValue).textColor,
                                  backgroundColor: getStatusDisplay(cellValue).bgColor
                                }}
                              >
                                {getStatusDisplay(cellValue).text}
                              </span>
                            ) : (
                              <span className={`text-sm text-[#191A1B] ${
                                column.key === 'address' ? 'leading-5' : 
                                column.key === 'itemName' ? 'break-words' : 'truncate'
                              }`} title={cellValue}>
                                {cellValue}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Action Column */}
          {action && (
            <div className="flex-shrink-0 bg-white border-l border-gray-200" style={{ width: '120px' }}>
              {/* Action Header */}
              <div 
                className="flex items-center justify-center bg-[#F5F5F5] px-4 rounded-lg"
                style={{ 
                  height: height ? 'auto' : '40px',
                  minHeight: height ? '40px' : undefined
                }}
              >
                <span className="text-sm font-medium text-[#191A1B]">Action</span>
              </div>

              {/* Action Rows */}
              <div>
                {currentData.map((row) => (
                  <div
                    key={`action-${row.id}`}
                    className="flex items-center justify-center bg-white border-b border-gray-100 px-2"
                    style={{ 
                      height: height ? 'auto' : '52px',
                      minHeight: height ? '52px' : undefined
                    }}
                  >
                    {getActionButton(row)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination - Only show if enabled based on threshold */}
      {isPaginationEnabled && totalPages > 1 && (
        <div className="flex justify-end mt-4 ">
          <div className="flex items-center gap-1 text-sm bg-[#F5F5F5] rounded-lg p-0.5 ">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-8 h-8 rounded-md text-[#191A1B] transition-colors ${
                currentPage === 1
                  ? 'cursor-not-allowed'
                  : 'bg-[#191A1B] text-white cursor-pointer'
              }`}
            >
              {
                currentPage === 1 ? (
                  <CaretLeftIcon size={16} color='#AFAFAF' />
                ) : (
                  <CaretLeftIcon size={16} color='#FFFFFF' />
                )
              }
              
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="flex items-center justify-center w-8 h-8 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page as number)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors text-[#191A1B] cursor-pointer ${
                      currentPage === page
                        ? ' bg-white shadow'
                        : 'bg-[#F5F5F5]'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-8 h-8 rounded-md  text-[#191A1B] transition-colors ${
                currentPage === totalPages
                  ? ' cursor-not-allowed'
                  : 'bg-[#191A1B] text-white cursor-pointer'
              }`}
            >
               {
                currentPage === totalPages ? (
                  <CaretRightIcon size={16} color='#AFAFAF' />
                ) : (
                  <CaretRightIcon size={16} color='#FFFFFF' />
                )
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDataTable;