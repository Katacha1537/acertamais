// contexts/solicitacao-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/service/firebase';
import { usePathname } from 'next/navigation';
import { auth } from '@/service/firebase'; // Importe sua instância de autenticação

interface Solicitacao {
    id: string;
    clienteId: string;
    donoId: string;
    nome_servico: string;
    descricao: string;
    preco: string;
    status: string;
}

interface SolicitacaoContextType {
    solicitacoes: Solicitacao[];
    newSolicitacao: Solicitacao | null;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
}

const SolicitacaoContext = createContext<SolicitacaoContextType | null>(null);

export const SolicitacaoProvider = ({ children }: { children: React.ReactNode }) => {
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [newSolicitacao, setNewSolicitacao] = useState<Solicitacao | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const pathname = usePathname();
    const processedIds = useRef(new Set<string>());
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'solicitacoes'),
            where('status', '==', 'pendente'),
            where('donoId', '==', user.uid)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newSolicitacao = {
                        id: change.doc.id,
                        ...change.doc.data(),
                    } as Solicitacao;

                    // Verifica se já processou esta solicitação
                    if (!processedIds.current.has(newSolicitacao.id)) {
                        processedIds.current.add(newSolicitacao.id);
                        
                        setSolicitacoes(prev => [...prev, newSolicitacao]);
                        
                        if (pathname !== '/login') {
                            setNewSolicitacao(newSolicitacao);
                            setIsModalOpen(true);
                        }
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [pathname, user?.uid]); // Adicione user.uid como dependência

    return (
        <SolicitacaoContext.Provider value={{ solicitacoes, newSolicitacao, isModalOpen, setIsModalOpen }}>
            {children}
        </SolicitacaoContext.Provider>
    );
};

export const useSolicitacao = () => {
    const context = useContext(SolicitacaoContext);
    if (!context) {
        throw new Error('useSolicitacao must be used within a SolicitacaoProvider');
    }
    return context;
};