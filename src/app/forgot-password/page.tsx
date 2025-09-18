"use client"
import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import axios from 'axios'

// Create a separate component for the content that uses useSearchParams
const ForgotPasswordContent = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  // Password validation function
  const isValidPassword = (password: string): boolean => {
    return password.length >= 8; // At least 8 characters
  };

  // Password strength function
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', bars: 1 };
    if (score === 3) return { label: 'Moderate', color: 'bg-yellow-500', bars: 2 };
    if (score >= 4) return { label: 'Strong', color: 'bg-green-500', bars: 4 };
    return { label: '', color: '', bars: 0 };
  };

  const doPasswordsMatch = password === confirmPassword && confirmPassword !== '';

  const isFormValid = password.trim() !== '' && confirmPassword.trim() !== '' && 
                     isValidPassword(password) && doPasswordsMatch;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    setError('');
    setSuccess('');

    if (!isFormValid || isLoading) return;

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('/api/users/set-password', {
        token,
        password
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!token) {
    return (
      <div className='flex justify-center items-center w-screen h-screen bg-[#fff]'>
        <div className='bg-white rounded-lg shadow-md w-[480px]'>
          <div className='flex flex-col items-center pb-4 border-b border-[#F5F5F5] pt-5'>
            <Image
              src="/logo.png"
              alt="Logo"
              width={60}
              height={60}
              className='object-contain mx-auto mb-4'
            />
            <h2 className='text-xl font-medium text-[#191A1B]'>Invalid Reset Link</h2>
          </div>
          <div className='p-4'>
            <p className="text-sm text-[#545659] text-center mb-4">
              This password reset link is invalid or has expired.
            </p>
            <button
              onClick={() => router.push('/login')}
              className='bg-[#191A1B] text-white cursor-pointer text-sm font-medium rounded-lg w-full h-12 transition-colors hover:bg-[#2A2B2C]'
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex justify-center items-center w-screen h-screen bg-[#fff]'>
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
          <h2 className='text-xl font-medium text-[#191A1B]'>Reset Your Password</h2>
        </div>

        <div className='p-4'>
          {/* Password Input */}
          <div className='flex flex-col gap-2'>
            <label className='text-sm text-[#545659]'>New Password</label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your new password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full h-12 px-4 pr-12 border rounded-lg outline-none text-sm text-[#191A1B] placeholder-[#90919B] ${
                  hasAttemptedSubmit && password.trim() !== '' && !isValidPassword(password)
                    ? 'border-[#F04438] focus:border-[#F04438]'
                    : 'border-[#EAEAEA] focus:border-[#191A1B]'
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-[#90919B] hover:text-[#191A1B] transition-colors'
              >
                {showPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
            {hasAttemptedSubmit && password.trim() !== '' && !isValidPassword(password) && (
              <div className='text-[#F04438] text-xs'>Password must be at least 8 characters long</div>
            )}
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className='mt-2'>
              <div className='flex gap-1 mb-1'>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-[6px] rounded w-full ${
                      getPasswordStrength(password).bars >= i
                        ? getPasswordStrength(password).color
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className='text-sm text-[#545659]'>
                Password strength: {getPasswordStrength(password).label}
              </div>
            </div>
          )}

          {/* Confirm Password Input */}
          <div className='flex flex-col gap-2 mt-4'>
            <label className='text-sm text-[#545659]'>Confirm Password</label>
            <div className='relative'>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='Confirm your password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full h-12 px-4 pr-12 border rounded-lg outline-none text-sm text-[#191A1B] placeholder-[#90919B] ${
                  hasAttemptedSubmit && confirmPassword.trim() !== '' && !doPasswordsMatch
                    ? 'border-[#F04438] focus:border-[#F04438]'
                    : 'border-[#EAEAEA] focus:border-[#191A1B]'
                }`}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-[#90919B] hover:text-[#191A1B] transition-colors'
              >
                {showConfirmPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
            {hasAttemptedSubmit && confirmPassword.trim() !== '' && !doPasswordsMatch && (
              <div className='text-[#F04438] text-xs'>Passwords do not match</div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className='text-[#F04438] text-xs mt-4'>
              <div>{error}</div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className='text-green-600 text-xs mt-4'>
              <div>{success}</div>
            </div>
          )}

          {/* Reset Password Button */}
          <div className='flex justify-end mt-6'>
            <button
              onClick={handleSubmit}
              className={`rounded-lg w-full h-12 transition-colors flex items-center justify-center gap-2 ${
                isFormValid && !isLoading
                  ? 'bg-[#191A1B] text-white cursor-pointer text-sm font-medium'
                  : 'bg-[#EAEAEA] text-[#90919B] cursor-not-allowed text-sm font-medium'
              }`}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>

          {/* Back to Login Link */}
          <div className='text-center mt-4'>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className='text-sm text-[#545659] hover:text-[#191A1B] transition-colors'
              disabled={isLoading}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
const ForgotPasswordLoading = () => (
  <div className='flex justify-center items-center w-screen h-screen bg-[#fff]'>
    <div className='bg-white rounded-lg shadow-md w-[480px]'>
      <div className='flex flex-col items-center pb-4 border-b border-[#F5F5F5] pt-5'>
        <Image
          src="/logo.png"
          alt="Logo"
          width={60}
          height={60}
          className='object-contain mx-auto mb-4'
        />
        <h2 className='text-xl font-medium text-[#191A1B]'>Loading...</h2>
      </div>
      <div className='p-4'>
        <div className="text-sm text-[#545659] text-center">
          Please wait while we load the page...
        </div>
      </div>
    </div>
  </div>
);

// Main page component with Suspense boundary
const ForgotPasswordPage = () => {
  return (
    <Suspense fallback={<ForgotPasswordLoading />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}

export default ForgotPasswordPage
