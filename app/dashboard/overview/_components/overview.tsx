'use client';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { Building, ClipboardList, Loader, Users } from 'lucide-react';
import { RecentSales } from './recent-sales';

export default function OverViewPage() {
  // Hook para pegar os dados das empresas
  const { documents: empresas, loading, error } = useFetchDocuments('empresas');

  // Você pode aplicar lógica similar para os planos e funcionários aqui
  const { documents: planos } = useFetchDocuments('planos');
  const { documents: funcionarios } = useFetchDocuments('funcionarios');

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        Erro ao carregar os dados!
      </div>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="space-y-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Olá, Bem vindo de volta 👋
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total empresas ativas
              </CardTitle>
              <Building className="w-6" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {empresas ? `+${empresas.length}` : '0'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total planos
              </CardTitle>
              <ClipboardList className="w-6" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {planos ? `+${planos.length}` : '0'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total funcionários
              </CardTitle>
              <Users className="w-6" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {funcionarios ? `+${funcionarios.length}` : '0'}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Card className="col-span-4 md:col-span-3">
            <CardHeader>
              <CardTitle>Funcionários Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentSales funcionarios={funcionarios} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
