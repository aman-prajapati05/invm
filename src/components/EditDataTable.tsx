"use client"
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react/dist/ssr';
import React, { useState, useRef, useEffect } from 'react';

// Generic interface for table columns
interface TableColumn {
  key: string;
  label: string;
  width?: string; // e.g., "260px", "150px", "1fr", etc.
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
  onEdit?: (rowId: string) => void;
  onDelete?: (rowId: string) => void;
  showActions?: boolean;
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onRowSelect,
  onActionClick,
  onEdit,
  onDelete,
  showActions = true,
  className = ""
}) => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? data.map(row => row.id) : [];
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
    setActiveDropdown(activeDropdown === rowId ? null : rowId);
  };

  const handleEdit = (rowId: string) => {
    console.log('Edit clicked for row:', rowId);
    onEdit?.(rowId);
    setActiveDropdown(null);
  };

  const handleDelete = (rowId: string) => {
    onDelete?.(rowId);
    setActiveDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const currentDropdown = dropdownRefs.current[activeDropdown];
        if (currentDropdown && !currentDropdown.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const isAllSelected = selectedRows.length === data.length && data.length > 0;
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length;

  // Create grid template columns string with flexible spacer
  const gridTemplateColumns = `50px ${columns.map(col => col.width || 'minmax(150px, 1fr)').join(' ')} ${showActions ? 'auto 60px' : ''}`;

  return (
    <div className={`w-full bg-white overflow-x-auto  ${className}`}>
      <div className="min-w-full bg-white overflow-visible">
        {/* Table Header */}
        <div 
          className="grid gap-0 rounded-lg bg-[#F5F5F5]" 
          style={{ gridTemplateColumns, height: '40px' }}
        >
          <div className="flex items-center rounded-lg justify-center bg-[#F5F5F5] px-4">
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
          
          {columns.map((column) => (
            <div key={column.key} className="flex items-center bg-[#F5F5F5] px-4">
              <span className="text-sm font-medium text-[#191A1B] truncate">{column.label}</span>
            </div>
          ))}
          
          {showActions && (
            <>
              <div className="bg-[#F5F5F5]" /> {/* Flexible spacer */}
              <div className="flex items-center bg-[#F5F5F5] rounded-lg px-4"></div>
            </>
          )}
        </div>

        {/* Table Rows */}
        {data.map((row) => (
          <div
            key={row.id}
            className="grid gap-0 border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white relative"
            style={{ gridTemplateColumns, height: '52px' }}
          >
            <div className="flex items-center justify-center bg-white px-4">
              <input
                type="checkbox"
                checked={selectedRows.includes(row.id)}
                onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                className="w-4 h-4 rounded-lg checked:bg-[#191A1B] checked:border-[#191A1B]"
              />
            </div>
            
            {columns.map((column) => (
              <div key={column.key} className="flex items-center bg-white px-4">
                <span className="text-sm text-[#191A1B] truncate" title={row[column.key]}>
                  {row[column.key]}
                </span>
              </div>
            ))}
            
            {showActions && (
              <>
                <div className="bg-white" /> 
                <div 
                  className="flex items-center justify-end bg-white px-4 relative" 
                  ref={(el) => { dropdownRefs.current[row.id] = el; }}
                >
                  <button 
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
                  
                  {activeDropdown === row.id && (
                    <div className='absolute top-8 right-4 flex flex-col bg-white w-36 p-0.5 rounded-lg shadow-lg border border-gray-200 z-50'>
                      <div 
                        onClick={() => handleEdit(row.id)} 
                        className='flex gap-2 cursor-pointer items-center p-2 hover:bg-gray-50 rounded transition-colors'
                      >
                        <PencilSimpleIcon size={16} color='#191A1B' />
                        <div className='text-sm text-[#191A1B]'>Edit</div>
                      </div>
                      <div 
                        onClick={() => handleDelete(row.id)} 
                        className='flex gap-2 cursor-pointer items-center p-2 hover:bg-gray-50 rounded transition-colors'
                      >
                        <TrashIcon size={16} color='#F04438' />
                        <div className='text-sm text-[#F04438] font-medium'>Delete</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTable;