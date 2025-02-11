// components/global-modal.tsx
'use client'

import {
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialog,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useSolicitacao } from '@/context/solicitacao-context';
import { db } from '@/service/firebase';
import { BellIcon, CheckCircledIcon, Cross2Icon } from '@radix-ui/react-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useDocumentById } from '@/hooks/useDocumentById';

export const GlobalModal = () => {
    const { newSolicitacao, isModalOpen, setIsModalOpen } = useSolicitacao();
    const [audio] = useState(typeof Audio !== 'undefined' ? new Audio('/notification.mp3') : null);
    
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

    const renderClienteInfo = () => {
        if (loadingCliente) {
            return (
                <div className="space-y-2">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            );
        }

        if (!cliente) return <span className="text-sm text-gray-500">Cliente não encontrado</span>;

        return (
            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nome:</span>
                    <span className="text-sm font-medium text-gray-800">
                        {cliente.nome || 'N/A'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CPF:</span>
                    <span className="text-sm font-medium text-gray-800">
                        {cliente.cpf || 'N/A'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nascimento:</span>
                    <span className="text-sm font-medium text-gray-800">
                        {cliente.dataNascimento || 'N/A'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Telefone:</span>
                    <span className="text-sm font-medium text-gray-800">
                        {cliente.telefone || 'N/A'}
                    </span>
                </div>
            </div>
        );
    };

    const renderEmpresaInfo = () => {
        if (cliente?.empresaId && loadingEmpresa) {
            return (
                <div className="space-y-1 mt-2">
                    <div className="animate-pulse h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
            );
        }

        if (empresa) {
            return (
                <div className="space-y-1 mt-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Empresa:</span>
                        <span className="text-sm font-medium text-gray-800">
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
            <AlertDialogContent className="rounded-lg max-w-md">
                {newSolicitacao && (
                    <>
                        <AlertDialogHeader className="border-b pb-4">
                            <div className="flex items-center gap-2">
                                <BellIcon className="w-5 h-5 text-blue-600" />
                                <AlertDialogTitle className="text-lg font-semibold">
                                    Nova Solicitação!
                                </AlertDialogTitle>
                            </div>
                        </AlertDialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                {renderClienteInfo()}
                                {renderEmpresaInfo()}
                                
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Serviço:</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        {newSolicitacao.nome_servico}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Preço:</span>
                                    <span className="text-sm font-medium text-green-600">
                                        R$ {newSolicitacao.preco}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Descrição:</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {newSolicitacao.descricao}
                                </p>
                            </div>
                        </div>

                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="gap-1">
                                <Cross2Icon className="w-4 h-4" />
                                Fechar
                            </AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleConfirmSolicitacao(newSolicitacao.id)}
                                className="bg-green-600 hover:bg-green-700 gap-1"
                            >
                                <CheckCircledIcon className="w-4 h-4" />
                                Confirmar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
};