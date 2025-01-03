'use client';

import { db } from '@/service/firebase'; // Certifique-se de que o Firebase está configurado corretamente
import { deleteDoc, doc } from 'firebase/firestore';
import { useState } from 'react';

const useDeleteDocument = (collectionName: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = async (documentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, collectionName, documentId); // Referência ao documento
      await deleteDoc(docRef); // Excluindo o documento
      return true; // Indica que a exclusão foi bem-sucedida
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar o documento.');
      return false; // Indica falha na exclusão
    } finally {
      setLoading(false);
    }
  };

  return { deleteDocument, loading, error };
};

export default useDeleteDocument;
