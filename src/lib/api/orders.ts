import { stat } from "fs";
import api from "../axios";

// types/order.ts
export type OrderItem = {
  itemCode: string;
  quantity: number;
  igst: number;
  cgst: number | null;
  taxAmount: number;
  totalAmount: number;
  basicCostPrice: number;
  itemName?: string; // Optional field for item name
};

export type PODetails = {
  poNumber: string;
  poDate: string;
  deliveryDate: string;
  deliveredTo: string;
  paymentTerms: string;
  gstNo: string;
  location: string;
  poExpiryDate: string;
  totalQuantity: number;
  totalValue: number;
};

export type Orders = {
  _id?: string;
  po_number: string;
  source: string;
  status?: string; // Add status field
  data: any;
  poDetails: PODetails;
  items: OrderItem[];
  s3_key: string;
  s3_url: string;
  validationErrors?: [];
};

export const getOrderById = async (id: string) => {
  const res = await api.get(`/api/orders/${id}`);
  return res.data;
};

export const getAllOrders = async () => {
  const res = await api.get('/api/orders');
  return res.data;
};

export const updateOrder = async (id: string, updateData: Partial<Orders>) => {
  const res = await api.put(`/api/orders`, { orderId: id, updateData });
  return res.data;
};

export const approveOrder = async (id: string) => {
  const res = await api.put(`/api/orders/enrich`, { orderId: id, status: 'approved' });
  return res.data;
};
export const deleteOrder = async (id: string) => {
  const res = await api.delete(`/api/orders/${id}`);
  return res.data;
};

export const createOrder = async (orderData: Orders) => {
  const res = await api.post('/api/orders', orderData);
  return res.data;
};

export const getAllOrdersbyQuery = async (query = '') => {
  const res = await api.get(`/api/orders${query}`);
  return res.data;
};

export const getAllBuyers = async () => {
  const res = await api.get('/api/orders/buyer');
  return await res.data;
};

export const searchOrders = async (query: string) => {
  const res = await api.get(`/api/orders/search?query=${encodeURIComponent(query)}`);
  return await res.data;
};

export const uploadPOPDFs = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

   const { data } = await api.post('/api/orders/uploadPo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

   return data?.data ?? data;
};

export async function getNextOrder(currentOrderId: string) {
  const res = await api.get(`/api/orders/next?currentOrderId=${currentOrderId}`);
  const data = res.data;
  return data.nextOrder;
}

export async function getPreviousOrder(currentOrderId: string) {
  const res = await api.get(`/api/orders/prev?currentOrderId=${currentOrderId}`);
  const data = res.data;
  return data.prevOrder;
}
