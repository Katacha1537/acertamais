'use client'
import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, DocumentChange } from 'firebase/firestore';
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

// Adicione um arquivo de áudio na pasta public/notification.mp3
const notificationSound = '/notification.mp3';

interface Solicitacao {
    id: string;
    clienteId: string;
    nome_servico: string;
    descricao: string;
    preco: string;
    status: string;
}

const SolicitacaoAlertDialog: React.FC = () => {
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [autoOpenEnabled, setAutoOpenEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasInitialLoad = useRef(false);
    const userInteracted = useRef(false);
    const processingIds = useRef(new Set<string>());

    useEffect(() => {
        document.title = `(${solicitacoes.length}) Solicitações Pendentes`;
    }, [solicitacoes.length]);

    useEffect(() => {
        const handleFirstInteraction = () => {
            userInteracted.current = true;
            if (!audioRef.current) {
                audioRef.current = new Audio(notificationSound);
            }
            window.removeEventListener('click', handleFirstInteraction);
        };

        window.addEventListener('click', handleFirstInteraction);
        return () => window.removeEventListener('click', handleFirstInteraction);
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'solicitacoes'), where('status', '==', 'pendente'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newSolicitacoes: Solicitacao[] = [];
            let hasNew = false;

            snapshot.docChanges().forEach((change: DocumentChange) => {
                if (change.type === 'added' && !processingIds.current.has(change.doc.id)) {
                    newSolicitacoes.push({
                        id: change.doc.id,
                        ...change.doc.data(),
                    } as Solicitacao);
                    
                    if (hasInitialLoad.current) {
                        hasNew = true;
                        processingIds.current.add(change.doc.id);
                    }
                }
            });

            if (newSolicitacoes.length > 0) {
                setSolicitacoes(prev => [
                    ...newSolicitacoes.filter(n => !prev.some(p => p.id === n.id)),
                    ...prev
                ]);
                
                if (autoOpenEnabled && !isModalOpen) {
                    setSelectedSolicitacao(newSolicitacoes[0]);
                    setIsModalOpen(true);
                }
            }

            if (hasNew && userInteracted.current && audioRef.current) {
                audioRef.current.play().catch(() => {});
            }

            hasInitialLoad.current = true;
        });

        return () => unsubscribe();
    }, [autoOpenEnabled, isModalOpen]);

    const handleConfirmSolicitacao = async (id: string) => {
        if (!selectedSolicitacao) return;
        
        processingIds.current.add(id);
        const solicitacaoRef = doc(db, 'solicitacoes', id);
        
        try {
            await updateDoc(solicitacaoRef, { status: 'confirmada' });
            setSolicitacoes(prev => prev.filter(s => s.id !== id));
        } finally {
            processingIds.current.delete(id);
            setIsModalOpen(false);
            setSelectedSolicitacao(null);
            setAutoOpenEnabled(true);
        }
    };

    const openDetailsModal = (solicitacao: Solicitacao) => {
        setAutoOpenEnabled(false);
        setSelectedSolicitacao(solicitacao);
        setIsModalOpen(true);
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
                {solicitacoes.map((solicitacao) => (
                    <div 
                        key={solicitacao.id}
                        className="group bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">{solicitacao.nome_servico}</h3>
                                <p className="text-sm text-gray-600">R$ {solicitacao.preco}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                    Pendente
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => openDetailsModal(solicitacao)}
                                >
                                    <InfoCircledIcon className="w-4 h-4" />
                                    Detalhes
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={isModalOpen} onOpenChange={(open) => {
                if (!open) setAutoOpenEnabled(true);
                setIsModalOpen(open);
            }}>
                <AlertDialogContent className="rounded-lg max-w-md">
                    {selectedSolicitacao && (
                        <>
                            <AlertDialogHeader className="border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <BellIcon className="w-5 h-5 text-blue-600" />
                                    <AlertDialogTitle className="text-lg font-semibold">
                                        {autoOpenEnabled ? 'Nova Solicitação!' : 'Detalhes da Solicitação'}
                                    </AlertDialogTitle>
                                </div>
                            </AlertDialogHeader>

                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Cliente ID:</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {selectedSolicitacao.clienteId}
                                        </span>
                                    </div>
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
                                    {autoOpenEnabled ? 'Cancelar' : 'Fechar'}
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => handleConfirmSolicitacao(selectedSolicitacao.id)}
                                    className="bg-green-600 hover:bg-green-700 gap-1"
                                >
                                    <CheckCircledIcon className="w-4 h-4" />
                                    Confirmar Solicitação
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    )}
                </AlertDialogContent>
            </AlertDialog>

            {/* Elemento de áudio oculto */}
            <audio ref={audioRef} style={{ display: 'none' }}>
                <source src={notificationSound} type="audio/mpeg" />
            </audio>
        </div>
    );
};

export default SolicitacaoAlertDialog;