"use client"
import React, { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from './Button'
import SearchBox from './SearchBox'
import DataTableSkeletonExample from './TableSkeleton'
import DataTable from './DataTable'
import { EyeIcon, PencilSimpleIcon, XCircleIcon } from '@phosphor-icons/react/dist/ssr'
import { getAllBuyers, createBuyer, updateBuyer, searchBuyers, getBuyers, deleteBuyer } from '@/lib/api/buyer'
import useProtectedRoute from '@/lib/useProtectedRoute'
import { useModal } from '@/contexts/ModalContext'

const Buyer = () => {
     const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
     const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
     const [isBuyerDropdownOpen, setIsBuyerDropdownOpen] = useState(false);
     const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
     const [buyerData, setBuyerData] = useState<any[]>([]);
     const [fetchLoading, setFetchLoading] = useState(true);
     const [isLoading, setIsLoading] = useState(false);
     const [searchText, setSearchText] = useState('');
     const [searchResults, setSearchResults] = useState<any[]>([]);
     const [isSearchActive, setIsSearchActive] = useState(false);
     const [buyerOptions, setBuyerOptions] = useState<string[]>([]);
     const dropdownRef = useRef<HTMLDivElement>(null);
     const locationDropdownRef = useRef<HTMLDivElement>(null);
     const loading = useProtectedRoute(['buyer']);
     const { openModal } = useModal();
     const router = useRouter();

     // Function to capitalize first letter of a string
     const capitalizeFirstLetter = (str: string) => {
       if (!str) return '';
       return str.charAt(0).toUpperCase() + str.slice(1);
     };

         const actions = [
           {
        id: 'view',
        label: 'View',
        icon: <EyeIcon size={16} />,
        color: '#191A1B',
        onClick: (rowId: string) => {
          // console.log('View row:', rowId);
          // Find the buyer data to get the complete row data for navigation
          const buyerToView = buyerData.find(buyer => buyer._id === rowId);
          if (buyerToView) {
            const buyerDetailData = {
              id: buyerToView._id,
              buyerId: buyerToView.buyerId,
              buyerName: buyerToView.buyerName,
              warehouses: buyerToView.warehouseCount || 0
            };
            
            // Encode the entire row data as URL parameters
            const queryParams = new URLSearchParams({
              id: buyerDetailData.id,
              buyerId: buyerDetailData.buyerId,
              buyerName: buyerDetailData.buyerName,
              warehouses: buyerDetailData.warehouses.toString()
            }).toString();
            
            router.push(`/buyer/${buyerToView.buyerId}?${queryParams}`);
          }
        }
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: <PencilSimpleIcon size={16} />,
        color: '#191A1B',
        onClick: (rowId: string) => {
          // console.log('Edit row:', rowId);
          handleEdit(rowId);
        }
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <XCircleIcon size={16} />,
        color: '#F04438',
        onClick: (rowId: string) => {
          // console.log('Delete row:', rowId);
          handleDelete(rowId);
        }
      },
    ];

     // Fetch buyers on component mount
     useEffect(() => {
       const loadBuyers = async () => {
         try {
           setFetchLoading(true);
           const buyers = await getAllBuyers();
           setBuyerData(buyers);
         } catch (error) {
           console.error('Error fetching buyers:', error);
         } finally {
           setFetchLoading(false);
         }
       };

       loadBuyers();
     }, []);

     // Fetch buyer options for dropdown
     useEffect(() => {
       const loadBuyerOptions = async () => {
         try {
           const response = await getBuyers();
           // Handle the actual response structure: { buyers: string[] }
           const buyerNames = (response as any).buyers || [];
           setBuyerOptions(buyerNames);
          //  console.log('Buyer options loaded:', buyerNames);
         } catch (error) {
           console.error('Error fetching buyer options:', error);
         }
       };

       loadBuyerOptions();
     }, []);

     // Transform API data to match DataTable format
     const transformedBuyerData = (isSearchActive ? searchResults : buyerData).map(buyer => ({
       id: buyer._id,
       buyerId: buyer.buyerId,
       buyerName: capitalizeFirstLetter(buyer.buyerName),
       warehouses: buyer.warehouseCount || 0
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
         const results = await searchBuyers(searchText.trim());
         setSearchResults(results || []);
        //  console.log('Search results:', results);
       } catch (error) {
         console.error('Error searching buyers:', error);
         setSearchResults([]);
       } finally {
         setFetchLoading(false);
       }
     };

     // Handle search text change
     const handleSearchChange = (value: string) => {
       setSearchText(value);
       
       // If search is cleared, exit search mode and reload all buyers
       if (!value.trim()) {
         setIsSearchActive(false);
         setSearchResults([]);
       }
     };
      
      const locationOptions = [
        'Mumbai',
        'Bangalore'
      ];

      // Define buyer table columns
      const buyerColumns = [
        { key: 'buyerId', label: 'Buyer ID', width: '145px' },
        { key: 'buyerName', label: 'Buyer Name', width: '152px' },
        { key: 'warehouses', label: 'Warehouses', width: '200px' },
      ];




      // Handle row click navigation
      const handleRowClick = (rowId: string, rowData: any) => {
        // console.log('Row clicked:', rowId, rowData);
        // Navigate to buyer detail page passing the entire row data
        const buyerDetailData = {
          id: rowData.id,
          buyerId: rowData.buyerId,
          buyerName: rowData.buyerName,
          warehouses: rowData.warehouses
        };
        
        // Encode the entire row data as URL parameters or use state
        const queryParams = new URLSearchParams({
          id: buyerDetailData.id,
          buyerId: buyerDetailData.buyerId,
          buyerName: buyerDetailData.buyerName,
          warehouses: buyerDetailData.warehouses.toString()
        }).toString();
        
        router.push(`/buyer/${rowData.buyerId}?${queryParams}`);
      };

      const handleEdit = (rowId: string) => {
        // console.log('Buyer handleEdit called with rowId:', rowId);
        
        const buyerToEdit = buyerData.find(buyer => buyer._id === rowId);
        // console.log('buyerToEdit:', buyerToEdit);
        
        if (buyerToEdit) {
          console.log('About to call openModal with edit-buyer');
          openModal('edit-buyer', {
            id: buyerToEdit._id,
            buyerId: buyerToEdit.buyerId,
            buyerName: buyerToEdit.buyerName,
            onSave: (buyerFormData: any) => handleEditBuyer(buyerToEdit._id, buyerFormData)
          });
          // console.log('openModal called');
        }
      };

      const handleEditBuyer = async (buyerId: string, buyerFormData: { 
        buyerId: string; 
        buyerName: string; 
      }) => {
        try {
          setIsLoading(true);
          
          await updateBuyer(buyerId, {
            buyerId: buyerFormData.buyerId,
            buyerName: buyerFormData.buyerName
          });
          
          // console.log('Buyer updated successfully');
          
          // Refresh buyers list after successful update
          const buyers = await getAllBuyers();
          setBuyerData(buyers);
          
          // Refresh buyer options for dropdown
          const buyerOptionsData = await getBuyers();
          const buyerNames = (buyerOptionsData as any).buyers || [];
          setBuyerOptions(buyerNames);
          
          // If we're in search mode, refresh search results
          if (isSearchActive && searchText.trim()) {
            const searchData = await searchBuyers(searchText.trim());
            setSearchResults(searchData || []);
          }
          
        } catch (error: any) {
          console.error('Error updating buyer:', error);
          
          // Re-throw the error so EditBuyer can catch and display it
          throw error;
        } finally {
          setIsLoading(false);
        }
      };

      const handleDelete = (rowId: string) => {
        // console.log('Delete row:', rowId);
        
        const buyerToDelete = buyerData.find(buyer => buyer._id === rowId);
        // console.log('buyerToDelete:', buyerToDelete);
        
        if (buyerToDelete) {
          // console.log('About to call openModal with delete-buyer');
          openModal('delete-buyer', {
            id: buyerToDelete._id,
            name: capitalizeFirstLetter(buyerToDelete.buyerName),
            onDelete: () => handleDeleteBuyer(buyerToDelete._id)
          });
          // console.log('openModal called');
        }
      };

      const handleDeleteBuyer = async (buyerId: string) => {
        try {
          setIsLoading(true);
          
          await deleteBuyer(buyerId);
          
          // console.log('Buyer deleted successfully');
          
          // Refresh buyers list after successful deletion
          const buyers = await getAllBuyers();
          setBuyerData(buyers);
          
          // Refresh buyer options for dropdown
          const buyerOptionsData = await getBuyers();
          const buyerNames = (buyerOptionsData as any).buyers || [];
          setBuyerOptions(buyerNames);
          
          // If we're in search mode, refresh search results
          if (isSearchActive && searchText.trim()) {
            const searchData = await searchBuyers(searchText.trim());
            setSearchResults(searchData || []);
          }
          
        } catch (error: any) {
          console.error('Error deleting buyer:', error);
          
          // Re-throw the error so DeleteBuyer can catch and display it
          throw error;
        } finally {
          setIsLoading(false);
        }
      };

      const handleSaveBuyer = async (buyerFormData: { 
        buyerId: string; 
        buyerName: string; 
      }) => {
        try {
          setIsLoading(true);
          
          await createBuyer({
            buyerId: buyerFormData.buyerId,
            buyerName: buyerFormData.buyerName
          });
          
          // console.log('Buyer created successfully');
          
          // Refresh buyers list after successful creation
          const buyers = await getAllBuyers();
          setBuyerData(buyers);
          
          // Refresh buyer options for dropdown
          const buyerOptionsData = await getBuyers();
          const buyerNames = (buyerOptionsData as any).buyers || [];
          setBuyerOptions(buyerNames);
          
          // If we're in search mode, refresh search results
          if (isSearchActive && searchText.trim()) {
            const searchData = await searchBuyers(searchText.trim());
            setSearchResults(searchData || []);
          }
          
        } catch (error: any) {
          console.error('Error creating buyer:', error);
          
          // Re-throw the error so EditBuyer can catch and display it
          throw error;
        } finally {
          setIsLoading(false);
        }
      };

      const handleAddBuyer = () => {
        openModal('add-buyer', { onSave: handleSaveBuyer });
      };

      const handleBuyerToggle = (buyer: string) => {
    setSelectedBuyers(prev => 
      prev.includes(buyer)
        ? prev.filter(b => b !== buyer)
        : [...prev, buyer]
    );
  };

  const handleLocationToggle = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleClearBuyers = () => {
    setSelectedBuyers([]);
  };

  const handleClearLocations = () => {
    setSelectedLocations([]);
  };

  const getBuyerDisplayText = () => {
    if (selectedBuyers.length === 0) return 'Buyer';
    if (selectedBuyers.length === 1) return selectedBuyers[0];
    return `${selectedBuyers.length} buyers selected`;
  };

  const getLocationDisplayText = () => {
    if (selectedLocations.length === 0) return 'Location';
    if (selectedLocations.length === 1) return selectedLocations[0];
    return `${selectedLocations.length} locations selected`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBuyerDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
        <div className='w-full bg-white p-5 min-h-screen'>
        <div className='flex justify-between mb-4'>
            <div className='text-xl font-medium text-[#191A1B]'>Buyer</div>
            <div className='flex gap-3'>
                <Button text='Add New Buyer' error={false} onClick={handleAddBuyer}/>
            </div>
        </div>
           <div className='mb-4 flex justify-between items-center'>
        <SearchBox 
          searchText={searchText}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Search buyers..."
        />
        </div>
        <div>
          {fetchLoading ? (
            <DataTableSkeletonExample/>
          ) : transformedBuyerData.length > 0 ? (
            <DataTable
              data={transformedBuyerData}
              columns={buyerColumns}
              showActions={true}
              clickableRows={true}
              actions={actions}
              onRowClick={handleRowClick}
              showCheckbox={false} 
            />
          ) : (
            <div className='flex flex-col justify-center items-center py-12'>
              <div className='text-[#545659] text-lg mb-2'>
                {isSearchActive ? 'No buyers found' : 'No buyers available'}
              </div>
              <div className='text-[#90919B] text-sm'>
                {isSearchActive 
                  ? 'Try adjusting your search terms or clear the search to see all buyers'
                  : 'Start by adding your first buyer'
                }
              </div>
            </div>
          )}
        </div>

    </div>
  )
}

export default Buyer