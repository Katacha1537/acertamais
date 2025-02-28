'use client';

import { db } from '@/service/firebase';
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  Query,
  QuerySnapshot,
  where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface Document {
  id: string;
  [key: string]: any;
}

interface Filters {
  id?: string;
  [key: string]: any;
}

const useFetchDocuments = (collectionName: string, filters?: Filters) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      if (filters?.id) {
        // Busca por ID específico
        const docRef = doc(db, collectionName, filters.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Verifica se o documento não está marcado como deletado
          if (data.isDelete !== true) {
            setDocuments([{ id: docSnap.id, ...data }]);
          } else {
            setDocuments([]);
          }
        } else {
          setDocuments([]);
        }
      } else {
        // Consulta geral com filtros
        let queryRef: Query<DocumentData> = collection(db, collectionName);

        if (filters) {
          Object.keys(filters).forEach((key) => {
            const value = filters[key];
            if (key !== 'id' && value) {
              // Removeu a exclusão do isDelete aqui
              queryRef = query(queryRef, where(key, '==', value));
            }
          });
        }

        const querySnapshot: QuerySnapshot = await getDocs(queryRef);

        // Filtra localmente os documentos não deletados
        const docs: Document[] = querySnapshot.docs
          .filter((doc) => doc.data().isDeleted !== true) // Filtra documentos não deletados
          .map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

        setDocuments(docs);
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao buscar documentos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [collectionName, filters]);

  return { documents, fetchDocuments, loading, error };
};

export default useFetchDocuments;
