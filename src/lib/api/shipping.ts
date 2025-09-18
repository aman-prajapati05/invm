import api from "../axios";

export const fetchAllShippingManifests = async () => {
   const res = await api.get('/api/shipping');
    return res.data;
};

export const fetchShippingManifestById = async (id: string) => {
    const res = await api.get(`/api/shipping/${id}`);
    return res.data;
};

export const updateShippingManifest = async (id: string, updateData: { invoiceNumber?: string; awbNumber?: string }) => {
    const res = await api.put(`/api/shipping/${id}`, updateData);
    return res.data;
};


export const searchShipping = async (query: string) => {
  const res = await api.get(`/api/shipping/search?query=${encodeURIComponent(query)}`);
  return await res.data;
};

export const getAllShippingByQuery = async (query = '') => {
  const res = await api.get(`/api/shipping${query}`);
  return res.data;
};

export const getDocketShippingManifests = async (docketId: string) => {
  const res = await api.get(`/api/shipping/docket/${docketId}`);
  return res.data;
};

export const getNextShippingOrder = async (currentOrderId: string) => {
  const res = await api.get(`/api/shipping/next?currentOrderId=${currentOrderId}`);
  return res.data.nextOrder;
};

export const getPreviousShippingOrder = async (currentOrderId: string) => {
  const res = await api.get(`/api/shipping/prev?currentOrderId=${currentOrderId}`);
  return res.data.prevOrder;
};