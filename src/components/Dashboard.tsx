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

interface ChartData extends Record<string, unknown> {
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
          {/* <div>
            <DateButton
              onDateRangeSelect={handleDateRangeSelect}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
            />
          </div> */}
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