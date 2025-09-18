import api from "../axios";
import { labelNotification } from "../notifications";


export const fetchAllLabels = async()=>{
    const res = await api.get('/api/label-maker')
    return res.data;
}

export const getLabelById = async (id: string) => {
  const res = await api.get(`/api/label-maker/${id}`);
  return res.data;
};

export const getDocketOrders = async (docketId: string) => {
  const res = await api.get(`/api/label-maker/docket/${docketId}`);
  return res.data;
};

export const updateLabel = async (id: string, data: any) => {
  const res = await api.patch(`/api/label-maker`, { orderId: id, updateData: data ,});
  // if(res.status == 200){
  //   await labelNotification(data.poNumber);
  // }
  return res.data;

};


export const addManifest = async (id: string, awbNumber: string, dispatchDate: string, courier?: string, isDocket?: boolean, docketId?: string) => {
  const requestData = {
    orderId: id,
    awbNumber,
    dispatchDate,
    courier,
    ...(isDocket && { isDocket: true, docketId })
  };
  
  console.log('addManifest API - Request data:', requestData);
  
  const res = await api.post('/api/label-maker/manifest', requestData);
  
  console.log('addManifest API - Response:', res.data);
  
  return res.data;
}

export const getAllLabelsByQuery = async (query = '') => {
  const res = await api.get(`/api/label-maker${query}`);
  return res.data;
};

export const searchLabels = async (query: string) => {
  const res = await api.get(`/api/label-maker/search?query=${encodeURIComponent(query)}`);
  return await res.data;
};