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
import { useEffect } from 'react';
import EmployeeTable from './employee-tables';

export default function EmployeeListingPage() {
  const { updateFlag } = useUpdateContext();
  // Fetching documents using a custom hook
  const {
    documents: plans,
    fetchDocuments,
    loading,
    error
  } = useFetchDocuments('credenciadoras');
  const totalPlans = plans?.length || 0;

  useEffect(() => {
    const fetchDoc = async () => {
      await fetchDocuments();
    };
    fetchDoc();
  }, [updateFlag]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Credenciadoras (${totalPlans})`}
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

        {/* Conditional rendering based on loading or error */}
        {loading && <p>Carregando os Credenciadoras...</p>}
        {updateFlag && <p></p>}
        {error && <p>Erro ao carregar os Credenciadoras</p>}

        {!loading && !error && (
          <EmployeeTable data={plans} totalData={totalPlans} />
        )}
      </div>
    </PageContainer>
  );
}
