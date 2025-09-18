"use client"
import React from 'react';

// Skeleton shimmer animation
const SkeletonShimmer = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

// Generic interface for table columns
interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

interface DataTableSkeletonProps {
  columns: TableColumn[];
  rowCount?: number;
  showActions?: boolean;
  className?: string;
}

const DataTableSkeleton: React.FC<DataTableSkeletonProps> = ({
  columns,
  rowCount = 5,
  showActions = true,
  className = ""
}) => {
  // Create grid template columns string with flexible spacer
  const gridTemplateColumns = `50px ${columns.map(col => col.width || 'minmax(150px, 1fr)').join(' ')} ${showActions ? 'auto 60px' : ''}`;

  return (
    <div className={`w-full bg-white overflow-x-auto ${className}`}>
      <div className="min-w-full bg-white overflow-visible">
        {/* Table Header */}
        <div 
          className="grid gap-0 rounded-lg bg-[#F5F5F5]" 
          style={{ gridTemplateColumns, height: '40px' }}
        >
          <div className="flex items-center rounded-lg justify-center bg-[#F5F5F5] px-4">
            <div className="w-4 h-4 bg-gray-300 rounded border"></div>
          </div>
          
          {columns.map((column) => (
            <div key={column.key} className="flex items-center bg-[#F5F5F5] px-4">
              <SkeletonShimmer className="h-4 w-20" />
            </div>
          ))}
          
          {showActions && (
            <>
              <div className="bg-[#F5F5F5]" />
              <div className="flex items-center bg-[#F5F5F5] rounded-lg px-4"></div>
            </>
          )}
        </div>

        {/* Skeleton Rows */}
        {Array.from({ length: rowCount }).map((_, index) => (
          <div
            key={index}
            className="grid gap-0 border-b border-gray-100 bg-white relative"
            style={{ gridTemplateColumns, height: '52px' }}
          >
            <div className="flex items-center justify-center bg-white px-4">
              <div className="w-4 h-4 bg-gray-300 rounded border"></div>
            </div>
            
            {columns.map((column) => (
              <div key={column.key} className="flex items-center bg-white px-4">
                <SkeletonShimmer className="h-4 w-full max-w-[80%]" />
              </div>
            ))}
            
            {showActions && (
              <>
                <div className="bg-white" />
                <div className="flex items-center justify-end bg-white px-4">
                  <SkeletonShimmer className="w-4 h-4 rounded-full" />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Example usage component
const DataTableSkeletonExample = () => {
  const columns = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'email', label: 'Email', width: '250px' },
    { key: 'role', label: 'Role', width: '150px' },
    { key: 'status', label: 'Status', width: '120px' },
    { key: 'lastActive', label: 'Last Active' }
  ];

  return (
    <div className="min-h-screen">
      <div className="">
        {/* <div className="mb-4">
          <SkeletonShimmer className="h-8 w-48 mb-2" />
          <SkeletonShimmer className="h-4 w-96" />
        </div> */}
        
        <DataTableSkeleton 
          columns={columns} 
          rowCount={8}
          showActions={true}
          className="shadow-sm border border-gray-200 rounded-lg"
        />
      </div>
    </div>
  );
};

export default DataTableSkeletonExample;