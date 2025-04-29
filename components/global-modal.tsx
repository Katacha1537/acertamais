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

interface Service {
  serviceId: string;
  nome_servico: string;
  descricao: string;
  preco: number; // Changed to number after parsing
  quantity: number;
  total: number;
  empresa_nome: string;
}

interface Solicitacao {
  id: string;
  clienteId: string;
  donoId: string;
  nome_servico: string;
  descricao: string;
  preco: string; // As defined in solicitacao-context
  status: string;
}

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

  // Função para mascarar CPF
  function maskCPF(cpf: string): string {
    if (!cpf || cpf.length < 11) return cpf;
    return `${cpf.slice(0, 3)}.XXX.XXX-${cpf.slice(-2)}`;
  }

  // Converter newSolicitacao para um único serviço
  const service: Service | null =
    newSolicitacao?.nome_servico && newSolicitacao?.preco
      ? {
          serviceId: newSolicitacao.id || 'single-service',
          nome_servico: newSolicitacao.nome_servico || 'N/A',
          descricao: newSolicitacao.descricao || 'N/A',
          preco: parseFloat(newSolicitacao.preco) || 0,
          quantity: 1, // Assuming single quantity as no quantity field exists
          total: parseFloat(newSolicitacao.preco) || 0,
          empresa_nome: empresa?.nomeFantasia || 'N/A'
        }
      : null;

  // Função para renderizar o serviço, igual ao SolicitacaoAlertDialog
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

  // Função para confirmar a solicitação (igual ao SolicitacaoAlertDialog)
  const handleConfirm = async () => {
    if (!newSolicitacao?.id) return;
    try {
      await updateDoc(doc(db, 'solicitacoes', newSolicitacao.id), {
        status: 'confirmada'
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao confirmar solicitação:', error);
    }
  };

  return (
    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <AlertDialogContent className="max-h-[80vh] w-[90vw] max-w-sm overflow-y-auto rounded-lg sm:max-w-md dark:bg-gray-800">
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
            <div className="space-y-4 py-4 dark:text-gray-300">
              <div className="space-y-2">
                {renderClienteInfo()}
                {renderEmpresaInfo()}
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Serviços:
                </h4>
                {service ? (
                  <div className="mb-3 last:mb-0">
                    {renderServiceItem(service)}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhum serviço disponível
                  </p>
                )}
                {service && (
                  <div className="mt-2 flex justify-between border-t pt-2 dark:border-gray-600">
                    <span className="text-sm font-medium">Total Geral:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      R$ {service.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel
                className="gap-1 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
                onClick={() => setIsModalOpen(false)}
              >
                <Cross2Icon className="h-4 w-4" />
                Fechar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
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
