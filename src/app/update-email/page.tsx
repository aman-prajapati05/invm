"use client";
import { verifyPassword, verifyUpdateOtp, updateCredentials, sendForgotPasswordEmail, resendUpdateOtp } from '@/lib/api/updateCredentials';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';


interface UpdateEmailPageProps {}

const UpdateEmailPage: React.FC<UpdateEmailPageProps> = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [otpArray, setOtpArray] = useState<string[]>(["", "", "", ""]);
  
  // Form data
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  
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
    setNewEmail('');
    setUserEmail('');
    setError('');
    setShowPassword(false);
    setTimer(30);
    setOtpArray(["", "", "", ""]);
    setHasAttemptedSubmit(false);
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
    setOtpArray(["", "", "", ""]);
    setTimer(30);
    setError('');
    inputsRef.current[0]?.focus();
    
    try {
      await resendUpdateOtp(userEmail, 'email-update');
      console.log("OTP resent successfully");
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resend OTP');
      console.error("Failed to resend OTP:", err);
    }
  };

  const handleForgotPassword = async (): Promise<void> => {
    if (!userEmail) {
      setError('Email address not found. Please try logging in again.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await sendForgotPasswordEmail(userEmail);
      setError(''); // Clear any existing errors
      // Show success message or redirect
      alert('Password reset instructions have been sent to your email.');
      router.push('/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };  const handleVerifyPassword = async (): Promise<void> => {
    if (!currentPassword.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await verifyPassword(currentPassword, 'email-update');
      // Capture user email from response for potential forgot password use
      if (response?.email) {
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
      await verifyUpdateOtp(fullOtp, 'email-update');
      setCurrentStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async (): Promise<void> => {
    setHasAttemptedSubmit(true);
    if (!newEmail.trim() || !isValidEmail(newEmail)) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await updateCredentials({ email: newEmail });
      // Update the user email in the context and localStorage
      updateUser({ email: newEmail });
      setCurrentStep(4);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void): void => {
    if (event.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Update Email</h1>
        
        {/* Modal Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => router.push('/settings')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
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
                    className='underline text-[#90919B] text-sm mt-4 text-end cursor-pointer hover:text-[#005BD3] transition-colors'
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

            {/* Step 3: Enter New Email */}
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
                <h2 className="text-lg text-[#191A1B] font-semibold mb-2 text-center mt-4">Enter New Email</h2>
                <p className="text-[#545659] mb-4 text-center">Please enter your new email address</p>
                
                <div className="space-y-4">
                  {/* Email Input */}
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm text-[#545659]'>New Email Address</label>
                    <input
                      type="email"
                      placeholder='Enter your new email'
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handleUpdateEmail)}
                      className={`w-full h-12 px-4 border rounded-lg outline-none text-sm text-[#191A1B] placeholder-[#90919B] ${
                        hasAttemptedSubmit && newEmail.trim() !== '' && !isValidEmail(newEmail) 
                          ? 'border-[#F04438] focus:border-[#F04438]' 
                          : 'border-[#EAEAEA] focus:border-[#191A1B]'
                      }`}
                    />
                    {hasAttemptedSubmit && newEmail.trim() !== '' && !isValidEmail(newEmail) && (
                      <div className='text-[#F04438] text-xs'>Please enter a valid email address</div>
                    )}
                  </div>
                  
                  {error && (
                    <div className="text-[#F04438] text-xs">{error}</div>
                  )}
                  
                  <button
                    onClick={handleUpdateEmail}
                    disabled={!newEmail.trim() || !isValidEmail(newEmail) || isLoading}
                    className={`w-full h-12 rounded-lg font-medium text-sm transition-colors mb-5 ${
                      newEmail.trim() && isValidEmail(newEmail) && !isLoading
                        ? 'bg-[#191A1B] text-white cursor-pointer'
                        : 'bg-[#EAEAEA] text-[#90919B] cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Updating...' : 'Update Email'}
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
                
                <h2 className="text-xl font-semibold text-[#191919] mb-4">Email Updated Successfully!</h2>
                <p className="text-gray-600 mb-6">
                  Your email address has been updated to <strong>{newEmail}</strong>
                </p>
                
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full py-2 px-4 bg-[#191A1B] text-white rounded-md hover:bg-[#2A2B2C] font-medium"
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

export default UpdateEmailPage;