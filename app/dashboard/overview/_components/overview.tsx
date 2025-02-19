'use client';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import {
  Building,
  ClipboardList,
  LineChart,
  Loader,
  ShieldCheck,
  Users
} from 'lucide-react';

// Interfaces para tipagem dos dados
interface Solicitacao {
  credenciado_id: string;
  preco: number;
  status: 'pendente' | 'confirmado';
}

interface Funcionario {
  empresaId: string;
}

interface Empresa {
  id: string;
  nomeFantasia: string;
  numeroFuncionarios: number;
}

interface Credenciado {
  id: string;
  nomeFantasia: string;
}

export default function OverViewPage() {
  // Hooks para pegar os dados
  const { documents: empresas, loading, error } = useFetchDocuments('empresas');
  const { documents: planos } = useFetchDocuments('planos');
  const { documents: funcionarios } = useFetchDocuments('funcionarios');
  // Removido o parâmetro genérico, fazendo cast para Credenciado[]
  const { documents: credenciados } = useFetchDocuments(
    'credenciados'
  ) as unknown as { documents: Credenciado[] };
  const { documents: solicitacoes } = useFetchDocuments('solicitacoes');

  // Função para calcular o Top 5 Empresas com Mais Funcionários
  const getTopEmpresas = () => {
    if (!empresas) return [];
    return [...empresas]
      .sort((a, b) => b.numeroFuncionarios - a.numeroFuncionarios)
      .slice(0, 5);
  };

  const getTopCredenciados = () => {
    if (!solicitacoes || !credenciados) return [];

    // Filtra as solicitações confirmadas
    const solicitacoesConfirmadas = solicitacoes.filter(
      (solicitacao) => solicitacao.status === 'confirmada'
    );

    // Agrupa as solicitações por credenciado e soma os valores
    const credenciadosMap = new Map<string, number>();
    solicitacoesConfirmadas.forEach((solicitacao) => {
      const credenciadoId = solicitacao.donoId;
      const preco = solicitacao.preco;

      if (credenciadosMap.has(credenciadoId)) {
        credenciadosMap.set(
          credenciadoId,
          credenciadosMap.get(credenciadoId)! + preco
        );
      } else {
        credenciadosMap.set(credenciadoId, preco);
      }
    });

    // Mapeia os credenciados com seus valores totais e filtra os que não foram encontrados
    const credenciadosComValor = Array.from(credenciadosMap.entries())
      .map(([credenciadoId, valorTotal]) => {
        const credenciado = credenciados.find((c) => c.id === credenciadoId);
        return credenciado ? { ...credenciado, valorTotal } : null;
      })
      .filter(
        (item): item is Credenciado & { valorTotal: number } => item !== null
      );

    // Ordena e seleciona os top 5
    return credenciadosComValor
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5);
  };

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Painel Gerencial - Visão Geral
          </h2>
        </div>

        {/* Cards Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-medium">
                Empresas Ativas
              </CardTitle>
              <Building className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">{empresas?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-medium">
                Credenciados Ativos
              </CardTitle>
              <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">
                {credenciados?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-medium">
                Funcionários Ativos
              </CardTitle>
              <Users className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">
                {funcionarios?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-medium">
                Planos Ativos
              </CardTitle>
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">{planos?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-medium">
                Serviços Ativos
              </CardTitle>
              <LineChart className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">
                {solicitacoes?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Gráficos e Rankings */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Top Empresas */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Empresas com Mais Funcionários</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-right">Funcionários</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTopEmpresas().map((empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell>{empresa.nomeFantasia}</TableCell>
                      <TableCell className="text-right">
                        {empresa.numeroFuncionarios}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Credenciados */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Credenciados por Valor de Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credenciado</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTopCredenciados().map((credenciado) => (
                    <TableRow key={credenciado.id}>
                      <TableCell>{credenciado.nomeFantasia}</TableCell>
                      <TableCell className="text-right">
                        {credenciado.valorTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
