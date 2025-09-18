"use client"
import React, { useState, useEffect } from 'react'
import Button from './Button'
import DataTable from './DataTable'
import { useModal } from '@/contexts/ModalContext'
import { createUser, fetchUsers, updateUser, resendInvite,deleteUser } from '@/lib/api/user'
import useProtectedRoute from '@/lib/useProtectedRoute'
import DataTableSkeletonExample from './TableSkeleton'
import { PencilSimpleIcon, CheckCircleIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react'
import { TrashIcon, XCircleIcon } from '@phosphor-icons/react/dist/ssr'


const User = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<any[]>([]);
    const [fetchLoading, setFetchLoading] = useState(true);
    const loading = useProtectedRoute(['user']);
    const { openModal, showToast } = useModal();

    // Fetch users on component mount
    useEffect(() => {
      const loadUsers = async () => {
        try {
          setFetchLoading(true);
          const users = await fetchUsers();
          setUserData(users);
        } catch (error) {
          console.error('Error fetching users:', error);
        } finally {
          setFetchLoading(false);
        }
      };

      loadUsers();
    }, []);

    // Function to get permissions display text
    const getPermissionsText = (permissions: any) => {
      if (!permissions) return 'None';
      
      // Map permission keys to display names
      const permissionDisplayNames: { [key: string]: string } = {
        dashboard: 'Dashboard',
        inventory: 'inventory',
        picklist: 'Picklist Generation',
        label: 'Label',
        shipping: 'Shipping',
        sku: 'SKU',
        buyer: 'Buyer',
        courier: 'Courier',
        user: 'User'
      };
      
      const enabledPermissions = Object.entries(permissions)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
      
      if (enabledPermissions.length === 0) return 'None';
      
      // If all 9 permissions are enabled, show "All"
      if (enabledPermissions.length === 9) return 'All';
      
      // If 1-2 permissions, show them with display names
      if (enabledPermissions.length <= 2) {
        return enabledPermissions
          .map(key => permissionDisplayNames[key] || key)
          .join(', ');
      }
      
      // If more than 2, show first 2 with display names + count
      const firstTwo = enabledPermissions.slice(0, 2)
        .map(key => permissionDisplayNames[key] || key)
        .join(', ');
      const remaining = enabledPermissions.length - 2;
      
      return `${firstTwo}, +${remaining}...`;
    };

    // Function to format date in "22-Jun 09:10" format
    const formatLastLogin = (dateString: string) => {
      if (!dateString) return 'Never';
      
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}-${month} ${hours}:${minutes}`;
    };

    // Function to format status with styling
    const formatStatus = (status: string) => {
      const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
      
      if (status.toLowerCase() === 'active') {
        return (
          <span 
            className="px-2 py-1 rounded-md text-xs font-medium"
            style={{ backgroundColor: '#CDFEE1', color: '#0C5132' }}
          >
            {capitalizedStatus}
          </span>
        );
      } else if (status.toLowerCase() === 'invited') {
        return (
          <span 
            className="px-2 py-1 rounded-md text-xs font-medium"
            style={{ backgroundColor: '#E0F0FF', color: '#00527C' }}
          >
            {capitalizedStatus}
          </span>
        );
      } else if (status.toLowerCase() === 'deactive') {
        return (
          <span 
            className="px-2 py-1 rounded-md text-xs font-medium"
            style={{ backgroundColor: '#EAEAEA', color: '#545659' }}
          >
           Inactive
          </span>
        );
      }
      
      // Default styling for other statuses
      return (
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {capitalizedStatus}
        </span>
      );
    };

    // Transform API data to match DataTable format
    const transformedUserData = userData.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email, // Capitalize first letter
      permissions: getPermissionsText(user.permissions),
      lastLogin: formatLastLogin(user.lastLogin),
      status: formatStatus(user.status),
      originalStatus: user.status, // Keep original status for action determination
      hasLastLogin: !!user.lastLogin // Track if user has logged in before
    }));

    // Create actions array - we'll include both and handle logic in onClick
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
        id: 'deactivate',
        label: 'Deactivate',
        icon: <XCircleIcon size={16} />,
        color: '#F04438',
        onClick: (rowId: string) => {
          console.log('Deactivate row:', rowId);
          handleDeactivate(rowId);
        }
      },
      {
        id: 'activate',
        label: 'Activate',
        icon: <CheckCircleIcon size={16} />,
        color: '#10B981',
        onClick: (rowId: string) => {
          console.log('Activate row:', rowId);
          handleActivate(rowId);
        }
      },
      {
        id: 'resend-invite',
        label: 'Resend Invite',
        icon: <PaperPlaneTiltIcon size={16} />,
        color: '#2563EB',
        onClick: (rowId: string) => {
          console.log('Resend invite for row:', rowId);
          handleResendInvite(rowId);
        }
      },
      {
        id:'deleted',
        label: 'Delete',
        icon: <TrashIcon size={16} />,
        color: '#F04438',
        onClick: (rowId: string) => {
          console.log('Delete row:', rowId);
          handleDelete(rowId);
        }
      }
    ];

  const userColumns = [
    { key: 'name', label: 'Name', width: '152px' },
    { key: 'email', label: 'Email', width: '222px' },
    {key:'permissions',label:'Permissions',width:'270px'},
    {key:'lastLogin',label:'Last Login',width:'190px'},
    { key: 'status', label: 'Status', width: '135px' },

  ];

  const handleRowSelect = (selectedIds: string[]) => {
    console.log('Selected rows:', selectedIds);
  };

  const handleActionClick = (rowId: string) => {
    console.log('Action clicked for row:', rowId);
  };

  const handleEditUser = async (userId: string, userData: { 
    firstName: string; 
    lastName: string; 
    email: string;  
    permissions: {
      dashboard?: boolean;
      inventory?: boolean;
      picklist?: boolean;
      label?: boolean;
      shipping?: boolean;
      sku?: boolean;
      buyer?: boolean;
      courier?: boolean;
      user?: boolean;
    };
    password?: string;
  }) => {
    try {
      setIsLoading(true);
      console.log('Updating user with ID:', userId);
      console.log('User data:', userData);
      
      // Combine first and last name
      const name = `${userData.firstName} ${userData.lastName}`.trim();
      
      // Create user data for API
      const userPayload: any = {
        name,
        email: userData.email,
        permissions: userData.permissions
      };

      // Only include password if it's provided
      if (userData.password && userData.password.trim()) {
        userPayload.password = userData.password;
      }

      console.log('Sending payload to API:', userPayload);
      await updateUser(userId, userPayload);
      
      console.log('User updated successfully');
      
      // Refresh users list after successful update
      const users = await fetchUsers();
      setUserData(users);
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Re-throw the error so EditUser can catch and display it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = (rowId: string) => {
    console.log('Deactivate row:', rowId);
    
    const userToDeactivate = userData.find(user => user._id === rowId);
    
    if (userToDeactivate) {
      openModal('deactivate-user', {
        id: userToDeactivate._id,
        name: userToDeactivate.name,
        onDeactivate: async () => await handleDeactivateUser(userToDeactivate._id)
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Find the user to get current data
      const userToDeactivate = userData.find(user => user._id === userId);
      
      if (!userToDeactivate) {
        throw new Error('User not found');
      }

      // Create payload with updated status
      const userPayload = {
        name: userToDeactivate.name,
        email: userToDeactivate.email,
        permissions: userToDeactivate.permissions,
        status: 'deactive' // Set status to deactivated
      };

      await updateUser(userId, userPayload);
      
      console.log('User deactivated successfully');
      
      // Refresh users list after successful deactivation
      const users = await fetchUsers();
      setUserData(users);
      
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (rowId: string) => {
    console.log('Activate row:', rowId);
    
    try {
      setIsLoading(true);
      
      // Find the user to get current data
      const userToActivate = userData.find(user => user._id === rowId);
      
      if (!userToActivate) {
        throw new Error('User not found');
      }

      // Create payload with updated status
      const userPayload = {
        name: userToActivate.name,
        email: userToActivate.email,
        permissions: userToActivate.permissions,
        status: 'active' // Set status to active
      };

      await updateUser(rowId, userPayload);
      
      console.log('User activated successfully');
      
      // Refresh users list after successful activation
      const users = await fetchUsers();
      setUserData(users);
      
    } catch (error: any) {
      console.error('Error activating user:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendInvite = async (rowId: string) => {
    console.log('Resend invite for row:', rowId);
    
    try {
      setIsLoading(true);
      
      // Find the user to get current data
      const userToResend = userData.find(user => user._id === rowId);
      
      if (!userToResend) {
        throw new Error('User not found');
      }

      // Call the resend invite API
      await resendInvite(rowId);
      
      console.log('Invite resent successfully to:', userToResend.email);
      
      // Show success toast notification
      showToast('success', `Invitation resent successfully to ${userToResend.email}`);
      
    } catch (error: any) {
      console.error('Error resending invite:', error);
      
      // Show error toast notification
      const errorMessage = error.response?.data?.message || 'Failed to resend invitation';
      showToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async(rowId: string) => {
  if(!rowId){
    console.error('Invalid row ID');
    return;
  }
  try{
    await deleteUser(rowId);
    console.log('User deleted successfully');
    // Refresh users list after successful deletion
    const users = await fetchUsers();
    setUserData(users);
  }
  catch(error){
    console.error('Error deleting user:', error);
  }

  }

const handleEdit = (rowId: string) => {
  console.log('User handleEdit called with rowId:', rowId);
  console.log('openModal function:', openModal);
  
  const userToEdit = userData.find(user => user._id === rowId);
  console.log('userToEdit:', userToEdit);
  
  if (userToEdit) {
    console.log('About to call openModal with edit-user');
    
    const modalData = {
      id: userToEdit._id,
      firstName: userToEdit.name.split(' ')[0] || '',
      lastName: userToEdit.name.split(' ')[1] || '',
      email: userToEdit.email,
      permissions: userToEdit.permissions || {},
      onSave: async (userData: any) => {
        console.log('Modal onSave called with userData:', userData);
        try {
          console.log('Calling handleEditUser...');
          await handleEditUser(userToEdit._id, userData);
          console.log('handleEditUser completed');
        } catch (error) {
          console.error('Error in modal onSave:', error);
          // Re-throw error so EditUser component can handle it
          throw error;
        }
      }
    };
    
    console.log('Modal data:', modalData);
    openModal('edit-user', modalData);
    console.log('openModal called');
  }
};

  const handleSaveUser = async (userData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    permissions: {
      dashboard?: boolean;
      inventory?: boolean;
      picklist?: boolean;
      label?: boolean;
      shipping?: boolean;
      sku?: boolean;
      buyer?: boolean;
      courier?: boolean;
      user?: boolean;
    };
    password?: string;
  }) => {
    try {
      setIsLoading(true);
      
      // Combine first and last name
      const name = `${userData.firstName} ${userData.lastName}`.trim();
      
      // Create user data for API
      const userPayload = {
        name,
        email: userData.email,
        password: userData.password || 'tempPassword123',
        status: 'invited',
        permissions: userData.permissions
      };

      await createUser(userPayload);
      
      console.log('User created successfully');
      
      // Refresh users list after successful creation
      const users = await fetchUsers();
      setUserData(users);
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Re-throw the error so EditUser can catch and display it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = () => {
    openModal('add-user', { 
      onSave: async (userData: any) => {
        try {
          await handleSaveUser(userData);
        } catch (error) {
          // Re-throw error so EditUser component can handle it
          throw error;
        }
      }
    });
  };
  return (
    <div className='w-full bg-white p-5 min-h-screen'>
        <div className='flex justify-between mb-4'>
            <div className='text-xl font-medium text-[#191A1B]'>Users</div>
            <div className='flex gap-3'>
                <Button text='Add New User' error={false} onClick={handleAddUser}/>
            </div>
        </div>
        <div>
          {fetchLoading ? (
            <>
            <DataTableSkeletonExample/>
            </>
          ) : (
            <DataTable
              data={transformedUserData}
              columns={userColumns}
              onRowSelect={handleRowSelect}
              actions={actions}
              showActions={true}
              showCheckbox={false} 
              
            />
          )}
        </div>

    </div>
  )
}

export default User
