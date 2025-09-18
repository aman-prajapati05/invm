"use client"

import React, { useState, useRef, useEffect } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';

// Generic interface for dropdown options
interface DropdownOption {
  label: string;
  value: string;
}

// Generic interface for table columns
interface TableColumn {
  key: string;
  label: string;
  width?: string;
  type?: 'text' | 'dropdown' | 'status' | 'number';
  dropdownOptions?: DropdownOption[];
  placeholder?: string;
  isStatus?: boolean;
  editable?: boolean; // New prop to control if column is editable
}

// Generic interface for table data
interface TableRow {
  id: string;
  [key: string]: any;
}

interface BulkEditTableProps {
  data: TableRow[];
  columns: TableColumn[];
  onDataChange?: (updatedData: TableRow[]) => void;
  className?: string;
}

const BulkEditTable: React.FC<BulkEditTableProps> = ({
  data,
  columns,
  onDataChange,
  className = "",
}) => {
  const [editableData, setEditableData] = useState<TableRow[]>(data);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get all data for editing (no pagination)
  const currentData = editableData;

  // Status formatting function
  const getStatusDisplay = (status: string) => {
    if (!status) return { text: '', className: '' };
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'active') {
      return {
        text: 'Active',
        className: 'bg-[#ECFDF3] text-[#027A48] border-[#D1FADF]'
      };
    } else if (lowerStatus === 'inactive' || lowerStatus === 'deactive') {
      return {
        text: 'Inactive',
        className: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]'
      };
    }
    return {
      text: status,
      className: 'bg-gray-100 text-gray-600 border-gray-200'
    };
  };

  // Handle cell value change
  const handleCellChange = (rowId: string, columnKey: string, value: string) => {
    const newData = editableData.map(row => 
      row.id === rowId ? { ...row, [columnKey]: value } : row
    );
    setEditableData(newData);
    onDataChange?.(newData);
  };

  // Handle dropdown change
  const handleDropdownChange = (rowId: string, columnKey: string, value: string) => {
    handleCellChange(rowId, columnKey, value);
    setActiveDropdown(null);
  };

  // Handle dropdown click
  const handleDropdownClick = (dropdownId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && dropdownRefs.current[activeDropdown] && 
          !dropdownRefs.current[activeDropdown]?.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Update internal data when prop changes
  useEffect(() => {
    setEditableData(data);
  }, [data]);

  // Create grid template columns string
  const gridTemplateColumns = `${columns.map(col => col.width || 'minmax(150px, 1fr)').join(' ')}`;
  
  // Calculate minimum width for horizontal scrolling
  const minTableWidth = columns.reduce((acc, col) => {
    if (col.width && col.width.includes('px')) {
      return acc + parseInt(col.width);
    }
    return acc + 150; // Default minimum width
  }, 0);

  const renderCellContent = (row: TableRow, column: TableColumn) => {
    const cellValue = row[column.key];
    const dropdownId = `${row.id}-${column.key}`;

    // If column is not editable, just display the value
    if (column.editable === false) {
      if (column.isStatus) {
        const statusDisplay = getStatusDisplay(cellValue);
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusDisplay.className}`}>
            {statusDisplay.text}
          </span>
        );
      }
      return <span className="text-sm text-[#191A1B]">{cellValue || ''}</span>;
    }

    // Handle dropdown columns
    if (column.type === 'dropdown') {
      return (
        <div className="relative w-full" ref={el => { dropdownRefs.current[dropdownId] = el; }}>
          <button
            onClick={(e) => handleDropdownClick(dropdownId, e)}
            className="w-full text-left text-sm text-[#191A1B] bg-transparent hover:bg-[#F9FAFB] focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-[#191A1B] rounded px-2 py-1 transition-all flex items-center justify-between min-h-[32px]"
          >
            <span>{cellValue || column.placeholder || 'Select...'}</span>
            <CaretDownIcon 
              size={14} 
              color='#545659' 
              className={`transition-transform flex-shrink-0 ml-2 ${activeDropdown === dropdownId ? 'rotate-180' : ''}`}
            />
          </button>
          
          {activeDropdown === dropdownId && column.dropdownOptions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
              {column.dropdownOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDropdownChange(row.id, column.key, option.value)}
                  className="w-full text-left px-3 py-2 text-sm text-[#191A1B] hover:bg-[#F5F5F5] transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Handle status columns (editable)
    if (column.isStatus) {
      const statusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ];
      
      return (
        <div className="relative w-full" ref={el => { dropdownRefs.current[dropdownId] = el; }}>
          <button
            onClick={(e) => handleDropdownClick(dropdownId, e)}
            className="w-full text-left bg-transparent hover:bg-[#F9FAFB] focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-[#191A1B] rounded px-2 py-1 transition-all flex items-center justify-between min-h-[32px]"
          >
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusDisplay(cellValue).className}`}>
              {getStatusDisplay(cellValue).text}
            </span>
            <CaretDownIcon 
              size={14} 
              color='#545659' 
              className={`transition-transform flex-shrink-0 ml-2 ${activeDropdown === dropdownId ? 'rotate-180' : ''}`}
            />
          </button>
          
          {activeDropdown === dropdownId && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDropdownChange(row.id, column.key, option.value)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#F5F5F5] transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusDisplay(option.value).className}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Handle regular text/number inputs
    if (column.type === 'number') {
      return (
        <input
          type="number"
          value={cellValue || ''}
          onChange={(e) => handleCellChange(row.id, column.key, e.target.value)}
          className="w-full text-sm text-[#191A1B] bg-transparent border-none outline-none hover:bg-[#F9FAFB] focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-[#191A1B] rounded px-2 py-1 transition-all"
          placeholder={column.placeholder}
        />
      );
    }
    
    // For text fields, use textarea to allow wrapping
    const isItemName = column.key === 'itemName';
    const isAddress = column.key === 'address';
    
    return (
      <textarea
        value={cellValue || ''}
        onChange={(e) => handleCellChange(row.id, column.key, e.target.value)}
        className={`w-full text-sm text-[#191A1B] bg-transparent border-none outline-none hover:bg-[#F9FAFB] focus:bg-white focus:shadow-sm focus:ring-1 focus:ring-[#191A1B] rounded px-2 py-1 transition-all resize-none ${
          isAddress ? 'leading-5' : 
          isItemName ? 'break-words leading-normal' : 'leading-5'
        }`}
        placeholder={column.placeholder}
        ref={(el) => {
          if (el) {
            // Set initial height based on content
            el.style.height = 'auto';
            const scrollHeight = el.scrollHeight;
            el.style.height = Math.max(24, scrollHeight) + 'px';
          }
        }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          const scrollHeight = target.scrollHeight;
          target.style.height = Math.max(24, scrollHeight) + 'px';
        }}
        style={{ 
          minHeight: '24px',
          lineHeight: isAddress ? '1.25' : isItemName ? '1.5' : '1.25',
          height: 'auto',
          wordBreak: isItemName ? 'break-word' : 'normal',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden'
        }}
      />
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Table Container */}
      <div className="w-full bg-white overflow-x-auto border border-[#EAEAEA] rounded-lg">
        <div 
          className="bg-white overflow-visible"
          style={{ 
            minWidth: `${minTableWidth}px`
          }}
        >
          <div className="w-full bg-white overflow-visible">
            {/* Header Row */}
            <div
              className="grid gap-0 bg-[#F9FAFB] border-b border-[#EAEAEA] sticky top-0 z-10"
              style={{ 
                gridTemplateColumns, 
                height: '52px',
                minWidth: '100%'
              }}
            >
              {columns.map((column) => (
                <div 
                  key={column.key} 
                  className="flex items-center px-4 py-3"
                >
                  <span className="text-sm font-medium text-[#191A1B]">
                    {column.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Data Rows */}
            <div className="relative">
              {currentData.map((row, index) => (
                <div
                  key={row.id}
                  className={`grid gap-0 border-b border-[#EAEAEA] last:border-b-0 hover:bg-[#F9FAFB] transition-colors relative w-full`}
                  style={{ 
                    gridTemplateColumns, 
                    minWidth: '100%'
                  }}
                >
                  {columns.map((column) => (
                    <div 
                      key={column.key} 
                      className="flex px-4 py-3 items-start"
                    >
                      <div className="w-full">
                        {renderCellContent(row, column)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEditTable;
