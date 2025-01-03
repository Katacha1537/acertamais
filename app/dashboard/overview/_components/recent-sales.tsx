import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function RecentSales({ funcionarios }: { funcionarios: any[] }) {
  // Função para pegar os 5 funcionários mais recentes
  const funcionariosRecentes = funcionarios
    ? funcionarios
        .sort(
          (a, b) =>
            new Date(b.dataAdmissao).getTime() -
            new Date(a.dataAdmissao).getTime()
        )
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-8">
      {/* Renderizando os funcionários recentes */}
      {funcionariosRecentes.map((funcionario, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            {/* Aqui você pode usar uma imagem do avatar se disponível, ou deixar o fallback */}
            <AvatarImage
              src={funcionario.avatar || '/avatars/default.png'}
              alt="Avatar"
            />
            <AvatarFallback>
              {funcionario.nome ? funcionario.nome.charAt(0) : 'F'}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {funcionario.nome}
            </p>
            <p className="text-sm text-muted-foreground">{funcionario.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
