// contexts/solicitacao-context.tsx
'use client';

import { auth, db } from '@/service/firebase';
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

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

export const SolicitacaoProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [newSolicitacao, setNewSolicitacao] = useState<Solicitacao | null>(
    null
  );
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

    let q;

    if (user.credenciado_Id) {
      // Se user.credenciado_Id existir, usará ele na consulta.
      q = query(
        collection(db, 'solicitacoes'),
        where('status', '==', 'pendente'),
        where('credenciado_id', '==', user.credenciado_Id)
      );
    } else {
      // Caso contrário, usará user.uid.
      q = query(
        collection(db, 'solicitacoes'),
        where('status', '==', 'pendente'),
        where('credenciado_id', '==', user.uid)
      );
    }

    // Primeiro, carrega os dados já existentes
    const loadInitialSolicitacoes = async () => {
      const snapshot = await getDocs(q);
      const existingSolicitacoes: Solicitacao[] = [];

      snapshot.forEach((doc) => {
        const solicitacao = {
          id: doc.id,
          ...doc.data()
        } as Solicitacao;
        processedIds.current.add(solicitacao.id);
        existingSolicitacoes.push(solicitacao);
      });

      setSolicitacoes(existingSolicitacoes);
    };

    loadInitialSolicitacoes().then(() => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatedSolicitacoes: Solicitacao[] = [];
        let latestSolicitacao: Solicitacao | null = null;

        snapshot.docChanges().forEach((change) => {
          const solicitacao = {
            id: change.doc.id,
            ...change.doc.data()
          } as Solicitacao;

          if (change.type === 'added') {
            if (!processedIds.current.has(solicitacao.id)) {
              processedIds.current.add(solicitacao.id);
              updatedSolicitacoes.push(solicitacao);
              if (!latestSolicitacao || solicitacao.id > latestSolicitacao.id) {
                latestSolicitacao = solicitacao;
              }

              if (pathname !== '/login') {
                setNewSolicitacao(solicitacao);
                setIsModalOpen(true);
              }
            }
          } else if (change.type === 'modified' || change.type === 'removed') {
            processedIds.current.delete(solicitacao.id);
          }
        });

        setSolicitacoes((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const filteredNewSolicitacoes = updatedSolicitacoes.filter(
            (s) => !existingIds.has(s.id)
          );
          return [...prev, ...filteredNewSolicitacoes];
        });

        if (latestSolicitacao && pathname !== '/login' && !isModalOpen) {
          setNewSolicitacao(latestSolicitacao);
        } else if (!snapshot.docs.length) {
          setNewSolicitacao(null);
          setIsModalOpen(false);
        }
      });

      return () => unsubscribe();
    });
  }, [user?.uid, pathname]);

  return (
    <SolicitacaoContext.Provider
      value={{ solicitacoes, newSolicitacao, isModalOpen, setIsModalOpen }}
    >
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
