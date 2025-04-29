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
import { useCallback, useEffect, useMemo } from 'react';
import EmployeeTable from './employee-tables';

export default function EmployeeListingPage() {
  const { updateFlag } = useUpdateContext();

  // Busca credenciadoras
  const {
    documents: credenciadoras,
    fetchDocuments: fetchCredenciadoras,
    loading: loadingCredenciadoras,
    error: errorCredenciadoras
  } = useFetchDocuments('credenciadoras');

  // Busca segmentos
  const {
    documents: segmentos,
    fetchDocuments: fetchSegmentos,
    loading: loadingSegmentos,
    error: errorSegmentos
  } = useFetchDocuments('segmentos');

  const totalCredenciadoras = credenciadoras?.length || 0;

  // Combina os dados de credenciadoras com o nome do segmento
  const enrichedCredenciadoras = useMemo(() => {
    if (!credenciadoras || !segmentos) return credenciadoras;

    return credenciadoras.map((credenciadora) => {
      const segmento = segmentos.find(
        (seg) => seg.id === credenciadora.segmento
      );
      return {
        ...credenciadora,
        segmentoNome: segmento ? segmento.nome : 'Sem Segmento' // Ajuste 'nome' conforme o campo real em segmentos
      };
    });
  }, [credenciadoras, segmentos]);

  const handleRetry = useCallback(async () => {
    try {
      await Promise.all([fetchCredenciadoras(), fetchSegmentos()]);
    } catch (error) {
      console.error('Failed to retry fetching:', error);
    }
  }, [fetchCredenciadoras, fetchSegmentos]);

  useEffect(() => {
    fetchCredenciadoras();
    fetchSegmentos();
  }, [updateFlag, fetchCredenciadoras, fetchSegmentos]);

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

        {!credenciadoras || !segmentos ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">
              Carregando Credenciadoras e Segmentos...
            </p>
          </div>
        ) : errorCredenciadoras || errorSegmentos ? (
          <div className="flex h-32 flex-col items-center justify-center gap-4">
            <p className="text-destructive">
              Erro ao carregar Credenciadoras ou Segmentos
            </p>
            <button
              onClick={handleRetry}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <EmployeeTable
            data={enrichedCredenciadoras}
            totalData={totalCredenciadoras}
          />
        )}
      </div>
    </PageContainer>
  );
}
