'use client';

import { db } from '@/service/firebase'; // Supondo que o Firebase está configurado aqui
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

// Definindo o tipo de um documento
interface Document {
  id: string;
  [key: string]: any; // Pode ser ajustado conforme a estrutura dos seus documentos
}

interface Filters {
  id?: string; // Adicionado o filtro por ID
  [key: string]: any; // Outros filtros dinâmicos, podem ser ajustados
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
        // Caso um ID seja fornecido, busca apenas o documento com esse ID
        const docRef = doc(db, collectionName, filters.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDocuments([{ id: docSnap.id, ...docSnap.data() }]);
        } else {
          setDocuments([]); // Documento não encontrado
        }
      } else {
        // Caso contrário, realiza uma consulta com filtros dinâmicos
        let queryRef: Query<DocumentData> = collection(db, collectionName);

        if (filters) {
          Object.keys(filters).forEach((key) => {
            const value = filters[key];
            if (key !== 'id' && value) {
              queryRef = query(queryRef, where(key, '==', value));
            }
          });
        }

        const querySnapshot: QuerySnapshot = await getDocs(queryRef);
        const docs: Document[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setDocuments(docs);
      }
    } catch (err: any) {
      console.log(err);
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
