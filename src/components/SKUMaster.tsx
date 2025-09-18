"use client"
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from './Button'
import SearchBox from './SearchBox'
import DataTable from './DataTable'
import { useModal } from '@/contexts/ModalContext'
import { CheckCircleIcon, EyeIcon, PencilSimpleIcon, XCircleIcon } from '@phosphor-icons/react/dist/ssr'
import { fetchSKUs, createSKU, updateSKU, searchSKUs } from '@/lib/api/skuMaster'
import DataTableSkeletonExample from './TableSkeleton'


const SKUMaster = () => {
  const router = useRouter();
  const { openModal } = useModal();
  const [skuData, setSkuData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Handle bulk edit action
  const handleBulkEdit = (selectedData: any[]) => {
    // console.log('handleBulkEdit called with data:', selectedData);
    
    if (!selectedData || selectedData.length === 0) {
      console.log('No data selected for bulk edit');
      return;
    }
    
    // Store data temporarily in sessionStorage for the bulk edit page
    sessionStorage.setItem('bulkEditData', JSON.stringify(selectedData));
    
    // Extract the IDs and pass as URL parameters
    const selectedIds = selectedData.map(item => item.id || item._id).filter(Boolean);
    // console.log('Selected IDs:', selectedIds);
    
    // Navigate with the selected IDs as URL parameters  
    const idsParam = selectedIds.join(',');
    router.push(`/sku-master/bulk-edit?ids=${encodeURIComponent(idsParam)}`);
  };
  
  const skuColumns = [
    { key: 'internalSku', label: 'Internal SKU', width: '150px' },
    { key: 'itemName', label: 'Item Name', width: '336px' },
    { key: 'basicCostDisplay', label: 'Basic Cost Price', width: '155px' },
    { key: 'barcode', label: 'Barcode', width: '155px' },
    { key: 'dimensionsDisplay', label: 'Dimensions (L×B×H cm)', width: '200px' },
    { key: 'statusDisplay', label: 'Status', width: '100px',isStatus: true },
  ];


  // Load SKU data on component mount
  useEffect(() => {
    loadSKUs();
  }, []);

  const loadSKUs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSKUs();
      // console.log('SKU data:', data);
      
      // Transform data for display
      const transformedData = data.map((sku: any) => ({
        ...sku,
        id: sku._id as string,
        basicCostDisplay: `₹${sku.basicCost.toFixed(2)}`,
        dimensionsDisplay: `${sku.dimensions.length}×${sku.dimensions.breadth}×${sku.dimensions.height}`,
        statusDisplay: sku.status === 'active' ? 'Active' : 'Inactive',
        originalStatus: sku.status === 'inactive' ? 'deactive' : sku.status // Add for DataTable filtering
      }));
      setSkuData(transformedData);
    } catch (error) {
      console.error('Error loading SKUs:', error);
      setError('Failed to load SKUs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    
    // If search is cleared, exit search mode and reload all SKUs
    if (!value.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setIsSearchActive(true);
      const results = await searchSKUs(searchText.trim());
      
      // Transform search results for display (same as loadSKUs)
      const transformedResults = results.products.map(sku => ({
        ...sku,
        id: sku._id as string,
        basicCostDisplay: `₹${sku.basicCost.toFixed(2)}`,
        dimensionsDisplay: `${sku.dimensions.length}×${sku.dimensions.breadth}×${sku.dimensions.height}`,
        statusDisplay: sku.status === 'active' ? 'Active' : 'Inactive',
        originalStatus: sku.status === 'inactive' ? 'deactive' : sku.status // Add for DataTable filtering
      }));
      
      setSearchResults(transformedResults);
      // console.log('Search results:', transformedResults);
      setError(null);
    } catch (err) {
      console.error('Error searching SKUs:', err);
      setError('Failed to search SKUs');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSKU = () => {
    openModal('add-sku', {
      onSave: async (data: any) => {
        try {
          await createSKU(data);
          await loadSKUs(); // Refresh the list
        } catch (error) {
          console.error('Error creating SKU:', error);
          throw error;
        }
      }
    });
  };

  const handleEditSKU = (rowId: string) => {
    // Find SKU from current display data instead of just skuData
    const currentData = getCurrentDisplayData();
    const skuToEdit = currentData.find((sku: any) => sku.id === rowId);
    if (skuToEdit) {
      openModal('edit-sku', {
        _id: skuToEdit._id,
        internalSku: skuToEdit.internalSku,
        itemName: skuToEdit.itemName,
        barcode: skuToEdit.barcode,
        basicCost: skuToEdit.basicCost,
        dimensions: skuToEdit.dimensions,
        status: skuToEdit.status,
        onSave: async (data: any) => {
          try {
            await updateSKU({ _id: skuToEdit._id }, data);
            await loadSKUs(); // Refresh the list
          } catch (error) {
            console.error('Error updating SKU:', error);
            throw error;
          }
        }
      });
    }
  };

  const handleViewSKU = (rowId: string) => {
    const currentData = getCurrentDisplayData();
    const skuToView = currentData.find((sku: any) => sku.id === rowId);
    if (skuToView && skuToView.internalSku) {
      router.push(`/sku-master/${encodeURIComponent(skuToView.internalSku)}`);
    }
  };

  const handleToggleStatus = async (rowId: string) => {
    const currentData = getCurrentDisplayData();
    const skuToToggle = currentData.find((sku: any) => sku.id === rowId);
    if (skuToToggle) {
      const newStatus = skuToToggle.status === 'active' ? 'inactive' : 'active';
      const mode = newStatus === 'active' ? 'activate' : 'deactivate';
      
      // Use modal for both activation and deactivation
      openModal('sku-inactive', {
        skuName: skuToToggle.itemName || skuToToggle.internalSku,
        skuId: skuToToggle._id,
        mode: mode,
        onAction: async () => {
          try {
            await updateSKU({ _id: skuToToggle._id }, { 
              ...skuToToggle, 
              status: newStatus 
            });
            await loadSKUs(); // Refresh the list
          } catch (error) {
            console.error(`Error ${mode}ing SKU:`, error);
            setError(`Failed to ${mode} SKU`);
            throw error;
          }
        }
      });
    }
  };



  const handleRowClick = (rowId: string, rowData: any) => {
    // Navigate to SKU detail page using internalSku
    const internalSku = rowData.internalSku;
    if (internalSku) {
      router.push(`/sku-master/${encodeURIComponent(internalSku)}`);
    }
  };

  // Function to get the current data to display based on active filters
  const getCurrentDisplayData = () => {
    if (isSearchActive) {
      return searchResults;
    }
    return skuData;
  };

  // Function to get filtered actions based on row data
  const getActionsForRow = (rowData: any) => {
    const baseActions = [
      {
        id: 'view',
        label: 'View',
        icon: <EyeIcon size={16} />,
        color: '#191A1B',
        onClick: (rowId: string) => {
          handleViewSKU(rowId);
        }
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: <PencilSimpleIcon size={16} />,
        color: '#191A1B',
        onClick: (rowId: string) => {
          handleEditSKU(rowId);
        }
      }
    ];

    // Add the appropriate status action based on current status
    if (rowData.status === 'active') {
      baseActions.push({
        id: 'deactivate',
        label: 'Inactive',
        icon: <XCircleIcon size={16} />,
        color: '#F04438',
        onClick: (rowId: string) => {
          handleToggleStatus(rowId);
        }
      });
    } else {
      baseActions.push({
        id: 'activate',
        label: 'Activate',
        icon: <CheckCircleIcon size={16} />,
        color: '#10B981',
        onClick: (rowId: string) => {
          handleToggleStatus(rowId);
        }
      });
    }

    return baseActions;
  };

      // All possible actions - DataTable will filter them based on row status
      const allActions = [
        {
          id: 'view',
          label: 'View',
          icon: <EyeIcon size={16} />,
          color: '#191A1B',
          onClick: (rowId: string) => {
            handleViewSKU(rowId);
          }
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: <PencilSimpleIcon size={16} />,
          color: '#191A1B',
          onClick: (rowId: string) => {
            handleEditSKU(rowId);
          }
        },
        {
          id: 'deactivate',
          label: 'Inactive',
          icon: <XCircleIcon size={16} />,
          color: '#F04438',
          onClick: (rowId: string) => {
            handleToggleStatus(rowId);
          }
        },
        {
          id: 'activate',
          label: 'Activate',
          icon: <CheckCircleIcon size={16} />,
          color: '#10B981',
          onClick: (rowId: string) => {
            handleToggleStatus(rowId);
          }
        }
      ];


  return (
      <div className='w-full bg-white p-5 min-h-screen'>
        <div className='flex justify-between mb-4'>
            <div className='text-xl font-medium text-[#191A1B]'>SKU Master</div>
            <div className='flex gap-3'>
                <Button text='Add New SKU' error={false} onClick={handleAddSKU} />
            </div>
        </div>
        <div className='mb-4 flex justify-between items-center'>
        <SearchBox 
          searchText={searchText}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder='Search Products'
        />
        </div>
        
        {error && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2'>
            <div className='w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0'>
              <span className='text-white text-xs font-bold'>!</span>
            </div>
            <span className='text-red-700 text-sm'>{error}</span>
          </div>
        )}
        
        <div>
          {isLoading ? (
            <DataTableSkeletonExample />
          ) : getCurrentDisplayData().length === 0 ? (
            // No data state
            <div className='flex flex-col items-center justify-center py-16 px-8 bg-white border border-[#EAEAEA] rounded-lg'>
              <div className='w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-6'>
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
                    stroke="#90919B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 7V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V7"
                    stroke="#90919B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 11H16"
                    stroke="#90919B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-[#191A1B] mb-2'>
                  {isSearchActive ? 'No SKUs Found' : 'No SKUs Available'}
                </h3>
                <p className='text-sm text-[#545659] mb-6 max-w-md'>
                  {isSearchActive 
                    ? `No SKUs match your search "${searchText}". Try a different search term.`
                    : 'You haven\'t added any SKUs yet. Create your first SKU to start managing your product inventory.'
                  }
                </p>
                
                {isSearchActive && (
                  <button
                    onClick={() => {
                      setSearchText('');
                      setIsSearchActive(false);
                      setSearchResults([]);
                    }}
                    className='px-4 py-2 text-sm text-[#007BFF] hover:text-[#0056b3] underline mb-4'
                  >
                    Clear search and view all SKUs
                  </button>
                )}
                
                {!isSearchActive && (
                <div className='flex gap-3 justify-center'>
                  <button
                    onClick={handleAddSKU}
                    className='px-6 py-3 bg-[#191A1B] text-white rounded-lg text-sm font-medium hover:bg-[#2A2B2C] transition-colors flex items-center gap-2'
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Add Your First SKU
                  </button>
                  
                  <button
                    onClick={() => openModal('import-sku')}
                    className='px-6 py-3 border border-[#EAEAEA] text-[#545659] rounded-lg text-sm font-medium hover:bg-[#F5F5F5] transition-colors flex items-center gap-2'
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 10L12 15L17 10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 15V3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Import SKUs
                  </button>
                </div>
                )}
              </div>
            </div>
          ) : (
            <DataTable
              data={getCurrentDisplayData()}
              columns={skuColumns}
              onBulkEdit={handleBulkEdit}
              showActions={true}
              height={true}
              clickableRows={true}
              onRowClick={handleRowClick}
              actions={allActions}
              paginationThreshold={6}
            />
          )}
        </div>

    </div>
  )
}

export default SKUMaster