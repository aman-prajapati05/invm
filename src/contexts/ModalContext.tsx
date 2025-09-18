"use client"
import { createContext, useContext } from 'react'
import { ToastData } from '@/components/Toast'

interface ModalContextType {
  openModal: (modalType: string, data?: any) => void;
  closeModal: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => void;
}

export const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};