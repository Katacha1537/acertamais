'use client';

import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useUpdateContext } from '@/context/GlobalUpdateContext.tsx';
import { useUser } from '@/context/UserContext';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { MoreVertical, Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import Papa from 'papaparse';
import { ChangeEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmployeeTable from './employee-tables';

export default function ServiceListingPage() {
  const { user } = useUser();

  const {
    documents: services,
    fetchDocuments,
    loading: servicesLoading,
    error: servicesError
  } = useFetchDocuments('servicos');

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

  const { addDocument } = useFirestore({
    collectionName: 'servicos',
    onSuccess: () => {
      toast.success('Serviços importados com sucesso!');
      fetchDocuments();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao importar serviços.');
    }
  });

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
        const credenciadosDaCredenciadora = credenciados.filter(
          (credenciado) => credenciado.accrediting_Id === user.uid
        );
        const credenciadosIds = credenciadosDaCredenciadora.map((c) => c.id);
        filtered = services.filter((service) =>
          credenciadosIds.includes(service.credenciado_id)
        );
      }

      const merged = filtered.map((service) => {
        const credenciado = credenciados.find(
          (c) => c.id === service.credenciado_id
        );
        const credenciadoName =
          credenciado?.nomeFantasia || 'Credenciado desconhecido';
        const accreditingName =
          credenciado?.accrediting_name || 'Credenciadora não informada';

        let descontoPorcentagem = '0% OFF';
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
          accreditingName,
          descontoPorcentagem,
          preco_original_formatado: formatCurrency(
            Number(service.preco_original)
          ),
          preco_com_desconto_formatado: formatCurrency(
            Number(service.preco_com_desconto)
          )
        };
      });

      setFilteredServices(merged);
    }
  }, [services, credenciados, user]);

  const totalServices = filteredServices?.length || 0;

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const csvData = result.data as any[];

        for (const row of csvData) {
          try {
            const parsePrice = (price: string | number | undefined): number => {
              if (!price) return 0;
              const cleanedPrice = String(price)
                .replace(/['"]+/g, '')
                .replace(/\s+/g, '')
                .replace(/R\$/g, '')
                .replace(',', '.');
              const parsed = parseFloat(cleanedPrice);
              return isNaN(parsed) ? 0 : parsed;
            };

            const serviceData = {
              credenciado_id:
                user?.role === 'accredited'
                  ? user.uid
                  : credenciados.find(
                      (credenciado) =>
                        credenciado.nomeFantasia === row['credenciado']
                    )?.id || '',
              nome_servico: row['nome_servico'] || '',
              descricao: row['descricao'] || '',
              preco_original: parsePrice(row['preco_original']),
              preco_com_desconto: parsePrice(row['preco_com_desconto']),
              imagemUrl: row['imagemUrl'] || null,
              createdAt: new Date().toISOString()
            };

            if (!serviceData.credenciado_id) {
              throw new Error(
                `Credenciado "${row['credenciado']}" não encontrado.`
              );
            }

            await addDocument(serviceData, null);
          } catch (error) {
            console.error('Erro ao processar linha do CSV:', error);
            toast.error(`Erro ao importar serviço: ${row['nome_servico']}`);
          }
        }
      },
      error: (error) => {
        console.error('Erro ao parsear CSV:', error);
        toast.error('Erro ao processar o arquivo CSV.');
      }
    });

    event.target.value = '';
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'nome_servico',
      'descricao',
      'preco_original',
      'preco_com_desconto',
      'imagemUrl'
    ];
    const csvContent = `${templateHeaders.join(',')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_servicos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Serviços (${totalServices})`}
            description="Gerenciar Serviços."
          />
          <div className="flex gap-2">
            <Link
              href={'/dashboard/servicos/novo'}
              className={cn(buttonVariants({ variant: 'default' }))}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Novo Serviço
            </Link>
            {user?.role === 'admin' ? (
              ''
            ) : (
              <>
                <label
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'cursor-pointer'
                  )}
                >
                  <Upload className="mr-2 h-4 w-4" /> Importar Serviços
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'icon' })
                    )}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={downloadTemplate}>
                      Baixar Template
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
        <Separator />

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
