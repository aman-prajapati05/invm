"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import SideBar from '@/components/SideBar'
import ModalRender from '@/components/ModalRender'
import ToastContainer from '@/components/ToastContainer'
import { ModalContext } from '@/contexts/ModalContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname,useRouter } from 'next/navigation'
import TopBar from '@/components/TopBar'
import Notification from '@/components/Notification'
import { ToastData } from '@/components/Toast'
import { hasAllRequiredPermissions } from '@/lib/utils/checkPermission';
import MaintenanceMode from '@/components/MaintenanceMode'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { getRedirectRoute } from '@/lib/utils/routeRedirect'

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [modalData, setModalData] = useState<any>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [toasts, setToasts] = useState<ToastData[]>([])

  const { user, accessToken, hydrated, maintenance } = useAuth()
  const router = useRouter()
    const pathname = usePathname()

  useEffect(() => {
    if (hydrated && user && accessToken) {
      const redirectPath = getRedirectRoute(user, pathname ?? "");
      if (redirectPath) {
        console.log(`Redirecting from ${pathname} to ${redirectPath} - no permission`);
        router.replace(redirectPath);
      }
    }
  }, [hydrated, user, pathname, router]);

  const openModal = (modalType: string, data?: any): void => {
    setActiveModal(modalType)
    setModalData(data)
  }

  const closeModal = (): void => {
    setActiveModal(null)
    setModalData(null)
  }

  const showToast = useCallback((
    type: 'success' | 'error' | 'warning' | 'info', 
    message: string, 
    duration: number = 2000
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      type,
      message,
      duration
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // ✅ Block render until hydrated
  if (!hydrated) return null

  // ✅ Redirect to /login if not authenticated
  if (hydrated && (!user || !accessToken)) {
    router.replace('/login')
    return null
  }
  if (maintenance && user && !hasAllRequiredPermissions(user)) {
    return <MaintenanceMode />;
  }

  return (
    <NotificationProvider>
      <ModalContext.Provider value={{ openModal, closeModal, showToast }}>
        <SidebarProvider>
          <DashboardContent 
            activeModal={activeModal}
            closeModal={closeModal}
            modalData={modalData}
            toasts={toasts}
            removeToast={removeToast}
            openModal={openModal}
            showNotification={showNotification}
            setShowNotification={setShowNotification}
          >
            {children}
          </DashboardContent>
        </SidebarProvider>
      </ModalContext.Provider>
    </NotificationProvider>
  )
}

// Separate component to use the BulkEditContext
function DashboardContent({ 
  children, 
  activeModal, 
  closeModal, 
  modalData, 
  toasts, 
  removeToast, 
  openModal, 
  showNotification, 
  setShowNotification 
}: {
  children: React.ReactNode;
  activeModal: string | null;
  closeModal: () => void;
  modalData: any;
  toasts: ToastData[];
  removeToast: (id: string) => void;
  openModal: (modalType: string, data?: any) => void;
  showNotification: boolean;
  setShowNotification: (show: boolean) => void;
}) {
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotification && notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotification(false)
      }
    }

    if (showNotification) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotification, setShowNotification])

  
  

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <ModalRender activeModal={activeModal} closeModal={closeModal} modalData={modalData} />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      <div className="w-full shrink-0">
        <TopBar 
          openModal={openModal} 
          showNotification={showNotification}
          setShowNotification={setShowNotification}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className="flex-1 overflow-y-auto relative">
          {children}
          {showNotification && (
            <div 
              ref={notificationRef}
              className='absolute top-0 h-[90vh] w-[30%] bg-white right-0 z-10 border-l border-[#EAEAEA] shadow-lg'
            >
              <Notification onClose={() => setShowNotification(false)} />
            </div>
          )}
        </div>
       
      </div>
    </div>
  );
}
