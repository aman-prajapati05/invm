"use client"
import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Package, AlertCircle, Brain, Target, Calendar, Layers } from 'lucide-react'
import { getForecastFromDB, getMultipleForecasts, getAllProducts, ForecastResponse } from '@/lib/api/forecast'

interface ForecastCardProps {
  forecast: ForecastResponse;
  isLoading?: boolean;
}

const FORECAST_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

// Individual Forecast Card Component
const ForecastCard: React.FC<ForecastCardProps> = ({ forecast, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  const accuracy = forecast.match_method === 'exact' ? 95 : 
                   forecast.match_method === 'substring' ? 80 : 70;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-blue-100 p-3 rounded-xl">
          <Brain className="h-6 w-6 text-blue-600" />
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          forecast.match_method === 'exact' 
            ? 'bg-green-100 text-green-700'
            : forecast.match_method === 'substring'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-orange-100 text-orange-700'
        }`}>
          {accuracy}% Match
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2 truncate" title={forecast.matched_name}>
        {forecast.matched_name}
      </h3>
      
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
          <span className="text-sm text-gray-600">Recent Sales</span>
          <span className="font-medium text-gray-800">
            {forecast.db_recent_total_quantity} units ({forecast.db_days_span_used}d)
          </span>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500">
              Stock: {forecast.features_used.Stock_Level} | 
              Expiry: {forecast.features_used.Days_to_Expiry}d
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product Search and Forecast Component
const ProductForecastSearch: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [availableProducts, setAvailableProducts] = useState<string[]>([])
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProductsLoading, setIsProductsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const products = await getAllProducts()
      setAvailableProducts(products)
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products')
    } finally {
      setIsProductsLoading(false)
    }
  }

  const handleProductSelect = async (productName: string) => {
    if (!productName) return
    
    setSelectedProduct(productName)
    setIsLoading(true)
    setError(null)
    
    try {
      const forecastData = await getForecastFromDB(productName, 30)
      setForecast(forecastData)
    } catch (error) {
      console.error('Error fetching forecast:', error)
      setError('Failed to fetch forecast for this product')
      setForecast(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-3xl shadow-xl p-8 border border-indigo-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-3 rounded-xl">
          <Target className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Product Demand Forecast
          </h3>
          <p className="text-gray-600 text-sm">AI-powered sales prediction and reorder recommendations</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Product for Forecast
        </label>
        <select
          value={selectedProduct}
          onChange={(e) => handleProductSelect(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          disabled={isProductsLoading || isLoading}
        >
          <option value="">
            {isProductsLoading ? 'Loading products...' : 'Choose a product'}
          </option>
          {availableProducts.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing product data and generating forecast...</p>
        </div>
      )}

      {forecast && !isLoading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {forecast.predicted_daily_sales_by_model.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Units/Day Predicted</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {forecast.recommended_reorder_qty_for_next_week}
              </div>
              <div className="text-sm text-gray-600">Weekly Reorder Qty</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {forecast.db_avg_daily_sales.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Daily Sales</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Model Features
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">SKU:</span>
                  <span className="font-medium">{forecast.features_used.SKU}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Level:</span>
                  <span className="font-medium">{forecast.features_used.Stock_Level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days to Expiry:</span>
                  <span className="font-medium">{forecast.features_used.Days_to_Expiry}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Recent Performance
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-medium">{forecast.db_recent_total_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium">{forecast.db_days_span_used} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Match Method:</span>
                  <span className={`font-medium capitalize ${
                    forecast.match_method === 'exact' ? 'text-green-600' : 
                    forecast.match_method === 'substring' ? 'text-yellow-600' : 'text-orange-600'
                  }`}>
                    {forecast.match_method}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 italic">{forecast.note}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Top Products Forecast Overview
const TopProductsForecasts: React.FC = () => {
  const [forecasts, setForecasts] = useState<ForecastResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTopProductsForecasts()
  }, [])

  const loadTopProductsForecasts = async () => {
    try {
      // You can customize this list based on your top products
      const topProducts = [
        'Rice', 'Wheat Flour', 'Sugar', 'Cooking Oil', 'Pulses', 'Tea'
      ]
      
      const forecastData = await getMultipleForecasts(topProducts, true) as ForecastResponse[]
      
      // Sort by predicted daily sales
      const sortedForecasts = forecastData.sort(
        (a, b) => b.predicted_daily_sales_by_model - a.predicted_daily_sales_by_model
      )
      
      setForecasts(sortedForecasts.slice(0, 6))
    } catch (error) {
      console.error('Error loading forecasts:', error)
      setError('Failed to load forecasts')
    } finally {
      setIsLoading(false)
    }
  }

  const chartData = forecasts.map((forecast, index) => ({
    name: forecast.matched_name?.length > 10 
      ? forecast.matched_name.substring(0, 10) + '...' 
      : forecast.matched_name,
    predicted: forecast.predicted_daily_sales_by_model,
    actual: forecast.db_avg_daily_sales,
    reorder: forecast.recommended_reorder_qty_for_next_week,
    fill: FORECAST_COLORS[index % FORECAST_COLORS.length]
  }))

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Forecast Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Chart Overview */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl shadow-xl p-8 border border-emerald-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Demand Forecast Overview
            </h3>
            <p className="text-gray-600 text-sm">AI predictions vs actual sales performance</p>
          </div>
        </div>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center bg-white/50 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <div className="text-gray-500 font-medium">Generating forecasts...</div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    color: '#374151'
                  }} 
                />
                <Legend />
                <Bar 
                  dataKey="predicted" 
                  name="Predicted Daily Sales" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="actual" 
                  name="Actual Avg Daily Sales" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Forecast Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <ForecastCard key={index} forecast={{} as ForecastResponse} isLoading={true} />
          ))
        ) : (
          forecasts.map((forecast, index) => (
            <ForecastCard key={index} forecast={forecast} />
          ))
        )}
      </div>
    </div>
  )
}

// Main Forecast Dashboard Component
export const ForecastDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <ProductForecastSearch />
      <TopProductsForecasts />
    </div>
  )
}

export { ProductForecastSearch, TopProductsForecasts, ForecastCard }