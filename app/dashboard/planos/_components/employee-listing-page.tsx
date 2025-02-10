'use client';

import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useUpdateContext } from '@/context/GlobalUpdateContext.tsx';
import { useUser } from '@/context/UserContext';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import EmployeeTable from './employee-tables';

export default function EmployeeListingPage() {
  const { user } = useUser(); // Obtém o usuário atual
  const { updateFlag } = useUpdateContext();
  const {
    documents: plans,
    fetchDocuments,
    loading,
    error
  } = useFetchDocuments('planos');
  const totalPlans = plans?.length || 0;

  const [filteredPlans, setFilteredPlans] = useState(plans);

  useEffect(() => {
    const fetchDoc = async () => {
      await fetchDocuments();
    };
    fetchDoc();
  }, [updateFlag]);

  // Filtra os planos se o user.role for 'accrediting'
  useEffect(() => {
    if (user?.role === 'accrediting') {
      const filtered = plans?.filter(
        (plan) => plan.accrediting_Id === user?.uid
      );
      setFilteredPlans(filtered);
    } else {
      setFilteredPlans(plans);
    }
  }, [plans, user?.role, user?.uid]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Planos (${filteredPlans?.length})`}
            description="Gerenciar Planos."
          />

          <Link
            href={'/dashboard/planos/novo'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Novo Plano
          </Link>
        </div>
        <Separator />

        {/* Conditional rendering based on loading or error */}
        {loading && <p>Carregando os dados...</p>}
        {updateFlag && <p></p>}
        {error && <p>Erro ao carregar os dados</p>}

        {!loading && !error && (
          <EmployeeTable
            data={filteredPlans}
            totalData={filteredPlans?.length}
          />
        )}
      </div>
    </PageContainer>
  );
}
