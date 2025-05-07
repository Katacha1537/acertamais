'use client';
import { Employee } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

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
    accessorKey: 'razaoSocial',
    header: 'Razão Social'
  },
  {
    accessorKey: 'nomeFantasia',
    header: 'Nome Fantasia'
  },
  {
    accessorKey: 'cnpj',
    header: 'CNPJ'
  },
  {
    accessorKey: 'telefone',
    header: 'Telefone'
  },
  {
    accessorKey: 'emailAcess',
    header: 'E-mail de Acesso'
  },
  {
    accessorKey: 'segmentoNome',
    header: 'Segmento'
  },
  {
    accessorKey: 'endereco',
    header: 'Endereco'
  },
  {
    accessorKey: 'cep',
    header: 'CEP'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
