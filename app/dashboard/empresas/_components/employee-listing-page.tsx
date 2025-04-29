'use client';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'; // Adicionar componentes de dropdown
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { useUpdateContext } from '@/context/GlobalUpdateContext.tsx';
import { useUser } from '@/context/UserContext';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { createLogin } from '@/lib/createLogin';
import { cn } from '@/lib/utils';
import { MoreVertical, Plus, Upload } from 'lucide-react'; // Adicionar MoreVertical
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { ChangeEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmployeeTable from './employee-tables';

type Business = {
  id: string;
  name: string;
  planos: string;
  accrediting_Id?: string;
  planName: string;
};

type TEmployeeListingPage = {};

export default function EmployeeListingPage({}: TEmployeeListingPage) {
  const { user } = useUser();

  const {
    documents: businesses,
    fetchDocuments,
    loading: businessLoading,
    error: businessError
  } = useFetchDocuments('empresas');
  const {
    documents: plans,
    loading: plansLoading,
    error: plansError
  } = useFetchDocuments('planos');

  const { addDocument } = useFirestore({
    collectionName: 'empresas',
    onSuccess: () => {
      toast.success('Empresas importadas com sucesso!');
      fetchDocuments();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao importar empresas.');
    }
  });

  const { addDocument: addUser } = useFirestore({
    collectionName: 'users'
  });

  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);

  const { updateFlag } = useUpdateContext();

  useEffect(() => {
    const fetchDoc = async () => {
      await fetchDocuments();
    };
    fetchDoc();
  }, [updateFlag]);

  const router = useRouter();

  useEffect(() => {
    if (businesses && plans) {
      const merged: Business[] = businesses.map((business: any) => {
        const planName =
          plans.find((plan) => plan.id === business.planos)?.nome ||
          'Plano desconhecido';
        return { ...business, planName };
      });

      let filtered = merged;
      if (user?.role === 'accrediting') {
        filtered = merged.filter(
          (business) => business.accrediting_Id === user?.uid
        );
      }

      setFilteredBusinesses(filtered);
    }
  }, [businesses, plans, user]);

  const totalBusinesses = filteredBusinesses?.length || 0;

  // Função para processar o arquivo CSV
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
            const empresaData = {
              razaoSocial: row['razaoSocial'] || '',
              nomeFantasia: row['nomeFantasia'] || '',
              endereco: row['endereco'] || '',
              emailAcess: row['emailAcess'] || '',
              cnpjCaepf: row['cnpjCaepf'] || '',
              cep: row['cep'] || '',
              contatoFinanceiro: {
                email: row['contatoFinanceiro - email'] || '',
                nome: row['contatoFinanceiro - nome'] || '',
                telefone: row['contatoFinanceiro - telefone'] || ''
              },
              contatoRH: {
                telefone: row['contatoRH- telefone'] || '',
                nome: row['contatoRH - nome'] || '',
                email: row['contatoRH - email'] || ''
              },
              numeroFuncionarios: Number(row['numeroFuncionarios']) || 0,
              planos:
                plans.find((plan) => plan.nome === row['planos'])?.id || '',
              accrediting_Id: user?.role === 'accrediting' ? user?.uid : null,
              accrediting_name:
                user?.role === 'accrediting' ? user?.displayName : null
            };

            const userUid = await createLogin(empresaData.emailAcess);
            const userInfo = {
              uid: userUid,
              role: 'business',
              name: empresaData.nomeFantasia,
              email: empresaData.emailAcess,
              firstLogin: true
            };

            await addUser(userInfo, null);
            await addDocument(empresaData, userUid);
          } catch (error) {
            console.error('Erro ao processar linha do CSV:', error);
            toast.error(`Erro ao importar empresa: ${row['nomeFantasia']}`);
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

  // Função para baixar o template CSV
  const downloadTemplate = () => {
    const templateHeaders = [
      'razaoSocial',
      'nomeFantasia',
      'endereco',
      'emailAcess',
      'cnpjCaepf',
      'cep',
      'contatoFinanceiro - email',
      'contatoFinanceiro - nome',
      'contatoFinanceiro - telefone',
      'contatoRH- telefone',
      'contatoRH - nome',
      'contatoRH - email',
      'numeroFuncionarios',
      'planos'
    ];
    const csvContent = `${templateHeaders.join(',')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_empresas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Empresas (${totalBusinesses})`}
            description="Gerenciar Empresas."
          />
          <div className="flex gap-2">
            <Link
              href={'/dashboard/empresas/novo'}
              className={cn(buttonVariants({ variant: 'default' }))}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Nova Empresa
            </Link>
            <label
              className={cn(
                buttonVariants({ variant: 'default' }),
                'cursor-pointer'
              )}
            >
              <Upload className="mr-2 h-4 w-4" /> Importar Empresas
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
          </div>
        </div>
        <Separator />
        <EmployeeTable data={filteredBusinesses} totalData={totalBusinesses} />
      </div>
    </PageContainer>
  );
}
