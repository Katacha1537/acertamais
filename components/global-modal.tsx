// components/global-modal.tsx
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
import { useSolicitacao } from '@/context/solicitacao-context';
import { useDocumentById } from '@/hooks/useDocumentById';
import { db } from '@/service/firebase';
import { BellIcon, CheckCircledIcon, Cross2Icon } from '@radix-ui/react-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const GlobalModal = () => {
  const { newSolicitacao, isModalOpen, setIsModalOpen } = useSolicitacao();
  const [audio] = useState(
    typeof Audio !== 'undefined' ? new Audio('/notification.mp3') : null
  );

  // Buscar dados do cliente
  const { data: cliente, loading: loadingCliente } = useDocumentById(
    'funcionarios',
    newSolicitacao?.clienteId || ''
  );

  // Buscar dados da empresa se existir
  const { data: empresa, loading: loadingEmpresa } = useDocumentById(
    'empresas',
    cliente?.empresaId || ''
  );

  useEffect(() => {
    if (isModalOpen && audio) {
      audio.play().catch(() => {});
    }
  }, [isModalOpen, audio]);

  const handleConfirmSolicitacao = async (id: string) => {
    if (!newSolicitacao) return;

    const solicitacaoRef = doc(db, 'solicitacoes', id);

    try {
      await updateDoc(solicitacaoRef, { status: 'confirmada' });
    } finally {
      setIsModalOpen(false);
    }
  };

  // Função para mascarar CPF conforme o segundo código
  function maskCPF(cpf: string): string {
    if (!cpf || cpf.length < 11) return cpf;
    return `${cpf.slice(0, 3)}.XXX.XXX-${cpf.slice(-2)}`;
  }

  const renderClienteInfo = () => {
    if (loadingCliente) {
      return (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      );
    }

    if (!cliente)
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Cliente não encontrado
        </span>
      );

    return (
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Cliente:
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
            {cliente.nome || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">CPF:</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
            {maskCPF(cliente.cpf) || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Telefone:
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
            {cliente.telefone || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            E-mail:
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
            {cliente.email || 'N/A'}
          </span>
        </div>
      </div>
    );
  };

  const renderEmpresaInfo = () => {
    if (cliente?.empresaId && loadingEmpresa) {
      return (
        <div className="mt-2 space-y-1">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      );
    }

    if (empresa) {
      return (
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Empresa:
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
              {empresa.nomeFantasia || 'N/A'}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <AlertDialogContent className="max-w-md rounded-lg dark:bg-gray-800">
        {newSolicitacao && (
          <>
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
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Serviço:
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  {newSolicitacao.nome_servico}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Preço:
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  R$ {newSolicitacao.preco}
                </span>
              </div>
            </div>

            <div className="space-y-4 py-4 dark:text-gray-300">
              <div className="space-y-2">
                {renderClienteInfo()}
                {renderEmpresaInfo()}
              </div>

              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                <h4 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Descrição:
                </h4>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {newSolicitacao.descricao}
                </p>
              </div>
            </div>

            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="gap-1 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600">
                <Cross2Icon className="h-4 w-4" />
                Fechar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleConfirmSolicitacao(newSolicitacao.id)}
                className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                <CheckCircledIcon className="h-4 w-4" />
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
