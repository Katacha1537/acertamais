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

      // Se o usuário for 'accredited', filtra os serviços com base no 'uid' do usuário
      if (user.role === 'accredited') {
        filtered = services.filter(
          (service) => service.credenciado_id === user.uid // Assumindo que os serviços têm um campo 'userId'
        );
      }

      // Processar os serviços e adicionar informações de credenciado e descontos
      const merged = filtered.map((service) => {
        const credenciadoName =
          credenciados.find(
            (credenciado) => credenciado.id === service.credenciado_id
          )?.nomeFantasia || 'Plano desconhecido';

        // Cálculo do percentual de desconto
        const precoOriginal = service.preco_original;
        const precoComDesconto = service.preco_com_desconto;

        let descontoPorcentagem = '0%'; // Valor padrão caso não haja dados suficientes
        if (precoOriginal && precoComDesconto && precoOriginal > 0) {
          const desconto =
            ((precoOriginal - precoComDesconto) / precoOriginal) * 100;
          descontoPorcentagem = `${desconto.toFixed(1)}% OFF`; // Formatação do desconto com uma casa decimal
        }

        // Criando um novo objeto para o serviço com o nome do credenciado e o desconto
        return { ...service, credenciadoName, descontoPorcentagem };
      });

      // Atualizar o estado com os serviços processados
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
