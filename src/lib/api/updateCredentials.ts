import api from "../axios";

export async function verifyPassword(currentPassword: string,type: 'email-update' | 'password-update' = 'email-update') {
  const res = await api.post('/api/auth/verify-password-send-otp', { currentPassword, type });
  return res.data;
}

export async function verifyUpdateOtp(otp: string, type: 'email-update' | 'password-update') {
  const res = await api.post('/api/auth/verify-update-otp', { otp, type });
  return res.data;
}

export async function updateCredentials(data: {
  email?: string;
  password?: string;
}) {
  const res = await api.put('/api/auth/update-credentials', data);
  return res.data;
}

export async function sendForgotPasswordEmail(email: string) {
  const res = await api.post('/api/auth/forgot-password', { email });
  return res.data;
}

export async function resendUpdateOtp(email: string, type: 'email-update' | 'password-update') {
  const res = await api.post('/api/auth/resend-update-otp', { email, type });
  return res.data;
}
