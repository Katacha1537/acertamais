'use client';
import { Employee } from '@/constants/data';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'name',
    header: 'Nome'
  },
  {
    accessorKey: 'email',
    header: 'E-mail'
  },
  {
    accessorKey: 'telefone',
    header: 'Telefone'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
