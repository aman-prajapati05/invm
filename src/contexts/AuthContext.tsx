'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { setAccessToken as syncToken,setLogoutCallback ,authApi} from '@/lib/axios';
import { getUserById } from '@/lib/api/user';

type Role = 'admin' | 'manager' | 'viewer';

interface User {
    _id: string;
    name: string;
    email: string;
    permissions: {
        [key: string]: boolean;
    };
    phone_no: string;
    password: string;
    role: string;
    status: 'active' | 'inactive';
    warehouse_id: string;
    warehouse_name: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  hydrated: boolean;
  maintenance: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [maintenance, setMaintenance] = useState<boolean>(false);


  useEffect(() => {
  const stored = localStorage.getItem('maintenance');
  if (stored) {
    setMaintenance(JSON.parse(stored));
  }
}, []);

  useEffect(() => {
  // Register the logout function with axios interceptor
  setLogoutCallback(logout);
  
  // Cleanup on unmount
  return () => {
    setLogoutCallback(null);
  };
}, []);

  useEffect(() => {
    if (user?._id) {
      getUserById(user._id).then((fetchedUser) => {
        if (fetchedUser) {
          setUser(fetchedUser);
          localStorage.setItem('user', JSON.stringify(fetchedUser)); // ✅ add this
          // console.log("User fetched and set:", fetchedUser);
        } else {
          console.error("Failed to fetch user data");
        }
      }).catch((error) => {
        console.error("Error fetching user data:", error);
      });
    }
  }, [user?._id, setUser]); // Fetch user data when user ID changes

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    const storedMaintenance = localStorage.getItem('maintenance');
    
    if (storedMaintenance) {
    setMaintenance(JSON.parse(storedMaintenance));
  }


    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setAccessToken(token);
        syncToken(token);
        setUser(parsedUser);
        // console.log("Auth restored from localStorage", { token, user: parsedUser });
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
    
    setHydrated(true);
  }, []);

  // Sync token with axios instance
  useEffect(() => {
    syncToken(accessToken);
  }, [accessToken]);

  // Save token/user to localStorage when updated
  useEffect(() => {
    if (accessToken && user) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }, [accessToken, user]);

  useEffect(() => {
  let interval: NodeJS.Timeout;

  const fetchMaintenance = async () => {
    try {
      const res = await api.get('/api/maintenance');
      setMaintenance(res.data.enabled);
      localStorage.setItem('maintenance', JSON.stringify(res.data.enabled));
    } catch (err) {
      console.error('Failed to fetch maintenance status', err);
    }
  };

  // ✅ Run once on load
  fetchMaintenance();

  // ✅ Optional polling (every 60s)
  interval = setInterval(fetchMaintenance, 60_000);

  return () => {
    clearInterval(interval);
  };
}, []);

  const login = async (email: string, password: string) => {
    await authApi.post('/api/auth/login', { email, password });
    // OTP is sent. Wait for verifyOtp next.
  };

  const resendOtp = async (email: string) => {
    await authApi.post('/api/auth/resend-otp', { email });
    // console.log("OTP resent to", email);
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await authApi.post('/api/auth/verify-otp', { email, otp });
    const { accessToken, user ,maintenance} = res.data;
    setAccessToken(accessToken);
    setUser(user);
    localStorage.setItem('maintenance', JSON.stringify(maintenance));
    router.push('/');
  };
  
//   const unsubscribeFromPush = async () => {
//   try {
//     const reg = await navigator.serviceWorker.ready;
//     const subscription = await reg.pushManager.getSubscription();

//     if (subscription) {
//       await api.delete('/api/push-subscription'); // 👈 remove from DB
//       const unsubscribed = await subscription.unsubscribe(); // 👈 remove from browser
//       if (unsubscribed) {
//         // console.log('✅ Unsubscribed from browser push');
//       }
//     }
//   } catch (err) {
//     console.warn('Failed to unsubscribe from push:', err);
//   }
// };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = async () => {
    // await unsubscribeFromPush(); 
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, verifyOtp, logout, hydrated, resendOtp, updateUser , maintenance }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};