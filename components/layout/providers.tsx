'use client';
import { UpdateProvider } from '@/context/GlobalUpdateContext.tsx';
import { UserProvider } from '@/context/UserContext';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { SolicitacaoProvider } from '@/context/solicitacao-context';
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <UpdateProvider>
          <SolicitacaoProvider>
            <UserProvider>{children}</UserProvider>
          </SolicitacaoProvider>
        </UpdateProvider>
      </ThemeProvider>
    </>
  );
}
