'use client';
import { UpdateProvider } from '@/context/GlobalUpdateContext.tsx';
import { UserProvider } from '@/context/UserContext';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <UpdateProvider>
          <UserProvider>{children}</UserProvider>
        </UpdateProvider>
      </ThemeProvider>
    </>
  );
}
