'use client';
import { Employee } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { LogoPreview } from './logo-preview';

export const columns: ColumnDef<Employee>[] = [
  // {
  //   id: 'select',
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Selecionar todos"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Selecionar linha"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false
  // },
  {
    cell: ({ row }) => <LogoPreview imagemUrl={row.original.imagemUrl} />,
    header: 'Logo'
  },
  {
    accessorKey: 'nome_servico',
    header: 'Serviço'
  },
  {
    accessorKey: 'descricao',
    header: 'Descrição'
  },
  {
    accessorKey: 'credenciadoName',
    header: 'Credenciado'
  },
  {
    accessorKey: 'preco_original_formatado',
    header: 'Preço Original'
  },
  {
    accessorKey: 'preco_com_desconto_formatado',
    header: 'Preço com Desconto'
  },
  {
    accessorKey: 'descontoPorcentagem',
    header: 'Porcentagem do Desconto'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
