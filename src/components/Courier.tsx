"use client"
import React, { useState, useEffect } from 'react'
import Button from './Button'
import SearchBox from './SearchBox'
import DataTable from './DataTable'
import DataTableSkeletonExample from './TableSkeleton'
import { useModal } from '@/contexts/ModalContext'
import { createCourier, fetchCouriers, updateCourier, deleteCourier, searchCouriers } from '@/lib/api/couriers'
import useProtectedRoute from '@/lib/useProtectedRoute'
import { CheckCircleIcon, PencilSimpleIcon, XCircleIcon } from '@phosphor-icons/react/dist/ssr'


const Courier = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [courierData, setCourierData] = useState<any[]>([]);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const loading = useProtectedRoute(['courier']);
    const { openModal } = useModal();

    // Fetch couriers on component mount
    useEffect(() => {
      const loadCouriers = async () => {
        try {
          setFetchLoading(true);
          const couriers = await fetchCouriers();
          setCourierData(couriers);
        } catch (error) {
          console.error('Error fetching couriers:', error);
        } finally {
          setFetchLoading(false);
        }
      };

      loadCouriers();
    }, []);

    // Transform API data to match DataTable format
    const transformedCourierData = (isSearchActive ? searchResults : courierData).map(courier => ({
      id: courier._id,
      name: courier.courierName,
      code: courier.courierCode || 'N/A'
    }));

    // Handle search
    const handleSearch = async () => {
      if (!searchText.trim()) {
        setIsSearchActive(false);
        setSearchResults([]);
        return;
      }

      try {
        setFetchLoading(true);
        setIsSearchActive(true);
        const results = await searchCouriers(searchText.trim());
        setSearchResults(results || []);
        console.log('Search results:', results);
      } catch (error) {
        console.error('Error searching couriers:', error);
        setSearchResults([]);
      } finally {
        setFetchLoading(false);
      }
    };

    // Handle search text change
    const handleSearchChange = (value: string) => {
      setSearchText(value);
      
      // If search is cleared, exit search mode and reload all couriers
      if (!value.trim()) {
        setIsSearchActive(false);
        setSearchResults([]);
      }
    };

  const courierColumns = [
    { key: 'name', label: 'Courier Name', width: '260px' },
    { key: 'code', label: 'Courier Code', width: '260px' },
  ];

  const handleRowSelect = (selectedIds: string[]) => {
    console.log('Selected rows:', selectedIds);
  };

  const handleActionClick = (rowId: string) => {
    console.log('Action clicked for row:', rowId);
  };

  const handleEditCourier = async (courierId: string, courierData: { 
    name: string; 
    code: string; 
  }) => {
    try {
      setIsLoading(true);
      
      // Create courier data for API (mapping from UI fields to API fields)
      const courierPayload = {
        courierName: courierData.name,
        courierCode: courierData.code || undefined // Only include if not empty
      };

      await updateCourier(courierId, courierPayload);
      
      console.log('Courier updated successfully');
      
      // Refresh couriers list after successful update
      const couriers = await fetchCouriers();
      setCourierData(couriers);
      
      // If we're in search mode, refresh search results
      if (isSearchActive && searchText.trim()) {
        const searchData = await searchCouriers(searchText.trim());
        setSearchResults(searchData || []);
      }
      
    } catch (error: any) {
      console.error('Error updating courier:', error);
      
      // Re-throw the error so EditCourier can catch and display it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourier = async (courierId: string) => {
    try {
      setIsLoading(true);
      
      await deleteCourier(courierId);
      
      console.log('Courier deleted successfully');
      
      // Refresh couriers list after successful deletion
      const couriers = await fetchCouriers();
      setCourierData(couriers);
      
      // If we're in search mode, refresh search results
      if (isSearchActive && searchText.trim()) {
        const searchData = await searchCouriers(searchText.trim());
        setSearchResults(searchData || []);
      }
      
    } catch (error: any) {
      console.error('Error deleting courier:', error);
      
      // Re-throw the error so DeleteCourier can catch and display it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

const handleEdit = (rowId: string) => {
  console.log('Courier handleEdit called with rowId:', rowId);
  console.log('openModal function:', openModal);
  
  const courierToEdit = courierData.find(courier => courier._id === rowId);
  console.log('courierToEdit:', courierToEdit);
  
  if (courierToEdit) {
    console.log('About to call openModal with edit-courier');
    openModal('edit-courier', {
      id: courierToEdit._id,
      name: courierToEdit.courierName,
      code: courierToEdit.courierCode || '',
      onSave: (courierFormData: any) => handleEditCourier(courierToEdit._id, courierFormData)
    });
    console.log('openModal called');
  }
};

  const handleDelete = (rowId: string) => {
    console.log('Delete row:', rowId);
    const courierToDelete = courierData.find(courier => courier._id === rowId);
    
    if (courierToDelete) {
      openModal('delete-courier', {
        id: courierToDelete._id,
        name: courierToDelete.courierName,
        onDelete: async () => await handleDeleteCourier(courierToDelete._id)
      });
    }
  };

  const handleSaveCourier = async (courierData: { 
    name: string; 
    code: string; 
  }) => {
    try {
      setIsLoading(true);
      
      // Create courier data for API (mapping from UI fields to API fields)
      const courierPayload = {
        courierName: courierData.name,
        courierCode: courierData.code || undefined // Only include if not empty
      };

      await createCourier(courierPayload);
      
      console.log('Courier created successfully');
      
      // Refresh couriers list after successful creation
      const couriers = await fetchCouriers();
      setCourierData(couriers);
      
      // If we're in search mode, refresh search results
      if (isSearchActive && searchText.trim()) {
        const searchData = await searchCouriers(searchText.trim());
        setSearchResults(searchData || []);
      }
      
    } catch (error: any) {
      console.error('Error creating courier:', error);
      
      // Re-throw the error so EditCourier can catch and display it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCourier = () => {
    openModal('add-courier', { onSave: handleSaveCourier });
  };

      const actions = [
      {
        id: 'edit',
        label: 'Edit',
        icon: <PencilSimpleIcon size={16} />,
        color: '#191A1B',
        onClick: (rowId: string) => {
          console.log('Edit row:', rowId);
          handleEdit(rowId);
        }
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <XCircleIcon size={16} />,
        color: '#F04438',
        onClick: (rowId: string) => {
          console.log('Delete row:', rowId);
          handleDelete(rowId);
        }
      },
     
    ];

  return (
    <div className='w-full bg-white p-5 min-h-screen'>
        <div className='flex justify-between mb-4'>
            <div className='text-xl font-medium text-[#191A1B]'>Courier</div>
            <div className='flex gap-3'>
                <Button text='Add New Courier' error={false} onClick={handleAddCourier}/>
            </div>
        </div>
        <div className='mb-4'>
        <SearchBox 
          searchText={searchText}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Search couriers..."
        />
        </div>
        <div>
          {fetchLoading ? (
            <DataTableSkeletonExample/>
          ) : transformedCourierData.length > 0 ? (
            <DataTable
              data={transformedCourierData}
              columns={courierColumns}
              onRowSelect={handleRowSelect}
              onActionClick={handleActionClick}
              actions={actions}
              showActions={true}
              showCheckbox={false} 
            />
          ) : (
            <div className='flex flex-col justify-center items-center py-12'>
              <div className='text-[#545659] text-lg mb-2'>
                {isSearchActive ? 'No couriers found' : 'No couriers available'}
              </div>
              <div className='text-[#90919B] text-sm'>
                {isSearchActive 
                  ? 'Try adjusting your search terms or clear the search to see all couriers'
                  : 'Start by adding your first courier'
                }
              </div>
            </div>
          )}
        </div>

    </div>
  )
}

export default Courier
