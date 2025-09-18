"use client"
import { XIcon, CaretDownIcon, WarningCircleIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useState, useRef, useEffect } from 'react'
import Button from './Button'

interface EditUserProps {
  mode: 'add' | 'edit';
  userData?: {
    firstName: string;
    lastName: string;
    email: string;
    permissions: {
      dashboard?: boolean;
      inventory?: boolean;
      expiry?: boolean;
      shipping?: boolean;
      sku?: boolean;
      buyer?: boolean;
      courier?: boolean;
      user?: boolean;
    };
  };
  onClose: () => void;
  onSave: (data: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    permissions: {
      dashboard?: boolean;
      inventory?: boolean;
      expiry?: boolean;
      shipping?: boolean;
      sku?: boolean;
      buyer?: boolean;
      courier?: boolean;
      user?: boolean;
    }; 
  }) => void;
}

const EditUser: React.FC<EditUserProps> = ({  
    mode,
    userData,
    onClose,
    onSave
}) => {
      const [firstName, setFirstName] = useState(userData?.firstName || '');
      const [lastName, setLastName] = useState(userData?.lastName || '');
      const [email, setEmail] = useState(userData?.email || '');
      const [permissions, setPermissions] = useState<{
        dashboard?: boolean;
        inventory?: boolean;
        expiry?: boolean;
        shipping?: boolean;
        sku?: boolean;
        buyer?: boolean;
        courier?: boolean;
        user?: boolean;
      }>(userData?.permissions || {});
      const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
      const [isPermissionsDropdownOpen, setIsPermissionsDropdownOpen] = useState(false);
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [emailError, setEmailError] = useState<string | null>(null);
      
      // Ref for permissions dropdown
      const permissionsDropdownRef = useRef<HTMLDivElement>(null);
    
      const roleOptions = ['Admin', 'Manager', 'Operator'];
      const permissionOptions = [
        { key: 'dashboard', label: 'Dashboard Access' },
        { key: 'inventory', label: 'Inventory Management' },
        { key: 'expiry', label: 'Expiry Alert' },
        { key: 'shipping', label: 'Shipping Manifest' },
        { key: 'sku', label: 'SKU Master Management' },
        { key: 'buyer', label: 'Buyer Management' },
        { key: 'courier', label: 'Courier Management' },
        { key: 'user', label: 'User Management' }
      ];
    
      // Effect to handle clicks outside the permissions dropdown
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (permissionsDropdownRef.current && !permissionsDropdownRef.current.contains(event.target as Node)) {
            setIsPermissionsDropdownOpen(false);
          }
        };

        if (isPermissionsDropdownOpen) {
          document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, [isPermissionsDropdownOpen]);
    
      const handleSave = async () => {
        // Clear previous errors
        setError(null);
        setEmailError(null);
        
        // Validate required fields
        if (!firstName.trim()) {
          setError('Please enter a first name');
          return;
        }
        
        if (!lastName.trim()) {
          setError('Please enter a last name');
          return;
        }
        
        if (!email.trim()) {
          setEmailError('Please enter an email address');
          return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setEmailError('Invalid email');
          return;
        }
        
        if (Object.values(permissions).every(value => !value)) {
          setError('Please select at least one permission');
          return;
        }

        setIsLoading(true);
        try {
          const data = { firstName, lastName, email, permissions };
          await onSave(data);
          onClose();
        } catch (error: any) {
          console.error('Error saving user:', error);
          
          // Handle different types of errors
          if (error?.response?.data?.message) {
            // Check if it's an email-related error
            const errorMessage = error.response.data.message;
            if (errorMessage.toLowerCase().includes('email') && 
                (errorMessage.toLowerCase().includes('taken') || 
                 errorMessage.toLowerCase().includes('exists') || 
                 errorMessage.toLowerCase().includes('already'))) {
              setEmailError('Email has already been taken');
            } else {
              setError(errorMessage);
            }
          } else if (error?.message) {
            // General error with message
            setError(error.message);
          } else {
            // Fallback error message
            setError('Failed to save user. Please try again.');
          }
        } finally {
          setIsLoading(false);
        }
      };


      const handlePermissionToggle = (permissionKey: string) => {
        setPermissions(prev => ({
          ...prev,
          [permissionKey]: !prev[permissionKey as keyof typeof prev]
        }));
      };

      const getPermissionsDisplayText = () => {
        const selectedPermissions = Object.entries(permissions).filter(([key, value]) => value);
        if (selectedPermissions.length === 0) return 'Select permissions';
        if (selectedPermissions.length === 1) {
          const option = permissionOptions.find(opt => opt.key === selectedPermissions[0][0]);
          return option?.label || selectedPermissions[0][0];
        }
        return `${selectedPermissions.length} permissions selected`;
      };
  return (
    <div className='bg-white p-6 rounded-xl shadow-lg max-w-xl w-full'>
        <div className='flex justify-between items-center mb-4'>
            <div className='text-[#191A1B] font-medium text-base'>
              {mode === 'add' ? 'Add New User' : 'Edit User'}
            </div>
            <XIcon size={16} color='#191A1B' className='cursor-pointer' onClick={onClose} />
        </div>
        
        {error && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2'>
            <div className='w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0'>
              <span className='text-white text-xs font-bold'>!</span>
            </div>
            <span className='text-red-700 text-sm'>{error}</span>
          </div>
        )}
        
        <div className='flex flex-col gap-4'>
            <div className='flex justify-between items-center gap-4'>
                <div className='flex flex-col gap-2 flex-1'>
              <div className='text-[#545659] text-sm font-medium'>First name</div>
              <input 
                  type='text' 
                  placeholder='Enter first name' 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className='rounded-lg p-3 text-sm text-[#191A1B] bg-[#FAFAFA] w-full border border-[#F5F5F5] outline-none'
              />
          </div>
           <div className='flex flex-col gap-2 flex-1'>
              <div className='text-[#545659] text-sm font-medium'>Last name</div>
              <input 
                  type='text' 
                  placeholder='Enter last name' 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className='rounded-lg p-3 text-sm text-[#191A1B] bg-[#FAFAFA] w-full border border-[#F5F5F5] outline-none'
              />
          </div>
          </div>
         
          <div className='flex flex-col gap-2'>
            <div className='flex gap-1 items-center'>
              <div className='text-[#545659] text-sm font-medium'>Email</div>
              </div>
              <div className='relative'>
                <input 
                    type='email' 
                    placeholder='Enter email' 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null); // Clear error on change
                    }}
                    className={`rounded-lg p-3 text-sm text-[#191A1B] bg-[#FAFAFA] w-full outline-none pr-10 ${
                      emailError 
                        ? 'border border-red-500' 
                        : 'border border-[#F5F5F5]'
                    }`}
                />
                {emailError && (
                  <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                    <WarningCircleIcon size={16} color='#EF4444' />
                  </div>
                )}
              </div>
              {emailError && (
                <div className='text-[#F04438] text-xs'>{emailError}</div>
              )}
          </div>
           <div className='flex flex-col gap-2'>
            <div className='flex gap-1 items-center'>
              <div className='text-[#545659] text-sm font-medium'>Select permissions</div>
            </div>
            <div className='relative' ref={permissionsDropdownRef}>
              <button
                type='button'
                onClick={() => setIsPermissionsDropdownOpen(!isPermissionsDropdownOpen)}
                className='rounded-lg p-3 text-sm bg-[#FAFAFA] w-full border border-[#F5F5F5] outline-none flex justify-between items-center'
              >
                <span className={Object.values(permissions).some(value => value) ? 'text-[#191A1B]' : 'text-[#90919B]'}>
                  {getPermissionsDisplayText()}
                </span>
                <CaretDownIcon 
                  size={16} 
                  color='#90919B' 
                  className={`transition-transform ${isPermissionsDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              {isPermissionsDropdownOpen && (
                <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-[#F5F5F5] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto'>
                  {permissionOptions.map((option, index) => (
                    <div
                      key={option.key}
                      onClick={() => handlePermissionToggle(option.key)}
                      className={`p-3 text-sm hover:bg-[#F5F5F5] cursor-pointer flex items-center gap-3 ${
                        index === 0 ? 'rounded-t-lg' : ''
                      } ${
                        index === permissionOptions.length - 1 ? 'rounded-b-lg' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={permissions[option.key as keyof typeof permissions] || false}
                        onChange={() => handlePermissionToggle(option.key)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded-lg border-gray-300 text-[#191A1B] focus:ring-[#191A1B] cursor-pointer"
                      />
                      <span className='text-[#191A1B] text-sm cursor-pointer'>{option.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className='flex gap-3 justify-end'>
            <Button text="Cancel" white={true} error={false} onClick={onClose} disabled={isLoading} />
            <Button 
              text={isLoading ? 'Saving...' : (mode === 'add' ? 'Add User' : 'Save Changes')} 
              error={false} 
              onClick={handleSave}
              disabled={isLoading}
            />
          </div>
        </div>
    </div>
  )
}

export default EditUser
