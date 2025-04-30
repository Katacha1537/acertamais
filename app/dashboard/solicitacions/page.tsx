'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useUser } from '@/context/UserContext';
import { db } from '@/service/firebase';
import {
  BellIcon,
  CheckCircledIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cross2Icon,
  InfoCircledIcon,
  MagnifyingGlassIcon
} from '@radix-ui/react-icons';
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  Query,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

interface Service {
  credenciado_id: string;
  descricao: string;
  empresa_nome: string;
  imagemUrl: string | null;
  nome_servico: string;
  preco: number;
  quantity: number;
  serviceId: string;
  total: number;
}

interface Solicitacao {
  id: string;
  allowContact: boolean;
  clienteId: string;
  clienteNome: string;
  createdAt: Timestamp;
  services: Service[];
  status: string;
  total: number;
}

const SolicitacaoAlertDialog: React.FC = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] =
    useState<Solicitacao | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [expandedSolicitacaoId, setExpandedSolicitacaoId] = useState<
    string | null
  >(null);
  const { user } = useUser();
  const [clientes, setClientes] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (!user?.uid) return;

    const fetchSolicitacoes = async () => {
      const baseQuery = collection(db, 'solicitacoes');

      let q: Query<DocumentData>;

      q =
        user.role === 'admin'
          ? query(baseQuery)
          : user.role === 'user'
          ? query(baseQuery, where('credenciado_id', '==', user.credenciado_Id))
          : query(baseQuery, where('credenciado_id', '==', user.uid));

      const snapshot = await getDocs(q);
      const newSolicitacoes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Solicitacao[];

      const newClientes: { [key: string]: any } = {};
      for (const solicitacao of newSolicitacoes) {
        if (!newClientes[solicitacao.clienteId]) {
          const clienteRef = doc(db, 'funcionarios', solicitacao.clienteId);
          const clienteSnap = await getDoc(clienteRef);
          if (clienteSnap.exists()) {
            newClientes[solicitacao.clienteId] = clienteSnap.data();
          }
        }
      }

      newSolicitacoes.sort((a, b) => {
        if (a.status === 'pendente' && b.status !== 'pendente') return -1;
        if (a.status !== 'pendente' && b.status === 'pendente') return 1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setClientes(newClientes);
      setSolicitacoes(newSolicitacoes);
    };

    fetchSolicitacoes();
  }, [user?.uid]);

  const filteredSolicitacoes = solicitacoes.filter((solicitacao) => {
    const cliente = clientes[solicitacao.clienteId];
    const matchesSearch =
      solicitacao.clienteNome
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      solicitacao.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solicitacao.services.some((service) =>
        service.nome_servico.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus =
      statusFilter === 'todos' ? true : solicitacao.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleConfirm = async (id: string) => {
    try {
      await updateDoc(doc(db, 'solicitacoes', id), { status: 'confirmada' });
      setSolicitacoes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'confirmada' } : s))
      );
    } finally {
      setIsModalOpen(false);
      setSelectedSolicitacao(null);
    }
  };

  function maskCPF(cpf: string): string {
    if (!cpf || cpf.length < 11) return cpf;
    return `${cpf.slice(0, 3)}.XXX.XXX-${cpf.slice(-2)}`;
  }

  const toggleExpand = (solicitacaoId: string) => {
    setExpandedSolicitacaoId(
      expandedSolicitacaoId === solicitacaoId ? null : solicitacaoId
    );
  };

  const renderServiceItem = (service: Service) => (
    <div className="border-b border-gray-200 py-3 last:border-b-0 dark:border-gray-700">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {service.nome_servico}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {service.descricao}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Quantidade: {service.quantity}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Preço Unitário: R$ {service.preco.toFixed(2).replace('.', ',')}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Total: R$ {service.total.toFixed(2).replace('.', ',')}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {service.empresa_nome}
      </p>
    </div>
  );

  const ClienteInfoModal = () => {
    if (!selectedSolicitacao || !isModalOpen) return null;

    const cliente = clientes[selectedSolicitacao.clienteId];

    return (
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-h-[80vh] w-[90vw] max-w-sm overflow-y-auto rounded-lg sm:max-w-md dark:bg-gray-800">
          <AlertDialogHeader className="border-b pb-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertDialogTitle className="text-lg font-semibold dark:text-gray-100">
                Detalhes da Solicitação
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="space-y-4 py-4 dark:text-gray-300">
            <div className="space-y-2">
              {cliente && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm">Cliente:</span>
                    <span className="text-sm font-medium">
                      {selectedSolicitacao.clienteNome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">CPF:</span>
                    <span className="text-sm font-medium">
                      {maskCPF(cliente.cpf)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Telefone:</span>
                    <span className="text-sm font-medium">
                      {cliente.telefone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">E-mail:</span>
                    <span className="text-sm font-medium">{cliente.email}</span>
                  </div>
                </>
              )}
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <h4 className="mb-2 text-sm font-medium">Serviços:</h4>
              {selectedSolicitacao.services.map((service) => (
                <div key={service.serviceId} className="mb-3 last:mb-0">
                  {renderServiceItem(service)}
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t pt-2 dark:border-gray-600">
                <span className="text-sm font-medium">Total Geral:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  R$ {selectedSolicitacao.total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              className="gap-1 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
              onClick={() => setSelectedSolicitacao(null)}
            >
              <Cross2Icon className="h-4 w-4" />
              Fechar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirm(selectedSolicitacao.id)}
              className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <CheckCircledIcon className="h-4 w-4" />
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 dark:bg-gray-900">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl dark:text-gray-100">
          <BellIcon className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6 dark:text-blue-400" />
          Minhas Solicitações
          <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 sm:text-sm dark:bg-blue-200 dark:text-blue-900">
            {filteredSolicitacoes.length}
          </span>
        </h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Pesquisar por cliente ou #pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full text-sm sm:w-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
              <SelectItem
                value="todos"
                className="text-sm dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Todos
              </SelectItem>
              <SelectItem
                value="pendente"
                className="text-sm dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Pendente
              </SelectItem>
              <SelectItem
                value="confirmada"
                className="text-sm dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Confirmada
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">
        {filteredSolicitacoes.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500 sm:text-base dark:text-gray-400">
            Nenhuma solicitação encontrada
          </div>
        ) : (
          filteredSolicitacoes.map((solicitacao) => {
            const isExpanded = expandedSolicitacaoId === solicitacao.id;
            return (
              <div
                key={solicitacao.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleExpand(solicitacao.id)}
                >
                  <h3 className="text-sm font-semibold text-gray-900 sm:text-base dark:text-gray-100">
                    Solicitação #{solicitacao.id.slice(0, 8)} - Total: R${' '}
                    {solicitacao.total.toFixed(2).replace('.', ',')}
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium sm:text-sm
                      ${
                        solicitacao.status === 'pendente'
                          ? 'bg-yellow-100/30 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : 'bg-green-100/30 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      }`}
                    >
                      {solicitacao.status === 'pendente'
                        ? 'Pendente'
                        : 'Confirmada'}
                    </span>
                    {isExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400" />
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                    {solicitacao.services.map((service) => (
                      <div key={service.serviceId}>
                        {renderServiceItem(service)}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSolicitacao(solicitacao);
                      setIsModalOpen(true);
                    }}
                    className="gap-1 text-sm dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    <InfoCircledIcon className="h-4 w-4" />
                    Detalhes
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <ClienteInfoModal />
    </div>
  );
};

export default SolicitacaoAlertDialog;
