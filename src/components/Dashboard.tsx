// // // // "use client"
// // // // import React, { useState, useEffect } from 'react'
// // // // import OrderDataTable from './OrderDataTable'
// // // // import { fetchDashboardOrdersData, fetchOrderStats } from '@/lib/api/dashboard';
// // // // import { fetchUsers } from '@/lib/api/user';
// // // // import { useAuth } from '@/contexts/AuthContext';
// // // // import DateButton from './DateButton';
// // // // import { useRouter } from 'next/navigation';

// // // // const Dashboard = () => {
// // // //   const { user } = useAuth();
// // // //   const router = useRouter();
// // // //   const [ordersData, setOrdersData] = useState<any[]>([]);
// // // //   const [usersData, setUsersData] = useState<any[]>([]);
// // // //   const [isLoading, setIsLoading] = useState(true);
// // // //   const [isStatsLoading, setIsStatsLoading] = useState(true);
// // // //   const [isUsersLoading, setIsUsersLoading] = useState(true);
// // // //   const [dashboardStats, setDashboardStats] = useState({
// // // //     newOrders: 0,
// // // //     priceMismatchPOs: 0,
// // // //     labelsPrinted: 0,
// // // //     expiredPOs: 0,
// // // //     posApproved: 0,
// // // //     onHold: 0,
// // // //     posRollOver: 0,
// // // //     picklistGenerated: 0
// // // //   });
// // // //   const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
// // // //   const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

// // // //   // Permission checking functions
// // // //   const hasPermission = (permission: string) => {
// // // //     if (!user?.permissions) return false; // No permissions set
    
// // // //     const userHasPermission = Boolean(user.permissions[permission as keyof typeof user.permissions]);
// // // //     // console.log(`Permission check for '${permission}':`, userHasPermission, 'User permissions:', user.permissions);
// // // //     return userHasPermission;
// // // //   };

// // // //   const hasOrdersPermission = () => {
// // // //     const result = hasPermission('orders');
// // // //     // console.log('hasOrdersPermission():', result);
// // // //     return result;
// // // //   };
  
// // // //   const hasUsersPermission = () => {
// // // //     const result = hasPermission('user');
// // // //     // console.log('hasUsersPermission():', result);
// // // //     return result;
// // // //   };

// // // //   // Function to fetch users data
// // // //   const fetchUsersData = async () => {
// // // //     try {
// // // //       setIsUsersLoading(true);
// // // //       const users = await fetchUsers();
// // // //       // console.log('Fetched users data:', users);
      
// // // //       if (users.users) {
// // // //         setUsersData(users.users);
// // // //       } else if (Array.isArray(users)) {
// // // //         setUsersData(users);
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Error fetching users:', error);
// // // //       setUsersData([]);
// // // //     } finally {
// // // //       setIsUsersLoading(false);
// // // //     }
// // // //   };

// // // //   // Function to fetch dashboard stats
// // // //   const fetchDashboardStats = async (startDate?: string, endDate?: string) => {
// // // //     try {
// // // //       setIsStatsLoading(true);
// // // //       const stats = await fetchOrderStats(startDate, endDate);
// // // //       // console.log('Fetched dashboard stats:', stats);
      
// // // //       setDashboardStats({
// // // //         newOrders: stats.newOrders || 0,
// // // //         priceMismatchPOs: stats.priceMismatch || 0,
// // // //         labelsPrinted: stats.labelsPrinted || 0,
// // // //         expiredPOs: stats.expiredOrders || 0,
// // // //         posApproved: stats.posApproved || 0,
// // // //         onHold: stats.onHold || 0,
// // // //         posRollOver: stats.posRollOver || 0,
// // // //         picklistGenerated: stats.picklistGenerated || 0
// // // //       });
// // // //     } catch (error) {
// // // //       // console.error('Error fetching dashboard stats:', error);
// // // //       // Keep default values if API fails
// // // //     } finally {
// // // //       setIsStatsLoading(false);
// // // //     }
// // // //   };

// // // //   // Function to fetch orders data with date filtering
// // // //   const fetchOrders = async (startDate?: string, endDate?: string) => {
// // // //     try {
// // // //       setIsLoading(true);
      
// // // //       // console.log('Fetching orders with date range:', { startDate, endDate });
      
// // // //       // Fetch orders data with date parameters
// // // //       const data = await fetchDashboardOrdersData(startDate, endDate);
// // // //       // console.log('Fetched orders data:', data);
      
// // // //       if (data.orders) {
// // // //         setOrdersData(data.orders);
// // // //         // console.log('Set orders data:', data.orders.length, 'orders');
// // // //       } else if (Array.isArray(data)) {
// // // //         setOrdersData(data);
// // // //         // console.log('Set orders data (array format):', data.length, 'orders');
// // // //       } else {
// // // //         // console.log('No orders found in response, setting empty array');
// // // //         setOrdersData([]);
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Error fetching orders:', error);
// // // //       setOrdersData([]);
// // // //     } finally {
// // // //       setIsLoading(false);
// // // //     }
// // // //   };

// // // //   // Fetch initial data on component mount
// // // //   useEffect(() => {
// // // //     // Only proceed if user data is available
// // // //     if (!user) {
// // // //       // console.log('User not loaded yet, skipping data fetch');
// // // //       return;
// // // //     }
    
// // // //     // console.log('User loaded, checking permissions and fetching data');
    
// // // //     // Always fetch dashboard stats (for metric boxes)
// // // //     fetchDashboardStats();
    
// // // //     // Only fetch orders if user has orders permission
// // // //     if (hasOrdersPermission()) {
// // // //       // console.log('User has orders permission, fetching orders');
// // // //       fetchOrders();
// // // //     } else {
// // // //       // console.log('User does not have orders permission, skipping orders fetch');
// // // //     }
    
// // // //     // Only fetch users if user has users permission
// // // //     if (hasUsersPermission()) {
// // // //       // console.log('User has users permission, fetching users');
// // // //       fetchUsersData();
// // // //     } else {
// // // //       // console.log('User does not have users permission, skipping users fetch');
// // // //     }
// // // //   }, [user]); // Re-run when user changes

// // // //   // Handle date range selection
// // // //   const handleDateRangeSelect = (startDate: Date | null, endDate: Date | null) => {
    
// // // //     setSelectedStartDate(startDate);
// // // //     setSelectedEndDate(endDate);
    
// // // //     // If both dates are null, clear filters and fetch all data
// // // //     if (!startDate && !endDate) {
      
// // // //       // Always fetch dashboard stats
// // // //       fetchDashboardStats();
      
// // // //       // Only fetch orders if user has permission
// // // //       if (hasOrdersPermission()) {
// // // //         fetchOrders();
// // // //       }
// // // //       return;
// // // //     }
    
// // // //     // Format dates for API call
// // // //     const startDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
// // // //     const endDateStr = endDate ? endDate.toISOString().split('T')[0] : '';
    
    
// // // //     // Always fetch dashboard stats with date filter
// // // //     fetchDashboardStats(startDateStr, endDateStr);
    
// // // //     // Only fetch orders if user has permission
// // // //     if (hasOrdersPermission()) {
// // // //       fetchOrders(startDateStr, endDateStr);
// // // //     }
// // // //   };

// // // //   // Function to format date from ISO string to readable format
// // // //   const formatDate = (dateString: string) => {
// // // //     if (!dateString) return '';
    
// // // //     try {
// // // //       const date = new Date(dateString);
// // // //       return date.toLocaleDateString('en-US', {
// // // //         year: 'numeric',
// // // //         month: 'short',
// // // //         day: 'numeric'
// // // //       });
// // // //     } catch (error) {
// // // //       console.error('Error formatting date:', error);
// // // //       return dateString; // Return original string if formatting fails
// // // //     }
// // // //   };

// // // //   // Transform orders data for the table
// // // //   const transformedOrdersData = ordersData.map((order, index) => ({
// // // //     id: order._id || `order-${index}`,
// // // //     poDate: formatDate(order.poDate) || '',
// // // //     poNumber: order.poNumber || order.po_number || '',
// // // //     buyer: order.source ? order.source.charAt(0).toUpperCase() + order.source.slice(1) : '',
// // // //     status: order.status || 'Unknown'
// // // //   }));

// // // //   // Transform users data for Staff Activity table
// // // //   const transformedUsersData = usersData.map((user, index) => ({
// // // //     id: user._id || `user-${index}`,
// // // //     name: user.name || 'Unknown',
// // // //     login: user.lastLogin ? formatDate(user.lastLogin) : 'Never',
// // // //     status: user.status || 'Unknown'
// // // //   }));

// // // //   // Transform dashboard stats for Order & Picklist Activity table
// // // //   const transformedPicklistData = [
// // // //     { id: 'POs Approved', name: dashboardStats.posApproved.toString() },
// // // //     { id: 'POs on Hold', name: dashboardStats.onHold.toString() },
// // // //     { id: 'POs Rolled Over', name: dashboardStats.posRollOver.toString() },
// // // //     { id: 'Picklists Generated', name: dashboardStats.picklistGenerated.toString() },
// // // //   ];

// // // //   // Transform dashboard stats for Operational Alerts table
// // // //   const transformedOperationalData = [
// // // //     { id: 'New Orders', name: dashboardStats.newOrders.toString() },
// // // //     { id: 'Price Mismatch POs', name: dashboardStats.priceMismatchPOs.toString() },
// // // //     { id: 'Expired POs', name: dashboardStats.expiredPOs.toString() },
// // // //     { id: 'Labels Printed', name: dashboardStats.labelsPrinted.toString() },
// // // //   ];

// // // //   const columns = [
// // // //     { key: 'poDate', label: 'PO Date', header: 'PO Date', accessor: 'poDate', width: '120px' },
// // // //     { key: 'poNumber', label: 'PO Number', header: 'PO Number', accessor: 'poNumber', sortable: true, width: '155px' },
// // // //     { key: 'buyer', label: 'Buyer', header: 'Buyer', accessor: 'buyer' },
// // // //     { key: 'status', label: 'Status', header: 'Status', accessor: 'status' },
// // // //   ];
  
// // // //   const columns2 = [
// // // //     { key: 'id', label: 'Type', accessor: 'id', width: '142px'},
// // // //     { key: 'name', label: 'Description', accessor: 'name', width:'345px'},
// // // //   ];

// // // //   const columns3 = [
// // // //     { key: 'name', label: 'Staff Name', accessor: 'name', width: '237px'},
// // // //     { key: 'login', label: 'Last Login', accessor: 'login', width:'237px'},
// // // //     { key: 'status', label: 'Status', accessor: 'status', width:'237px'},
// // // //   ];

// // // //   const columns4 = [
// // // //     { key: 'id', label: 'Metric', accessor: 'id', width: '204px'},
// // // //     { key: 'name', label: 'Value', accessor: 'name', width:'155px'},
// // // //   ];

// // // //   const handleRowClick = (rowId: string, rowData: any) => {
// // // //     // console.log('Row clicked:', rowId, rowData);
    
// // // //     // Navigate using Order ID
// // // //     if (rowId) {
// // // //       router.push(`/orders/${rowId}`);
// // // //     }
// // // //   };

// // // //   // Show loading state while user data is being fetched
// // // //   if (!user) {
// // // //     return (
// // // //       <div className='p-4 h-full w-full bg-[#F5F5F5] flex items-center justify-center'>
// // // //         <div className='text-center'>
// // // //           <div className='animate-pulse bg-gray-200 h-8 w-32 rounded mb-2'></div>
// // // //           <div className='text-sm text-gray-500'>Loading dashboard...</div>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <div className='min-h-screen bg-[#F5F5F5]'>
// // // //       <div className='p-2 sm:p-4 h-full w-full bg-[#F5F5F5]'>
// // // //         {/* Header */}
// // // //         <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2'>
// // // //           <div className='text-xl text-[#191A1B] font-medium'>Dashboard</div>
// // // //           <div>
// // // //             <DateButton
// // // //               onDateRangeSelect={handleDateRangeSelect}
// // // //               selectedStartDate={selectedStartDate}
// // // //               selectedEndDate={selectedEndDate}
// // // //             />
// // // //           </div>
// // // //         </div>

// // // //         {/* Metric Cards - Responsive Grid */}
// // // //         <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4'>
// // // //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// // // //             <div className='text-xs sm:text-sm text-[#545659] font-medium'>New Orders</div>
// // // //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// // // //               {isStatsLoading ? (
// // // //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// // // //               ) : (
// // // //                 dashboardStats.newOrders
// // // //               )}
// // // //             </div>
// // // //           </div>

// // // //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// // // //             <div className='text-xs sm:text-sm text-[#545659] font-medium'>Forecasting</div>
// // // //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// // // //               {isStatsLoading ? (
// // // //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// // // //               ) : (
// // // //                 dashboardStats.priceMismatchPOs
// // // //               )}
// // // //             </div>
// // // //           </div>

// // // //           {/* <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// // // //             <div className='text-xs sm:text-sm text-[#545659] font-medium'>Labels Printed</div>
// // // //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// // // //               {isStatsLoading ? (
// // // //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// // // //               ) : (
// // // //                 dashboardStats.labelsPrinted
// // // //               )}
// // // //             </div>
// // // //           </div> */}

// // // //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// // // //             <div className='text-xs sm:text-sm text-[#545659] font-medium'>Expired</div>
// // // //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// // // //               {isStatsLoading ? (
// // // //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// // // //               ) : (
// // // //                 dashboardStats.expiredPOs
// // // //               )}
// // // //             </div>
// // // //           </div>
// // // //         </div>

// // // //         {/* Tables Grid - Responsive Layout */}
// // // //         <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
// // // //           {/* Active POs by Status - Shows only if user has orders permission */}
// // // //           {hasOrdersPermission() && (
// // // //             <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
// // // //               <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-5 gap-2'>
// // // //                 <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Active POs by Status</div>
// // // //                 <div className='text-[#545659] text-xs underline cursor-pointer' onClick={() => router.push('/orders')}>
// // // //                   View all POs
// // // //                 </div>
// // // //               </div>
// // // //               <OrderDataTable
// // // //                 data={isLoading ? [] : transformedOrdersData}
// // // //                 columns={columns}
// // // //                 clickableRows={true}
// // // //                 paginationThreshold={6}
// // // //                 enableSorting={true}
// // // //                 onRowClick={handleRowClick}
// // // //               />
// // // //             </div>
// // // //           )}

// // // //           {/* Operational Alerts */}
// // // //           {/* <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
// // // //             <div className='flex justify-between mb-3 sm:mb-5'>
// // // //               <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Operational Alerts</div>
// // // //             </div>
// // // //             <OrderDataTable
// // // //               data={isStatsLoading ? [] : transformedOperationalData}
// // // //               columns={columns2}
// // // //               clickableRows={false}
// // // //               paginationThreshold={6}
// // // //               enableSorting={true}
// // // //             />
// // // //           </div> */}

// // // //           {/* Staff Activity - Shows only if user has users permission */}
// // // //           {hasUsersPermission() && (
// // // //             <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
// // // //               <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-5 gap-2'>
// // // //                 <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Staff Activity</div>
// // // //                 <div onClick={() => router.push('/user')} className='text-[#545659] text-xs underline cursor-pointer'>
// // // //                   View all Users
// // // //                 </div>
// // // //               </div>
// // // //               <OrderDataTable
// // // //                 data={isUsersLoading ? [] : transformedUsersData}
// // // //                 columns={columns3}
// // // //                 clickableRows={false}
// // // //                 paginationThreshold={5}
// // // //                 enableSorting={true}
// // // //               />
// // // //             </div>
// // // //           )}

// // // //           {/* Order & Picklist Activity */}
// // // //             {/* <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
// // // //               <div className='flex justify-between mb-3 sm:mb-5'>
// // // //                 <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Order & Picklist Activity</div>
// // // //               </div>
// // // //               <OrderDataTable
// // // //                 data={isStatsLoading ? [] : transformedPicklistData}
// // // //                 columns={columns4}
// // // //                 clickableRows={false}
// // // //                 paginationThreshold={6}
// // // //                 enableSorting={true}
// // // //               />
// // // //             </div> */}
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   )
// // // // }

// // // // export default Dashboard

// // // "use client"
// // // import React, { useState, useEffect } from 'react'
// // // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
// // // import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Clock, AlertTriangle, Eye } from 'lucide-react'
// // // import OrderDataTable from './OrderDataTable'
// // // import { fetchDashboardOrdersData, fetchOrderStats } from '@/lib/api/dashboard'
// // // import { fetchUsers } from '@/lib/api/user'
// // // import { getAllSales } from '@/lib/api/sales'
// // // import { useAuth } from '@/contexts/AuthContext'
// // // import DateButton from './DateButton'
// // // import { useRouter } from 'next/navigation'

// // // interface SalesData {
// // //   _id: string
// // //   productName: string
// // //   batchCode: string
// // //   quantitySold: number
// // //   saleDate: string
// // //   createdAt: string
// // // }

// // // interface ChartData {
// // //   name: string
// // //   value: number
// // //   date?: string
// // //   sales?: number
// // //   orders?: number
// // // }

// // // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

// // // const Dashboard = () => {
// // //   const { user } = useAuth()
// // //   const router = useRouter()
// // //   const [ordersData, setOrdersData] = useState<any[]>([])
// // //   const [salesData, setSalesData] = useState<SalesData[]>([])
// // //   const [usersData, setUsersData] = useState<any[]>([])
// // //   const [isLoading, setIsLoading] = useState(true)
// // //   const [isStatsLoading, setIsStatsLoading] = useState(true)
// // //   const [isUsersLoading, setIsUsersLoading] = useState(true)
// // //   const [isSalesLoading, setIsSalesLoading] = useState(true)
// // //   const [dashboardStats, setDashboardStats] = useState({
// // //     newOrders: 0,
// // //     priceMismatchPOs: 0,
// // //     labelsPrinted: 0,
// // //     expiredPOs: 0,
// // //     posApproved: 0,
// // //     onHold: 0,
// // //     posRollOver: 0,
// // //     picklistGenerated: 0
// // //   })
// // //   const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
// // //   const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)

// // //   // Permission checking functions
// // //   const hasPermission = (permission: string) => {
// // //     if (!user?.permissions) return false
// // //     return Boolean(user.permissions[permission as keyof typeof user.permissions])
// // //   }

// // //   const hasOrdersPermission = () => hasPermission('orders')
// // //   const hasUsersPermission = () => hasPermission('user')
// // //   const hasSalesPermission = () => hasPermission('sales') || hasPermission('inventory') // Assuming sales is part of inventory

// // //   // Fetch sales data
// // //   const fetchSalesData = async () => {
// // //     try {
// // //       setIsSalesLoading(true)
// // //       const sales = await getAllSales()
// // //       setSalesData(sales)
// // //     } catch (error) {
// // //       console.error('Error fetching sales:', error)
// // //       setSalesData([])
// // //     } finally {
// // //       setIsSalesLoading(false)
// // //     }
// // //   }

// // //   // Function to fetch users data
// // //   const fetchUsersData = async () => {
// // //     try {
// // //       setIsUsersLoading(true)
// // //       const users = await fetchUsers()
// // //       if (users.users) {
// // //         setUsersData(users.users)
// // //       } else if (Array.isArray(users)) {
// // //         setUsersData(users)
// // //       }
// // //     } catch (error) {
// // //       console.error('Error fetching users:', error)
// // //       setUsersData([])
// // //     } finally {
// // //       setIsUsersLoading(false)
// // //     }
// // //   }

// // //   // Function to fetch dashboard stats
// // //   const fetchDashboardStats = async (startDate?: string, endDate?: string) => {
// // //     try {
// // //       setIsStatsLoading(true)
// // //       const stats = await fetchOrderStats(startDate, endDate)
// // //       setDashboardStats({
// // //         newOrders: stats.newOrders || 0,
// // //         priceMismatchPOs: stats.priceMismatch || 0,
// // //         labelsPrinted: stats.labelsPrinted || 0,
// // //         expiredPOs: stats.expiredOrders || 0,
// // //         posApproved: stats.posApproved || 0,
// // //         onHold: stats.onHold || 0,
// // //         posRollOver: stats.posRollOver || 0,
// // //         picklistGenerated: stats.picklistGenerated || 0
// // //       })
// // //     } catch (error) {
// // //       // Keep default values if API fails
// // //     } finally {
// // //       setIsStatsLoading(false)
// // //     }
// // //   }

// // //   // Function to fetch orders data
// // //   const fetchOrders = async (startDate?: string, endDate?: string) => {
// // //     try {
// // //       setIsLoading(true)
// // //       const data = await fetchDashboardOrdersData(startDate, endDate)
// // //       if (data.orders) {
// // //         setOrdersData(data.orders)
// // //       } else if (Array.isArray(data)) {
// // //         setOrdersData(data)
// // //       } else {
// // //         setOrdersData([])
// // //       }
// // //     } catch (error) {
// // //       console.error('Error fetching orders:', error)
// // //       setOrdersData([])
// // //     } finally {
// // //       setIsLoading(false)
// // //     }
// // //   }

// // //   // Generate chart data
// // //   const generateSalesChartData = (): ChartData[] => {
// // //     if (!salesData.length) return []
    
// // //     const last7Days = Array.from({ length: 7 }, (_, i) => {
// // //       const date = new Date()
// // //       date.setDate(date.getDate() - i)
// // //       return date.toISOString().split('T')[0]
// // //     }).reverse()

// // //     return last7Days.map(date => {
// // //       const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
// // //       const daySales = salesData.filter(sale => 
// // //         new Date(sale.saleDate).toISOString().split('T')[0] === date
// // //       )
// // //       const totalQuantity = daySales.reduce((sum, sale) => sum + sale.quantitySold, 0)
      
// // //       return {
// // //         name: dayName,
// // //         value: totalQuantity,
// // //         date: date
// // //       }
// // //     })
// // //   }

// // //   const generateOrderTrendData = (): ChartData[] => {
// // //     if (!ordersData.length) return []
    
// // //     const last7Days = Array.from({ length: 7 }, (_, i) => {
// // //       const date = new Date()
// // //       date.setDate(date.getDate() - i)
// // //       return date.toISOString().split('T')[0]
// // //     }).reverse()

// // //     return last7Days.map(date => {
// // //       const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
// // //       const dayOrders = ordersData.filter(order => 
// // //         new Date(order.poDate).toISOString().split('T')[0] === date
// // //       ).length
      
// // //       return {
// // //         name: dayName,
// // //         orders: dayOrders,
// // //         date: date
// // //       }
// // //     })
// // //   }

// // //   const generateTopProductsData = (): ChartData[] => {
// // //     if (!salesData.length) return []
    
// // //     const productSales = salesData.reduce((acc: Record<string, number>, sale) => {
// // //       acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantitySold
// // //       return acc
// // //     }, {})

// // //     return Object.entries(productSales)
// // //       .sort(([,a], [,b]) => b - a)
// // //       .slice(0, 5)
// // //       .map(([name, value]) => ({ name, value }))
// // //   }

// // //   const generateStatusDistribution = (): ChartData[] => {
// // //     if (!ordersData.length) return []
    
// // //     const statusCount = ordersData.reduce((acc: Record<string, number>, order) => {
// // //       acc[order.status] = (acc[order.status] || 0) + 1
// // //       return acc
// // //     }, {})

// // //     return Object.entries(statusCount).map(([name, value]) => ({ name, value }))
// // //   }

// // //   // Calculate key metrics
// // //   const calculateSalesMetrics = () => {
// // //     const totalSales = salesData.reduce((sum, sale) => sum + sale.quantitySold, 0)
// // //     const todaySales = salesData.filter(sale => 
// // //       new Date(sale.saleDate).toDateString() === new Date().toDateString()
// // //     ).reduce((sum, sale) => sum + sale.quantitySold, 0)
    
// // //     const yesterdayDate = new Date()
// // //     yesterdayDate.setDate(yesterdayDate.getDate() - 1)
// // //     const yesterdaySales = salesData.filter(sale => 
// // //       new Date(sale.saleDate).toDateString() === yesterdayDate.toDateString()
// // //     ).reduce((sum, sale) => sum + sale.quantitySold, 0)

// // //     const salesGrowth = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

// // //     return { totalSales, todaySales, salesGrowth }
// // //   }

// // //   // Fetch initial data
// // //   useEffect(() => {
// // //     if (!user) return
    
// // //     fetchDashboardStats()
    
// // //     if (hasOrdersPermission()) {
// // //       fetchOrders()
// // //     }
    
// // //     if (hasUsersPermission()) {
// // //       fetchUsersData()
// // //     }
    
// // //     if (hasSalesPermission()) {
// // //       fetchSalesData()
// // //     }
// // //   }, [user])

// // //   // Handle date range selection
// // //   const handleDateRangeSelect = (startDate: Date | null, endDate: Date | null) => {
// // //     setSelectedStartDate(startDate)
// // //     setSelectedEndDate(endDate)
    
// // //     if (!startDate && !endDate) {
// // //       fetchDashboardStats()
// // //       if (hasOrdersPermission()) fetchOrders()
// // //       return
// // //     }
    
// // //     const startDateStr = startDate ? startDate.toISOString().split('T')[0] : ''
// // //     const endDateStr = endDate ? endDate.toISOString().split('T')[0] : ''
    
// // //     fetchDashboardStats(startDateStr, endDateStr)
// // //     if (hasOrdersPermission()) {
// // //       fetchOrders(startDateStr, endDateStr)
// // //     }
// // //   }

// // //   // Transform data for tables
// // //   const formatDate = (dateString: string) => {
// // //     if (!dateString) return ''
// // //     try {
// // //       return new Date(dateString).toLocaleDateString('en-US', {
// // //         year: 'numeric',
// // //         month: 'short',
// // //         day: 'numeric'
// // //       })
// // //     } catch {
// // //       return dateString
// // //     }
// // //   }

// // //   const transformedOrdersData = ordersData.map((order, index) => ({
// // //     id: order._id || `order-${index}`,
// // //     poDate: formatDate(order.poDate) || '',
// // //     poNumber: order.poNumber || order.po_number || '',
// // //     buyer: order.source ? order.source.charAt(0).toUpperCase() + order.source.slice(1) : '',
// // //     status: order.status || 'Unknown'
// // //   }))

// // //   const transformedUsersData = usersData.map((user, index) => ({
// // //     id: user._id || `user-${index}`,
// // //     name: user.name || 'Unknown',
// // //     login: user.lastLogin ? formatDate(user.lastLogin) : 'Never',
// // //     status: user.status || 'Unknown'
// // //   }))

// // //   const columns = [
// // //     { key: 'poDate', label: 'PO Date', header: 'PO Date', accessor: 'poDate', width: '120px' },
// // //     { key: 'poNumber', label: 'PO Number', header: 'PO Number', accessor: 'poNumber', sortable: true, width: '155px' },
// // //     { key: 'buyer', label: 'Buyer', header: 'Buyer', accessor: 'buyer' },
// // //     { key: 'status', label: 'Status', header: 'Status', accessor: 'status' },
// // //   ]

// // //   const columns3 = [
// // //     { key: 'name', label: 'Staff Name', accessor: 'name', width: '237px'},
// // //     { key: 'login', label: 'Last Login', accessor: 'login', width:'237px'},
// // //     { key: 'status', label: 'Status', accessor: 'status', width:'237px'},
// // //   ]

// // //   const handleRowClick = (rowId: string) => {
// // //     if (rowId) {
// // //       router.push(`/orders/${rowId}`)
// // //     }
// // //   }

// // //   const salesMetrics = calculateSalesMetrics()
// // //   const salesChartData = generateSalesChartData()
// // //   const orderTrendData = generateOrderTrendData()
// // //   const topProductsData = generateTopProductsData()
// // //   const statusDistribution = generateStatusDistribution()

// // //   if (!user) {
// // //     return (
// // //       <div className='p-4 h-full w-full bg-[#F5F5F5] flex items-center justify-center'>
// // //         <div className='text-center'>
// // //           <div className='animate-pulse bg-gray-200 h-8 w-32 rounded mb-2'></div>
// // //           <div className='text-sm text-gray-500'>Loading dashboard...</div>
// // //         </div>
// // //       </div>
// // //     )
// // //   }

// // //   return (
// // //     <div className='min-h-screen bg-[#F5F5F5]'>
// // //       <div className='p-2 sm:p-4 h-full w-full bg-[#F5F5F5]'>
// // //         {/* Header */}
// // //         <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2'>
// // //           <div className='text-xl text-[#191A1B] font-medium'>Dashboard</div>
// // //           <div>
// // //             <DateButton
// // //               onDateRangeSelect={handleDateRangeSelect}
// // //               selectedStartDate={selectedStartDate}
// // //               selectedEndDate={selectedEndDate}
// // //             />
// // //           </div>
// // //         </div>

// // //         {/* Enhanced Metric Cards */}
// // //         <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6'>
// // //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// // //             <div className='flex items-center justify-between'>
// // //               <div className='text-xs sm:text-sm text-[#545659] font-medium'>New Orders</div>
// // //               <ShoppingCart className='h-4 w-4 text-blue-500' />
// // //             </div>
// // //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// // //               {isStatsLoading ? (
// // //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// // //               ) : (
// // //                 dashboardStats.newOrders
// // //               )}
// // //             </div>
// // //           </div>

// // //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// // //             <div className='flex items-center justify-between'>
// // //               <div className='text-xs sm:text-sm text-[#545659] font-medium'>Total Sales</div>
// // //               <DollarSign className='h-4 w-4 text-green-500' />
// // //             </div>
// // //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// // //               {isSalesLoading ? (
// // //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// // //               ) : (
// // //                 salesMetrics.totalSales
// // //               )}
// // //             </div>
// // //             {!isSalesLoading && (
// // //               <div className='flex items-center gap-1'>
// // //                 {salesMetrics.salesGrowth >= 0 ? (
// // //                   <TrendingUp className='h-3 w-3 text-green-500' />
// // //                 ) : (
// // //                   <TrendingDown className='h-3 w-3 text-red-500' />
// // //                 )}
// // //                 <span className={`text-xs ${salesMetrics.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
// // //                   {Math.abs(salesMetrics.salesGrowth).toFixed(1)}%
// // //                 </span>
// // //               </div>
// // //             )}
// // //           </div>

// // //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// // //             <div className='flex items-center justify-between'>
// // //               <div className='text-xs sm:text-sm text-[#545659] font-medium'>Active Products</div>
// // //               <Package className='h-4 w-4 text-purple-500' />
// // //             </div>
// // //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// // //               {isSalesLoading ? (
// // //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// // //               ) : (
// // //                 new Set(salesData.map(s => s.productName)).size
// // //               )}
// // //             </div>
// // //           </div>

// // //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// // //             <div className='flex items-center justify-between'>
// // //               <div className='text-xs sm:text-sm text-[#545659] font-medium'>Alerts</div>
// // //               <AlertTriangle className='h-4 w-4 text-orange-500' />
// // //             </div>
// // //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// // //               {isStatsLoading ? (
// // //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// // //               ) : (
// // //                 dashboardStats.expiredPOs + dashboardStats.priceMismatchPOs
// // //               )}
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* Charts Section */}
// // //         <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6'>
// // //           {/* Sales Trend Chart */}
// // //           {hasSalesPermission() && (
// // //             <div className='p-4 bg-white rounded-lg shadow-md'>
// // //               <div className='flex items-center justify-between mb-4'>
// // //                 <h3 className='text-lg font-medium text-[#191A1B]'>Sales Trend (7 Days)</h3>
// // //                 <button 
// // //                   onClick={() => router.push('/sales')}
// // //                   className='text-xs text-blue-600 hover:text-blue-800'
// // //                 >
// // //                   View Details
// // //                 </button>
// // //               </div>
// // //               {isSalesLoading ? (
// // //                 <div className='h-64 flex items-center justify-center'>
// // //                   <div className='animate-pulse bg-gray-200 h-full w-full rounded'></div>
// // //                 </div>
// // //               ) : (
// // //                 <ResponsiveContainer width="100%" height={250}>
// // //                   <AreaChart data={salesChartData}>
// // //                     <CartesianGrid strokeDasharray="3 3" />
// // //                     <XAxis dataKey="name" />
// // //                     <YAxis />
// // //                     <Tooltip />
// // //                     <Area type="monotone" dataKey="value" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
// // //                   </AreaChart>
// // //                 </ResponsiveContainer>
// // //               )}
// // //             </div>
// // //           )}

// // //           {/* Order Status Distribution */}
// // //           {hasOrdersPermission() && (
// // //             <div className='p-4 bg-white rounded-lg shadow-md'>
// // //               <div className='flex items-center justify-between mb-4'>
// // //                 <h3 className='text-lg font-medium text-[#191A1B]'>Order Status Distribution</h3>
// // //                 <button 
// // //                   onClick={() => router.push('/orders')}
// // //                   className='text-xs text-blue-600 hover:text-blue-800'
// // //                 >
// // //                   View Details
// // //                 </button>
// // //               </div>
// // //               {isLoading ? (
// // //                 <div className='h-64 flex items-center justify-center'>
// // //                   <div className='animate-pulse bg-gray-200 h-full w-full rounded'></div>
// // //                 </div>
// // //               ) : (
// // //                 <ResponsiveContainer width="100%" height={250}>
// // //                   <PieChart>
// // //                     <Pie
// // //                       data={statusDistribution}
// // //                       cx="50%"
// // //                       cy="50%"
// // //                       labelLine={false}
// // //                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
// // //                       outerRadius={80}
// // //                       fill="#8884d8"
// // //                       dataKey="value"
// // //                     >
// // //                       {statusDistribution.map((entry, index) => (
// // //                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
// // //                       ))}
// // //                     </Pie>
// // //                     <Tooltip />
// // //                   </PieChart>
// // //                 </ResponsiveContainer>
// // //               )}
// // //             </div>
// // //           )}

// // //           {/* Top Products Chart */}
// // //           {hasSalesPermission() && (
// // //             <div className='p-4 bg-white rounded-lg shadow-md'>
// // //               <h3 className='text-lg font-medium text-[#191A1B] mb-4'>Top Products by Sales</h3>
// // //               {isSalesLoading ? (
// // //                 <div className='h-64 flex items-center justify-center'>
// // //                   <div className='animate-pulse bg-gray-200 h-full w-full rounded'></div>
// // //                 </div>
// // //               ) : (
// // //                 <ResponsiveContainer width="100%" height={250}>
// // //                   <BarChart data={topProductsData} layout="horizontal">
// // //                     <CartesianGrid strokeDasharray="3 3" />
// // //                     <XAxis type="number" />
// // //                     <YAxis dataKey="name" type="category" width={100} />
// // //                     <Tooltip />
// // //                     <Bar dataKey="value" fill="#00C49F" />
// // //                   </BarChart>
// // //                 </ResponsiveContainer>
// // //               )}
// // //             </div>
// // //           )}

// // //           {/* Order Trend */}
// // //           {hasOrdersPermission() && (
// // //             <div className='p-4 bg-white rounded-lg shadow-md'>
// // //               <h3 className='text-lg font-medium text-[#191A1B] mb-4'>Order Trend (7 Days)</h3>
// // //               {isLoading ? (
// // //                 <div className='h-64 flex items-center justify-center'>
// // //                   <div className='animate-pulse bg-gray-200 h-full w-full rounded'></div>
// // //                 </div>
// // //               ) : (
// // //                 <ResponsiveContainer width="100%" height={250}>
// // //                   <LineChart data={orderTrendData}>
// // //                     <CartesianGrid strokeDasharray="3 3" />
// // //                     <XAxis dataKey="name" />
// // //                     <YAxis />
// // //                     <Tooltip />
// // //                     <Legend />
// // //                     <Line type="monotone" dataKey="orders" stroke="#FF8042" strokeWidth={2} />
// // //                   </LineChart>
// // //                 </ResponsiveContainer>
// // //               )}
// // //             </div>
// // //           )}
// // //         </div>

// // //         {/* Tables Grid */}
// // //         <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
// // //           {/* Active POs by Status */}
// // //           {hasOrdersPermission() && (
// // //             <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
// // //               <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-5 gap-2'>
// // //                 <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Active POs by Status</div>
// // //                 <div className='text-[#545659] text-xs underline cursor-pointer' onClick={() => router.push('/orders')}>
// // //                   View all POs
// // //                 </div>
// // //               </div>
// // //               <OrderDataTable
// // //                 data={isLoading ? [] : transformedOrdersData}
// // //                 columns={columns}
// // //                 clickableRows={true}
// // //                 paginationThreshold={6}
// // //                 enableSorting={true}
// // //                 onRowClick={handleRowClick}
// // //               />
// // //             </div>
// // //           )}

// // //           {/* Staff Activity */}
// // //           {hasUsersPermission() && (
// // //             <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
// // //               <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-5 gap-2'>
// // //                 <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Staff Activity</div>
// // //                 <div onClick={() => router.push('/user')} className='text-[#545659] text-xs underline cursor-pointer'>
// // //                   View all Users
// // //                 </div>
// // //               </div>
// // //               <OrderDataTable
// // //                 data={isUsersLoading ? [] : transformedUsersData}
// // //                 columns={columns3}
// // //                 clickableRows={false}
// // //                 paginationThreshold={5}
// // //                 enableSorting={true}
// // //               />
// // //             </div>
// // //           )}
// // //         </div>

// // //         {/* Quick Actions */}
// // //         <div className='mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4'>
// // //           <button 
// // //             onClick={() => router.push('/expiry')}
// // //             className='p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2 border border-orange-200'
// // //           >
// // //             <Clock className='h-6 w-6 text-orange-500' />
// // //             <span className='text-sm font-medium text-gray-900'>Expiry Alerts</span>
// // //             <span className='text-xs text-gray-600'>Check expiring batches</span>
// // //           </button>

// // //           {hasSalesPermission() && (
// // //             <button 
// // //               onClick={() => router.push('/sales')}
// // //               className='p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2 border border-green-200'
// // //             >
// // //               <DollarSign className='h-6 w-6 text-green-500' />
// // //               <span className='text-sm font-medium text-gray-900'>Sales Report</span>
// // //               <span className='text-xs text-gray-600'>View sales analytics</span>
// // //             </button>
// // //           )}

// // //           <button 
// // //             onClick={() => router.push('/inventory')}
// // //             className='p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2 border border-blue-200'
// // //           >
// // //             <Package className='h-6 w-6 text-blue-500' />
// // //             <span className='text-sm font-medium text-gray-900'>Inventory</span>
// // //             <span className='text-xs text-gray-600'>Manage stock levels</span>
// // //           </button>

// // //           {hasOrdersPermission() && (
// // //             <button 
// // //               onClick={() => router.push('/orders')}
// // //               className='p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2 border border-purple-200'
// // //             >
// // //               <ShoppingCart className='h-6 w-6 text-purple-500' />
// // //               <span className='text-sm font-medium text-gray-900'>Orders</span>
// // //               <span className='text-xs text-gray-600'>Manage all orders</span>
// // //             </button>
// // //           )}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   )
// // // }

// // // export default Dashboard


// // "use client"
// // import React, { useState, useEffect } from 'react'
// // import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
// // import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Clock, AlertTriangle, Eye } from 'lucide-react'
// // import OrderDataTable from './OrderDataTable'
// // import { fetchDashboardOrdersData, fetchOrderStats } from '@/lib/api/dashboard'
// // import { fetchUsers } from '@/lib/api/user'
// // import { getAllSales } from '@/lib/api/sales'
// // import { useAuth } from '@/contexts/AuthContext'
// // import DateButton from './DateButton'
// // import { useRouter } from 'next/navigation'

// // interface SalesData {
// //   _id: string
// //   productName: string
// //   batchCode: string
// //   quantitySold: number
// //   saleDate: string
// //   createdAt: string
// // }

// // interface ChartData {
// //   name: string
// //   value: number
// //   date?: string
// //   sales?: number
// //   orders?: number
// // }

// // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

// // const Dashboard = () => {
// //   const { user } = useAuth()
// //   const router = useRouter()
// //   const [ordersData, setOrdersData] = useState<any[]>([])
// //   const [salesData, setSalesData] = useState<SalesData[]>([])
// //   const [usersData, setUsersData] = useState<any[]>([])
// //   const [isLoading, setIsLoading] = useState(true)
// //   const [isStatsLoading, setIsStatsLoading] = useState(true)
// //   const [isUsersLoading, setIsUsersLoading] = useState(true)
// //   const [isSalesLoading, setIsSalesLoading] = useState(true)
// //   const [dashboardStats, setDashboardStats] = useState({
// //     newOrders: 0,
// //     priceMismatchPOs: 0,
// //     labelsPrinted: 0,
// //     expiredPOs: 0,
// //     posApproved: 0,
// //     onHold: 0,
// //     posRollOver: 0,
// //     picklistGenerated: 0
// //   })
// //   const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
// //   const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)

// //   // Permission checking functions
// //   const hasPermission = (permission: string) => {
// //     if (!user?.permissions) return false
// //     return Boolean(user.permissions[permission as keyof typeof user.permissions])
// //   }

// //   const hasOrdersPermission = () => hasPermission('orders')
// //   const hasUsersPermission = () => hasPermission('user')
// //   const hasSalesPermission = () => hasPermission('sales') || hasPermission('inventory') // Assuming sales is part of inventory

// //   // Fetch sales data
// //   const fetchSalesData = async () => {
// //     try {
// //       setIsSalesLoading(true)
// //       const sales = await getAllSales()
// //       setSalesData(sales)
// //     } catch (error) {
// //       console.error('Error fetching sales:', error)
// //       setSalesData([])
// //     } finally {
// //       setIsSalesLoading(false)
// //     }
// //   }

// //   // Function to fetch users data
// //   const fetchUsersData = async () => {
// //     try {
// //       setIsUsersLoading(true)
// //       const users = await fetchUsers()
// //       if (users.users) {
// //         setUsersData(users.users)
// //       } else if (Array.isArray(users)) {
// //         setUsersData(users)
// //       }
// //     } catch (error) {
// //       console.error('Error fetching users:', error)
// //       setUsersData([])
// //     } finally {
// //       setIsUsersLoading(false)
// //     }
// //   }

// //   // Function to fetch dashboard stats
// //   const fetchDashboardStats = async (startDate?: string, endDate?: string) => {
// //     try {
// //       setIsStatsLoading(true)
// //       const stats = await fetchOrderStats(startDate, endDate)
// //       setDashboardStats({
// //         newOrders: stats.newOrders || 0,
// //         priceMismatchPOs: stats.priceMismatch || 0,
// //         labelsPrinted: stats.labelsPrinted || 0,
// //         expiredPOs: stats.expiredOrders || 0,
// //         posApproved: stats.posApproved || 0,
// //         onHold: stats.onHold || 0,
// //         posRollOver: stats.posRollOver || 0,
// //         picklistGenerated: stats.picklistGenerated || 0
// //       })
// //     } catch (error) {
// //       // Keep default values if API fails
// //     } finally {
// //       setIsStatsLoading(false)
// //     }
// //   }

// //   // Function to fetch orders data
// //   const fetchOrders = async (startDate?: string, endDate?: string) => {
// //     try {
// //       setIsLoading(true)
// //       const data = await fetchDashboardOrdersData(startDate, endDate)
// //       if (data.orders) {
// //         setOrdersData(data.orders)
// //       } else if (Array.isArray(data)) {
// //         setOrdersData(data)
// //       } else {
// //         setOrdersData([])
// //       }
// //     } catch (error) {
// //       console.error('Error fetching orders:', error)
// //       setOrdersData([])
// //     } finally {
// //       setIsLoading(false)
// //     }
// //   }

// //   // Generate chart data
// //   const generateSalesChartData = (): ChartData[] => {
// //     if (!salesData.length) return []
    
// //     const last7Days = Array.from({ length: 7 }, (_, i) => {
// //       const date = new Date()
// //       date.setDate(date.getDate() - i)
// //       return date.toISOString().split('T')[0]
// //     }).reverse()

// //     return last7Days.map(date => {
// //       const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
// //       const daySales = salesData.filter(sale => 
// //         new Date(sale.saleDate).toISOString().split('T')[0] === date
// //       )
// //       const totalQuantity = daySales.reduce((sum, sale) => sum + sale.quantitySold, 0)
      
// //       return {
// //         name: dayName,
// //         value: totalQuantity,
// //         date: date
// //       }
// //     })
// //   }

// //   const generateOrderTrendData = (): ChartData[] => {
// //     if (!ordersData.length) return []
    
// //     const last7Days = Array.from({ length: 7 }, (_, i) => {
// //       const date = new Date()
// //       date.setDate(date.getDate() - i)
// //       return date.toISOString().split('T')[0]
// //     }).reverse()

// //     return last7Days.map(date => {
// //       const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
// //       const dayOrders = ordersData.filter(order => 
// //         new Date(order.poDate).toISOString().split('T')[0] === date
// //       ).length
      
// //       return {
// //         name: dayName,
// //         orders: dayOrders,
// //         date: date
// //       }
// //     })
// //   }

// //   const generateTopProductsData = (): ChartData[] => {
// //     if (!salesData.length) return []
    
// //     const productSales = salesData.reduce((acc: Record<string, number>, sale) => {
// //       acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantitySold
// //       return acc
// //     }, {})

// //     return Object.entries(productSales)
// //       .sort(([,a], [,b]) => b - a)
// //       .slice(0, 5)
// //       .map(([name, value]) => ({ name, value }))
// //   }

// //   const generateStatusDistribution = (): ChartData[] => {
// //     if (!ordersData.length) return []
    
// //     const statusCount = ordersData.reduce((acc: Record<string, number>, order) => {
// //       acc[order.status] = (acc[order.status] || 0) + 1
// //       return acc
// //     }, {})

// //     return Object.entries(statusCount).map(([name, value]) => ({ name, value }))
// //   }

// //   // Calculate key metrics
// //   const calculateSalesMetrics = () => {
// //     const totalSales = salesData.reduce((sum, sale) => sum + sale.quantitySold, 0)
// //     const todaySales = salesData.filter(sale => 
// //       new Date(sale.saleDate).toDateString() === new Date().toDateString()
// //     ).reduce((sum, sale) => sum + sale.quantitySold, 0)
    
// //     const yesterdayDate = new Date()
// //     yesterdayDate.setDate(yesterdayDate.getDate() - 1)
// //     const yesterdaySales = salesData.filter(sale => 
// //       new Date(sale.saleDate).toDateString() === yesterdayDate.toDateString()
// //     ).reduce((sum, sale) => sum + sale.quantitySold, 0)

// //     const salesGrowth = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

// //     return { totalSales, todaySales, salesGrowth }
// //   }

// //   // Fetch initial data
// //   useEffect(() => {
// //     if (!user) return
    
// //     fetchDashboardStats()
    
// //     if (hasOrdersPermission()) {
// //       fetchOrders()
// //     }
    
// //     if (hasUsersPermission()) {
// //       fetchUsersData()
// //     }
    
// //     if (hasSalesPermission()) {
// //       fetchSalesData()
// //     }
// //   }, [user])

// //   // Handle date range selection
// //   const handleDateRangeSelect = (startDate: Date | null, endDate: Date | null) => {
// //     setSelectedStartDate(startDate)
// //     setSelectedEndDate(endDate)
    
// //     if (!startDate && !endDate) {
// //       fetchDashboardStats()
// //       if (hasOrdersPermission()) fetchOrders()
// //       return
// //     }
    
// //     const startDateStr = startDate ? startDate.toISOString().split('T')[0] : ''
// //     const endDateStr = endDate ? endDate.toISOString().split('T')[0] : ''
    
// //     fetchDashboardStats(startDateStr, endDateStr)
// //     if (hasOrdersPermission()) {
// //       fetchOrders(startDateStr, endDateStr)
// //     }
// //   }

// //   // Transform data for tables
// //   const formatDate = (dateString: string) => {
// //     if (!dateString) return ''
// //     try {
// //       return new Date(dateString).toLocaleDateString('en-US', {
// //         year: 'numeric',
// //         month: 'short',
// //         day: 'numeric'
// //       })
// //     } catch {
// //       return dateString
// //     }
// //   }

// //   const transformedOrdersData = ordersData.map((order, index) => ({
// //     id: order._id || `order-${index}`,
// //     poDate: formatDate(order.poDate) || '',
// //     poNumber: order.poNumber || order.po_number || '',
// //     buyer: order.source ? order.source.charAt(0).toUpperCase() + order.source.slice(1) : '',
// //     status: order.status || 'Unknown'
// //   }))

// //   const transformedUsersData = usersData.map((user, index) => ({
// //     id: user._id || `user-${index}`,
// //     name: user.name || 'Unknown',
// //     login: user.lastLogin ? formatDate(user.lastLogin) : 'Never',
// //     status: user.status || 'Unknown'
// //   }))

// //   const columns = [
// //     { key: 'poDate', label: 'PO Date', header: 'PO Date', accessor: 'poDate', width: '120px' },
// //     { key: 'poNumber', label: 'PO Number', header: 'PO Number', accessor: 'poNumber', sortable: true, width: '155px' },
// //     { key: 'buyer', label: 'Buyer', header: 'Buyer', accessor: 'buyer' },
// //     { key: 'status', label: 'Status', header: 'Status', accessor: 'status' },
// //   ]

// //   const columns3 = [
// //     { key: 'name', label: 'Staff Name', accessor: 'name', width: '237px'},
// //     { key: 'login', label: 'Last Login', accessor: 'login', width:'237px'},
// //     { key: 'status', label: 'Status', accessor: 'status', width:'237px'},
// //   ]

// //   const handleRowClick = (rowId: string) => {
// //     if (rowId) {
// //       router.push(`/orders/${rowId}`)
// //     }
// //   }

// //   const salesMetrics = calculateSalesMetrics()
// //   const salesChartData = generateSalesChartData()
// //   const orderTrendData = generateOrderTrendData()
// //   const topProductsData = generateTopProductsData()
// //   const statusDistribution = generateStatusDistribution()

// //   if (!user) {
// //     return (
// //       <div className='p-4 h-full w-full bg-[#F5F5F5] flex items-center justify-center'>
// //         <div className='text-center'>
// //           <div className='animate-pulse bg-gray-200 h-8 w-32 rounded mb-2'></div>
// //           <div className='text-sm text-gray-500'>Loading dashboard...</div>
// //         </div>
// //       </div>
// //     )
// //   }

// //   return (
// //     <div className='min-h-screen bg-[#F5F5F5]'>
// //       <div className='p-2 sm:p-4 h-full w-full bg-[#F5F5F5]'>
// //         {/* Header */}
// //         <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2'>
// //           <div className='text-xl text-[#191A1B] font-medium'>Dashboard</div>
// //           <div>
// //             <DateButton
// //               onDateRangeSelect={handleDateRangeSelect}
// //               selectedStartDate={selectedStartDate}
// //               selectedEndDate={selectedEndDate}
// //             />
// //           </div>
// //         </div>

// //         {/* Enhanced Metric Cards */}
// //         <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6'>
// //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// //             <div className='flex items-center justify-between'>
// //               <div className='text-xs sm:text-sm text-[#545659] font-medium'>New Orders</div>
// //               <ShoppingCart className='h-4 w-4 text-blue-500' />
// //             </div>
// //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// //               {isStatsLoading ? (
// //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// //               ) : (
// //                 dashboardStats.newOrders
// //               )}
// //             </div>
// //           </div>

// //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// //             <div className='flex items-center justify-between'>
// //               <div className='text-xs sm:text-sm text-[#545659] font-medium'>Total Sales</div>
// //               <DollarSign className='h-4 w-4 text-green-500' />
// //             </div>
// //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// //               {isSalesLoading ? (
// //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// //               ) : (
// //                 salesMetrics.totalSales
// //               )}
// //             </div>
// //             {!isSalesLoading && (
// //               <div className='flex items-center gap-1'>
// //                 {salesMetrics.salesGrowth >= 0 ? (
// //                   <TrendingUp className='h-3 w-3 text-green-500' />
// //                 ) : (
// //                   <TrendingDown className='h-3 w-3 text-red-500' />
// //                 )}
// //                 <span className={`text-xs ${salesMetrics.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
// //                   {Math.abs(salesMetrics.salesGrowth).toFixed(1)}%
// //                 </span>
// //               </div>
// //             )}
// //           </div>

// //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// //             <div className='flex items-center justify-between'>
// //               <div className='text-xs sm:text-sm text-[#545659] font-medium'>Active Products</div>
// //               <Package className='h-4 w-4 text-purple-500' />
// //             </div>
// //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// //               {isSalesLoading ? (
// //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// //               ) : (
// //                 new Set(salesData.map(s => s.productName)).size
// //               )}
// //             </div>
// //           </div>

// //           <div className='p-3 sm:p-4 bg-white rounded-lg shadow-md flex flex-col gap-2'>
// //             <div className='flex items-center justify-between'>
// //               <div className='text-xs sm:text-sm text-[#545659] font-medium'>Alerts</div>
// //               <AlertTriangle className='h-4 w-4 text-orange-500' />
// //             </div>
// //             <div className='text-[#191A1B] text-lg sm:text-2xl font-semibold'>
// //               {isStatsLoading ? (
// //                 <div className='animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded'></div>
// //               ) : (
// //                 dashboardStats.expiredPOs + dashboardStats.priceMismatchPOs
// //               )}
// //             </div>
// //           </div>
// //         </div>

// //         {/* Charts Section */}
// //         <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6'>
// //           {/* Sales Trend Chart */}
// //           {hasSalesPermission() && (
// //             <div className='p-4 bg-white rounded-lg shadow-md'>
// //               <div className='flex items-center justify-between mb-4'>
// //                 <h3 className='text-lg font-medium text-[#191A1B]'>Sales Trend (7 Days)</h3>
// //                 <button 
// //                   onClick={() => router.push('/sales')}
// //                   className='text-xs text-blue-600 hover:text-blue-800'
// //                 >
// //                   View Details
// //                 </button>
// //               </div>
// //               {isSalesLoading ? (
// //                 <div className='h-64 flex items-center justify-center'>
// //                   <div className='animate-pulse bg-gray-200 h-full w-full rounded'></div>
// //                 </div>
// //               ) : (
// //                 <ResponsiveContainer width="100%" height={250}>
// //                   <AreaChart data={salesChartData}>
// //                     <CartesianGrid strokeDasharray="3 3" />
// //                     <XAxis dataKey="name" />
// //                     <YAxis />
// //                     <Tooltip />
// //                     <Area type="monotone" dataKey="value" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
// //                   </AreaChart>
// //                 </ResponsiveContainer>
// //               )}
// //             </div>
// //           )}

// //           {/* Order Status Distribution */}
// //           {hasOrdersPermission() && (
// //             <div className='p-4 bg-white rounded-lg shadow-md'>
// //               <div className='flex items-center justify-between mb-4'>
// //                 <h3 className='text-lg font-medium text-[#191A1B]'>Order Status Distribution</h3>
// //                 <button 
// //                   onClick={() => router.push('/orders')}
// //                   className='text-xs text-blue-600 hover:text-blue-800'
// //                 >
// //                   View Details
// //                 </button>
// //               </div>
// //               {isLoading ? (
// //                 <div className='h-64 flex items-center justify-center'>
// //                   <div className='animate-pulse bg-gray-200 h-full w-full rounded'></div>
// //                 </div>
// //               ) : (
// //                 <ResponsiveContainer width="100%" height={250}>
// //                   <PieChart>
// //                     <Pie
// //                       data={statusDistribution}
// //                       cx="50%"
// //                       cy="50%"
// //                       labelLine={false}
// //                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
// //                       outerRadius={80}
// //                       fill="#8884d8"
// //                       dataKey="value"
// //                     >
// //                       {statusDistribution.map((entry, index) => (
// //                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
// //                       ))}
// //                     </Pie>
// //                     <Tooltip />
// //                   </PieChart>
// //                 </ResponsiveContainer>
// //               )}
// //             </div>
// //           )}

// //           {/* Top Products Chart */}
// //           {hasSalesPermission() && (
// //             <div className='p-4 bg-white rounded-lg shadow-md'>
// //               <h3 className='text-lg font-medium text-[#191A1B] mb-4'>Top Products by Sales</h3>
// //               {isSalesLoading ? (
// //                 <div className='h-64 flex items-center justify-center'>
// //                   <div className='animate-pulse bg-gray-200 h-full w-full rounded'></div>
// //                 </div>
// //               ) : (
// //                 <ResponsiveContainer width="100%" height={250}>
// //                   <BarChart data={topProductsData} layout="horizontal">
// //                     <CartesianGrid strokeDasharray="3 3" />
// //                     <XAxis type="number" />
// //                     <YAxis dataKey="name" type="category" width={100} />
// //                     <Tooltip />
// //                     <Bar dataKey="value" fill="#00C49F" />
// //                   </BarChart>
// //                 </ResponsiveContainer>
// //               )}
// //             </div>
// //           )}

// //           {/* Order Trend */}
// //           {hasOrdersPermission() && (
// //             <div className='p-4 bg-white rounded-lg shadow-md'>
// //               <h3 className='text-lg font-medium text-[#191A1B] mb-4'>Order Trend (7 Days)</h3>
// //               {isLoading ? (
// //                 <div className='h-64 flex items-center justify-center'>
// //                   <div className='animate-pulse bg-gray-200 h-full w-full rounded'></div>
// //                 </div>
// //               ) : (
// //                 <ResponsiveContainer width="100%" height={250}>
// //                   <LineChart data={orderTrendData}>
// //                     <CartesianGrid strokeDasharray="3 3" />
// //                     <XAxis dataKey="name" />
// //                     <YAxis />
// //                     <Tooltip />
// //                     <Legend />
// //                     <Line type="monotone" dataKey="orders" stroke="#FF8042" strokeWidth={2} />
// //                   </LineChart>
// //                 </ResponsiveContainer>
// //               )}
// //             </div>
// //           )}
// //         </div>

// //         {/* Tables Grid */}
// //         <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
// //           {/* Active POs by Status */}
// //           {hasOrdersPermission() && (
// //             <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
// //               <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-5 gap-2'>
// //                 <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Active POs by Status</div>
// //                 <div className='text-[#545659] text-xs underline cursor-pointer' onClick={() => router.push('/orders')}>
// //                   View all POs
// //                 </div>
// //               </div>
// //               <OrderDataTable
// //                 data={isLoading ? [] : transformedOrdersData}
// //                 columns={columns}
// //                 clickableRows={true}
// //                 paginationThreshold={6}
// //                 enableSorting={true}
// //                 onRowClick={handleRowClick}
// //               />
// //             </div>
// //           )}

// //           {/* Staff Activity */}
// //           {hasUsersPermission() && (
// //             <div className='p-3 sm:p-5 bg-white rounded-lg shadow-md'>
// //               <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-5 gap-2'>
// //                 <div className='text-[#191A1B] text-sm sm:text-base font-medium'>Staff Activity</div>
// //                 <div onClick={() => router.push('/user')} className='text-[#545659] text-xs underline cursor-pointer'>
// //                   View all Users
// //                 </div>
// //               </div>
// //               <OrderDataTable
// //                 data={isUsersLoading ? [] : transformedUsersData}
// //                 columns={columns3}
// //                 clickableRows={false}
// //                 paginationThreshold={5}
// //                 enableSorting={true}
// //               />
// //             </div>
// //           )}
// //         </div>

// //         {/* Quick Actions */}
// //         <div className='mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4'>
// //           <button 
// //             onClick={() => router.push('/expiry')}
// //             className='p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2 border border-orange-200'
// //           >
// //             <Clock className='h-6 w-6 text-orange-500' />
// //             <span className='text-sm font-medium text-gray-900'>Expiry Alerts</span>
// //             <span className='text-xs text-gray-600'>Check expiring batches</span>
// //           </button>

// //           {hasSalesPermission() && (
// //             <button 
// //               onClick={() => router.push('/sales')}
// //               className='p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2 border border-green-200'
// //             >
// //               <DollarSign className='h-6 w-6 text-green-500' />
// //               <span className='text-sm font-medium text-gray-900'>Sales Report</span>
// //               <span className='text-xs text-gray-600'>View sales analytics</span>
// //             </button>
// //           )}

// //           <button 
// //             onClick={() => router.push('/inventory')}
// //             className='p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2 border border-blue-200'
// //           >
// //             <Package className='h-6 w-6 text-blue-500' />
// //             <span className='text-sm font-medium text-gray-900'>Inventory</span>
// //             <span className='text-xs text-gray-600'>Manage stock levels</span>
// //           </button>

// //           {hasOrdersPermission() && (
// //             <button 
// //               onClick={() => router.push('/orders')}
// //               className='p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center gap-2 border border-purple-200'
// //             >
// //               <ShoppingCart className='h-6 w-6 text-purple-500' />
// //               <span className='text-sm font-medium text-gray-900'>Orders</span>
// //               <span className='text-xs text-gray-600'>Manage all orders</span>
// //             </button>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// // export default Dashboard


// "use client"
// import React, { useState, useEffect } from 'react'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts'
// import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Clock, AlertTriangle, Eye, Users, Activity } from 'lucide-react'
// import OrderDataTable from './OrderDataTable'
// import { fetchDashboardOrdersData, fetchOrderStats } from '@/lib/api/dashboard'
// import { fetchUsers } from '@/lib/api/user'
// import { getAllSales } from '@/lib/api/sales'
// import { useAuth } from '@/contexts/AuthContext'
// import DateButton from './DateButton'
// import { useRouter } from 'next/navigation'

// interface SalesData {
//   _id: string
//   productName: string
//   batchCode: string
//   quantitySold: number
//   saleDate: string
//   createdAt: string
// }

// interface ChartData {
//   name: string
//   value: number
//   date?: string
//   sales?: number
//   orders?: number
//   fill?: string
// }

// const MODERN_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444']

// const Dashboard = () => {
//   const { user } = useAuth()
//   const router = useRouter()
//   const [ordersData, setOrdersData] = useState<any[]>([])
//   const [salesData, setSalesData] = useState<SalesData[]>([])
//   const [usersData, setUsersData] = useState<any[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [isStatsLoading, setIsStatsLoading] = useState(true)
//   const [isUsersLoading, setIsUsersLoading] = useState(true)
//   const [isSalesLoading, setIsSalesLoading] = useState(true)
//   const [dashboardStats, setDashboardStats] = useState({
//     newOrders: 0,
//     priceMismatchPOs: 0,
//     labelsPrinted: 0,
//     expiredPOs: 0,
//     posApproved: 0,
//     onHold: 0,
//     posRollOver: 0,
//     picklistGenerated: 0
//   })
//   const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
//   const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)

//   // Permission checking functions
//   const hasPermission = (permission: string) => {
//     if (!user?.permissions) return false
//     return Boolean(user.permissions[permission as keyof typeof user.permissions])
//   }

//   const hasOrdersPermission = () => hasPermission('orders')
//   const hasUsersPermission = () => hasPermission('user')
//   const hasSalesPermission = () => hasPermission('sales') || hasPermission('inventory')

//   // Fetch sales data
//   const fetchSalesData = async () => {
//     try {
//       setIsSalesLoading(true)
//       const sales = await getAllSales()
//       setSalesData(sales)
//     } catch (error) {
//       console.error('Error fetching sales:', error)
//       setSalesData([])
//     } finally {
//       setIsSalesLoading(false)
//     }
//   }

//   // Function to fetch users data
//   const fetchUsersData = async () => {
//     try {
//       setIsUsersLoading(true)
//       const users = await fetchUsers()
//       if (users.users) {
//         setUsersData(users.users)
//       } else if (Array.isArray(users)) {
//         setUsersData(users)
//       }
//     } catch (error) {
//       console.error('Error fetching users:', error)
//       setUsersData([])
//     } finally {
//       setIsUsersLoading(false)
//     }
//   }

//   // Function to fetch dashboard stats
//   const fetchDashboardStats = async (startDate?: string, endDate?: string) => {
//     try {
//       setIsStatsLoading(true)
//       const stats = await fetchOrderStats(startDate, endDate)
//       setDashboardStats({
//         newOrders: stats.newOrders || 0,
//         priceMismatchPOs: stats.priceMismatch || 0,
//         labelsPrinted: stats.labelsPrinted || 0,
//         expiredPOs: stats.expiredOrders || 0,
//         posApproved: stats.posApproved || 0,
//         onHold: stats.onHold || 0,
//         posRollOver: stats.posRollOver || 0,
//         picklistGenerated: stats.picklistGenerated || 0
//       })
//     } catch (error) {
//       // Keep default values if API fails
//     } finally {
//       setIsStatsLoading(false)
//     }
//   }

//   // Function to fetch orders data
//   const fetchOrders = async (startDate?: string, endDate?: string) => {
//     try {
//       setIsLoading(true)
//       const data = await fetchDashboardOrdersData(startDate, endDate)
//       if (data.orders) {
//         setOrdersData(data.orders)
//       } else if (Array.isArray(data)) {
//         setOrdersData(data)
//       } else {
//         setOrdersData([])
//       }
//     } catch (error) {
//       console.error('Error fetching orders:', error)
//       setOrdersData([])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Generate chart data
//   const generateSalesChartData = (): ChartData[] => {
//     if (!salesData.length) return []
    
//     const last7Days = Array.from({ length: 7 }, (_, i) => {
//       const date = new Date()
//       date.setDate(date.getDate() - i)
//       return date.toISOString().split('T')[0]
//     }).reverse()

//     return last7Days.map(date => {
//       const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
//       const daySales = salesData.filter(sale => 
//         new Date(sale.saleDate).toISOString().split('T')[0] === date
//       )
//       const totalQuantity = daySales.reduce((sum, sale) => sum + sale.quantitySold, 0)
      
//       return {
//         name: dayName,
//         value: totalQuantity,
//         sales: totalQuantity,
//         date: date
//       }
//     })
//   }

//   const generateTopProductsData = (): ChartData[] => {
//     if (!salesData.length) return []
    
//     const productSales = salesData.reduce((acc: Record<string, number>, sale) => {
//       acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantitySold
//       return acc
//     }, {})

//     return Object.entries(productSales)
//       .sort(([,a], [,b]) => b - a)
//       .slice(0, 5)
//       .map(([name, value], index) => ({ 
//         name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
//         value,
//         fill: MODERN_COLORS[index % MODERN_COLORS.length]
//       }))
//   }

//   const generateStatusDistribution = (): ChartData[] => {
//     if (!ordersData.length) return []
    
//     const statusCount = ordersData.reduce((acc: Record<string, number>, order) => {
//       acc[order.status] = (acc[order.status] || 0) + 1
//       return acc
//     }, {})

//     return Object.entries(statusCount).map(([name, value], index) => ({ 
//       name, 
//       value,
//       fill: MODERN_COLORS[index % MODERN_COLORS.length]
//     }))
//   }

//   // Calculate key metrics
//   const calculateSalesMetrics = () => {
//     const totalSales = salesData.reduce((sum, sale) => sum + sale.quantitySold, 0)
//     const todaySales = salesData.filter(sale => 
//       new Date(sale.saleDate).toDateString() === new Date().toDateString()
//     ).reduce((sum, sale) => sum + sale.quantitySold, 0)
    
//     const yesterdayDate = new Date()
//     yesterdayDate.setDate(yesterdayDate.getDate() - 1)
//     const yesterdaySales = salesData.filter(sale => 
//       new Date(sale.saleDate).toDateString() === yesterdayDate.toDateString()
//     ).reduce((sum, sale) => sum + sale.quantitySold, 0)

//     const salesGrowth = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

//     return { totalSales, todaySales, salesGrowth }
//   }

//   // Fetch initial data
//   useEffect(() => {
//     if (!user) return
    
//     fetchDashboardStats()
    
//     if (hasOrdersPermission()) {
//       fetchOrders()
//     }
    
//     if (hasUsersPermission()) {
//       fetchUsersData()
//     }
    
//     if (hasSalesPermission()) {
//       fetchSalesData()
//     }
//   }, [user])

//   // Handle date range selection
//   const handleDateRangeSelect = (startDate: Date | null, endDate: Date | null) => {
//     setSelectedStartDate(startDate)
//     setSelectedEndDate(endDate)
    
//     if (!startDate && !endDate) {
//       fetchDashboardStats()
//       if (hasOrdersPermission()) fetchOrders()
//       return
//     }
    
//     const startDateStr = startDate ? startDate.toISOString().split('T')[0] : ''
//     const endDateStr = endDate ? endDate.toISOString().split('T')[0] : ''
    
//     fetchDashboardStats(startDateStr, endDateStr)
//     if (hasOrdersPermission()) {
//       fetchOrders(startDateStr, endDateStr)
//     }
//   }

//   // Transform data for tables
//   const formatDate = (dateString: string) => {
//     if (!dateString) return ''
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//       })
//     } catch {
//       return dateString
//     }
//   }

//   const transformedOrdersData = ordersData.map((order, index) => ({
//     id: order._id || `order-${index}`,
//     poDate: formatDate(order.poDate) || '',
//     poNumber: order.poNumber || order.po_number || '',
//     buyer: order.source ? order.source.charAt(0).toUpperCase() + order.source.slice(1) : '',
//     status: order.status || 'Unknown'
//   }))

//   const transformedUsersData = usersData.map((user, index) => ({
//     id: user._id || `user-${index}`,
//     name: user.name || 'Unknown',
//     login: user.lastLogin ? formatDate(user.lastLogin) : 'Never',
//     status: user.status || 'Unknown'
//   }))

//   const columns = [
//     { key: 'poDate', label: 'PO Date', header: 'PO Date', accessor: 'poDate', width: '120px' },
//     { key: 'poNumber', label: 'PO Number', header: 'PO Number', accessor: 'poNumber', sortable: true, width: '155px' },
//     { key: 'buyer', label: 'Buyer', header: 'Buyer', accessor: 'buyer' },
//     { key: 'status', label: 'Status', header: 'Status', accessor: 'status' },
//   ]

//   const columns3 = [
//     { key: 'name', label: 'Staff Name', accessor: 'name', width: '237px'},
//     { key: 'login', label: 'Last Login', accessor: 'login', width:'237px'},
//     { key: 'status', label: 'Status', accessor: 'status', width:'237px'},
//   ]

//   const handleRowClick = (rowId: string) => {
//     if (rowId) {
//       router.push(`/orders/${rowId}`)
//     }
//   }

//   const salesMetrics = calculateSalesMetrics()
//   const salesChartData = generateSalesChartData()
//   const topProductsData = generateTopProductsData()
//   const statusDistribution = generateStatusDistribution()

//   // Loading state
//   if (!user) {
//     return (
//       <div className='p-4 h-full w-full bg-[#F5F5F5] flex items-center justify-center'>
//         <div className='text-center'>
//           <div className='animate-pulse bg-gray-200 h-8 w-32 rounded mb-2'></div>
//           <div className='text-sm text-gray-500'>Loading dashboard...</div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
//       <div className='p-4 sm:p-6 h-full w-full'>
//         {/* Header */}
//         <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-2'>
//           <div>
//             <h1 className='text-3xl font-bold text-gray-900 mb-2'>Dashboard</h1>
//             <p className='text-gray-600'>Welcome back! Here's what's happening with your business today.</p>
//           </div>
//           <div>
//             <DateButton
//               onDateRangeSelect={handleDateRangeSelect}
//               selectedStartDate={selectedStartDate}
//               selectedEndDate={selectedEndDate}
//             />
//           </div>
//         </div>

//         {/* Enhanced Metric Cards with Modern Design */}
//         <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
//           <div className='bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-300'>
//             <div className='flex items-center justify-between mb-4'>
//               <div className='bg-blue-100 p-3 rounded-xl'>
//                 <ShoppingCart className='h-6 w-6 text-blue-600' />
//               </div>
//               <div className='text-right'>
//                 <p className='text-sm text-gray-500 font-medium'>New Orders</p>
//                 <p className='text-2xl font-bold text-gray-900'>
//                   {isStatsLoading ? '...' : dashboardStats.newOrders}
//                 </p>
//               </div>
//             </div>
//             <div className='bg-blue-50 rounded-lg p-3'>
//               <p className='text-xs text-blue-700'>📈 Track incoming orders</p>
//             </div>
//           </div>

//           <div className='bg-white rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-300'>
//             <div className='flex items-center justify-between mb-4'>
//               <div className='bg-green-100 p-3 rounded-xl'>
//                 <DollarSign className='h-6 w-6 text-green-600' />
//               </div>
//               <div className='text-right'>
//                 <p className='text-sm text-gray-500 font-medium'>Total Sales</p>
//                 <p className='text-2xl font-bold text-gray-900'>
//                   {isSalesLoading ? '...' : salesMetrics.totalSales}
//                 </p>
//               </div>
//             </div>
//             <div className='bg-green-50 rounded-lg p-3 flex items-center justify-between'>
//               <p className='text-xs text-green-700'>💰 Revenue growth</p>
//               {!isSalesLoading && (
//                 <div className='flex items-center gap-1'>
//                   {salesMetrics.salesGrowth >= 0 ? (
//                     <TrendingUp className='h-3 w-3 text-green-600' />
//                   ) : (
//                     <TrendingDown className='h-3 w-3 text-red-600' />
//                   )}
//                   <span className={`text-xs font-semibold ${salesMetrics.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                     {Math.abs(salesMetrics.salesGrowth).toFixed(1)}%
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className='bg-white rounded-2xl shadow-lg p-6 border border-purple-100 hover:shadow-xl transition-all duration-300'>
//             <div className='flex items-center justify-between mb-4'>
//               <div className='bg-purple-100 p-3 rounded-xl'>
//                 <Package className='h-6 w-6 text-purple-600' />
//               </div>
//               <div className='text-right'>
//                 <p className='text-sm text-gray-500 font-medium'>Active Products</p>
//                 <p className='text-2xl font-bold text-gray-900'>
//                   {isSalesLoading ? '...' : new Set(salesData.map(s => s.productName)).size}
//                 </p>
//               </div>
//             </div>
//             <div className='bg-purple-50 rounded-lg p-3'>
//               <p className='text-xs text-purple-700'>📦 Products in circulation</p>
//             </div>
//           </div>

//           <div className='bg-white rounded-2xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all duration-300'>
//             <div className='flex items-center justify-between mb-4'>
//               <div className='bg-orange-100 p-3 rounded-xl'>
//                 <AlertTriangle className='h-6 w-6 text-orange-600' />
//               </div>
//               <div className='text-right'>
//                 <p className='text-sm text-gray-500 font-medium'>Alerts</p>
//                 <p className='text-2xl font-bold text-gray-900'>
//                   {isStatsLoading ? '...' : dashboardStats.expiredPOs + dashboardStats.priceMismatchPOs}
//                 </p>
//               </div>
//             </div>
//             <div className='bg-orange-50 rounded-lg p-3'>
//               <p className='text-xs text-orange-700'>⚠️ Requires attention</p>
//             </div>
//           </div>
//         </div>

//         {/* Modern Charts Section */}
//         <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
//           {/* Sales Performance - Hero Chart */}
//           {hasSalesPermission() && (
//             <div className='lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100'>
//               <div className='flex items-center justify-between mb-6'>
//                 <div>
//                   <h3 className='text-xl font-bold text-gray-900 mb-2'>Sales Performance</h3>
//                   <p className='text-gray-600 text-sm'>Weekly sales trend and performance metrics</p>
//                 </div>
//                 <button 
//                   onClick={() => router.push('/sales')}
//                   className='bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm'
//                 >
//                   View Details
//                 </button>
//               </div>
//               {isSalesLoading ? (
//                 <div className='h-80 flex items-center justify-center bg-gray-50 rounded-xl'>
//                   <div className='animate-pulse text-gray-400'>Loading sales data...</div>
//                 </div>
//               ) : (
//                 <ResponsiveContainer width="100%" height={320}>
//                   <AreaChart data={salesChartData}>
//                     <defs>
//                       <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
//                         <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
//                       </linearGradient>
//                     </defs>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//                     <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
//                     <YAxis stroke="#6B7280" fontSize={12} />
//                     <Tooltip 
//                       contentStyle={{ 
//                         backgroundColor: '#1F2937', 
//                         border: 'none', 
//                         borderRadius: '12px', 
//                         color: '#F9FAFB',
//                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
//                       }} 
//                     />
//                     <Area 
//                       type="monotone" 
//                       dataKey="value" 
//                       stroke="#6366F1" 
//                       strokeWidth={3}
//                       fill="url(#salesGradient)" 
//                     />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               )}
//             </div>
//           )}

//           {/* Order Status - Modern Donut Chart */}
//           {hasOrdersPermission() && (
//             <div className='bg-white rounded-2xl shadow-lg p-8 border border-gray-100'>
//               <div className='flex items-center justify-between mb-6'>
//                 <div>
//                   <h3 className='text-xl font-bold text-gray-900 mb-2'>Order Status</h3>
//                   <p className='text-gray-600 text-sm'>Current order distribution</p>
//                 </div>
//               </div>
//               {isLoading ? (
//                 <div className='h-64 flex items-center justify-center'>
//                   <div className='animate-pulse text-gray-400'>Loading orders...</div>
//                 </div>
//               ) : (
//                 <div>
//                   <ResponsiveContainer width="100%" height={200}>
//                     <PieChart>
//                       <Pie
//                         data={statusDistribution}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={50}
//                         outerRadius={80}
//                         paddingAngle={5}
//                         dataKey="value"
//                       >
//                         {statusDistribution.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.fill} />
//                         ))}
//                       </Pie>
//                       <Tooltip 
//                         contentStyle={{ 
//                           backgroundColor: '#1F2937', 
//                           border: 'none', 
//                           borderRadius: '12px', 
//                           color: '#F9FAFB' 
//                         }} 
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                   <div className='space-y-3 mt-4'>
//                     {statusDistribution.slice(0, 4).map((entry, index) => (
//                       <div key={entry.name} className='flex items-center justify-between'>
//                         <div className='flex items-center gap-3'>
//                           <div 
//                             className='w-3 h-3 rounded-full' 
//                             style={{ backgroundColor: entry.fill }}
//                           ></div>
//                           <span className='text-sm font-medium text-gray-700'>{entry.name}</span>
//                         </div>
//                         <span className='text-sm font-bold text-gray-900'>{entry.value}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Secondary Charts */}
//         <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
//           {/* Top Products */}
//           {hasSalesPermission() && (
//             <div className='bg-white rounded-2xl shadow-lg p-8 border border-gray-100'>
//               <div className='flex items-center justify-between mb-6'>
//                 <div>
//                   <h3 className='text-xl font-bold text-gray-900 mb-2'>Top Products</h3>
//                   <p className='text-gray-600 text-sm'>Best performing products by sales volume</p>
//                 </div>
//               </div>
//               {isSalesLoading ? (
//                 <div className='h-64 flex items-center justify-center'>
//                   <div className='animate-pulse text-gray-400'>Loading products...</div>
//                 </div>
//               ) : (
//                 <ResponsiveContainer width="100%" height={280}>
//                   <BarChart data={topProductsData} layout="horizontal">
//                     <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//                     <XAxis type="number" stroke="#6B7280" fontSize={12} />
//                     <YAxis dataKey="name" type="category" width={120} stroke="#6B7280" fontSize={11} />
//                     <Tooltip 
//                       contentStyle={{ 
//                         backgroundColor: '#1F2937', 
//                         border: 'none', 
//                         borderRadius: '12px', 
//                         color: '#F9FAFB' 
//                       }} 
//                     />
//                     <Bar dataKey="value" radius={[0, 6, 6, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               )}
//             </div>
//           )}

//           {/* Activity Overview */}
//           <div className='bg-white rounded-2xl shadow-lg p-8 border border-gray-100'>
//             <h3 className='text-xl font-bold text-gray-900 mb-6'>Quick Actions</h3>
//             <div className='grid grid-cols-2 gap-4'>
//               <button 
//                 onClick={() => router.push('/expiry')}
//                 className='p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-md transition-all group'
//               >
//                 <Clock className='h-8 w-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform' />
//                 <p className='font-semibold text-gray-900 text-sm'>Expiry Alerts</p>
//                 <p className='text-xs text-gray-600 mt-1'>Check expiring items</p>
//               </button>

//               <button 
//                 onClick={() => router.push('/inventory')}
//                 className='p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all group'
//               >
//                 <Package className='h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform' />
//                 <p className='font-semibold text-gray-900 text-sm'>Inventory</p>
//                 <p className='text-xs text-gray-600 mt-1'>Manage stock</p>
//               </button>

//               {hasSalesPermission() && (
//                 <button 
//                   onClick={() => router.push('/sales')}
//                   className='p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all group'
//                 >
//                   <DollarSign className='h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform' />
//                   <p className='font-semibold text-gray-900 text-sm'>Sales Report</p>
//                   <p className='text-xs text-gray-600 mt-1'>View analytics</p>
//                 </button>
//               )}

//               {hasUsersPermission() && (
//                 <button 
//                   onClick={() => router.push('/user')}
//                   className='p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all group'
//                 >
//                   <Users className='h-8 w-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform' />
//                   <p className='font-semibold text-gray-900 text-sm'>User Management</p>
//                   <p className='text-xs text-gray-600 mt-1'>Manage staff</p>
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Data Tables */}
//         <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
//           {/* Active POs */}
//           {hasOrdersPermission() && (
//             <div className='bg-white rounded-2xl shadow-lg p-8 border border-gray-100'>
//               <div className='flex items-center justify-between mb-6'>
//                 <div>
//                   <h3 className='text-xl font-bold text-gray-900 mb-2'>Recent Orders</h3>
//                   <p className='text-gray-600 text-sm'>Latest purchase orders and their status</p>
//                 </div>
//                 <button 
//                   onClick={() => router.push('/orders')}
//                   className='text-blue-600 hover:text-blue-800 text-sm font-medium'
//                 >
//                   View All
//                 </button>
//               </div>
//               <OrderDataTable
//                 data={isLoading ? [] : transformedOrdersData}
//                 columns={columns}
//                 clickableRows={true}
//                 paginationThreshold={6}
//                 enableSorting={true}
//                 onRowClick={handleRowClick}
//               />
//             </div>
//           )}

//           {/* Staff Activity */}
//           {hasUsersPermission() && (
//             <div className='bg-white rounded-2xl shadow-lg p-8 border border-gray-100'>
//               <div className='flex items-center justify-between mb-6'>
//                 <div>
//                   <h3 className='text-xl font-bold text-gray-900 mb-2'>Staff Activity</h3>
//                   <p className='text-gray-600 text-sm'>Team member login status and activity</p>
//                 </div>
//                 <button 
//                   onClick={() => router.push('/user')}
//                   className='text-blue-600 hover:text-blue-800 text-sm font-medium'
//                 >
//                   Manage Users
//                 </button>
//               </div>
//               <OrderDataTable
//                 data={isUsersLoading ? [] : transformedUsersData}
//                 columns={columns3}
//                 clickableRows={false}
//                 paginationThreshold={5}
//                 enableSorting={true}
//               />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Dashboard

"use client"
import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts'
import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Clock, AlertTriangle, Eye, Users, Activity } from 'lucide-react'
import OrderDataTable from './OrderDataTable'
import { fetchDashboardOrdersData, fetchOrderStats } from '@/lib/api/dashboard'
import { fetchUsers } from '@/lib/api/user'
import { getAllSales } from '@/lib/api/sales'
import { useAuth } from '@/contexts/AuthContext'
import DateButton from './DateButton'
import { useRouter } from 'next/navigation'

interface SalesData {
  _id: string
  productName: string
  batchCode: string
  quantitySold: number
  saleDate: string
  createdAt: string
}

interface ChartData {
  name: string
  value: number
  date?: string
  sales?: number
  orders?: number
  fill?: string
}

const MODERN_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444']

const Dashboard = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [ordersData, setOrdersData] = useState<any[]>([])
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [usersData, setUsersData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [isSalesLoading, setIsSalesLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState({
    newOrders: 0,
    priceMismatchPOs: 0,
    labelsPrinted: 0,
    expiredPOs: 0,
    posApproved: 0,
    onHold: 0,
    posRollOver: 0,
    picklistGenerated: 0
  })
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)

  // Permission checking functions
  const hasPermission = (permission: string) => {
    if (!user?.permissions) return false
    return Boolean(user.permissions[permission as keyof typeof user.permissions])
  }

  const hasOrdersPermission = () => hasPermission('orders')
  const hasUsersPermission = () => hasPermission('user')
  const hasSalesPermission = () => hasPermission('sales') || hasPermission('inventory')

  // Fetch sales data
  const fetchSalesData = async () => {
    try {
      setIsSalesLoading(true)
      const sales = await getAllSales()
      setSalesData(sales)
    } catch (error) {
      console.error('Error fetching sales:', error)
      setSalesData([])
    } finally {
      setIsSalesLoading(false)
    }
  }

  // Function to fetch users data
  const fetchUsersData = async () => {
    try {
      setIsUsersLoading(true)
      const users = await fetchUsers()
      if (users.users) {
        setUsersData(users.users)
      } else if (Array.isArray(users)) {
        setUsersData(users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsersData([])
    } finally {
      setIsUsersLoading(false)
    }
  }

  // Function to fetch dashboard stats
  const fetchDashboardStats = async (startDate?: string, endDate?: string) => {
    try {
      setIsStatsLoading(true)
      const stats = await fetchOrderStats(startDate, endDate)
      setDashboardStats({
        newOrders: stats.newOrders || 0,
        priceMismatchPOs: stats.priceMismatch || 0,
        labelsPrinted: stats.labelsPrinted || 0,
        expiredPOs: stats.expiredOrders || 0,
        posApproved: stats.posApproved || 0,
        onHold: stats.onHold || 0,
        posRollOver: stats.posRollOver || 0,
        picklistGenerated: stats.picklistGenerated || 0
      })
    } catch (error) {
      // Keep default values if API fails
    } finally {
      setIsStatsLoading(false)
    }
  }

  // Function to fetch orders data
  const fetchOrders = async (startDate?: string, endDate?: string) => {
    try {
      setIsLoading(true)
      const data = await fetchDashboardOrdersData(startDate, endDate)
      if (data.orders) {
        setOrdersData(data.orders)
      } else if (Array.isArray(data)) {
        setOrdersData(data)
      } else {
        setOrdersData([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrdersData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate chart data
  const generateSalesChartData = (): ChartData[] => {
    if (!salesData.length) return []
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    return last7Days.map(date => {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
      const daySales = salesData.filter(sale => 
        new Date(sale.saleDate).toISOString().split('T')[0] === date
      )
      const totalQuantity = daySales.reduce((sum, sale) => sum + sale.quantitySold, 0)
      
      return {
        name: dayName,
        value: totalQuantity,
        sales: totalQuantity,
        date: date
      }
    })
  }

  const generateTopProductsData = (): ChartData[] => {
    if (!salesData.length) return []
    
    const productSales = salesData.reduce((acc: Record<string, number>, sale) => {
      acc[sale.productName] = (acc[sale.productName] || 0) + sale.quantitySold
      return acc
    }, {})

    return Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, value], index) => ({ 
        name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
        value,
        fill: MODERN_COLORS[index % MODERN_COLORS.length]
      }))
  }

  const generateStatusDistribution = (): ChartData[] => {
    if (!ordersData.length) return []
    
    const statusCount = ordersData.reduce((acc: Record<string, number>, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusCount).map(([name, value], index) => ({ 
      name, 
      value,
      fill: MODERN_COLORS[index % MODERN_COLORS.length]
    }))
  }

  // Calculate key metrics
  const calculateSalesMetrics = () => {
    const totalSales = salesData.reduce((sum, sale) => sum + sale.quantitySold, 0)
    const todaySales = salesData.filter(sale => 
      new Date(sale.saleDate).toDateString() === new Date().toDateString()
    ).reduce((sum, sale) => sum + sale.quantitySold, 0)
    
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdaySales = salesData.filter(sale => 
      new Date(sale.saleDate).toDateString() === yesterdayDate.toDateString()
    ).reduce((sum, sale) => sum + sale.quantitySold, 0)

    const salesGrowth = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

    return { totalSales, todaySales, salesGrowth }
  }

  // Fetch initial data
  useEffect(() => {
    if (!user) return
    
    fetchDashboardStats()
    
    if (hasOrdersPermission()) {
      fetchOrders()
    }
    
    if (hasUsersPermission()) {
      fetchUsersData()
    }
    
    if (hasSalesPermission()) {
      fetchSalesData()
    }
  }, [user])

  // Handle date range selection
  const handleDateRangeSelect = (startDate: Date | null, endDate: Date | null) => {
    setSelectedStartDate(startDate)
    setSelectedEndDate(endDate)
    
    if (!startDate && !endDate) {
      fetchDashboardStats()
      if (hasOrdersPermission()) fetchOrders()
      return
    }
    
    const startDateStr = startDate ? startDate.toISOString().split('T')[0] : ''
    const endDateStr = endDate ? endDate.toISOString().split('T')[0] : ''
    
    fetchDashboardStats(startDateStr, endDateStr)
    if (hasOrdersPermission()) {
      fetchOrders(startDateStr, endDateStr)
    }
  }

  // Transform data for tables
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const transformedOrdersData = ordersData.map((order, index) => ({
    id: order._id || `order-${index}`,
    poDate: formatDate(order.poDate) || '',
    poNumber: order.poNumber || order.po_number || '',
    buyer: order.source ? order.source.charAt(0).toUpperCase() + order.source.slice(1) : '',
    status: order.status || 'Unknown'
  }))

  const transformedUsersData = usersData.map((user, index) => ({
    id: user._id || `user-${index}`,
    name: user.name || 'Unknown',
    login: user.lastLogin ? formatDate(user.lastLogin) : 'Never',
    status: user.status || 'Unknown'
  }))

  const columns = [
    { key: 'poDate', label: 'PO Date', header: 'PO Date', accessor: 'poDate', width: '120px' },
    { key: 'poNumber', label: 'PO Number', header: 'PO Number', accessor: 'poNumber', sortable: true, width: '155px' },
    { key: 'buyer', label: 'Buyer', header: 'Buyer', accessor: 'buyer' },
    { key: 'status', label: 'Status', header: 'Status', accessor: 'status' },
  ]

  const columns3 = [
    { key: 'name', label: 'Staff Name', accessor: 'name', width: '237px'},
    { key: 'login', label: 'Last Login', accessor: 'login', width:'237px'},
    { key: 'status', label: 'Status', accessor: 'status', width:'237px'},
  ]

  const handleRowClick = (rowId: string) => {
    if (rowId) {
      router.push(`/orders/${rowId}`)
    }
  }

  const salesMetrics = calculateSalesMetrics()
  const salesChartData = generateSalesChartData()
  const topProductsData = generateTopProductsData()
  const statusDistribution = generateStatusDistribution()

  // Loading state
  if (!user) {
    return (
      <div className='p-4 h-full w-full bg-[#F5F5F5] flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-pulse bg-gray-200 h-8 w-32 rounded mb-2'></div>
          <div className='text-sm text-gray-500'>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <div className='p-4 sm:p-6 h-full w-full'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-2'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Dashboard</h1>
            <p className='text-gray-600'>Welcome back! Here's what's happening with your business today.</p>
          </div>
          <div>
            <DateButton
              onDateRangeSelect={handleDateRangeSelect}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
            />
          </div>
        </div>

        {/* Enhanced Metric Cards with Modern Design */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='bg-blue-100 p-3 rounded-xl'>
                <ShoppingCart className='h-6 w-6 text-blue-600' />
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-500 font-medium'>New Orders</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {isStatsLoading ? '...' : dashboardStats.newOrders}
                </p>
              </div>
            </div>
            <div className='bg-blue-50 rounded-lg p-3'>
              <p className='text-xs text-blue-700'>📈 Track incoming orders</p>
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='bg-green-100 p-3 rounded-xl'>
                <DollarSign className='h-6 w-6 text-green-600' />
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-500 font-medium'>Total Sales</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {isSalesLoading ? '...' : salesMetrics.totalSales}
                </p>
              </div>
            </div>
            <div className='bg-green-50 rounded-lg p-3 flex items-center justify-between'>
              <p className='text-xs text-green-700'>💰 Revenue growth</p>
              {!isSalesLoading && (
                <div className='flex items-center gap-1'>
                  {salesMetrics.salesGrowth >= 0 ? (
                    <TrendingUp className='h-3 w-3 text-green-600' />
                  ) : (
                    <TrendingDown className='h-3 w-3 text-red-600' />
                  )}
                  <span className={`text-xs font-semibold ${salesMetrics.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(salesMetrics.salesGrowth).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-lg p-6 border border-purple-100 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='bg-purple-100 p-3 rounded-xl'>
                <Package className='h-6 w-6 text-purple-600' />
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-500 font-medium'>Active Products</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {isSalesLoading ? '...' : new Set(salesData.map(s => s.productName)).size}
                </p>
              </div>
            </div>
            <div className='bg-purple-50 rounded-lg p-3'>
              <p className='text-xs text-purple-700'>📦 Products in circulation</p>
            </div>
          </div>

          <div className='bg-white rounded-2xl shadow-lg p-6 border border-orange-100 hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='bg-orange-100 p-3 rounded-xl'>
                <AlertTriangle className='h-6 w-6 text-orange-600' />
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-500 font-medium'>Alerts</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {isStatsLoading ? '...' : dashboardStats.expiredPOs + dashboardStats.priceMismatchPOs}
                </p>
              </div>
            </div>
            <div className='bg-orange-50 rounded-lg p-3'>
              <p className='text-xs text-orange-700'>⚠️ Requires attention</p>
            </div>
          </div>
        </div>

        {/* Modern Charts Section with Beautiful Pie Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
          {/* Sales Performance - Hero Pie Chart */}
          {hasSalesPermission() && (
            <div className='lg:col-span-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-xl p-8 border border-blue-200 backdrop-blur-sm'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h3 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>Sales Distribution</h3>
                  <p className='text-gray-600 text-sm'>Weekly sales breakdown with visual insights</p>
                </div>
                <button 
                  onClick={() => router.push('/sales')}
                  className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105'
                >
                  View Details
                </button>
              </div>
              {isSalesLoading ? (
                <div className='h-80 flex items-center justify-center bg-white/50 rounded-2xl backdrop-blur-sm'>
                  <div className='flex flex-col items-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4'></div>
                    <div className='text-gray-500 font-medium'>Loading sales data...</div>
                  </div>
                </div>
              ) : (
                <div className='flex items-center justify-center'>
                  <div className='relative'>
                    <ResponsiveContainer width={400} height={320}>
                      <PieChart>
                        <defs>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.15)"/>
                          </filter>
                        </defs>
                        <Pie
                          data={salesChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          innerRadius={0}
                          paddingAngle={3}
                          dataKey="value"
                          filter="url(#shadow)"
                        >
                          {salesChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={MODERN_COLORS[index % MODERN_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '16px', 
                            color: '#1F2937',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            backdropFilter: 'blur(10px)'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg'>
                        <p className='text-2xl font-bold text-gray-900'>{salesMetrics.totalSales}</p>
                        <p className='text-sm text-gray-600'>Total Sales</p>
                      </div>
                    </div>
                  </div>
                  <div className='ml-8 space-y-4 max-w-xs'>
                    {salesChartData.map((entry, index) => (
                      <div key={entry.name} className='flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all'>
                        <div 
                          className='w-4 h-4 rounded-full shadow-sm' 
                          style={{ backgroundColor: MODERN_COLORS[index % MODERN_COLORS.length] }}
                        ></div>
                        <div className='flex-1'>
                          <span className='text-sm font-semibold text-gray-800'>{entry.name}</span>
                          <p className='text-xs text-gray-600'>{entry.value} units</p>
                        </div>
                        <span className='text-sm font-bold text-gray-900 bg-white/80 px-2 py-1 rounded-lg'>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Status - Enhanced Donut Chart */}
          {hasOrdersPermission() && (
            <div className='bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl shadow-xl p-8 border border-green-200'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h3 className='text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2'>Order Status</h3>
                  <p className='text-gray-600 text-sm'>Current order distribution</p>
                </div>
              </div>
              {isLoading ? (
                <div className='h-64 flex items-center justify-center'>
                  <div className='flex flex-col items-center'>
                    <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-3'></div>
                    <div className='text-gray-500'>Loading orders...</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className='relative mb-6'>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <defs>
                          <filter id="statusShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.1)"/>
                          </filter>
                        </defs>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          filter="url(#statusShadow)"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px', 
                            color: '#1F2937',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='text-center bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-md'>
                        <p className='text-lg font-bold text-gray-900'>{ordersData.length}</p>
                        <p className='text-xs text-gray-600'>Total Orders</p>
                      </div>
                    </div>
                  </div>
                  <div className='space-y-3'>
                    {statusDistribution.slice(0, 4).map((entry, index) => (
                      <div key={entry.name} className='flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all'>
                        <div className='flex items-center gap-3'>
                          <div 
                            className='w-3 h-3 rounded-full shadow-sm' 
                            style={{ backgroundColor: entry.fill }}
                          ></div>
                          <span className='text-sm font-medium text-gray-700'>{entry.name}</span>
                        </div>
                        <span className='text-sm font-bold text-gray-900 bg-white/80 px-2 py-1 rounded-lg'>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Secondary Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          {/* Top Products - Beautiful Pie Chart */}
          {hasSalesPermission() && (
            <div className='bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-3xl shadow-xl p-8 border border-purple-200'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h3 className='text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2'>Top Products</h3>
                  <p className='text-gray-600 text-sm'>Best performing products by sales volume</p>
                </div>
              </div>
              {isSalesLoading ? (
                <div className='h-64 flex items-center justify-center'>
                  <div className='flex flex-col items-center'>
                    <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3'></div>
                    <div className='text-gray-500'>Loading products...</div>
                  </div>
                </div>
              ) : (
                <div className='flex items-center justify-between'>
                  <div className='relative'>
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <defs>
                          <filter id="productShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="rgba(0,0,0,0.12)"/>
                          </filter>
                        </defs>
                        <Pie
                          data={topProductsData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={30}
                          paddingAngle={3}
                          dataKey="value"
                          filter="url(#productShadow)"
                        >
                          {topProductsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '12px', 
                            color: '#1F2937',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className='flex-1 ml-6 space-y-3'>
                    {topProductsData.map((entry, index) => (
                      <div key={entry.name} className='flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm hover:shadow-md transition-all'>
                        <div className='flex items-center gap-3'>
                          <div 
                            className='w-3 h-3 rounded-full shadow-sm' 
                            style={{ backgroundColor: entry.fill }}
                          ></div>
                          <span className='text-sm font-medium text-gray-700'>{entry.name}</span>
                        </div>
                        <span className='text-sm font-bold text-gray-900 bg-white/80 px-2 py-1 rounded-lg'>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Overview - Enhanced Design */}
          <div className='bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-3xl shadow-xl p-8 border border-orange-200'>
            <h3 className='text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6'>Quick Actions</h3>
            <div className='grid grid-cols-2 gap-4'>
              <button 
                onClick={() => router.push('/expiry')}
                className='p-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl border border-orange-200 hover:shadow-xl transition-all duration-300 group transform hover:scale-105'
              >
                <div className='bg-white/80 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 shadow-md'>
                  <Clock className='h-8 w-8 text-orange-600 group-hover:scale-110 transition-transform duration-300' />
                </div>
                <p className='font-bold text-gray-900 text-base mb-1'>Expiry Alerts</p>
                <p className='text-sm text-gray-600'>Check expiring items</p>
              </button>

              <button 
                onClick={() => router.push('/inventory')}
                className='p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl border border-blue-200 hover:shadow-xl transition-all duration-300 group transform hover:scale-105'
              >
                <div className='bg-white/80 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 shadow-md'>
                  <Package className='h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300' />
                </div>
                <p className='font-bold text-gray-900 text-base mb-1'>Inventory</p>
                <p className='text-sm text-gray-600'>Manage stock</p>
              </button>

              {hasSalesPermission() && (
                <button 
                  onClick={() => router.push('/sales')}
                  className='p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl border border-green-200 hover:shadow-xl transition-all duration-300 group transform hover:scale-105'
                >
                  <div className='bg-white/80 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 shadow-md'>
                    <DollarSign className='h-8 w-8 text-green-600 group-hover:scale-110 transition-transform duration-300' />
                  </div>
                  <p className='font-bold text-gray-900 text-base mb-1'>Sales Report</p>
                  <p className='text-sm text-gray-600'>View analytics</p>
                </button>
              )}

              {hasUsersPermission() && (
                <button 
                  onClick={() => router.push('/user')}
                  className='p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border border-purple-200 hover:shadow-xl transition-all duration-300 group transform hover:scale-105'
                >
                  <div className='bg-white/80 backdrop-blur-sm rounded-xl p-3 w-fit mb-4 shadow-md'>
                    <Users className='h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform duration-300' />
                  </div>
                  <p className='font-bold text-gray-900 text-base mb-1'>User Management</p>
                  <p className='text-sm text-gray-600'>Manage staff</p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Active POs */}
          {hasOrdersPermission() && (
            <div className='bg-white rounded-2xl shadow-lg p-8 border border-gray-100'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h3 className='text-xl font-bold text-gray-900 mb-2'>Recent Orders</h3>
                  <p className='text-gray-600 text-sm'>Latest purchase orders and their status</p>
                </div>
                <button 
                  onClick={() => router.push('/orders')}
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                >
                  View All
                </button>
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

          {/* Staff Activity */}
          {hasUsersPermission() && (
            <div className='bg-white rounded-2xl shadow-lg p-8 border border-gray-100'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h3 className='text-xl font-bold text-gray-900 mb-2'>Staff Activity</h3>
                  <p className='text-gray-600 text-sm'>Team member login status and activity</p>
                </div>
                <button 
                  onClick={() => router.push('/user')}
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                >
                  Manage Users
                </button>
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
        </div>
      </div>
    </div>
  )
}

export default Dashboard