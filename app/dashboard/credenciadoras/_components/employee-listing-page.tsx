'use client';

import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useUpdateContext } from '@/context/GlobalUpdateContext.tsx';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect } from 'react';
import EmployeeTable from './employee-tables';

export default function EmployeeListingPage() {
  const { updateFlag } = useUpdateContext();
  const {
    documents: credenciadoras,
    fetchDocuments,
    loading,
    error
  } = useFetchDocuments('credenciadoras');

  const totalCredenciadoras = credenciadoras?.length || 0;

  const handleRetry = useCallback(async () => {
    try {
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to retry fetching:', error);
    }
  }, [fetchDocuments]);

  useEffect(() => {
    fetchDocuments();
  }, [updateFlag, fetchDocuments]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Credenciadoras (${totalCredenciadoras})`}
            description="Gerenciar Credenciadoras."
          />

          <Link
            href={'/dashboard/credenciadoras/novo'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Novo Credenciadora
          </Link>
        </div>
        <Separator />

        {!credenciadoras ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">
              Carregando Credenciadoras...
            </p>
          </div>
        ) : error ? (
          <div className="flex h-32 flex-col items-center justify-center gap-4">
            <p className="text-destructive">Erro ao carregar Credenciadoras</p>
            <button
              onClick={handleRetry}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <EmployeeTable
            data={credenciadoras}
            totalData={totalCredenciadoras}
          />
        )}
      </div>
    </PageContainer>
  );
}
