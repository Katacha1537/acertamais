'use client';
import { UpdateProvider } from '@/context/GlobalUpdateContext.tsx';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <UpdateProvider>{children}</UpdateProvider>
      </ThemeProvider>
    </>
  );
}
