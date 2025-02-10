import { NavItem } from '@/types';

export type User = {
  id: number;
  name: string;
  company: string;
  role: string;
  verified: boolean;
  status: string;
};
export const users: User[] = [
  {
    id: 1,
    name: 'Candice Schiner',
    company: 'Dell',
    role: 'Frontend Developer',
    verified: false,
    status: 'Active'
  },
  {
    id: 2,
    name: 'John Doe',
    company: 'TechCorp',
    role: 'Backend Developer',
    verified: true,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Alice Johnson',
    company: 'WebTech',
    role: 'UI Designer',
    verified: true,
    status: 'Active'
  },
  {
    id: 4,
    name: 'David Smith',
    company: 'Innovate Inc.',
    role: 'Fullstack Developer',
    verified: false,
    status: 'Inactive'
  },
  {
    id: 5,
    name: 'Emma Wilson',
    company: 'TechGuru',
    role: 'Product Manager',
    verified: true,
    status: 'Active'
  },
  {
    id: 6,
    name: 'James Brown',
    company: 'CodeGenius',
    role: 'QA Engineer',
    verified: false,
    status: 'Active'
  },
  {
    id: 7,
    name: 'Laura White',
    company: 'SoftWorks',
    role: 'UX Designer',
    verified: true,
    status: 'Active'
  },
  {
    id: 8,
    name: 'Michael Lee',
    company: 'DevCraft',
    role: 'DevOps Engineer',
    verified: false,
    status: 'Active'
  },
  {
    id: 9,
    name: 'Olivia Green',
    company: 'WebSolutions',
    role: 'Frontend Developer',
    verified: true,
    status: 'Active'
  },
  {
    id: 10,
    name: 'Robert Taylor',
    company: 'DataTech',
    role: 'Data Analyst',
    verified: false,
    status: 'Active'
  }
];

export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string; // Consider using a proper date type if possible
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  longitude?: number; // Optional field
  latitude?: number; // Optional field
  job: string;
  profile_picture?: string | null; // Profile picture can be a string (URL) or null (if no picture)
};

export type Plan = {
  id: string; // Unique identifier for the plan
  desconto: number; // Discount percentage
  descricao: string; // Description of the plan
  nome: string; // Name of the plan
};

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

export const roleRoutes: {
  admin: string;
  business: string;
  accredited: string;
} = {
  admin: '/dashboard/overview',
  business: '/dashboard/funcionarios',
  accredited: '/dashboard/servicos'
};

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Crendenciadoras',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'shildCheck',
    isActive: true,

    items: [
      {
        title: 'Listar credenciadoras',
        url: '/dashboard/credenciadoras',
        icon: 'shildCheck',
        shortcut: ['c', 'c'],
        isActive: false,
        items: []
      },
      {
        title: 'listar Planos',
        url: '/dashboard/planos',
        icon: 'clipboardList',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    title: 'Empresas',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'building',
    isActive: true,

    items: [
      {
        title: 'listar Empresas',
        url: '/dashboard/empresas',
        icon: 'building',
        shortcut: ['b', 'b'],
        isActive: false,
        items: []
      },
      {
        title: 'listar Funcionários',
        url: '/dashboard/funcionarios',
        icon: 'user',
        shortcut: ['f', 'f'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    title: 'Credenciados',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'package',
    isActive: true,

    items: [
      {
        title: 'listar Crendenciados',
        url: '/dashboard/credenciados',
        icon: 'shildCheck',
        shortcut: ['c', 'c'],
        isActive: false,
        items: []
      },
      {
        title: 'listar Serviços',
        url: '/dashboard/servicos',
        icon: 'package',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      }
    ]
  }
];
