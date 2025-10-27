// lib/api/forecast.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ForecastResponse {
  source: string;
  product_name: string;
  matched_name: string;
  match_method: string;
  sku: number;
  db_recent_total_quantity: number;
  db_days_span_used: number;
  db_avg_daily_sales: number;
  features_used: {
    SKU: number;
    Stock_Level: number;
    Days_to_Expiry: number;
  };
  predicted_daily_sales_by_model: number;
  recommended_reorder_qty_for_next_week: number;
  note: string;
}

export interface ProductForecast {
  product_name: string;
  sku: number;
  predicted_daily_sales: number;
  recommended_reorder_qty_for_next_week: number;
}

export interface AllProductsResponse {
  products: string[];
}

// Get forecast for a specific product from database
export const getForecastFromDB = async (
  productName: string, 
  lookbackDays: number = 30
): Promise<ForecastResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/forecast/from-db/${encodeURIComponent(productName)}?lookback_days=${lookbackDays}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching forecast from DB:', error);
    throw error;
  }
};

// Get forecast for a specific product from CSV data
export const getForecastFromCSV = async (productName: string): Promise<ProductForecast> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/forecast/${encodeURIComponent(productName)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching forecast from CSV:', error);
    throw error;
  }
};

// Get all available products
export const getAllProducts = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/all-products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AllProductsResponse = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

// Get multiple forecasts for dashboard
export const getMultipleForecasts = async (
  productNames: string[], 
  useDB: boolean = true
): Promise<(ForecastResponse | ProductForecast)[]> => {
  try {
    const promises = productNames.map(productName => 
      useDB 
        ? getForecastFromDB(productName)
        : getForecastFromCSV(productName)
    );

    const results = await Promise.allSettled(promises);
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<ForecastResponse | ProductForecast>).value);
  } catch (error) {
    console.error('Error fetching multiple forecasts:', error);
    throw error;
  }
};