"use client"
import { ArrowElbowDownLeftIcon, ArrowsDownUpIcon, BarcodeIcon, GearIcon, HouseIcon, ListDashesIcon, MagnifyingGlassIcon, PackageIcon, ShippingContainerIcon, SmileyStickerIcon, StorefrontIcon, TagIcon, TruckIcon, UsersIcon, AlarmIcon } from '@phosphor-icons/react/dist/ssr'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface SearchModalProps {
  onClose?: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  type: 'page' | 'action';
  iconName: string; // Store icon name instead of React component
  icon: React.ReactNode; // Add icon property to match usage
  path: string;
  showInPages?: boolean;
  permission?: string; // Add permission field
}

interface StoredSearchItem {
  id: string;
  title: string;
  type: 'page' | 'action';
  iconName: string;
  path: string;
  showInPages?: boolean;
  permission?: string; // Add permission field
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState<SearchItem[]>([]);
    const router = useRouter();
    const { user } = useAuth();

    // Load recent searches from sessionStorage on component mount
    useEffect(() => {
        const stored = sessionStorage.getItem('searchModalRecents');
        if (stored) {
            try {
                const storedItems: StoredSearchItem[] = JSON.parse(stored);
                // Convert stored items back to SearchItems with icons and filter by permissions
                const itemsWithIcons = storedItems
                    .map(item => ({
                        ...item,
                        icon: getIconByName(item.iconName)
                    }))
                    .filter(hasPermission); // Only include items user has permission for
                setRecentSearches(itemsWithIcons);
            } catch (error) {
                console.error('Failed to parse recent searches:', error);
            }
        }
    }, [user]); // Re-run when user changes

    // Save recent searches to sessionStorage whenever it changes
    useEffect(() => {
        if (recentSearches.length > 0) {
            // Convert to storable format (without React components)
            const storableItems: StoredSearchItem[] = recentSearches.map(item => ({
                id: item.id,
                title: item.title,
                type: item.type,
                iconName: item.iconName,
                path: item.path,
                showInPages: item.showInPages,
                permission: item.permission
            }));
            sessionStorage.setItem('searchModalRecents', JSON.stringify(storableItems));
        }
    }, [recentSearches]);

    // Function to get icon component by name
    const getIconByName = (iconName: string) => {
        const iconMap: Record<string, React.ReactNode> = {
            'house': <HouseIcon size={16} weight="bold" color='#191A1B' />,
            'package': <PackageIcon size={16} weight="bold" color='#191A1B' />,
            'list': <ListDashesIcon size={16} weight="bold" color='#191A1B' />,
            'tag': <TagIcon size={16} weight="bold" color='#191A1B' />,
            'shipping': <ShippingContainerIcon size={16} weight="bold" color='#191A1B' />,
            'sticker': <SmileyStickerIcon size={16} weight="bold" color='#191A1B' />
        };
        return iconMap[iconName] || <HouseIcon size={16} weight="bold" color='#191A1B' />;
    };

    // Use the same menu items as SideBar for consistency
    const allItems: SearchItem[] = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'page',
            iconName: 'house',
            icon: <HouseIcon size={16} weight="bold" color='#191A1B' />,
            path: '/',
            showInPages: true,
            permission: 'dashboard'
        },
        {
            id: 'inventory',
            title: 'Inventory',
            type: 'page',
            iconName: 'package',
            icon: <PackageIcon size={16} weight="bold" color='#191A1B' />,
            path: '/inventory',
            showInPages: true,
            permission: 'inventory'
        },
        {
            id: 'expiry-alert',
            title: 'Expiry Alert',
            type: 'page',
            iconName: 'alarm',
            icon: <AlarmIcon size={16} weight="bold" color='#191A1B' />,
            path: '/expiry-alert',
            showInPages: true,
            permission: 'expiry'
        },
        {
            id: 'sales',
            title: 'Sales',
            type: 'page',
            iconName: 'truck',
            icon: <TruckIcon size={16} weight="bold" color='#191A1B' />,
            path: '/sales',
            showInPages: true,
            permission: 'categories'
        },
        {
            id: 'user',
            title: 'User',
            type: 'page',
            iconName: 'users',
            icon: <UsersIcon size={16} weight="bold" color='#191A1B' />,
            path: '/user',
            showInPages: true,
            permission: 'user'
        },
        {
            id: 'settings',
            title: 'Account & Settings',
            type: 'page',
            iconName: 'gear',
            icon: <GearIcon size={16} weight="bold" color='#191A1B' />,
            path: '/settings',
            showInPages: false
        },
    ];

    // Function to check if user has permission for an item
    const hasPermission = (item: SearchItem): boolean => {
        // If no permission is required, allow access
        if (!item.permission) return true;
        
        // If user is not loaded yet, don't show anything
        if (!user) return false;
        
        // Check if user has the required permission
        // Permissions are stored as an object with boolean values
        return user.permissions?.[item.permission] === true;
    };

    // Filter items based on user permissions
    const allowedItems = allItems.filter(hasPermission);

    // Filter items based on search query
    const filteredItems = searchQuery.trim() === '' 
        ? allowedItems 
        : allowedItems.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
          );

    // Group filtered items by type
    const pageItems = filteredItems
        .filter(item => item.type === 'page' && (searchQuery.trim() === '' ? item.showInPages !== false : true))
        .slice(0, 4); // Limit to maximum 4 items
    const actionItems = filteredItems.filter(item => item.type === 'action');

    useEffect(() => {
        // Auto-focus the input when modal opens
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Reset selected index when search results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    // Calculate total items for keyboard navigation
    const totalItems = searchQuery.trim() === '' 
        ? recentSearches.slice(0, 3).length + pageItems.length + actionItems.length
        : filteredItems.length;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && onClose) {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => 
                prev < totalItems - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => 
                prev > 0 ? prev - 1 : totalItems - 1
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (searchQuery.trim() === '') {
                // Handle recent searches when no search query
                const recentItems = recentSearches.slice(0, 3);
                const visiblePageItems = pageItems.filter(item => item.showInPages !== false);
                const allVisibleItems = [...recentItems, ...visiblePageItems, ...actionItems];
                if (allVisibleItems[selectedIndex]) {
                    handleItemClick(allVisibleItems[selectedIndex]);
                }
            } else {
                // Handle filtered results when searching
                if (filteredItems[selectedIndex]) {
                    handleItemClick(filteredItems[selectedIndex]);
                }
            }
        }
    };

    const handleItemClick = (item: SearchItem) => {
        // Only update recent searches if user has permission for the item
        if (hasPermission(item)) {
            setRecentSearches(prevRecents => {
                // Remove the item if it already exists (to avoid duplicates)
                const filteredRecents = prevRecents.filter(recent => recent.id !== item.id);
                
                // Add the clicked item to the beginning and keep only last 3
                const newRecents = [item, ...filteredRecents].slice(0, 3);
                
                return newRecents;
            });
        }
        
        // Navigate using Next.js router for SPA navigation
        router.push(item.path);
        
        if (onClose) {
            onClose();
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const renderItems = (items: SearchItem[], startIndex: number) => {
        return items.map((item, index) => {
            const globalIndex = startIndex + index;
            const isSelected = globalIndex === selectedIndex;
            
            return (
                <div 
                    key={item.id}
                    className={`text-[#191A1B] text-sm font-medium px-2 flex gap-1 items-center cursor-pointer rounded-lg py-2 ${
                        isSelected ? 'bg-[#F5F5F5]' : 'hover:bg-[#F5F5F5]'
                    }`}
                    onClick={() => handleItemClick(item)}
                >
                    {item.icon}
                    {item.title}
                </div>
            );
        });
    };

    return (
        <div className='bg-white pt-4 rounded-xl shadow-lg max-w-xl w-full mx-4'>
            <div className='flex items-center gap-1 px-2 border-b border-[#EAEAEA] pb-3'>
                <MagnifyingGlassIcon size={16} weight="bold" color='#191A1B' />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search"
                    className='rounded-lg w-full outline-none text-sm text-[#191A1B] placeholder-[#90919B]'
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {/* Show message if no results */}
            {filteredItems.length === 0 && searchQuery.trim() !== '' && (
                <div className='p-4 text-center text-[#90919B] text-sm'>
                    No results found for "{searchQuery}"
                </div>
            )}

            {/* Recent Searches Section - only show when no search query */}
            {recentSearches.length > 0 && searchQuery.trim() === '' && (
                <div className='p-2'>
                    <div className='text-[#545659] text-xs pb-2 px-2'>Recent</div>
                    <div className='flex flex-col gap-1'>
                        {recentSearches.slice(0, 3).map((item, index) => (
                            <div 
                                key={`recent-${item.id}`}
                                className={`text-[#191A1B] text-sm font-medium px-2 flex gap-1 items-center cursor-pointer rounded-lg py-2 ${
                                    index === selectedIndex ? 'bg-[#F5F5F5]' : 'hover:bg-[#F5F5F5]'
                                }`}
                                onClick={() => handleItemClick(item)}
                            >
                                {item.icon}
                                {item.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pages Section - show when there's a search query OR when no search query */}
            {pageItems.length > 0 && (
                <div className='p-2'>
                    <div className='text-[#545659] text-xs pb-2 px-2'>Pages</div>
                    <div className='flex flex-col gap-1'>
                        {renderItems(pageItems, searchQuery.trim() === '' ? recentSearches.slice(0, 3).length : 0)}
                    </div>
                </div>
            )}

            {/* Actions Section - show when there's a search query OR when no search query */}
            {actionItems.length > 0 && (
                <div className='p-2'>
                    <div className='text-[#545659] text-xs pb-2 px-2'>Actions</div>
                    <div className='flex flex-col gap-1'>
                        {renderItems(actionItems, (searchQuery.trim() === '' ? recentSearches.slice(0, 3).length : 0) + pageItems.length)}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className='border-t border-[#EAEAEA] py-2 px-2 flex justify-between items-center w-full'>
                <div className='flex items-center gap-4'>
                    <div className='text-[#90919B] text-xs flex gap-0.5 items-center'>
                        <ArrowsDownUpIcon size={12} color='#90919B' />
                        Select
                    </div>
                    <div className='text-[#90919B] text-xs flex gap-0.5 items-center'>
                        <ArrowElbowDownLeftIcon size={12} color='#90919B' />
                        Return
                    </div>
                </div>
                <div className='text-[#90919B] text-xs flex gap-0.5 items-center'>
                    <div className='text-[#90919B] text-[10px] font-bold'>ESC</div>
                    Close
                </div>
            </div>
        </div>
    )
}

export default SearchModal