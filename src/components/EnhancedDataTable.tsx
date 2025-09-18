"use client"
import { CaretLeftIcon, CaretRightIcon, CaretUpIcon, CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import React, { useState, useEffect } from 'react';

// Generic interface for table columns
interface TableColumn {
  key: string;
  label: string;
  width?: string; // e.g., "260px", "150px", "1fr", etc.
  sortable?: boolean; // New prop for sortable columns
  showTotal?: boolean; // New prop to show total for this column
  render?: (value: any, row: any) => React.ReactNode; // Custom render function for cells
}

// Generic interface for table data
interface TableRow {
  id: string;
  [key: string]: any; // Allow any additional properties
}

interface EnhancedDataTableProps {
  data: TableRow[];
  columns: TableColumn[];
  className?: string;
  clickableRows?: boolean; // New prop for clickable functionality
  onRowClick?: (rowId: string, rowData: TableRow) => void; // New prop for row click handler
  height?: boolean; // New prop for auto height functionality
  enableSorting?: boolean; // New prop to enable/disable sorting functionality
  enablePagination?: boolean; // New prop to enable/disable pagination
  itemsPerPage?: number; // Number of items per page (default: 5)
  maxVisibleRows?: number; // Maximum rows visible before scrolling (default: 5)
  showCheckboxes?: boolean; // New prop to show/hide checkboxes
  onRowSelect?: (selectedIds: string[]) => void; // New prop for handling row selection
  showSerialNumber?: boolean; // New prop to show/hide serial number column
  stickyCheckbox?: boolean; // New prop to make checkbox column sticky
}

const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({
  data,
  columns,
  className = "",
  clickableRows = false, // Default to false
  onRowClick,
  height = false, // Default to false (fixed height)
  enableSorting = false, // Default to false
  enablePagination = true, // Default to true
  itemsPerPage = 5, // Default to 5
  maxVisibleRows = 5, // Default to 5
  showCheckboxes = false, // Default to false
  onRowSelect,
  showSerialNumber = true, // Default to true
  stickyCheckbox = false, // Default to false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  
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
  
  // Get current page data or all data if pagination is disabled
  const getCurrentPageData = () => {
    if (!enablePagination) return sortedData;
    if (sortedData.length <= itemsPerPage) return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  // Add serial numbers to the data
  const addSerialNumbers = (data: TableRow[]) => {
    return data.map((row, index) => ({
      ...row,
      serialNumber: index + 1
    }));
  };

  const dataWithSerialNumbers = addSerialNumbers(sortedData);

  const getCurrentPageDataWithSerial = () => {
    if (!enablePagination) return dataWithSerialNumbers;
    if (dataWithSerialNumbers.length <= itemsPerPage) return dataWithSerialNumbers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dataWithSerialNumbers.slice(startIndex, endIndex);
  };

  const currentData = getCurrentPageDataWithSerial();

  // Calculate totals for columns that have showTotal enabled
  const calculateTotals = () => {
    const totals: { [key: string]: number } = {};
    
    columns.forEach(column => {
      if (column.showTotal) {
        const total = sortedData.reduce((sum, row) => {
          const value = Number(row[column.key]);
          return sum + (isNaN(value) ? 0 : value);
        }, 0);
        totals[column.key] = total;
      }
    });
    
    return totals;
  };

  const totals = calculateTotals();
  const hasTotals = columns.some(col => col.showTotal);

  // Checkbox functionality
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
    
    // Reset to first page when sorting
    if (enablePagination) {
      setCurrentPage(1);
    }
  };

  // Handle row click
  const handleRowClick = (rowId: string, rowData: TableRow, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox
    const target = event.target as HTMLElement;
    const isCheckboxClick = target.closest('input[type="checkbox"]') || target.closest('.checkbox-container');
    
    if (!isCheckboxClick && clickableRows && onRowClick) {
      onRowClick(rowId, rowData);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Clear selections when changing pages
    if (showCheckboxes) {
      setSelectedRows([]);
      onRowSelect?.([]);
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

  // Reset to first page when data changes
  useEffect(() => {
    if (enablePagination) {
      setCurrentPage(1);
    }
    setSortConfig(null); // Clear sort when data changes
    setSelectedRows([]); // Clear selections when data changes
  }, [data, enablePagination]);

  // Checkbox states
  const isAllSelected = showCheckboxes && selectedRows.length === currentData.length && currentData.length > 0;
  const isIndeterminate = showCheckboxes && selectedRows.length > 0 && selectedRows.length < currentData.length;

  // Create grid template columns string (include checkbox and S.No columns)
  const gridTemplateColumns = (() => {
    let template = '';
    if (showCheckboxes) template += '50px ';
    if (showSerialNumber) template += '100px ';
    template += columns.map(col => col.width || 'minmax(150px, 1fr)').join(' ');
    return template.trim();
  })();

  return (
    <div className={`w-full ${className}`}>
      {/* Table Container */}
      <div className="w-full bg-white overflow-x-auto relative">
        <div className="min-w-full bg-white" style={{ minWidth: 'max-content' }}>
          {/* Table Header - Fixed */}
          <div 
            className="grid gap-0 rounded-lg bg-[#F5F5F5] sticky top-0 z-10" 
            style={{ 
              gridTemplateColumns, 
              height: height ? 'auto' : '40px',
              minHeight: height ? '40px' : undefined,
              minWidth: 'max-content'
            }}
          >
            {/* Checkbox Header */}
            {showCheckboxes && (
              <div 
                className={`flex items-center rounded-lg justify-center px-4 checkbox-container ${
                  stickyCheckbox ? 'sticky left-0 z-30 border-r border-gray-200' : ''
                }`}
                style={stickyCheckbox ? { position: 'sticky', left: 0, backgroundColor: '#F5F5F5' } : { backgroundColor: '#F5F5F5' }}
              >
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
              </div>
            )}

            {/* S.No Header */}
            {showSerialNumber && (
              <div 
                className={`flex items-center rounded-l-lg justify-between bg-[#F5F5F5] pl-5 pr-4 ${
                  enableSorting ? 'cursor-pointer hover:bg-gray-200' : ''
                }`}
                onClick={() => enableSorting && handleSort('serialNumber')}
              >
                <span className="text-sm font-medium text-[#191A1B]">
                  S.No
                </span>
                {enableSorting && (
                  <div className="flex flex-col ml-1">
                    <CaretUpIcon 
                      size={12} 
                      color={sortConfig?.key === 'serialNumber' && sortConfig.direction === 'asc' ? '#191A1B' : '#AFAFAF'} 
                      className="mb-[-2px]"
                    />
                    <CaretDownIcon 
                      size={12} 
                      color={sortConfig?.key === 'serialNumber' && sortConfig.direction === 'desc' ? '#191A1B' : '#AFAFAF'}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Other Column Headers */}
            {columns.map((column) => {
              const isSortable = enableSorting && column.sortable;
              const isSorted = sortConfig?.key === column.key;
              const sortDirection = isSorted ? sortConfig.direction : null;
              
              return (
                <div 
                  key={column.key} 
                  className={`flex items-center text-[#191A1B] rounded-lg justify-between bg-[#F5F5F5] pl-5 pr-4 ${
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

          {/* Scrollable Table Body */}
          <div 
            className="overflow-y-auto"
            style={{ 
              maxHeight: `${maxVisibleRows * 52}px`, // 52px per row
              minWidth: 'max-content'
            }}
          >
            {/* Table Rows */}
            {currentData.map((row) => (
              <div
                key={row.id}
                className={`grid gap-0 border-b border-gray-100 transition-colors bg-white relative ${
                  clickableRows ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                style={{ 
                  gridTemplateColumns, 
                  height: height ? 'auto' : '52px',
                  minHeight: height ? '52px' : undefined,
                  minWidth: 'max-content'
                }}
                onClick={(e) => handleRowClick(row.id, row, e)}
              >
                {/* Checkbox Cell */}
                {showCheckboxes && (
                  <div 
                    className={`flex items-center justify-center px-4 checkbox-container ${
                      stickyCheckbox ? 'sticky left-0 z-20 border-r border-gray-200' : ''
                    } ${clickableRows && !stickyCheckbox ? 'bg-white hover:bg-gray-50' : 'bg-white'}`}
                    style={stickyCheckbox ? { position: 'sticky', left: 0, backgroundColor: 'white' } : {}}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                      className="w-4 h-4 rounded-lg checked:bg-[#191A1B] checked:border-[#191A1B]"
                    />
                  </div>
                )}

                {/* S.No Cell */}
                {showSerialNumber && (
                  <div className="flex items-center justify-center bg-white pl-5 pr-4">
                    <span className="text-sm text-[#191A1B] font-medium">
                      {row.serialNumber}
                    </span>
                  </div>
                )}

                {/* Other Data Cells */}
                {columns.map((column) => {
                  // Check if this is a status column and apply special styling
                  const isStatusColumn = column.key.toLowerCase().includes('status');
                  const cellValue = (row as any)[column.key];
                  const isActiveStatus = typeof cellValue === 'string' && cellValue.toLowerCase() === 'active';
                  const isInactiveStatus = typeof cellValue === 'string' && cellValue.toLowerCase() === 'inactive';
                  
                  return (
                    <div key={column.key} className={`flex bg-white pl-5 pr-4 ${
                      column.key === 'address' ? 'items-start py-3' : 
                      column.key === 'itemName' ? 'items-start py-3' : 'items-center'
                    }`}>
                      {column.render ? (
                        // Use custom render function if provided
                        column.render(cellValue, row)
                      ) : isStatusColumn ? (
                        <span className={`text-sm px-3 py-1 rounded-lg font-medium ${
                          isActiveStatus 
                            ? 'text-[#0C5132] bg-[#CDFEE1]' 
                            : isInactiveStatus 
                            ? 'text-[#545659] bg-[#EAEAEA]' 
                            : 'text-[#191A1B]'
                        }`}>
                          {cellValue}
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

          {/* Totals Row - Fixed at Bottom */}
          {hasTotals && (
            <div
              className="grid gap-0 border-t-[0.5px] border-[#EAEAEA] font-semibold sticky bottom-0 bg-white"
              style={{ 
                gridTemplateColumns, 
                height: height ? 'auto' : '52px',
                minHeight: height ? '52px' : undefined,
                minWidth: 'max-content'
              }}
            >
              {/* Checkbox Total Cell */}
              {showCheckboxes && (
                <div 
                  className={`flex items-center justify-center px-4 ${
                    stickyCheckbox ? 'sticky left-0 z-20 border-r border-gray-200' : ''
                  }`}
                  style={stickyCheckbox ? { position: 'sticky', left: 0, backgroundColor: 'white' } : { backgroundColor: 'white' }}
                >
                  {/* Empty cell for checkbox column in totals */}
                </div>
              )}

              {/* S.No Total Cell */}
              {showSerialNumber && (
                <div className="flex items-center justify-center pl-5 pr-4 bg-white">
                  {/* Empty cell for S.No column in totals */}
                </div>
              )}

              {/* Other Total Cells */}
              {columns.map((column, index) => {
                const isFirstColumn = index === 0;
                
                return (
                  <div key={column.key} className="flex items-center pl-5 pr-4 bg-white">
                    {isFirstColumn ? (
                      <span className="text-sm font-semibold text-[#191A1B]">
                        Total
                      </span>
                    ) : column.showTotal ? (
                      <span className="text-sm font-semibold text-[#191A1B]">
                        {totals[column.key]?.toLocaleString() || '0'}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-[#191A1B]">
                        {/* Empty cell for non-total columns */}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pagination - Show only if enabled and more items than itemsPerPage */}
      {enablePagination && sortedData.length > itemsPerPage && (
        <div className="flex justify-end mt-4 ">
          <div className="flex items-center gap-1 text-sm bg-[#F5F5F5] rounded-lg p-0.5 ">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-8 h-8 rounded-md text-[#191A1B] transition-colors ${
                currentPage === 1
                  ? 'cursor-not-allowed'
                  : 'bg-[#191A1B] text-white'
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
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors text-[#191A1B] ${
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
                  : 'bg-[#191A1B] text-white]'
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

export default EnhancedDataTable;