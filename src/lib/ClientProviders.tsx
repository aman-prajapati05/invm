
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { BulkEditProvider } from '@/contexts/BulkEditContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import React from 'react';


export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
      <BulkEditProvider>
          {children}
        </BulkEditProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}
