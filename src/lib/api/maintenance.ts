import api from "../axios";

export const getMaintenanceMode = async (): Promise<boolean> => {
  const response = await api.get('/api/maintenance');
  return response.data.maintenance;
};

export const setMaintenanceMode = async (enabled: boolean): Promise<void> => {
  await api.post('/api/maintenance', { enabled });
};
