"use client"
import { PencilSimpleIcon, TrashIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon, CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import React, { useState, useRef, useEffect } from 'react';

// Generic interface for dropdown options
interface DropdownOption {
  label: string;
  value: string;
}

// Interface for action buttons
interface ActionButton {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string; // Text color (e.g., '#F04438' for red, '#191A1B' for black)
  onClick: (rowId: string) => void;
}

// Generic interface for table columns
interface TableColumn {
  key: string;
  label: string;
  width?: string; // e.g., "260px", "150px", "1fr", etc.
  type?: 'text' | 'dropdown' | 'status'; // Column type
  dropdownOptions?: DropdownOption[]; // Options for dropdown columns
  placeholder?: string; // Placeholder for dropdown columns
  sortable?: boolean; // New prop for sortable columns
  isStatus?: boolean; // New prop to identify status columns
}

// Generic interface for table data
interface TableRow {
  id: string;
  [key: string]: any; // Allow any additional properties
}

interface DataTableProps {
  data: TableRow[];
  columns: TableColumn[];
  onRowSelect?: (selectedIds: string[]) => void;
  onActionClick?: (rowId: string) => void;
  actions?: ActionButton[]; // New prop for custom actions (1-4 buttons)
  onDropdownChange?: (rowId: string, columnKey: string, value: string) => void; // New prop for dropdown changes
  onBulkEdit?: (selectedData: TableRow[]) => void; // New prop for bulk edit action
  showActions?: boolean;
  showCheckbox?: boolean; // New prop for optional checkbox column
  className?: string;
  clickableRows?: boolean; // New prop for clickable functionality
  onRowClick?: (rowId: string, rowData: TableRow) => void; // New prop for row click handler
  height?: boolean; // New prop for auto height functionality
  paginationThreshold?: number; // New prop: pagination enabled after this many rows (default: 8)
  enableSorting?: boolean; // New prop to enable/disable sorting functionality
  showTotalRow?: boolean; // New prop to show/hide total row
  totalRowData?: { [key: string]: any }; // New prop for total row data
  // Server-side pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  disableClientPagination?: boolean; // New prop to disable client-side pagination
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onRowSelect,
  actions = [], // Default to empty array
  onDropdownChange,
  onBulkEdit,
  showActions = true,
  showCheckbox = true, // Default to true (checkbox visible)
  className = "",
  clickableRows = false, // Default to false
  onRowClick,
  height = false, // Default to false (fixed height)
  paginationThreshold = 10, // Set default to 20 rows per page
  enableSorting = false, // Default to false
  showTotalRow = false, // Default to false
  totalRowData = {}, // Default to empty object
  // Server-side pagination props
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
  onPageChange: externalOnPageChange,
  disableClientPagination = false,
}) => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const actionButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Determine if we should use server-side pagination
  const shouldUseServerPagination = disableClientPagination && 
    typeof externalCurrentPage === 'number' && externalCurrentPage > 0 && 
    typeof externalTotalPages === 'number' && externalTotalPages > 0 && 
    typeof externalOnPageChange === 'function';
  
  // Use external pagination values if server-side, otherwise use internal values
  const currentPage = shouldUseServerPagination ? externalCurrentPage : internalCurrentPage;
  const itemsPerPage = paginationThreshold;
  
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
        textColor: '#92400E',
        bgColor: '#FFEDD5'
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
      'printed':{
        text: 'Printed',
        textColor: '#00527C',
        bgColor: '#E0F0FF'
      },
      'invited':{
        text: 'Invited',
        textColor: '#00527C',
        bgColor: '#E0F0FF'
      },
      'new-order':{
        text: 'New Order',
        textColor: '#6B21A8',
        bgColor: '#EBD6FF'
      },
      'approved':{
        text: 'Approved',
        textColor: '#00527C',
        bgColor: '#E0F0FF'
      },
      'completed':{
        text: 'Completed',
        textColor: '#0C5132',
        bgColor: '#CDFEE1'
      },
      'error':{
        text: 'Error',
        textColor: '#8E1F0B',
        bgColor: '#FEDAD9'
      },
      'on-hold':{
        text: 'On Hold',
        textColor: '#92400E',
        bgColor: '#FFEDD5'
      },
      'expired':{
        text: 'Expired',
        textColor: '#545659',
        bgColor: '#EAEAEA'
      },
      'generated':{
        text: 'Generated',
        textColor: '#0C5132',
        bgColor: '#CDFEE1'
      },
      'not-generated':{
        text: 'Not Generated',
        textColor: '#8E1F0B',
        bgColor: '#FEDAD9'
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
  
  // Calculate pagination settings
  const isPaginationEnabled = shouldUseServerPagination || data.length > paginationThreshold;
  const totalPages = shouldUseServerPagination ? externalTotalPages : Math.ceil(sortedData.length / itemsPerPage);
  
  // Get current page data
  const getCurrentPageData = () => {
    if (shouldUseServerPagination) return sortedData; // For server-side pagination, show all data received
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

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? currentData.map(row => row.id) : [];
    setSelectedRows(newSelection);
    onRowSelect?.(newSelection);
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedRows, rowId]
      : selectedRows.filter(id => id !== rowId);
    
    setSelectedRows(newSelection);
    onRowSelect?.(newSelection);
  };

  const handleDotsClick = (rowId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (activeDropdown === rowId) {
      setActiveDropdown(null);
      setDropdownPosition(null);
      return;
    }

    const buttonElement = actionButtonRefs.current[rowId];
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // Approximate dropdown height
      
      // Calculate position
      let top = rect.bottom + window.scrollY + 4; // 4px gap
      let left = rect.right + window.scrollX - 144; // 144px is dropdown width (w-36)
      
      // Adjust if dropdown would go below viewport
      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top + window.scrollY - dropdownHeight - 4;
      }
      
      // Adjust if dropdown would go outside left edge
      if (left < 8) {
        left = 8;
      }
      
      // Adjust if dropdown would go outside right edge
      const dropdownWidth = 144;
      if (left + dropdownWidth > window.innerWidth - 8) {
        left = window.innerWidth - dropdownWidth - 8;
      }
      
      setDropdownPosition({ top, left });
      setActiveDropdown(rowId);
    }
  };

  const handleActionClick = (action: ActionButton, rowId: string) => {
    action.onClick(rowId);
    setActiveDropdown(null);
    setDropdownPosition(null);
  };

  // Handle dropdown value change
  const handleDropdownChange = (rowId: string, columnKey: string, value: string) => {
    onDropdownChange?.(rowId, columnKey, value);
  };

  // Handle row click
  const handleRowClick = (rowId: string, rowData: TableRow, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox or action button areas
    const target = event.target as HTMLElement;
    const isCheckboxClick = target.closest('input[type="checkbox"]') || target.closest('.checkbox-container');
    const isActionClick = target.closest('.action-container');
    
    if (!isCheckboxClick && !isActionClick && clickableRows && onRowClick) {
      onRowClick(rowId, rowData);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (shouldUseServerPagination && externalOnPageChange) {
      externalOnPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
    setSelectedRows([]); // Clear selections when changing pages
    onRowSelect?.([]);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        // Check if click is outside dropdown and not on the button
        const isClickOnDropdown = document.querySelector('.action-dropdown')?.contains(event.target as Node);
        const isClickOnButton = actionButtonRefs.current[activeDropdown]?.contains(event.target as Node);
        
        if (!isClickOnDropdown && !isClickOnButton) {
          setActiveDropdown(null);
          setDropdownPosition(null);
        }
      }
    };

    const handleScroll = () => {
      if (activeDropdown) {
        setActiveDropdown(null);
        setDropdownPosition(null);
      }
    };

    const handleResize = () => {
      if (activeDropdown) {
        setActiveDropdown(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeDropdown]);

  // Reset to first page when data changes (but not for server-side pagination)
  useEffect(() => {
    // Don't reset page for server-side pagination as data changes are result of page changes
    if (!shouldUseServerPagination) {
      setInternalCurrentPage(1);
    }
    setSelectedRows([]);
    setActiveDropdown(null);
    setDropdownPosition(null);
    setSortConfig(null); // Clear sort when data changes
  }, [data]);

  const isAllSelected = selectedRows.length === currentData.length && currentData.length > 0;
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < currentData.length;

  // Create grid template columns string with flexible spacer
  const checkboxColumn = showCheckbox ? '50px ' : '';
  const gridTemplateColumns = `${checkboxColumn}${columns.map(col => col.width || 'minmax(150px, 1fr)').join(' ')} ${showActions ? 'auto 60px' : ''}`;
  
  // Calculate minimum width for horizontal scrolling
  const checkboxWidth = showCheckbox ? 50 : 0;
  const minTableWidth = columns.reduce((acc, col) => {
    if (col.width && col.width.includes('px')) {
      return acc + parseInt(col.width);
    }
    return acc + 150; // Default minimum width
  }, 0) + checkboxWidth + (showActions ? 60 : 0); // Add checkbox column and action column widths

  // Only show actions column if showActions is true AND there are actions to show
  const shouldShowActions = showActions && actions.length > 0;

  return (

  <div className={`w-full bg-white ${className}`}>
    {/* Table Container with Fixed Height */}
    <div className='overflow-x-auto h-[60vh] flex flex-col'>
      <div className="w-full bg-white flex flex-col h-full" style={{ minWidth: `${minTableWidth}px` }}>
        {/* Fixed Table Header */}
        <div 
          className="grid gap-0 rounded-lg bg-[#F5F5F5] w-full flex-shrink-0" 
          style={{ 
            gridTemplateColumns: selectedRows.length > 0 ? '1fr' : gridTemplateColumns, 
            height: height ? 'auto' : '40px',
            minHeight: height ? '40px' : undefined,
            minWidth: '100%',
          }}
        >
          {/* Checkbox Column Header */}
          {showCheckbox && (
            <div className="flex items-center rounded-lg justify-start bg-[#F5F5F5] px-4 ">
              {selectedRows.length > 0 ? (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isAllSelected ? '#191A1B' : 'transparent',
                      borderColor: isAllSelected ? '#191A1B' : '#EAEAEA'
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded-lg checked:bg-[#191A1B] checked:border-[#191A1B] flex-shrink-0"
                  />
                  <button
                    onClick={() => {
                      // console.log('Bulk edit button clicked');
                      // console.log('Selected rows:', selectedRows);
                      // console.log('All data:', data);
                      
                      const selectedData = data.filter(row => selectedRows.includes(row.id));
                      // console.log('Filtered selected data:', selectedData);
                      
                      onBulkEdit?.(selectedData);
                    }}
                    className="px-3 py-1.5 cursor-pointer bg-[#191A1B] text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors whitespace-nowrap shadow-sm"
                  >
                    Bulk edit ({selectedRows.length})
                  </button>
                </div>
              ) : (
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isAllSelected ? '#191A1B' : 'transparent',
                    borderColor: isAllSelected ? '#191A1B' : '#EAEAEA'
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded-lg checked:bg-[#191A1B] checked:border-[#191A1B]"
                />
              )}
            </div>
          )}
          
          {/* Only show column headers when bulk edit is NOT active */}
          {selectedRows.length === 0 && columns.map((column) => {
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
          
          {/* Only show action headers when bulk edit is NOT active */}
          {selectedRows.length === 0 && shouldShowActions && (
            <>
              <div className="bg-[#F5F5F5]" /> {/* Flexible spacer */}
              <div className="flex items-center bg-[#F5F5F5] rounded-r-lg px-4"></div>
            </>
          )}
        </div>

        {/* Scrollable Table Body */}
        <div 
          className="w-full overflow-y-auto flex-1"
          style={{ 
            minHeight: 0 // Important for flex child to scroll
          }}
        >
          {/* Table Rows */}
          <div className="w-full">
            {currentData.map((row) => (
              <div
                key={row.id}
                className={`grid gap-0 border-b border-gray-100 rounded-l-lg bg-white relative w-full ${
                  clickableRows ? 'cursor-pointer' : ''
                }`}
                style={{ 
                  gridTemplateColumns, 
                  height: height ? 'auto' : '52px',
                  minHeight: height ? '52px' : undefined,
                  minWidth: '100%' // Ensure row spans full width
                }}
                onClick={(e) => handleRowClick(row.id, row, e)}
              >
                {/* Conditional Checkbox Column */}
                {showCheckbox && (
                  <div className="flex items-center justify-center bg-white px-4 checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                      className="w-4 h-4 rounded-lg checked:bg-[#191A1B] checked:border-[#191A1B] cursor-pointer"
                    />
                  </div>
                )}
                
                {columns.map((column) => {
                  // Check if this is a status column using the new isStatus prop
                  const isStatusColumn = column.isStatus === true;
                  const cellValue = row[column.key];
                  const dropdownId = `${row.id}-${column.key}`;
                  
                  return (
                    <div 
                      key={column.key} 
                      className={`flex bg-white px-4 relative ${
                        column.key === 'address' ? 'items-start py-3' : 
                        column.key === 'itemName' ? 'items-start py-3' : 'items-center'
                      }`}
                    >
                      {column.type === 'dropdown' ? (
                        <select
                          value={cellValue || ''}
                          onChange={(e) => handleDropdownChange(row.id, column.key, e.target.value)}
                          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking dropdown
                          className="w-full text-sm text-[#191A1B] px-3 py-1.5 border border-[#EAEAEA] rounded-lg focus:border-[#191A1B] focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="" disabled>
                            {column.placeholder || 'Select...'}
                          </option>
                          {column.dropdownOptions?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : isStatusColumn ? (
                        <span 
                          className={`text-xs px-1.5 py-1 rounded-lg font-medium`}
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
                
                {shouldShowActions && (
                  <>
                    <div className="bg-white" /> 
                    <div 
                      className="flex items-center justify-end bg-white px-4 relative action-container" 
                      ref={(el) => { dropdownRefs.current[row.id] = el; }}
                    >
                      <button 
                        ref={(el) => { actionButtonRefs.current[row.id] = el; }}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                        onClick={(e) => handleDotsClick(row.id, e)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="8" cy="3" r="1" fill="currentColor"/>
                          <circle cx="8" cy="8" r="1" fill="currentColor"/>
                          <circle cx="8" cy="13" r="1" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Total Row */}
            {showTotalRow && (
              <div
                className="grid gap-0 border-t-2 border-gray-300 bg-gray-50 relative w-full font-semibold"
                style={{ 
                  gridTemplateColumns, 
                  height: height ? 'auto' : '52px',
                  minHeight: height ? '52px' : undefined,
                  minWidth: '100%'
                }}
              >
                {/* Conditional Empty checkbox column for total row */}
                {showCheckbox && (
                  <div className="flex items-center justify-center bg-gray-50 px-4">
                    {/* Empty space for checkbox column */}
                  </div>
                )}
                
                {columns.map((column, index) => {
                  const cellValue = totalRowData[column.key];
                  const isFirstColumn = index === 0;
                  
                  return (
                    <div 
                      key={column.key} 
                      className="flex bg-gray-50 px-4 items-center"
                    >
                      <span className="text-sm text-[#191A1B] font-semibold">
                        {isFirstColumn ? 'Total' : (cellValue || '')}
                      </span>
                    </div>
                  );
                })}
                
                {shouldShowActions && (
                  <>
                    <div className="bg-gray-50" />
                    <div className="flex items-center justify-end bg-gray-50 px-4">
                      {/* Empty space for actions column */}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Fixed Position Dropdown - Rendered outside table */}
    {activeDropdown && dropdownPosition && (
      <div
        className="action-dropdown fixed flex flex-col bg-white w-36 p-0.5 rounded-lg shadow-lg border border-gray-200"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          zIndex: 9999,
        }}
      >
        {actions
          .filter((action) => {
            // Filter actions based on row data and action type
            const row = data.find(r => r.id === activeDropdown);
            if (!row) return true;
            
            if (action.id === 'activate') {
              return row.originalStatus?.toLowerCase() === 'deactive';
            }
            if (action.id === 'deactivate') {
              return row.originalStatus?.toLowerCase() !== 'deactive';
            }
            if (action.id === 'resend-invite') {
              return !row.hasLastLogin; // Only show resend invite if user hasn't logged in
            }
            return true; // Show all other actions (like edit)
          })
          .map((action) => (
          <div 
            key={action.id}
            onClick={() => handleActionClick(action, activeDropdown)} 
            className='flex gap-2 cursor-pointer items-center p-2 hover:bg-gray-50 rounded transition-colors'
          >
            {action.icon && (
              <div style={{ color: action.color || '#191A1B' }}>
                {action.icon}
              </div>
            )}
            <div 
              className='text-sm font-medium'
              style={{ color: action.color || '#191A1B' }}
            >
              {action.label}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Pagination - Only show if enabled based on threshold */}
    {isPaginationEnabled && totalPages > 1 && (
      <div className="flex justify-end mt-4">
        <div className="flex items-center gap-1 text-sm bg-[#F5F5F5] rounded-lg p-0.5">
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
                  className={`flex items-center justify-center cursor-pointer w-8 h-8 rounded-md transition-colors text-[#191A1B] ${
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
                : 'bg-[#191A1B] text-white] cursor-pointer'
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

export default DataTable;