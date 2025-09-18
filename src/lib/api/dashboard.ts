import api from "../axios";

export const fetchDashboardOrdersData = async (startDate?: string, endDate?: string) => {
    let url = 'api/dashboard/orders';
    
    // Add query parameters if dates are provided
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    const res = await api.get(url);
    if (res.status === 200) {
        return res.data;
    } else {
        throw new Error('Failed to fetch dashboard orders data');
    }
}

export const fetchOrderStats = async (startDate?: string, endDate?: string) => {
    let url = 'api/dashboard/stats';
    
    // Add query parameters if dates are provided
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    const res = await api.get(url);
    if (res.status === 200) {
        return res.data;
    } else {
        throw new Error('Failed to fetch order statistics');
    }
}