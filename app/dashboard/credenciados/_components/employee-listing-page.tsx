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

type Business = {
  id: string;
  name: string;
  planos: string;
  accrediting_Id?: string; // Certificando-se de que existe a propriedade accrediting_Id
  planName: string;
};

type TEmployeeListingPage = {};

export default function EmployeeListingPage({}: TEmployeeListingPage) {
  const { updateFlag } = useUpdateContext();

  const { user } = useUser(); // Obtém o usuário atual
  // Fetching documents using a custom hook
  const {
    documents: plans,
    fetchDocuments,
    loading,
    error
  } = useFetchDocuments('planos');
  const {
    documents: businesses,
    loading: businessLoading,
    error: businessError
  } = useFetchDocuments('credenciados');
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    const fetchDoc = async () => {
      await fetchDocuments();
    };
    fetchDoc();
  }, [updateFlag]);

  useEffect(() => {
    if (businesses && plans) {
      // Mapeando as empresas para incluir o nome do plano
      const merged: Business[] = businesses.map((business: any) => {
        const planName =
          plans.find((plan) => plan.id === business.planos)?.nome ||
          'Plano desconhecido';
        return { ...business, planName };
      });

      // Filtrando as empresas baseadas no papel do usuário
      let filtered = merged;
      if (user?.role === 'accrediting') {
        filtered = merged.filter(
          (business) => business.accrediting_Id === user?.uid
        );
      }

      // Atualizando o estado de empresas filtradas
      setFilteredBusinesses(filtered);
    }
  }, [businesses, plans, user]);

  const totalBusinesses = filteredBusinesses?.length || 0;
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Credenciados (${totalBusinesses})`}
            description="Gerenciar Credenciados."
          />

          <Link
            href={'/dashboard/credenciados/novo'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Novo Credenciado
          </Link>
        </div>
        <Separator />

        {/* Conditional rendering based on loading or error */}
        {loading && <p>Carregando os Credenciados...</p>}
        {updateFlag && <p></p>}
        {error && <p>Erro ao carregar os Credenciados</p>}

        {!loading && !error && (
          <EmployeeTable
            data={filteredBusinesses}
            totalData={totalBusinesses}
          />
        )}
      </div>
    </PageContainer>
  );
}
