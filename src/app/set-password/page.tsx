// /app/set-password/page.tsx or /pages/set-password.tsx (based on routing strategy)

'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import SetPassword from '@/components/SetPassword';

const SetPasswordContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const router = useRouter();

  const [valid, setValid] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Redirect to login if no token is provided
    if (!token) {
      router.push('/login');
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(`/api/users/verify-token?token=${token}`);
        setValid(res.data.valid);
      } catch {
        setValid(false);
      }
    };

    verify();
  }, [token, router]);

  const handleSetPassword = async (password: string, confirmPassword: string) => {
    try {
      await axios.post('/api/users/set-password', { token, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500); // redirect after success
    } catch (err: any) {
      throw err; // Let the SetPassword component handle the error display
    }
  };

  if (valid === false) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-[#fff]">
        <div className="bg-white rounded-lg shadow-md w-[480px] p-6 text-center">
          <p className="text-red-600 text-lg">Invalid or expired link.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 bg-[#191A1B] text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (valid === null) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-[#fff]">
        <div className="bg-white rounded-lg shadow-md w-[480px] p-6 text-center">
          <p className="text-gray-500 text-lg">Verifying token...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-[#fff]">
        <div className="bg-white rounded-lg shadow-md w-[480px] p-6 text-center">
          <p className="text-green-600 text-lg">Password set successfully!</p>
          <p className="text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <SetPassword onContinue={handleSetPassword} token={token || undefined} />;
};

const SetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center w-screen h-screen bg-[#fff]">
        <div className="bg-white rounded-lg shadow-md w-[480px] p-6 text-center">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
};

export default SetPasswordPage;
