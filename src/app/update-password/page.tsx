"use client";
import { verifyPassword, verifyUpdateOtp, updateCredentials, sendForgotPasswordEmail, resendUpdateOtp } from '@/lib/api/updateCredentials';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';

interface UpdatePasswordPageProps {}

const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [otpArray, setOtpArray] = useState<string[]>(["", "", "", ""]);

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Timer effect for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStep === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, timer]);

  const resetForm = (): void => {
    setCurrentStep(1);
    setCurrentPassword('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setUserEmail('');
    setError('');
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setTimer(30);
    setOtpArray(["", "", "", ""]);
  };

  // OTP handling functions
  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpArray(newOtp);
    setError('');

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerifyOtp();
    }
  };

  const handleResendOtp = async () => {
    if (!userEmail) {
      setError('Email not found. Please restart the process.');
      return;
    }

    try {
      setIsLoading(true);
      await resendUpdateOtp(userEmail, 'password-update');
      setOtpArray(["", "", "", ""]);
      setTimer(30);
      setError('');
      inputsRef.current[0]?.focus();
      console.log("OTP resent for password update");
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!userEmail) {
      setError('Email not found. Please restart the process.');
      return;
    }

    try {
      setIsLoading(true);
      await sendForgotPasswordEmail(userEmail);
      setError('');
      alert('Password reset link has been sent to your email. Please check your inbox.');
      router.push('/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPassword = async (): Promise<void> => {
    if (!currentPassword.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await verifyPassword(currentPassword,'password-update');
      // Store user email for later use
      if (response.email) {
        setUserEmail(response.email);
      }
      setCurrentStep(2);
      setTimer(30); // Reset timer when moving to OTP step
      setOtpArray(["", "", "", ""]); // Reset OTP array
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    const fullOtp = otpArray.join('');
    if (fullOtp.length !== 4) return;

    setIsLoading(true);
    setError('');

    try {
      await verifyUpdateOtp(fullOtp,'password-update');
      setCurrentStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (): Promise<void> => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await updateCredentials({ password: newPassword });
      setCurrentStep(4);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void): void => {
    if (event.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Update Password</h1>

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 relative">

            {/* Close Button */}
            <button onClick={() => router.push('/settings')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Step 1: Verify Current Password */}
            {currentStep === 1 && (
              <div className="pt-5 px-4">
                <div className='pb-4 border-b border-[#F5F5F5] '>
                  <Image
                              src="/logo.png"
                              alt="Logo"
                              width={60}
                              height={60}
                              className='object-contain mx-auto mb-4'
                            />
                </div>
                <h2 className="text-lg text-[#191A1B] font-semibold mb-2 text-center mt-4">Verify Your Password</h2>
                <p className="text-[#545659] mb-4 text-center">Please enter your current password to continue</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#545659] mb-2">
                    Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleVerifyPassword)}
                        className="w-full px-3 py-2 pr-10 border text-[#545659] border-[#EAEAEA] rounded-md focus:outline-none  "
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}
                  <div 
                    onClick={handleForgotPassword}
                    className='underline text-[#90919B] text-sm mt-4 text-end cursor-pointer hover:text-[#191A1B] transition-colors'
                  >
                    Forgot Password?
                  </div>
                  
                  <button
                    onClick={handleVerifyPassword}
                    disabled={!currentPassword.trim() || isLoading}
                    className={`w-full py-2 px-4 rounded-md font-medium mb-5 ${
                      currentPassword.trim() && !isLoading
                        ? 'bg-[#191A1B] text-white'
                        : 'bg-[#EAEAEA] text-[#545659] cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Verifying...' : 'Continue'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verify OTP */}
            {currentStep === 2 && (
              <div className="pt-5">
                {/* Header */}
                <div className='flex flex-col items-center pb-4 border-b border-[#F5F5F5]'>
                  <Image src="/logo.png" alt="Logo" width={60} height={60} className='object-contain mx-auto mb-4' />
                </div>

                {/* OTP Title */}
                <div className='flex flex-col items-center mt-4'>
                  <div className='text-[#191A1B] text-lg font-semibold'>OTP Verification</div>
                  <div className='flex gap-1'>
                    <div className='text-[#545659] text-sm'>Enter OTP code sent to your email</div>
                  </div>
                </div>

                {/* OTP Inputs */}
                <div className='flex justify-center items-center gap-2 my-4'>
                  {otpArray.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputsRef.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className={`w-16 h-16 text-center border rounded-lg text-[#191A1B] text-lg outline-none ${
                        error
                          ? 'border-[#F04438]'
                          : otpArray.every((digit) => digit !== "")
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
                    onClick={handleVerifyOtp}
                    disabled={!otpArray.every((digit) => digit !== "") || isLoading}
                    className={`text-sm font-medium rounded-lg w-full h-12 transition-colors ${
                      otpArray.every((digit) => digit !== "") && !isLoading
                        ? 'bg-[#191A1B] text-white cursor-pointer'
                        : 'bg-[#EAEAEA] text-[#90919B] cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>

                {/* Timer */}
                <div className='text-sm flex justify-center items-center mt-4 mb-6'>
                  {timer > 0 ? (
                    <span className='text-[#545659]'>
                      Didn't receive OTP code? Retry in 00:{timer.toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <div className='flex gap-1'>
                      <div className='text-[#545659]'>Didn't receive OTP code?</div>
                      <span onClick={handleResendOtp} className='text-[#005BD3] underline cursor-pointer'>
                        Resend Code
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Set New Password */}
            {currentStep === 3 && (
              <div className="pt-5 px-4">
                <div className='pb-4 border-b border-[#F5F5F5]'>
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={60}
                    height={60}
                    className='object-contain mx-auto mb-4'
                  />
                </div>
                <h2 className="text-lg text-[#191A1B] font-semibold mb-2 text-center mt-4">Set New Password</h2>
                <p className="text-[#545659] mb-4 text-center">Create a strong password for your account</p>
                
                <div className="space-y-4">
                  {/* New Password Input */}
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm text-[#545659]'>New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder='Enter new password'
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleUpdatePassword)}
                        className="w-full h-12 px-4 pr-10 border rounded-lg outline-none text-sm text-[#191A1B] placeholder-[#90919B] border-[#EAEAEA] focus:border-[#191A1B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm text-[#545659]'>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='Confirm new password'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, handleUpdatePassword)}
                        className="w-full h-12 px-4 pr-10 border rounded-lg outline-none text-sm text-[#191A1B] placeholder-[#90919B] border-[#EAEAEA] focus:border-[#191A1B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="text-[#F04438] text-xs">{error}</div>
                  )}
                  
                  <button
                    onClick={handleUpdatePassword}
                    disabled={
                      !newPassword || !confirmPassword || newPassword.length < 6 || newPassword !== confirmPassword || isLoading
                    }
                    className={`w-full h-12 rounded-lg font-medium text-sm transition-colors mb-5 ${
                      newPassword.length >= 6 && newPassword === confirmPassword && !isLoading
                        ? 'bg-[#191A1B] text-white cursor-pointer'
                        : 'bg-[#EAEAEA] text-[#90919B] cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full py-2 px-4 text-[#90919B] hover:text-[#191A1B] text-sm underline"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {currentStep === 4 && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-xl text-[#191919] font-semibold mb-4">Password Updated Successfully!</h2>
                <p className="text-gray-600 mb-6">
                  You can now use your new password to log in securely.
                </p>
                
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full py-2 px-4 bg-[#191A1B] text-white rounded-md hover:bg-gray-800 font-medium"
                >
                  Back to Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
