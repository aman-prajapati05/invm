'use client';

import ForgotPassword from '@/components/ForgotPassword';
import LoginForm from '@/components/LoginForm';
import OtpVerification from '@/components/OtpVerification';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Step = 'login' | 'forgot' | 'otp' | 'reset' | 'done';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState<string>('');
  const { login, verifyOtp ,hydrated,user} = useAuth(); // ⬅️ pulled from context
useEffect(() => {
    if (hydrated && user) {
      router.replace('/'); // or your desired protected route
    }
  }, [hydrated, user, router]);

  if (!hydrated) return null; 
  return (
    <>
      {step === 'login' && (
        <LoginForm
          onContinue={async (userEmail, password) => {
            await login(userEmail, password);
            setEmail(userEmail);
            setStep('otp');
          }}
          onForgotPassword={() => setStep('forgot')}
        />
      )}

      {step === 'forgot' && (
        <ForgotPassword
          onOtpSent={(userEmail) => {
            setEmail(userEmail);
            setStep('otp');
          }}
        />
      )}

      {step === 'otp' && (
        <OtpVerification
          email={email}
          onVerified={() => {
            setStep('done');
          }}
          onChangeEmail={() => setStep('login')}
        />
      )}
    </>
  );
}
