'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navItems } from '@/constants/data';
import { useUser } from '@/context/UserContext'; // Importe o hook do contexto do usuário
import { db } from '@/service/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ChevronRight, ChevronsUpDown, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icons } from '../icons';

export const company = {
  logo: Plus
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [notificationCount, setNotificationCount] = useState(0);

  const { user, loading, isAuthenticated } = useUser(); // Usando o hook useUser

  useEffect(() => {
    if (!user?.uid) return;
    let q;
    console.log(user);
    if (user.role === 'accredited') {
      q = query(
        collection(db, 'solicitacoes'),
        where('status', '==', 'pendente'),
        where('credenciado_id', '==', user.uid)
      );
    } else if (user.role === 'user') {
      q = query(
        collection(db, 'solicitacoes'),
        where('status', '==', 'pendente'),
        where('credenciado_id', '==', user.credenciado_Id)
      );
    } else {
      q = query(
        collection(db, 'solicitacoes'),
        where('status', '==', 'pendente')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotificationCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer logout');
      }

      // Após o logout, redireciona para a página de login ou inicial
      router.push('/');
    } catch (error) {
      console.error('Erro durante o logout:', error);
    }
  };

  if (loading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex gap-2 py-2 text-sidebar-accent ">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
              <company.logo className="size-8" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold dark:text-white dark:opacity-90">
                ACERTA+
              </span>
              <span className="truncate text-xs dark:text-gray-300">
                Painel ADMIN
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup>
            <SidebarGroupLabel>Carregando...</SidebarGroupLabel>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.photoURL || ''} // Usando o contexto para a imagem do usuário
                        alt={user?.displayName || ''} // Usando o contexto para o nome do usuário
                      />
                      <AvatarFallback className="rounded-lg">
                        {user?.displayName?.slice(0, 2)?.toUpperCase() || 'AD'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.displayName || 'Acerta+ Admin'}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || ''}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={user?.photoURL || ''} // Usando o contexto para a imagem do usuário
                          alt={user?.displayName || ''} // Usando o contexto para o nome do usuário
                        />
                        <AvatarFallback className="rounded-lg">
                          {user?.displayName?.slice(0, 2)?.toUpperCase() ||
                            'AD'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user?.displayName || 'Acerta+ Admin'}
                        </span>
                        <span className="truncate text-xs">
                          {user?.email || 'admin@acertamais.com'}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={handleLogout}
                  >
                    <LogOut />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    ); // Tela de carregamento enquanto os dados do usuário estão sendo carregados
  }

  // Função para filtrar os itens do menu com base no role
  const filterNavItemsByRole = (items: typeof navItems) => {
    if (!user?.role) return items;

    switch (user.role) {
      case 'business':
        return items
          .filter((item) => item.title !== 'Dashboard') // Remove o Dashboard
          .filter((item) => item.title !== 'Segmentos') // Remove o Dashboard
          .filter((item) => item.title !== 'Solicitações') // Remove o Dashboard
          .filter((item) => item.title !== 'Crendenciadoras') // Remove o Dashboard
          .filter((item) => item.title !== 'Credenciados') // Remove o Dashboard
          .map((item) => ({
            ...item,
            items: item.items
              ? item.items.filter((subItem) => subItem.title !== 'Empresas')
              : []
          }));
      case 'accredited':
        return items
          .filter((item) => item.title !== 'Dashboard')
          .filter((item) => item.title !== 'Segmentos') // Remove o Dashboard
          .filter((item) => item.title !== 'Empresas')
          .filter((item) => item.title !== 'Crendenciadoras')
          .map((item) => ({
            ...item,
            items: item.items
              ? item.items.filter(
                  (subItem) =>
                    subItem.title === 'Serviços' || subItem.title === 'Usuários'
                )
              : []
          }));
      case 'adminAccredited':
        return items
          .filter((item) => item.title !== 'Dashboard')
          .filter((item) => item.title !== 'Segmentos') // Remove o Dashboard
          .filter((item) => item.title !== 'Empresas')
          .filter((item) => item.title !== 'Crendenciadoras')
          .map((item) => ({
            ...item,
            items: item.items
              ? item.items.filter(
                  (subItem) =>
                    subItem.title === 'Serviços' || subItem.title === 'Usuários'
                )
              : []
          }));
      case 'employeeAccredited':
        return items
          .filter((item) => item.title !== 'Dashboard')
          .filter((item) => item.title !== 'Segmentos') // Remove o Dashboard
          .filter((item) => item.title !== 'Empresas')
          .filter((item) => item.title !== 'Crendenciadoras')
          .filter((item) => item.title !== 'Credenciados')
          .filter((item) => item.title !== 'Usuários') // Remove o Dashboard
          .filter((item) => item.title !== 'Serviços'); // Remove o Dashboard
      case 'user':
        return items
          .filter((item) => item.title !== 'Dashboard')
          .filter((item) => item.title !== 'Segmentos') // Remove o Dashboard
          .filter((item) => item.title !== 'Empresas')
          .filter((item) => item.title !== 'Crendenciadoras')
          .filter((item) => item.title !== 'Credenciados');
      case 'accrediting':
        return items
          .filter((item) => item.title !== 'Dashboard') // Remove o Dashboard
          .filter((item) => item.title !== 'Segmentos') // Remove o Dashboard
          .filter((item) => item.title !== 'Solicitações') // Remove o Dashboard
          .map((item) => ({
            ...item,
            items: item.items
              ? item.items.filter(
                  (subItem) => subItem.title !== 'Credenciadoras'
                )
              : []
          }));
      case 'adminAccrediting':
        return items
          .filter((item) => item.title !== 'Dashboard') // Remove o Dashboard
          .filter((item) => item.title !== 'Segmentos') // Remove o Dashboard
          .filter((item) => item.title !== 'Solicitações') // Remove o Dashboard
          .filter((item) => item.title !== 'Usuários') // Remove o Dashboard
          .map((item) => ({
            ...item,
            items: item.items
              ? item.items.filter(
                  (subItem) => subItem.title !== 'Credenciadoras'
                )
              : []
          }));
      case 'admin':
        return items; // Admin tem acesso a todos
      case 'adminBusiness':
        return items
          .filter((item) => item.title !== 'Dashboard') // Remove o Dashboard
          .filter((item) => item.title !== 'Segmentos') // Remove o Dashboard
          .filter((item) => item.title !== 'Solicitações') // Remove o Dashboard
          .filter((item) => item.title !== 'Crendenciadoras') // Remove o Dashboard
          .filter((item) => item.title !== 'Credenciados') // Remove o Dashboard
          .map((item) => ({
            ...item,
            items: item.items
              ? item.items.filter((subItem) => subItem.title !== 'Empresas')
              : []
          }));
      default:
        return items;
    }
  };

  const filteredNavItems = filterNavItemsByRole(navItems);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex gap-2 py-2 text-sidebar-accent ">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
            <company.logo className="size-8" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold dark:text-white dark:opacity-90">
              ACERTA+
            </span>
            <span className="truncate text-xs dark:text-gray-300">
              Painel ADMIN
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Visão geral</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNavItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>

                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>

                      {/* Adicione o badge de notificação */}
                      {item.title === 'Solicitações' && (
                        <span className="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs text-white">
                          {notificationCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.photoURL || ''} // Usando o contexto para a imagem do usuário
                      alt={user?.displayName || ''} // Usando o contexto para o nome do usuário
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.displayName?.slice(0, 2)?.toUpperCase() || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.displayName || 'Acerta+ Admin'}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || ''}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.photoURL || ''} // Usando o contexto para a imagem do usuário
                        alt={user?.displayName || ''} // Usando o contexto para o nome do usuário
                      />
                      <AvatarFallback className="rounded-lg">
                        {user?.displayName?.slice(0, 2)?.toUpperCase() || 'AD'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.displayName || 'Acerta+ Admin'}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || 'admin@acertamais.com'}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
