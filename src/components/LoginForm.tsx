"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  onContinue: (email: string, password: string) => Promise<void>;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<Props> = ({ onContinue, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (!lockUntil) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.max(0, new Date(lockUntil).getTime() - now.getTime());

      if (diff <= 0) {
        setLockUntil(null);
        setCountdown('');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = email.trim() !== '' && password.trim() !== '' && isValidEmail(email);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleContinue = async () => {
    setHasAttemptedSubmit(true);
    
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      await onContinue(email, password);
    } catch (err: any) {
      const res = err?.response?.data;

    

  if (res?.lockUntil) {
    setLockUntil(new Date(res.lockUntil));
    setError(''); // handled in UI below
  } else if (res?.remainingAttempts !== undefined) {
    setRemainingAttempts(res.remainingAttempts);
    setError(''); // handled in UI below
  } else if (res?.message) {
    // Show backend message only if it's not one of the above
    setError(res.message);
  } else {
    setError('Something went wrong. Please try again.');
  }
    }
     finally {
    setIsLoading(false); // ✅ this ensures it always stops loading
  }

  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleContinue();
    }
  };

  return (
    <div className='flex justify-center items-center w-screen h-screen bg-[#A3A3A3] '>
      <div className='bg-white rounded-lg shadow-md w-[480px]'>
        {/* Logo */}
        <div className='flex flex-col items-center pb-4 border-b border-[#F5F5F5] pt-5'>
          <Image
            src="/logo.png"
            alt="Logo"
            width={60}
            height={60}
            className='object-contain mx-auto mb-4'
          />
        </div>

        {/* Email Input */}
        <div className='flex flex-col gap-2 px-4'>
          <label className='text-sm text-[#545659]'>Email</label>
          <input
            type="email"
            placeholder='Enter your email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full h-12 px-4 border rounded-lg outline-none text-sm text-[#191A1B] placeholder-[#90919B] ${
              hasAttemptedSubmit && email.trim() !== '' && !isValidEmail(email) 
                ? 'border-[#F04438] focus:border-[#F04438]' 
                : 'border-[#EAEAEA] focus:border-[#191A1B]'
            }`}
          />
          {hasAttemptedSubmit && email.trim() !== '' && !isValidEmail(email) && (
            <div className='text-[#F04438] text-xs'>Please enter a valid email address</div>
          )}
        </div>

        {/* Password Input */}
        <div className='flex flex-col gap-2 px-4 mt-4'>
          <label className='text-sm text-[#545659]'>Password</label>
          <div>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className='w-full h-12 px-4 pr-12 border border-[#EAEAEA] rounded-lg outline-none text-sm text-[#191A1B] placeholder-[#90919B]'
              />


              <button
                type="button"
                onClick={togglePasswordVisibility}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-[#90919B] hover:text-[#191A1B] transition-colors'
              >
                {showPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
              </button>

            </div>
{(remainingAttempts !== null || lockUntil || error) && (
  <div className='text-[#F04438] text-xs mt-1'>
    {lockUntil && countdown && (
      <div>Too many failed attempts. Your account is temporarily disabled. </div>
    )}
    {!lockUntil && remainingAttempts !== null && (
      <div>Password is incorrect. {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} left.</div>
    )}
    {!lockUntil && error && (
      <div>{error}</div>
    )}
  </div>
)}
          </div>
        </div>

        {/* Forgot Password */}
        <div
          onClick={onForgotPassword}
          className='flex justify-end px-4 mt-4 pb-4 border-b border-[#F5F5F5] text-[#90919B] text-sm cursor-pointer underline'
        >
          Forgot Password?
        </div>

        {/* Continue Button */}
        <div className='flex justify-end px-4 pb-4'>
          <button
            onClick={handleContinue}
            className={`rounded-lg w-full h-12 transition-colors flex items-center justify-center gap-2 ${
              lockUntil && countdown
                ? 'bg-[#EAEAEA] text-[#90919B] cursor-not-allowed font-medium text-base'
                : isFormValid && !isLoading
                ? 'bg-[#191A1B] text-white cursor-pointer text-sm font-medium'
                : 'bg-[#EAEAEA] text-[#90919B] cursor-not-allowed text-sm font-medium'
            }`}
            disabled={!isFormValid || isLoading || !!lockUntil}
          >
            {lockUntil && countdown ? (
              `Try again in ${countdown}`
            ) : isLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Continue'
            )}

          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
