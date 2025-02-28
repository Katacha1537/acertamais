'use client';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { LogoPreview } from './logo-preview';

// Definindo a estrutura da linha de dados
interface Company {
  id: string;
  nome: string;
  descricao: string;
  accrediting_name: string;
  accrediting_Id: string;
  imagemUrl: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  segmento: string;
  endereco: string;
  cep: string;
}

// Definindo a tipagem para as colunas
export const columns: ColumnDef<Company>[] = [
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
    cell: ({ row }) => <LogoPreview data={row.original} />,
    header: 'Logo'
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
    accessorKey: 'accrediting_name',
    header: 'Credenciadora'
  },
  {
    accessorKey: 'planName',
    header: 'Plano'
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
    accessorKey: 'segmento',
    header: 'Segmento'
  },
  {
    accessorKey: 'endereco',
    header: 'Endereço'
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
