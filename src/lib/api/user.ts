import api from "../axios";


export const fetchUsers = async () => {
  const res = await api.get('/api/users');
  return res.data;
};

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  status: string;
  permissions: {
    dashboard?: boolean;
    inventory?: boolean;
    picklist?: boolean;
    label?: boolean;
    shipping?: boolean;
    sku?: boolean;
    buyer?: boolean;
    courier?: boolean;
    user?: boolean;
  };
}) => {
  const res = await api.post('/api/users/invite', userData);
  return res.data;
};

export const updateUser = async (id: string, updates: Partial<{
  name: string;
  email: string;
  password: string;
  status: string;
  permissions: {
    dashboard?: boolean;
    inventory?: boolean;
    picklist?: boolean;
    label?: boolean;
    shipping?: boolean;
    sku?: boolean;
    buyer?: boolean;
    courier?: boolean;
    user?: boolean;
  };
}>) => {
  const res = await api.put('/api/users', { id, ...updates });
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete('/api/users', { data: { id } });
  return res.data;
};

export const getUserById = async (id: string) => {
  const res = await api.get(`/api/users/${id}`);
  return res.data;
};

export const resendInvite = async (userId: string) => {
  const res = await api.post('/api/users/resend-invite', { userId });
  return res.data;
};