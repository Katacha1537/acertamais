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

  const {
    documents: employees,
    fetchDocuments,
    loading: employeesLoading,
    error: employeesError
  } = useFetchDocuments('funcionarios');

  const {
    documents: accrediting,
    loading: accreditingLoading,
    error: accreditingError
  } = useFetchDocuments('credenciadoras');

  const {
    documents: companies,
    loading: companiesLoading,
    error: companiesError
  } = useFetchDocuments('empresas');

  const [mergedEmployees, setMergedEmployees] = useState<any[]>([]);

  const { updateFlag } = useUpdateContext();

  useEffect(() => {
    const fetchDoc = async () => {
      console.log('Buscando dados...');
      await fetchDocuments();
    };
    fetchDoc();
  }, [updateFlag]);

  useEffect(() => {
    if (user && employees && companies) {
      let filteredEmployees = employees;

      if (user.role === 'business') {
        // Filtro para business permanece o mesmo
        filteredEmployees = employees.filter(
          (employee) => employee.empresaId === user.uid
        );
      } else if (user.role === 'accrediting') {
        // Filtra as empresas cujo accrediting_Id é igual ao user.uid
        const accreditingCompanies = companies.filter(
          (company) => company.accrediting_Id === user.uid
        );

        // Obtém os IDs das empresas filtradas
        const accreditingCompanyIds = accreditingCompanies.map(
          (company) => company.id
        );
        console.log(accreditingCompanyIds);
        console.log(employees);
        // Filtra os funcionários que pertencem a essas empresas
        filteredEmployees = employees.filter((employee) =>
          accreditingCompanyIds.includes(employee.empresaId)
        );
      }

      console.log(filteredEmployees);

      const merged = filteredEmployees.map((employee) => {
        const companyName =
          companies.find((company) => company.id === employee.empresaId)
            ?.razaoSocial || 'Empresa desconhecida';
        return {
          ...employee,
          companyName,
          id: String(employee.id)
        };
      });

      setMergedEmployees(merged);
    }
  }, [employees, companies, user]);

  const totalEmployees = mergedEmployees?.length || 0;

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Funcionários (${totalEmployees})`}
            description="Gerenciar Funcionários."
          />

          <Link
            href={'/dashboard/funcionarios/novo'}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Novo Funcionário
          </Link>
        </div>
        <Separator />

        {/* Renderização condicional para loading ou erro */}
        {(employeesLoading || companiesLoading) && (
          <p>Carregando os dados...</p>
        )}
        {(employeesError || companiesError) && <p>Erro ao carregar os dados</p>}

        {!employeesLoading &&
          !companiesLoading &&
          !employeesError &&
          !companiesError && (
            <EmployeeTable data={mergedEmployees} totalData={totalEmployees} />
          )}
      </div>
    </PageContainer>
  );
}
