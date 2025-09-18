"use client"
import React, { useEffect, useState } from 'react'
import { X, CheckCircle, Warning, Info, XCircle } from '@phosphor-icons/react'

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // in milliseconds, default 2000
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-close timer
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, toast.duration || 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // Match the exit animation duration
  };

  const getToastStyles = () => {
    const baseStyles = "flex items-center gap-3 p-4 rounded-lg shadow-lg border min-w-[300px] max-w-[500px]";
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  const getIcon = () => {
    const iconProps = { size: 20, weight: "fill" as const };
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-600" />;
      case 'error':
        return <XCircle {...iconProps} className="text-red-600" />;
      case 'warning':
        return <Warning {...iconProps} className="text-yellow-600" />;
      case 'info':
        return <Info {...iconProps} className="text-blue-600" />;
      default:
        return <Info {...iconProps} className="text-gray-600" />;
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-2 opacity-0'
        }
      `}
    >
      <div className={getToastStyles()}>
        {getIcon()}
        <div className="flex-1 text-sm font-medium">
          {toast.message}
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-black/5 transition-colors duration-150"
          aria-label="Close toast"
        >
          <X 
            size={16} 
            className="text-current opacity-60 hover:opacity-100"
          />
        </button>
      </div>
    </div>
  );
};

export default Toast;
