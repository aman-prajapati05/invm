"use client";

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  email: string;
  onVerified: () => void;
  onChangeEmail: () => void;
}

const OtpVerification: React.FC<Props> = ({
  email,
  onVerified,
  onChangeEmail
}) => {
  const { verifyOtp,resendOtp } = useAuth();
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 4) return;

    setLoading(true);
    try {
      await verifyOtp(email, fullOtp);
      setError(null);
      onVerified();
    } catch (err: any) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtp(["", "", "", ""]);
    setTimer(30);
    setError(null);
    inputsRef.current[0]?.focus();
    // You may call a resend OTP API here if implemented
    resendOtp(email).catch((err) => {
      setError("Failed to resend OTP. Please try again.");
    });
    console.log("OTP resent to", email);
  };

  const isFormValid: boolean = otp.every((digit) => digit !== "");

  return (
    <div className='flex justify-center items-center w-screen h-screen bg-[#fff] bg-op'>
      <div className='bg-white rounded-lg shadow-md  w-[480px]'>
        {/* Header */}
        <div className='flex flex-col items-center pb-4 border-b border-[#F5F5F5] pt-5'>
          <Image src="/logo.png" alt="Logo" width={60} height={60} className='object-contain mx-auto mb-4' />
        </div>

        {/* OTP Title */}
        <div className='flex flex-col items-center mt-4'>
          <div className='text-[#191A1B] text-lg font-semibold'>OTP Verification</div>
          <div className='flex gap-1'>
            <div className='text-[#545659] text-sm'>Enter OTP code sent to {email}</div>
            <div onClick={onChangeEmail} className='text-[#005BD3] text-sm cursor-pointer'>(Change)</div>
          </div>
        </div>

        {/* OTP Inputs */}
        <div className='flex justify-center items-center gap-2 my-4'>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputsRef.current[index] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`w-16 h-16 text-center border rounded-lg text-[#191A1B] text-lg outline-none ${
                error
                  ? 'border-[#F04438]'
                  : isFormValid
                  ? 'border-[#5433EB]'
                  : 'border-[#EAEAEA]'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className='text-[#F04438] text-sm text-center mt-[-12px] mb-2'>
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className='flex justify-end px-4 border-t pt-4 border-[#F5F5F5]'>
          <button
            onClick={handleVerify}
            disabled={!isFormValid || loading}
            className={`text-sm font-medium rounded-lg w-full h-12 transition-colors ${
              isFormValid && !loading
                ? 'bg-[#191A1B] text-white cursor-pointer'
                : 'bg-[#EAEAEA] text-[#90919B] cursor-not-allowed'
            }`}
          >
            {loading ? 'Verifying...' : 'Log in'}
          </button>
        </div>

        {/* Timer */}
        <div className='text-sm flex justify-center items-center mt-4 mb-6'>
          {timer > 0 ? (
            <span className='text-[#545659]'>
              Didn’t receive OTP code? Retry in 00:{timer.toString().padStart(2, '0')}
            </span>
          ) : (
            <div className='flex gap-1'>
              <div className='text-[#545659]'>Didn’t receive OTP code?</div>
              <span onClick={handleResend} className='text-[#005BD3] underline cursor-pointer'>
                Resend Code
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
