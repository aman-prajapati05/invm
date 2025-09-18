"use client"
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import React, { useState } from 'react'
import axios from 'axios'

interface Props {
    onOtpSent: (email: string) => void;
}

const ForgotPassword:React.FC<Props> = ({
    onOtpSent
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isFormValid = email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!isFormValid) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: email.trim()
      });

      setSuccess(response.data.message || 'Password reset link has been sent to your email.');
      
      // Optionally redirect to login or show success message
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
      
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex justify-center items-center w-screen h-screen bg-[#A3A3A4]'>
        <div className='bg-white rounded-lg shadow-md w-[480px]'>
            <div className='flex flex-col items-center pb-4 border-b border-[#F5F5F5] pt-5'>
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={60}
                    height={60}
                    className='object-contain mx-auto mb-4'
                />
                <h2 className='text-xl font-semibold text-[#191A1B]'>Forgot Password</h2>
                <p className='text-sm text-[#545659] mt-2 text-center px-4'>
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className='flex flex-col gap-2 px-4 mt-4'>
                    <div className='text-sm text-[#545659]'>Email</div>
                    <input
                        type="email"
                        placeholder='Enter your email'
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                          setSuccess('');
                        }}
                        className='w-full h-12 px-4 border border-[#EAEAEA] rounded-lg outline-none text-sm text-[#191A1B] placeholder-[#90919B] focus:border-[#191A1B]'
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <div className='mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm'>
                        {error}
                    </div>
                )}

                {success && (
                    <div className='mx-4 mt-3 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm'>
                        {success}
                    </div>
                )}

                <div className='flex flex-col gap-3 px-4 pb-4 border-t pt-4 mt-4 border-[#F5F5F5]'>
                    <button 
                        type="submit"
                        className={`text-sm font-medium rounded-lg w-full h-12 transition-colors ${
                            isFormValid && !isLoading
                                ? 'bg-[#191A1B] text-white cursor-pointer hover:bg-[#2A2B2C]' 
                                : 'bg-[#EAEAEA] text-[#90919B] cursor-not-allowed'
                        }`}
                        disabled={!isFormValid || isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => window.location.href = '/login'}
                        className='text-sm text-[#545659] hover:text-[#191A1B] transition-colors'
                        disabled={isLoading}
                    >
                        Back to Login
                    </button>
                </div>
            </form>
        </div>
    </div>
  )
}

export default ForgotPassword
