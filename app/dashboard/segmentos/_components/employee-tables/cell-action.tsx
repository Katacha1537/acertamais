'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Employee } from '@/constants/data';
import { useUpdateContext } from '@/context/GlobalUpdateContext.tsx';
import { useFirestore } from '@/hooks/useFirestore'; // Importe seu hook modificado
import { Edit, MoreHorizontal, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
  data: Employee;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { triggerUpdate } = useUpdateContext();

  // Usando o hook useFirestore com a coleção 'Segmento'
  const {
    updateDocument,
    loading: updateLoading,
    error
  } = useFirestore({
    collectionName: 'segmentos',
    onSuccess: () => {
      toast.success('Segmento deletado com sucesso!');
      triggerUpdate();
    },
    onError: () => {
      toast.error('Erro Erro ao deletar segmento.');
    }
  });

  const onConfirm = async () => {
    setLoading(true);
    try {
      // Ao invés de deletar, atualiza o documento com isDeleted: true
      await updateDocument(data.id, {
        ...data,
        isDeleted: true,
        deletedAt: new Date().toISOString() // Opcional: adicionar data de "exclusão"
      });
      setOpen(false);
    } catch (err) {
      toast.error('Erro ao deletar segmento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading || updateLoading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/segmentos/${data.id}`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-500 hover:text-red-500"
            onClick={() => setOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" /> Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
