
"use client"
import Button from '@/components/Button';
import EnhancedDataTable from '@/components/EnhancedDataTable';
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, CopyIcon, DotIcon } from '@phosphor-icons/react/dist/ssr';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { getOrderById,  Orders as OrderType, OrderItem, updateOrder, approveOrder, getPreviousOrder, getNextOrder } from '@/lib/api/orders';
import useProtectedRoute from '@/lib/useProtectedRoute';
import { useToast } from '@/hooks/useToast';
import { sendOrderStatusNotification } from '@/lib/notifications';

// Action types for button clicks
type ActionType = 'approve' | 'hold' | 'release' | 'resolve';

// Skeleton Components
const SkeletonBox = ({ width, height = "20px", className = "" }: { width: string; height?: string; className?: string }) => (
    <div
        className={`bg-gray-200 rounded animate-pulse ${className}`}
        style={{ width, height }}
    />
);

const OrderDetailSkeleton = () => (
    <div className='w-full bg-white p-5 min-h-screen'>
        {/* Header Skeleton */}
        <div className='flex justify-between mb-4'>
            <div className='flex items-center gap-2'>
                <SkeletonBox width="16px" height="16px" />
                <div className='flex gap-2 items-center'>
                    <SkeletonBox width="150px" height="28px" />
                    <SkeletonBox width="60px" height="24px" className="rounded-md" />
                </div>
            </div>
            <div className='flex gap-3'>
                <SkeletonBox width="60px" height="36px" className="rounded-lg" />
                <SkeletonBox width="80px" height="36px" className="rounded-lg" />
                <div className='flex items-center'>
                    <SkeletonBox width="36px" height="36px" className="rounded-l-lg" />
                    <SkeletonBox width="36px" height="36px" className="rounded-r-lg" />
                </div>
            </div>
        </div>

        {/* PO Details Skeleton */}
        <div className='flex flex-col gap-3'>
            <SkeletonBox width="100px" height="20px" />
            <div className='w-full rounded-lg border border-[#EAEAEA] p-6 shadow-sm flex justify-between'>
                <div className='flex flex-col gap-4 w-[48%]'>
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className='flex gap-2 items-center justify-between'>
                            <SkeletonBox width="120px" height="16px" />
                            <SkeletonBox width="100px" height="16px" />
                        </div>
                    ))}
                </div>
                
                <div className='flex flex-col gap-4 w-[48%]'>
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className='flex gap-2 items-center justify-between'>
                            <SkeletonBox width="120px" height="16px" />
                            <SkeletonBox width="100px" height="16px" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        {/* Order Items Skeleton */}
        <div className='pt-8'>
            <SkeletonBox width="100px" height="20px" className="mb-4" />
            
            {/* Table Header Skeleton */}
            <div className='border border-[#EAEAEA] rounded-lg overflow-hidden'>
                <div className='bg-gray-50 p-4 border-b border-[#EAEAEA]'>
                    <div className='flex gap-4'>
                        <SkeletonBox width="120px" height="16px" />
                        <SkeletonBox width="160px" height="16px" />
                        <SkeletonBox width="140px" height="16px" />
                        <SkeletonBox width="130px" height="16px" />
                        <SkeletonBox width="80px" height="16px" />
                        <SkeletonBox width="110px" height="16px" />
                        <SkeletonBox width="110px" height="16px" />
                        <SkeletonBox width="110px" height="16px" />
                    </div>
                </div>
                
                {/* Table Rows Skeleton */}
                {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className='p-4 border-b border-[#EAEAEA] last:border-b-0'>
                        <div className='flex gap-4'>
                            <SkeletonBox width="120px" height="16px" />
                            <SkeletonBox width="160px" height="16px" />
                            <SkeletonBox width="140px" height="16px" />
                            <SkeletonBox width="130px" height="16px" />
                            <SkeletonBox width="80px" height="16px" />
                            <SkeletonBox width="110px" height="16px" />
                            <SkeletonBox width="110px" height="16px" />
                            <SkeletonBox width="110px" height="16px" />
                        </div>
                    </div>
                ))}
                
                {/* Table Footer Skeleton */}
                <div className='bg-gray-50 p-4 border-t border-[#EAEAEA]'>
                    <div className='flex gap-4'>
                        <SkeletonBox width="120px" height="16px" />
                        <SkeletonBox width="160px" height="16px" />
                        <SkeletonBox width="140px" height="16px" />
                        <SkeletonBox width="130px" height="16px" />
                        <SkeletonBox width="80px" height="16px" />
                        <SkeletonBox width="110px" height="16px" />
                        <SkeletonBox width="110px" height="16px" />
                        <SkeletonBox width="110px" height="16px" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const OrderDetailPage = () => {
    const permissionLoading = useProtectedRoute(['orders']);
    const params = useParams<{ orderId: string }>();
    const orderId = params?.orderId;
    const router = useRouter();
    const toast = useToast();
    const [previousOrderId, setPreviousOrderId] = useState<string | null>(null);
const [nextOrderId, setNextOrderId] = useState<string | null>(null);

    const [order, setOrder] = useState<OrderType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [navigationLoading, setNavigationLoading] = useState(false);

    const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which action is loading

    // Status labels mapping
    const statusLabels: Record<string, string> = {
        'new-order': 'New Order',
        'approved': 'Approved',
        'price-mismatch': 'Price Mismatch',
        'on-hold': 'On Hold',
        'completed': 'Completed',
        'expired': 'Expired',
        'error': 'Error',
    };

    // Mapping for status transitions
    const getNewStatus = (currentStatus: string, actionType: ActionType): string => {
        const normalizedStatus = currentStatus.toLowerCase().replace(/\s+/g, '-');
        
        switch (actionType) {
            case 'approve':
                return 'approved';
            case 'hold':
                return 'on-hold';
            case 'release':
                return 'approved'; // Released orders go back to approved'
            case 'resolve':
                return 'new-order';
            default:
                return normalizedStatus;
        }
    };

    // Function to get status styling based on status value
    const getStatusStyling = (status: string) => {
        const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
        
        switch (normalizedStatus) {
            case 'new-order':
                return 'text-[#6B21A8] bg-[#EBD6FF]';
            case 'approved':
                return 'text-[#00527C] bg-[#E0F0FF]';
            case 'price-mismatch':
                return 'text-red-700 bg-red-100';
            case 'on-hold':
                return 'text-[#92400E] bg-[#FFEDD5]';
            case 'completed':
                return 'text-[#0C5132] bg-[#CDFEE1]';
            case 'expired':
                return 'text-[#545659] bg-[#EAEAEA]';
            case 'error':
                return 'text-[#8E1F0B] bg-[#FEDAD9]';
            default:
                return 'text-purple-700 bg-purple-100'; // fallback
        }
    };

    // Fetch current order data
    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            
            try {
                setLoading(true);
                const response = await getOrderById(orderId);
                setOrder(response.order);
                setError(null);
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Failed to fetch order details');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    // Fetch navigation orders (previous and next)
    useEffect(() => {
        const fetchNavigationOrders = async () => {
            if (!orderId) return;
            
            try {
                // Fetch previous order
                try {
                    const prevOrder = await getPreviousOrder(orderId);
                    // console.log('Previous order:', prevOrder);
                    setPreviousOrderId(prevOrder?._id || null);
                } catch (prevErr) {
                    // console.log('No previous order found');
                    setPreviousOrderId(null);
                }

                // Fetch next order
                try {
                    const nextOrder = await getNextOrder(orderId);
                    // console.log('Next order:', nextOrder);
                    setNextOrderId(nextOrder?._id || null);
                } catch (nextErr) {
                    // console.log('No next order found');
                    setNextOrderId(null);
                }
            } catch (err) {
                console.error('Error fetching navigation orders:', err);
                setPreviousOrderId(null);
                setNextOrderId(null);
            }
        };

        fetchNavigationOrders();
    }, [orderId]);


    // Navigation logic



const handlePreviousOrder = async () => {
    if (previousOrderId && !navigationLoading) {
        setNavigationLoading(true);
        try {
            router.push(`/orders/${previousOrderId}`);
        } catch (error) {
            console.error('Error navigating to previous order:', error);
        } finally {
            // Reset loading state after a short delay to account for page transition
            setTimeout(() => setNavigationLoading(false), 100);
        }
    }
};

const handleNextOrder = async () => {
    if (nextOrderId && !navigationLoading) {
        setNavigationLoading(true);
        try {
            router.push(`/orders/${nextOrderId}`);
        } catch (error) {
            console.error('Error navigating to next order:', error);
        } finally {
            // Reset loading state after a short delay to account for page transition
            setTimeout(() => setNavigationLoading(false), 100);
        }
    }
};

const canNavigatePrevious = !!previousOrderId && !navigationLoading;
const canNavigateNext = !!nextOrderId && !navigationLoading;


    // Copy to clipboard function
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Copied to clipboard!');
        }).catch(() => {
            toast.error('Failed to copy to clipboard');
        });
    };

    // Function to format date from ISO string to readable format
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString; // Return original string if formatting fails
        }
    };

    // Function to capitalize the first letter of a string
    const capitalizeFirstLetter = (string: string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    // Handle action click for order status changes
    const handleActionClick = async (actionType: ActionType) => {
        if (!order || !orderId) return;

        // Prevent multiple simultaneous requests
        if (actionLoading === actionType) {
            console.log('Action already in progress:', actionType);
            return;
        }

        try {
            // Set loading state for this specific action
            setActionLoading(actionType);
            
            // Get the current status from order
            const currentStatusLabel = statusLabels[order.status || ''] || order.status || '';
            
            // Find the current status key from the label
            const currentStatusKey = Object.keys(statusLabels).find(
                key => statusLabels[key] === currentStatusLabel
            ) || order.status?.toLowerCase().replace(/\s+/g, '-') || '';
            
            // Get the new status based on action
            const newStatus = getNewStatus(currentStatusKey, actionType);
            
            console.log(`Updating status from ${currentStatusKey} to ${newStatus}`);
            
            let response;
            
            // Main order update - use the same logic as Orders component
            if (actionType === 'approve') {
                response = await approveOrder(orderId);
            } else {
                // For other actions (hold, release), use the regular updateOrder API
                const updateData: any = { status: newStatus };
                
                // Handle picklistStatus based on action type
                if (actionType === 'hold') {
                    // When putting on hold, clear the picklistStatus
                    updateData.picklistStatus = '';
                } else if (actionType === 'release' || newStatus === 'approved') {
                    // When releasing or approving, set picklistStatus to approved
                    updateData.picklistStatus = 'approved';
                    updateData.courier = '';
                }
                else if (actionType === 'resolve') {
                    // When resolving, reset to new-order
                    updateData.picklistStatus = '';
                    updateData.status = 'new-order';
                }
                
                response = await updateOrder(orderId, updateData);
            }
            
            console.log('Order updated successfully:', response);
            
            // Handle notifications separately - don't let them fail the main operation
            try {

                await sendOrderStatusNotification(order.po_number, orderId, actionType, newStatus);
                console.log('Notification sent successfully');
            } catch (notificationError) {
                console.warn('Notification failed but order was updated successfully:', notificationError);
                // Don't fail the entire operation if notification fails
            }
            
            // Refresh the order data
            const updatedOrderResponse = await getOrderById(orderId);
            setOrder(updatedOrderResponse.order);
            
        } catch (err) {
            console.error('Error updating order status:', err);
            setError('Failed to update order status. Please try again.');
            
            setTimeout(() => {
                setError(null);
            }, 5000);
            
        } finally {
            setActionLoading(null);
        }
    };

    // Function to get action buttons based on status
    const getActionButtons = () => {
        if (!order) return null;

        const currentStatus = statusLabels[order.status || ''] || order.status || '';
        const status = currentStatus.toLowerCase();
      
        
        switch (status) {
            case 'new order':
                 return (
                    <button 
                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                            actionLoading !== null 
                                ? 'bg-[#AFAFAF] text-white cursor-not-allowed' 
                                : 'bg-[#6B7FFF] text-white hover:bg-[#5A6EFF] cursor-pointer'
                        }`}
                        onClick={() => actionLoading === null && handleActionClick('approve')}
                        disabled={actionLoading !== null}
                    >
                        {actionLoading === 'approve' ? 'Updating...' : 'Approve'}
                    </button>
                );
            case 'approved':
                return (
                    <>
                        <button 
                            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                                actionLoading !== null 
                                    ? 'bg-[#AFAFAF] text-white cursor-not-allowed' 
                                    : 'bg-[#F5A623] text-white hover:bg-[#E4951A] cursor-pointer'
                            }`}
                            onClick={() => actionLoading === null && handleActionClick('hold')}
                            disabled={actionLoading !== null}
                        >
                            {actionLoading === 'hold' ? 'Updating...' : 'Hold'}
                        </button>
                        <button 
                            className="px-4 py-2 text-sm rounded-lg bg-[#AFAFAF] text-white font-medium cursor-not-allowed"
                            disabled
                        >
                            Approve
                        </button>
                    </>
                );
            case 'on hold':
                return (
                    <>
                        <button 
                            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                                actionLoading !== null 
                                    ? 'bg-[#AFAFAF] text-white cursor-not-allowed' 
                                    : 'bg-[#FF8A47] text-white hover:bg-[#FF7A33] cursor-pointer'
                            }`}
                            onClick={() => actionLoading === null && handleActionClick('release')}
                            disabled={actionLoading !== null}
                        >
                            {actionLoading === 'release' ? 'Updating...' : 'Release'}
                        </button>
                        <button 
                            className="px-4 py-2 text-sm rounded-lg bg-[#AFAFAF] text-white font-medium cursor-not-allowed"
                            disabled
                        >
                            Approve
                        </button>
                    </>
                );
            case 'error':
            case 'expired':
            case 'completed':
            default:
                return (
                    <button 
                        className="px-4 py-2 text-sm rounded-lg bg-[#AFAFAF] text-white font-medium cursor-not-allowed"
                        disabled
                    >
                        Approve
                    </button>
                );
        }
    };

    // Show loading state while checking permissions
    if (permissionLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    // Show skeleton while loading
    if (loading) {
        return <OrderDetailSkeleton />;
    }

    if (error || !order) {
        return (
            <div className='w-full bg-white p-5 min-h-screen'>
                <div className='flex justify-center items-center py-8'>
                    <div className='text-red-600'>Error: {error || 'Order not found'}</div>
                </div>
            </div>
        );
    }

    // Get PO details (handle both data.poDetails and legacy poDetails)
    const poDetails = order?.data?.poDetails || order?.poDetails;
    const items = order?.data?.items || order?.items || [];

    // Transform items for table display with error highlighting
    const tableData = items.map((item: OrderItem, index: number) => {
        // Find validation errors for this item
        const validationErrors = (order?.validationErrors as any[]) || [];
        const itemErrors = validationErrors.filter(
            (error: any) => error.itemCode === item.itemCode
        );
        
        // Check for specific error types
        const hasSkuError = itemErrors.some((error: any) => 
            error.error.toLowerCase().includes('not found') || 
            error.error.toLowerCase().includes('sku')
        );
        const hasPriceError = itemErrors.some((error: any) => 
            error.error.toLowerCase().includes('cost') || 
            error.error.toLowerCase().includes('price') ||
            error.error.toLowerCase().includes('mismatch')
        );

        return {
            id: `${index}`,
            itemCode: item.itemCode,
            itemName: item.itemName,
            productName: `Product ${item.itemCode}`,
            quantity: item.quantity,
            price: item.basicCostPrice,
            totalAmount: item.totalAmount,
            orderDate: formatDate(poDetails?.poDate) || '',
            taxAmount: item.taxAmount,
            igst: item.igst,
            cgst: item.cgst,
            // Add error flags for styling
            hasSkuError,
            hasPriceError
        };
    });

    // Table columns configuration with custom styling
    const ordersColumns = [
        { 
            key: 'itemCode', 
            label: 'Item Code', 
            width: '142px',
            render: (value: any, row: any) => (
                <span className={row.hasSkuError ? 'text-red-600 font-medium' : 'text-[#191A1B]'}>
                    {value}
                </span>
            )
        },
        { 
            key: 'itemName', 
            label: 'Item Name', 
            width: '420px',
        },
        { 
            key: 'price', 
            label: 'Basic Cost Price', 
            width: '155px',
            sortable: true,
            showTotal: true,
            render: (value: any, row: any) => (
                <span className={row.hasPriceError ? 'text-red-600 font-medium' : 'text-[#191A1B]'}>
                    {value}
                </span>
            )
        },
        { 
            key: 'quantity', 
            label: 'Qty.', 
            width: '100px',
            showTotal: true 
        },
        { 
            key: 'taxAmount', 
            label: 'Tax Amount', 
            width: '130px',
            sortable: true,
            showTotal: true 
        },
        { 
            key: 'totalAmount', 
            label: ' Total ', 
            width: '130px',
            sortable: true,
            showTotal: true 
        },
    ];

    return (
        <div className='w-full bg-white p-5 min-h-screen'>
            <div className='flex justify-between mb-4'>
                <div className='flex items-center gap-2'>
                    <div className='cursor-pointer' onClick={() => router.push('/orders')}>
                        <ArrowLeftIcon size={16} color='#545659' weight="bold" />
                    </div>

                    <div className='flex gap-2 items-center'>
                        <div className='text-xl font-medium text-[#191A1B]'>{order.po_number}</div>
                        <div className={`${getStatusStyling(order.status || '')} rounded-md py-1 px-1.5 text-xs`}>
                            {statusLabels[order.status || ''] || order.status || ''}
                        </div>
                    </div>
                </div>
                <div className='flex gap-3'>
                    {getActionButtons()}
                    <div className='flex items-center'>
                        <button 
                            className={`w-9 h-9 rounded-l-lg bg-[#FFFFFF] flex justify-center items-center border-t border-b border-l border-[#EAEAEA] transition-colors ${
                                canNavigatePrevious ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'
                            }`}
                            onClick={handlePreviousOrder}
                            disabled={!canNavigatePrevious}
                            title={canNavigatePrevious ? 'Previous Order' : 'No previous order'}
                        >
                            <CaretLeftIcon 
                                size={16} 
                                color={canNavigatePrevious ? '#191A1B' : '#AFAFAF'} 
                                weight='bold' 
                            />
                        </button>
                        <button 
                            className={`w-9 h-9 rounded-r-lg bg-[#FFFFFF] flex justify-center items-center border border-[#EAEAEA] transition-colors ${
                                canNavigateNext ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'
                            }`}
                            onClick={handleNextOrder}
                            disabled={!canNavigateNext}
                            title={canNavigateNext ? 'Next Order' : 'No next order'}
                        >
                            <CaretRightIcon 
                                size={16} 
                                color={canNavigateNext ? '#191A1B' : '#AFAFAF'} 
                                weight='bold' 
                            />
                        </button>
                        {navigationLoading && (
                            <div className='ml-2 text-sm text-gray-500'>
                                Loading...
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>

            {/* Error State for Actions */}
            {error && (
                <div className='mb-4 flex justify-center items-center py-2'>
                    <div className='text-red-600 text-sm'>{error}</div>
                </div>
            )}

            {order.status === 'error' && order?.validationErrors && Array.isArray(order.validationErrors) && order.validationErrors.length > 0 && (
                <div className='py-3 px-4 bg-[#FFE5E5] rounded-[2px] border-l-3 border-[#FF4D4D] mb-4 flex justify-between items-center '>
                    <div>
                        <div className='text-[#141C25] text-sm font-medium mb-[2px]'>
                            There {(order.validationErrors as any[]).length === 1 ? 'is' : 'are'} {(order.validationErrors as any[]).length} error{(order.validationErrors as any[]).length > 1 ? 's' : ''}:
                        </div>
                        <div className='flex flex-col'>
                            {(order.validationErrors as any[]).map((validationError: any, index: number) => {
                                // Standardize error messages
                                let standardizedError = validationError.error;
                                if (validationError.error.toLowerCase().includes('not found') || 
                                    validationError.error.toLowerCase().includes('sku')) {
                                    standardizedError = "Item code don't match the SKU Master";
                                } else if (validationError.error.toLowerCase().includes('cost') || 
                                          validationError.error.toLowerCase().includes('price') ||
                                          validationError.error.toLowerCase().includes('mismatch')) {
                                    standardizedError = "Price in PO doesn't match master rate";
                                }
                                return (
                                    <div key={index} className='text-[#141C25] text-[11px] flex gap-1 items-center'>
                                        <DotIcon size={14} weight="bold" /> 
                                        {standardizedError}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* Show 'Resolve' if only one price/cost/mismatch error and no SKU mismatch, else show 'Resolve All' */}
                    {(() => {
                        if (!Array.isArray(order.validationErrors)) return null;
                        const priceErrors = order.validationErrors.filter((validationError: any) =>
                            validationError.error.toLowerCase().includes('cost') ||
                            validationError.error.toLowerCase().includes('price') ||
                            validationError.error.toLowerCase().includes('mismatch')
                        );
                        const hasSkuMismatch = order.validationErrors.some((validationError: any) =>
                            validationError.error.toLowerCase().includes('not found') ||
                            validationError.error.toLowerCase().includes('sku')
                        );
                        if (priceErrors.length > 0 && !hasSkuMismatch) {
                            return (
                                <button onClick={() => handleActionClick('resolve')} className='text-[#fff]  bg-[#F04438] text-sm px-2 py-2 border-[#F04438] cursor-pointer border-b rounded-lg '>
                                    {priceErrors.length === 1 ? 'Resolve' : 'Resolve All'}
                                </button>
                            );
                        }
                        return null;
                    })()}
                </div>
            )}

            <div className='flex flex-col gap-3'>
                <div className='text-[#545659] text-base font-medium'>PO Details</div>
                <div className='w-full rounded-lg border border-[#EAEAEA] p-6 shadow-sm flex justify-between'>
                    <div className='flex flex-col gap-4 w-[48%]'>
                        <div className='flex gap-2 items-center justify-between'>
                            <div className='text-[#191A1B] text-base font-medium'>PO Number</div>
                            <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                                {poDetails?.poNumber || order.po_number}
                                <CopyIcon 
                                    size={16} 
                                    className="cursor-pointer hover:text-gray-600" 
                                    onClick={() => copyToClipboard(poDetails?.poNumber || order.po_number)}
                                />
                            </div>
                        </div>
                        
                        <div className='flex gap-2 items-center justify-between'>
                            <div className='text-[#191A1B] text-base font-medium'>PO Date</div>
                            <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                                {formatDate(poDetails?.poDate) || 'N/A'}
                            </div>
                        </div>
                        
                        <div className='flex gap-2 items-center justify-between'>
                            <div className='text-[#191A1B] text-base font-medium'>Delivery Date</div>
                            <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                                {formatDate(poDetails?.deliveryDate) || 'N/A'}
                            </div>
                        </div>
                        
                        <div className='flex gap-2 items-center justify-between'>
                            <div className='text-[#191A1B] text-base font-medium'>Delivered To</div>
                            <div className='flex items-center gap-1.5 text-[#90919B] text-sm w-[60%] justify-end text-right'>
                                {poDetails?.deliveredTo || poDetails?.location || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div className='flex flex-col gap-4 w-[48%]'>
                        <div className='flex gap-2 items-center justify-between'>
                            <div className='text-[#191A1B] text-base font-medium'>Buyer</div>
                            <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                                {capitalizeFirstLetter(order.source) || 'N/A'}
                            </div>
                        </div>
                        
                        <div className='flex gap-2 items-center justify-between'>
                            <div className='text-[#191A1B] text-base font-medium'>PO Expiry Date</div>
                            <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                                {formatDate(poDetails?.poExpiryDate) || 'N/A'}
                            </div>
                        </div>
                        
                        <div className='flex gap-2 items-center justify-between'>
                            <div className='text-[#191A1B] text-base font-medium'>Payment Terms</div>
                            <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                                {poDetails?.paymentTerms || 'N/A'}
                            </div>
                        </div>
                        
                        <div className='flex gap-2 items-center justify-between'>
                            <div className='text-[#191A1B] text-base font-medium'>GST No.</div>
                            <div className='flex items-center gap-1.5 text-[#90919B] text-sm'>
                                {poDetails?.gstNo || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className='pt-8'>
                <div className='text-[#545659] text-base font-medium mb-4'>Order Items</div>
                <EnhancedDataTable
                    data={tableData}
                    columns={ordersColumns}
                    enablePagination={false}
                    enableSorting={true}
                    maxVisibleRows={7}
                    height={true}
                
                />
            </div>

            {/* Download PO Document */}
          
        </div>
    );
};

export default OrderDetailPage;



