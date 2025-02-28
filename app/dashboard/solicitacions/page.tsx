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
  Cross2Icon,
  InfoCircledIcon,
  MagnifyingGlassIcon
} from '@radix-ui/react-icons';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

interface Solicitacao {
  id: string;
  clienteId: string;
  donoId: string;
  nome_servico: string;
  descricao: string;
  preco: string;
  status: string;
  createdAt: Timestamp;
}

const SolicitacaoAlertDialog: React.FC = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [selectedSolicitacao, setSelectedSolicitacao] =
    useState<Solicitacao | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useUser();

  const [clientes, setClientes] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (!user?.uid) return;

    let q;

    const baseQuery = collection(db, 'solicitacoes');
    const filters = [];

    if (user.role === 'accredited') {
      filters.push(where('donoId', '==', user.uid));
    }

    if (statusFilter !== 'all') {
      filters.push(where('status', '==', statusFilter));
    }

    q = query(
      baseQuery,
      ...filters,
      orderBy('createdAt', 'desc') // Ordena do mais recente para o mais antigo
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
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

      setClientes(newClientes);
      setSolicitacoes(newSolicitacoes);
    });

    return () => unsubscribe();
  }, [user?.uid, statusFilter]);

  const filteredSolicitacoes = solicitacoes.filter((solicitacao) => {
    const cliente = clientes[solicitacao.clienteId];
    const matchesSearch =
      cliente?.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solicitacao.nome_servico
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleConfirm = async (id: string) => {
    try {
      await updateDoc(doc(db, 'solicitacoes', id), { status: 'confirmada' });
      setSolicitacoes((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setIsModalOpen(false);
    }
  };

  function maskCPF(cpf: string): string {
    if (!cpf || cpf.length < 11) return cpf; // Retorna original se não for válido
    return `${cpf.slice(0, 3)}.XXX.XXX-${cpf.slice(-2)}`;
  }

  const ClienteInfoModal = () => {
    if (!selectedSolicitacao) return null;

    const cliente = clientes[selectedSolicitacao.clienteId];

    return (
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-md rounded-lg dark:bg-gray-800">
          <AlertDialogHeader className="border-b pb-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertDialogTitle className="text-lg font-semibold dark:text-gray-100">
                Detalhes da Solicitação
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Serviço:</span>
              <span className="text-sm font-medium">
                {selectedSolicitacao.nome_servico}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Preço:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                R$ {selectedSolicitacao.preco}
              </span>
            </div>
          </div>
          <div className="space-y-4 py-4 dark:text-gray-300">
            <div className="space-y-2">
              {cliente && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm">Cliente:</span>
                    <span className="text-sm font-medium">{cliente.nome}</span>
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
              <h4 className="mb-1 text-sm font-medium">Descrição:</h4>
              <p className="text-sm leading-relaxed">
                {selectedSolicitacao.descricao}
              </p>
            </div>
          </div>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="gap-1 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600">
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
    <div className="mx-auto max-h-[calc(100vh-80px)] max-w-4xl rounded-md p-6 dark:bg-gray-900">
      <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h1 className="flex items-center gap-2 text-2xl font-bold dark:text-gray-100">
          <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          Solicitações Pendentes
          <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-200 dark:text-blue-900">
            {filteredSolicitacoes.length}
          </span>
        </h1>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="relative w-full">
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="dark:border-gray-700 dark:bg-gray-800">
              <SelectItem
                value="all"
                className="dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Todos
              </SelectItem>
              <SelectItem
                value="pendente"
                className="dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Pendentes
              </SelectItem>
              <SelectItem
                value="confirmada"
                className="dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Confirmadas
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 mb-8
                grid max-h-[calc(100vh-210px)] gap-4
                overflow-y-auto pr-2"
      >
        {filteredSolicitacoes.map((solicitacao) => {
          const cliente = clientes[solicitacao.clienteId];

          return (
            <div
              key={solicitacao.id}
              className="group rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md
                            dark:border-gray-700 dark:bg-gray-800 dark:hover:shadow-lg dark:hover:shadow-gray-800"
            >
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-1.5">
                  <h3 className="font-semibold dark:text-gray-100">
                    {solicitacao.nome_servico}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {solicitacao.createdAt.toDate().toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    R$ {solicitacao.preco}
                  </p>
                  {cliente && (
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        Cliente:{' '}
                        <span className="font-medium dark:text-gray-300">
                          {cliente.nome}
                        </span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        CPF:{' '}
                        <span className="font-medium dark:text-gray-300">
                          {maskCPF(cliente.cpf)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Tag de status adicionada aqui */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${
                      solicitacao.status === 'pendente'
                        ? 'bg-yellow-100/30 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        : 'bg-green-100/30 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    }`}
                  >
                    {solicitacao.status === 'pendente'
                      ? 'Pendente'
                      : 'Confirmado'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSolicitacao(solicitacao);
                      setIsModalOpen(true);
                    }}
                    className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    <InfoCircledIcon className="mr-2 h-4 w-4" />
                    Detalhes
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSolicitacoes.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Nenhuma solicitação encontrada
          </div>
        )}
      </div>

      <ClienteInfoModal />
    </div>
  );
};

export default SolicitacaoAlertDialog;
