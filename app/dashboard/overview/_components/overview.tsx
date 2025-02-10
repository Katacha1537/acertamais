'use client';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import {
  Box,
  Building,
  ClipboardList,
  Loader,
  ShieldCheck,
  Users
} from 'lucide-react';

export default function OverViewPage() {
  // Hooks para pegar os dados
  const { documents: empresas, loading, error } = useFetchDocuments('empresas');
  const { documents: planos } = useFetchDocuments('planos');
  const { documents: funcionarios } = useFetchDocuments('funcionarios');
  const { documents: credenciados } = useFetchDocuments('credenciados');
  const { documents: servicos } = useFetchDocuments('servicos');

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
            Olá, Bem-vindo de volta 👋
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Total empresas ativas */}
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

          {/* Total planos */}
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

          {/* Total funcionários */}
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

          {/* Total credenciados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total credenciados
              </CardTitle>
              <ShieldCheck className="w-6" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {credenciados ? `+${credenciados.length}` : '0'}
              </div>
            </CardContent>
          </Card>

          {/* Total serviços */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total serviços
              </CardTitle>
              <Box className="w-6" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {servicos ? `+${servicos.length}` : '0'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
