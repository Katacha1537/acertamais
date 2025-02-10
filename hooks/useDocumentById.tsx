// hooks/useDocumentById.ts
import { db } from '@/service/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// Tipo genérico para o documento
interface DocumentData {
  [key: string]: any; // Você pode melhorar o tipo com a estrutura do seu documento
}

export function useDocumentById<T extends DocumentData>(
  collection: string,
  id: string
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, collection, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data() as T); // Tipando com a estrutura de T
        } else {
          setError('Documento não encontrado');
        }
      } catch (err) {
        setError('Erro ao buscar documento');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [collection, id]); // Reexecuta quando a coleção ou o ID mudam

  return { data, loading, error };
}
