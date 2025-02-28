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

export default function ServiceListingPage() {
  const { user } = useUser(); // Obtém o usuário atual

  // Carregar serviços
  const {
    documents: services,
    fetchDocuments,
    loading: servicesLoading,
    error: servicesError
  } = useFetchDocuments('servicos');

  // Carregar credenciados
  const {
    documents: credenciados,
    loading: credenciadosLoading,
    error: credenciadosError
  } = useFetchDocuments('credenciados');
  const {
    documents: credenciadoras,
    loading: credenciadorasLoading,
    error: credenciadorasError
  } = useFetchDocuments('credenciadoras');

  const [filteredServices, setFilteredServices] = useState<any[]>([]);

  const { updateFlag } = useUpdateContext();

  useEffect(() => {
    const fetchDoc = async () => {
      console.log('Buscando dados...');
      await fetchDocuments();
    };
    fetchDoc();
  }, [updateFlag]);

  useEffect(() => {
    if (user && services && credenciados) {
      let filtered = services;

      if (user.role === 'accredited') {
        filtered = services.filter(
          (service) => service.credenciado_id === user.uid
        );
      } else if (user.role === 'accrediting') {
        // Primeiro filtrar os credenciados desta credenciadora
        const credenciadosDaCredenciadora = credenciados.filter(
          (credenciado) => credenciado.accrediting_Id === user.uid
        );

        // Pegar apenas os IDs dos credenciados filtrados
        const credenciadosIds = credenciadosDaCredenciadora.map((c) => c.id);

        // Filtrar serviços que pertencem a esses credenciados
        filtered = services.filter((service) =>
          credenciadosIds.includes(service.credenciado_id)
        );
      }

      // Processamento dos dados...
      const merged = filtered.map((service) => {
        const credenciado = credenciados.find(
          (c) => c.id === service.credenciado_id
        );

        const credenciadoName =
          credenciado?.nomeFantasia || 'Credenciado desconhecido';
        const accreditingName =
          credenciado?.accrediting_name || 'Credenciadora não informada';

        // Cálculo do desconto
        let descontoPorcentagem = '0%';
        if (
          service.preco_original &&
          service.preco_com_desconto &&
          service.preco_original > 0
        ) {
          const desconto =
            ((service.preco_original - service.preco_com_desconto) /
              service.preco_original) *
            100;
          descontoPorcentagem = `${desconto.toFixed(1)}% OFF`;
        }

        return {
          ...service,
          credenciadoName,
          accreditingName, // Novo campo adicionado
          descontoPorcentagem
        };
      });

      setFilteredServices(merged);
    }
  }, [services, credenciados, user]);

  const totalServices = filteredServices?.length || 0;

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Serviços (${totalServices})`}
            description="Gerenciar Serviços."
          />

          <Link
            href={'/dashboard/servicos/novo'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Novo Serviço
          </Link>
        </div>
        <Separator />

        {/* Renderização condicional para loading ou erro */}
        {servicesLoading || credenciadosLoading ? (
          <p>Carregando os dados...</p>
        ) : servicesError || credenciadosError ? (
          <p>Erro ao carregar os dados</p>
        ) : (
          <EmployeeTable data={filteredServices} totalData={totalServices} />
        )}
      </div>
    </PageContainer>
  );
}
