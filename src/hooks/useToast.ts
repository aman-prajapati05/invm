"use client"
import { useModal } from '@/contexts/ModalContext'

export const useToast = () => {
  const { showToast } = useModal();

  const toast = {
    success: (message: string, duration?: number) => showToast('success', message, duration),
    error: (message: string, duration?: number) => showToast('error', message, duration),
    warning: (message: string, duration?: number) => showToast('warning', message, duration),
    info: (message: string, duration?: number) => showToast('info', message, duration),
  };

  return toast;
};
