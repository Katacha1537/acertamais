'use client';
import { Checkbox } from '@/components/ui/checkbox';
import { Employee } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Employee>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar Todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'nomeFantasia',
    header: 'Nome Fantasia'
  },
  {
    accessorKey: 'razaoSocial',
    header: 'Razão Social'
  },
  {
    accessorKey: 'cnpjCaepf',
    header: 'CPNJ ou CAEPF'
  },
  {
    accessorKey: 'numeroFuncionarios',
    header: 'Nº de Funcionário'
  },
  {
    accessorKey: 'planName',
    header: 'Plano'
  },
  {
    accessorKey: 'endereco',
    header: 'Endereço'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
