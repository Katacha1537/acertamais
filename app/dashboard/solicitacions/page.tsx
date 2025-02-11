'use client';
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore'; // Importação correta das funções
import { Button } from '@/components/ui/button';
import { db } from '@/service/firebase';
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
import { BellIcon, CheckCircledIcon, Cross2Icon, InfoCircledIcon } from '@radix-ui/react-icons';
import { useUser } from '@/context/UserContext';
import { useDocumentById } from '@/hooks/useDocumentById';

interface Solicitacao {
    id: string;
    clienteId: string;
    donoId: string;
    nome_servico: string;
    descricao: string;
    preco: string;
    status: string;
}

const SolicitacaoAlertDialog: React.FC = () => {
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useUser();

    const [clientes, setClientes] = useState<{ [key: string]: any }>({}); // Mapa de clientes carregados

    // Atualiza a lista de solicitações em tempo real
    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'solicitacoes'),
            where('status', '==', 'pendente'),
            where('donoId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const newSolicitacoes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Solicitacao[];

            // Carregar os clientes para cada solicitação
            const newClientes: { [key: string]: any } = {};
            for (const solicitacao of newSolicitacoes) {
                if (!newClientes[solicitacao.clienteId]) {
                    const clienteRef = doc(db, 'funcionarios', solicitacao.clienteId);
                    const clienteSnap = await getDoc(clienteRef); // Usar getDoc
                    if (clienteSnap.exists()) {
                        newClientes[solicitacao.clienteId] = clienteSnap.data();
                    }
                }
            }

            setClientes(newClientes); // Atualiza os clientes carregados
            setSolicitacoes(newSolicitacoes);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleConfirm = async (id: string) => {
        try {
            await updateDoc(doc(db, 'solicitacoes', id), { status: 'confirmada' });
            setSolicitacoes(prev => prev.filter(s => s.id !== id));
        } finally {
            setIsModalOpen(false);
        }
    };

    const ClienteInfoModal = () => {
        if (!selectedSolicitacao) {
            return null;
        }

        const cliente = clientes[selectedSolicitacao.clienteId];

        return (
            <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <AlertDialogContent className="rounded-lg max-w-md">
                    <AlertDialogHeader className="border-b pb-4">
                        <div className="flex items-center gap-2">
                            <BellIcon className="w-5 h-5 text-blue-600" />
                            <AlertDialogTitle className="text-lg font-semibold">
                                Detalhes da Solicitação
                            </AlertDialogTitle>
                        </div>
                    </AlertDialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            {cliente && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Cliente:</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {cliente.nome}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">CPF:</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {cliente.cpf}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Serviço:</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {selectedSolicitacao.nome_servico}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Preço:</span>
                                <span className="text-sm font-medium text-green-600">
                                    R$ {selectedSolicitacao.preco}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Descrição:</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {selectedSolicitacao.descricao}
                            </p>
                        </div>
                    </div>

                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="gap-1">
                            <Cross2Icon className="w-4 h-4" />
                            Fechar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleConfirm(selectedSolicitacao.id)}
                            className="bg-green-600 hover:bg-green-700 gap-1"
                        >
                            <CheckCircledIcon className="w-4 h-4" />
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BellIcon className="w-6 h-6 text-blue-600" />
                    Solicitações Pendentes
                    <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                        {solicitacoes.length}
                    </span>
                </h1>
            </div>

            <div className="grid gap-4 mb-8">
                {solicitacoes.map((solicitacao) => {
                    const cliente = clientes[solicitacao.clienteId];

                    return (
                        <div
                            key={solicitacao.id}
                            className="group bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{solicitacao.nome_servico}</h3>
                                    <p className="text-sm text-gray-600">R$ {solicitacao.preco}</p>
                                    {cliente && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Cliente:</span>
                                                <span className="text-sm font-medium text-gray-800">
                                                    {cliente.nome}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">CPF:</span>
                                                <span className="text-sm font-medium text-gray-800">
                                                    {cliente.cpf}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedSolicitacao(solicitacao);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    <InfoCircledIcon className="w-4 h-4 mr-2" />
                                    Detalhes
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ClienteInfoModal />
        </div>
    );
};

export default SolicitacaoAlertDialog;
