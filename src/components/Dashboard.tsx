"use client"
import React, { useState, useEffect } from 'react'
import OrderDataTable from './OrderDataTable'
import { fetchDashboardOrdersData, fetchOrderStats } from '@/lib/api/dashboard';
import { fetchUsers } from '@/lib/api/user';
import { useAuth } from '@/contexts/AuthContext';
import DateButton from './DateButton';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    newOrders: 0,
    priceMismatchPOs: 0,
    labelsPrinted: 0,
    expiredPOs: 0,
    posApproved: 0,
    onHold: 0,
    posRollOver: 0,
    picklistGenerated: 0
  });
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  // Permission checking functions
  const hasPermission = (permission: string) => {
    if (!user?.permissions) return false; // No permissions set
    
    const userHasPermission = Boolean(user.permissions[permission as keyof typeof user.permissions]);
    // console.log(`Permission check for '${permission}':`, userHasPermission, 'User permissions:', user.permissions);
    return userHasPermission;
  };

  const hasOrdersPermission = () => {
    const result = hasPermission('orders');
    // console.log('hasOrdersPermission():', result);
    return result;
  };
  
  const hasUsersPermission = () => {
    const result = hasPermission('user');
    // console.log('hasUsersPermission():', result);
    return result;
  };

  // Function to fetch users data
  const fetchUsersData = async () => {
    try {
      setIsUsersLoading(true);
      const users = await fetchUsers();
      // console.log('Fetched users data:', users);
      
      if (users.users) {
        setUsersData(users.users);
      } else if (Array.isArray(users)) {
        setUsersData(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersData([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Function to fetch dashboard stats
  const fetchDashboardStats = async (startDate?: string, endDate?: string) => {
    try {
      setIsStatsLoading(true);
      const stats = await fetchOrderStats(startDate, endDate);
      // console.log('Fetched dashboard stats:', stats);
      
      setDashboardStats({
        newOrders: stats.newOrders || 0,
        priceMismatchPOs: stats.priceMismatch || 0,
        labelsPrinted: stats.labelsPrinted || 0,
        expiredPOs: stats.expiredOrders || 0,
        posApproved: stats.posApproved || 0,
        onHold: stats.onHold || 0,
        posRollOver: stats.posRollOver || 0,
        picklistGenerated: stats.picklistGenerated || 0
      });
    } catch (error) {
      // console.error('Error fetching dashboard stats:', error);
      // Keep default values if API fails
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Function to fetch orders data with date filtering
  const fetchOrders = async (startDate?: string, endDate?: string) => {
    try {
      setIsLoading(true);
      
      // console.log('Fetching orders with date range:', { startDate, endDate });
      
      // Fetch orders data with date parameters
      const data = await fetchDashboardOrdersData(startDate, endDate);
      // console.log('Fetched orders data:', data);
      
      if (data.orders) {
        setOrdersData(data.orders);
        // console.log('Set orders data:', data.orders.length, 'orders');
      } else if (Array.isArray(data)) {
        setOrdersData(data);
        // console.log('Set orders data (array format):', data.length, 'orders');
      } else {
        // console.log('No orders found in response, setting empty array');
        setOrdersData([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrdersData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    // Only proceed if user data is available
    if (!user) {
      // console.log('User not loaded yet, skipping data fetch');
      return;
    }
    
    // console.log('User loaded, checking permissions and fetching data');
    
    // Always fetch dashboard stats (for metric boxes)
    fetchDashboardStats();
    
    // Only fetch orders if user has orders permission
    if (hasOrdersPermission()) {
      // console.log('User has orders permission, fetching orders');
      fetchOrders();
    } else {
      // console.log('User does not have orders permission, skipping orders fetch');
    }
    
    // Only fetch users if user has users permission
    if (hasUsersPermission()) {
      // console.log('User has users permission, fetching users');
      fetchUsersData();
    } else {
      // console.log('User does not have users permission, skipping users fetch');
    }
  }, [user]); // Re-run when user changes

  // Handle date range selection
  const handleDateRangeSelect = (startDate: Date | null, endDate: Date | null) => {
    
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    
    // If both dates are null, clear filters and fetch all data
    if (!startDate && !endDate) {
      
      // Always fetch dashboard stats
      fetchDashboardStats();
      
      // Only fetch orders if user has permission
      if (hasOrdersPermission()) {
        fetchOrders();
      }
      return;
    }
    
    // Format dates for API call
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    
    
    // Always fetch dashboard stats with date filter
    fetchDashboardStats(startDateStr, endDateStr);
    
    // Only fetch orders if user has permission
    if (hasOrdersPermission()) {
      fetchOrders(startDateStr, endDateStr);
    }
  };

  // Function to format date from ISO string to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if formatting fails
    }
  };

  // Transform orders data for the table
  const transformedOrdersData = ordersData.map((order, index) => ({
    id: order._id || `order-${index}`,
    poDate: formatDate(order.poDate) || '',
    poNumber: order.poNumber || order.po_number || '',
    buyer: order.source ? order.source.charAt(0).toUpperCase() + order.source.slice(1) : '',
    status: order.status || 'Unknown'
  }));

  // Transform users data for Staff Activity table
  const transformedUsersData = usersData.map((user, index) => ({
    id: user._id || `user-${index}`,
    name: user.name || 'Unknown',
    login: user.lastLogin ? formatDate(user.lastLogin) : 'Never',
    status: user.status || 'Unknown'
  }));

  // Transform dashboard stats for Order & Picklist Activity table
  const transformedPicklistData = [
    { id: 'POs Approved', name: dashboardStats.posApproved.toString() },
    { id: 'POs on Hold', name: dashboardStats.onHold.toString() },
    { id: 'POs Rolled Over', name: dashboardStats.posRollOver.toString() },
    { id: 'Picklists Generated', name: dashboardStats.picklistGenerated.toString() },
  ];

  // Transform dashboard stats for Operational Alerts table
  const transformedOperationalData = [
    { id: 'New Orders', name: dashboardStats.newOrders.toString() },
    { id: 'Price Mismatch POs', name: dashboardStats.priceMismatchPOs.toString() },
    { id: 'Expired POs', name: dashboardStats.expiredPOs.toString() },
    { id: 'Labels Printed', name: dashboardStats.labelsPrinted.toString() },
  ];

  const columns = [
    { key: 'poDate', label: 'PO Date', header: 'PO Date', accessor: 'poDate', width: '120px' },
    { key: 'poNumber', label: 'PO Number', header: 'PO Number', accessor: 'poNumber', sortable: true, width: '155px' },
    { key: 'buyer', label: 'Buyer', header: 'Buyer', accessor: 'buyer' },
    { key: 'status', label: 'Status', header: 'Status', accessor: 'status' },
  ];
  
  const columns2 = [
    { key: 'id', label: 'Type', accessor: 'id', width: '142px'},
    { key: 'name', label: 'Description', accessor: 'name', width:'345px'},
  ];

  const columns3 = [
    { key: 'name', label: 'Staff Name', accessor: 'name', width: '237px'},
    { key: 'login', label: 'Last Login', accessor: 'login', width:'237px'},
    { key: 'status', label: 'Status', accessor: 'status', width:'237px'},
  ];

  const columns4 = [
    { key: 'id', label: 'Metric', accessor: 'id', width: '204px'},
    { key: 'name', label: 'Value', accessor: 'name', width:'155px'},
  ];

  const handleRowClick = (rowId: string, rowData: any) => {
    // console.log('Row clicked:', rowId, rowData);
    
    // Navigate using Order ID
    if (rowId) {
      router.push(`/orders/${rowId}`);
    }
  };

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className='p-4 h-full w-full bg-[#F5F5F5] flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-pulse bg-gray-200 h-8 w-32 rounded mb-2'></div>
          <div className='text-sm text-gray-500'>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#F5F5F5]'>
      <div className='p-2 sm:p-4 h-full w-full bg-[#F5F5F5]'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2'>
          <div className='text-xl text-[#191A1B] font-medium'>Dashboard</div>
          <div>
            <DateButton
              onDateRangeSelect={handleDateRangeSelect}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
            />
          </div>
        </div>

        {/* Metric Cards - Responsive Grid */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4'>
          <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
            <div className='text-xs sm:text-sm text-[#545659] font-medium'>New Orders</div>
            <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
              {isStatsLoading ? (
                <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
              ) : (
                dashboardStats.newOrders
              )}
            </div>
          </div>

          <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
            <div className='text-xs sm:text-sm text-[#545659] font-medium'>Forecasting</div>
            <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
              {isStatsLoading ? (
                <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
              ) : (
                dashboardStats.priceMismatchPOs
              )}
            </div>
          </div>

          {/* <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
            <div className='text-xs sm:text-sm text-[#545659] font-medium'>Labels Printed</div>
            <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
              {isStatsLoading ? (
                <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
              ) : (
                dashboardStats.labelsPrinted
              )}
            </div>
          </div> */}

          <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
            <div className='text-xs sm:text-sm text-[#545659] font-medium'>Expired</div>
            <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
              {isStatsLoading ? (
                <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
              ) : (
                dashboardStats.expiredPOs
              )}
            </div>
          </div>
        </div>

        {/* Tables Grid - Responsive Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Active POs by Status - Shows only if user has orders permission */}
          {hasOrdersPermission() && (
            <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-5 gap-2'>
                <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Active POs by Status</div>
                <div className='text-[#545659] text-xs underline cursor-pointer' onClick={() => router.push('/orders')}>
                  View all POs
                </div>
              </div>
              <OrderDataTable
                data={isLoading ? [] : transformedOrdersData}
                columns={columns}
                clickableRows={true}
                paginationThreshold={6}
                enableSorting={true}
                onRowClick={handleRowClick}
              />
            </div>
          )}

          {/* Operational Alerts */}
          {/* <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
            <div className='flex justify-between mb-3 sm:mb-5'>
              <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Operational Alerts</div>
            </div>
            <OrderDataTable
              data={isStatsLoading ? [] : transformedOperationalData}
              columns={columns2}
              clickableRows={false}
              paginationThreshold={6}
              enableSorting={true}
            />
          </div> */}

          {/* Staff Activity - Shows only if user has users permission */}
          {hasUsersPermission() && (
            <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-5 gap-2'>
                <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Staff Activity</div>
                <div onClick={() => router.push('/user')} className='text-[#545659] text-xs underline cursor-pointer'>
                  View all Users
                </div>
              </div>
              <OrderDataTable
                data={isUsersLoading ? [] : transformedUsersData}
                columns={columns3}
                clickableRows={false}
                paginationThreshold={5}
                enableSorting={true}
              />
            </div>
          )}

          {/* Order & Picklist Activity */}
            {/* <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
              <div className='flex justify-between mb-3 sm:mb-5'>
                <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Order & Picklist Activity</div>
              </div>
              <OrderDataTable
                data={isStatsLoading ? [] : transformedPicklistData}
                columns={columns4}
                clickableRows={false}
                paginationThreshold={6}
                enableSorting={true}
              />
            </div> */}
        </div>
      </div>
    </div>
  )
}

export default Dashboard