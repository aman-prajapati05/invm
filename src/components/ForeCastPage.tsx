"use client"
import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, RadialBarChart, RadialBar } from 'recharts'
import { Brain, TrendingUp, Package, AlertCircle, Download, RefreshCw, Calendar, Filter, Search, Target, Zap, BarChart3 } from 'lucide-react'
import { getAllProducts, getForecastFromDB, getMultipleForecasts, ForecastResponse } from '@/lib/api/forecast'

interface ForecastMetrics {
  totalProducts: number
  avgAccuracy: number
  totalPredictedSales: number
  totalReorderRecommendation: number
  topPerformer: string
  riskProducts: number
}

const ForecastPage = () => {
  const [products, setProducts] = useState<string[]>([])
  const [forecasts, setForecasts] = useState<ForecastResponse[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'high-demand' | 'low-stock' | 'expiring'>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const productList = await getAllProducts()
      setProducts(productList)
      
      // Auto-load forecasts for first 8 products
      const initialProducts = productList.slice(0, 8)
      setSelectedProducts(initialProducts)
      await generateForecasts(initialProducts)
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  const generateForecasts = async (productList: string[]) => {
    try {
      setIsGenerating(true)
      setError(null)
      const forecastData = await getMultipleForecasts(productList, true) as ForecastResponse[]
      setForecasts(forecastData)
    } catch (error) {
      console.error('Error generating forecasts:', error)
      setError('Failed to generate forecasts')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleProductSelection = (product: string) => {
    const newSelection = selectedProducts.includes(product)
      ? selectedProducts.filter(p => p !== product)
      : [...selectedProducts, product]
    
    setSelectedProducts(newSelection)
  }

  const handleGenerateForecasts = () => {
    if (selectedProducts.length > 0) {
      generateForecasts(selectedProducts)
    }
  }

  const calculateMetrics = (): ForecastMetrics => {
    if (!forecasts.length) {
      return {
        totalProducts: 0,
        avgAccuracy: 0,
        totalPredictedSales: 0,
        totalReorderRecommendation: 0,
        topPerformer: 'N/A',
        riskProducts: 0
      }
    }

    const totalPredictedSales = forecasts.reduce((sum, f) => sum + f.predicted_daily_sales_by_model, 0)
    const totalReorderRecommendation = forecasts.reduce((sum, f) => sum + f.recommended_reorder_qty_for_next_week, 0)
    
    const avgAccuracy = forecasts.reduce((sum, f) => {
      const score = f.match_method === 'exact' ? 95 : 
                   f.match_method === 'substring' ? 80 : 70;
      return sum + score;
    }, 0) / forecasts.length;

    const topPerformer = forecasts.reduce((prev, current) => 
      prev.predicted_daily_sales_by_model > current.predicted_daily_sales_by_model ? prev : current
    ).matched_name || 'N/A';

    const riskProducts = forecasts.filter(f => 
      f.features_used.Days_to_Expiry < 7 || f.features_used.Stock_Level < 10
    ).length;

    return {
      totalProducts: forecasts.length,
      avgAccuracy,
      totalPredictedSales,
      totalReorderRecommendation,
      topPerformer,
      riskProducts
    }
  }

  const getFilteredForecasts = () => {
    let filtered = forecasts

    if (filter === 'high-demand') {
      const avgDemand = forecasts.reduce((sum, f) => sum + f.predicted_daily_sales_by_model, 0) / forecasts.length
      filtered = forecasts.filter(f => f.predicted_daily_sales_by_model > avgDemand)
    } else if (filter === 'low-stock') {
      filtered = forecasts.filter(f => f.features_used.Stock_Level < 20)
    } else if (filter === 'expiring') {
      filtered = forecasts.filter(f => f.features_used.Days_to_Expiry < 14)
    }

    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.matched_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const filteredProducts = products.filter(product =>
    product.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const chartData = forecasts.map(f => ({
    name: f.matched_name?.length > 10 ? f.matched_name.substring(0, 10) + '...' : f.matched_name,
    predicted: f.predicted_daily_sales_by_model,
    actual: f.db_avg_daily_sales,
    stock: f.features_used.Stock_Level,
    expiry: f.features_used.Days_to_Expiry,
    reorder: f.recommended_reorder_qty_for_next_week
  }))

  const metrics = calculateMetrics()
  const displayedForecasts = getFilteredForecasts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-2xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Demand Forecasting
              </h1>
              <p className="text-gray-600 mt-2">
                Machine learning-powered inventory predictions and recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Products</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</p>
          </div>

          {/* <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-2 rounded-xl">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.avgAccuracy.toFixed(1)}%</p>
          </div> */}

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-xl">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Daily Pred.</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalPredictedSales.toFixed(0)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-xl">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Reorder</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalReorderRecommendation}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-100 p-2 rounded-xl">
                <Zap className="h-5 w-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Top Item</span>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate" title={metrics.topPerformer}>
              {metrics.topPerformer.length > 8 ? metrics.topPerformer.substring(0, 8) + '...' : metrics.topPerformer}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 p-2 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">At Risk</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.riskProducts}</p>
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Products for Forecasting</h2>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleGenerateForecasts}
              disabled={selectedProducts.length === 0 || isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Brain className="h-5 w-5" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Forecasts'}
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-12 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Selected: {selectedProducts.length} products</span>
                {selectedProducts.length > 0 && (
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product}
                    onClick={() => handleProductSelection(product)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      selectedProducts.includes(product)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {product.length > 15 ? product.substring(0, 15) + '...' : product}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Charts */}
        {forecasts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Predictions vs Actual */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Predictions vs Actual Sales</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)' 
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="predicted" name="AI Predicted" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual Avg" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stock vs Expiry Analysis */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Stock Level vs Days to Expiry</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="stock" name="Stock Level" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="expiry" name="Days to Expiry" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)' 
                    }} 
                  />
                  <Scatter name="Products" dataKey="expiry" fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Forecast Results */}
        {forecasts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Forecast Results</h2>
                <div className="flex items-center gap-4">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Products</option>
                    <option value="high-demand">High Demand</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="expiring">Expiring Soon</option>
                  </select>
                  <button className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              {isGenerating ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Generating AI forecasts...</p>
                </div>
              ) : displayedForecasts.length === 0 ? (
                <div className="text-center py-16">
                  <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Forecasts Available</h3>
                  <p className="text-gray-600">Select products above and click "Generate Forecasts" to see AI predictions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedForecasts.map((forecast, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 truncate flex-1 mr-2" title={forecast.matched_name}>
                          {forecast.matched_name}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          forecast.match_method === 'exact' 
                            ? 'bg-green-100 text-green-700'
                            : forecast.match_method === 'substring'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {forecast.match_method}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Daily Prediction</span>
                          <span className="font-bold text-blue-600">
                            {forecast.predicted_daily_sales_by_model.toFixed(1)} units
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Weekly Reorder</span>
                          <span className="font-bold text-green-600">
                            {forecast.recommended_reorder_qty_for_next_week} units
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg Daily Sales</span>
                          <span className="font-medium text-gray-800">
                            {forecast.db_avg_daily_sales.toFixed(1)} units
                          </span>
                        </div>

                        <div className="pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <span className="block text-gray-500">Stock</span>
                              <span className="font-semibold text-gray-800">{forecast.features_used.Stock_Level}</span>
                            </div>
                            <div className="text-center">
                              <span className="block text-gray-500">Expiry</span>
                              <span className="font-semibold text-gray-800">{forecast.features_used.Days_to_Expiry}d</span>
                            </div>
                            <div className="text-center">
                              <span className="block text-gray-500">SKU</span>
                              <span className="font-semibold text-gray-800">{forecast.features_used.SKU}</span>
                            </div>
                          </div>
                        </div>

                        {(forecast.features_used.Days_to_Expiry < 7 || forecast.features_used.Stock_Level < 10) && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-red-700 font-medium">Requires attention</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForecastPage