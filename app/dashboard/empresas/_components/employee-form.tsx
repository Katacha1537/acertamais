'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useUser } from '@/context/UserContext';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { createLogin } from '@/lib/createLogin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Validação do Formulário
const formSchema = z.object({
  razaoSocial: z.string().min(2, {
    message: 'Razão Social deve ter pelo menos 2 caracteres.'
  }),
  nomeFantasia: z.string().min(2, {
    message: 'Nome Fantasia deve ter pelo menos 2 caracteres.'
  }),
  emailAcess: z.string().email({ message: 'Email inválido.' }),
  cnpjCaepf: z.string().min(11, {
    message: 'CNPJ ou CAEPF deve ter pelo menos 11 caracteres.'
  }),
  endereco: z.string().min(5, {
    message: 'Endereço deve ter pelo menos 5 caracteres.'
  }),
  cep: z.string().min(8, {
    message: 'CEP deve ter 8 caracteres.'
  }),
  numeroFuncionarios: z.number().positive({
    message: 'Número de funcionários deve ser positivo.'
  }),
  contatoRH: z.object({
    nome: z.string().min(2, {
      message: 'Nome do RH deve ter pelo menos 2 caracteres.'
    }),
    email: z.string().email({ message: 'Email inválido.' }),
    telefone: z.string().min(10, {
      message: 'Telefone do RH deve ter pelo menos 10 caracteres.'
    })
  }),
  contatoFinanceiro: z.object({
    nome: z.string().min(2, {
      message: 'Nome do Financeiro deve ter pelo menos 2 caracteres.'
    }),
    email: z.string().email({ message: 'Email inválido.' }),
    telefone: z.string().min(10, {
      message: 'Telefone do Financeiro deve ter pelo menos 10 caracteres.'
    })
  }),
  accrediting_name: z.string().optional(),
  accrediting_Id: z.string().optional(),
  planos: z.string().min(1, {
    message: 'Selecione um plano.'
  })
});

export default function EmpresaForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      emailAcess: '',
      cnpjCaepf: '',
      endereco: '',
      cep: '',
      numeroFuncionarios: 0,
      contatoRH: {
        nome: '',
        email: '',
        telefone: ''
      },
      contatoFinanceiro: {
        nome: '',
        email: '',
        telefone: ''
      },
      planos: ''
    }
  });

  const router = useRouter();
  const { user } = useUser(); // Obtém o usuário atual

  const { documents: plans, loading, error } = useFetchDocuments('planos');
  const {
    documents: accreditors,
    loading: accreditorsLoading,
    error: accreditorsError
  } = useFetchDocuments('credenciadoras');
  const [filteredPlans, setFilteredPlans] = useState(plans);
  const [selectedAccreditor, setSelectedAccreditor] = useState<string | null>(
    null
  );
  const [isAccreditorActive, setIsAccreditorActive] = useState<boolean>(true);

  // Filtra os planos se o user.role for 'accrediting'
  useEffect(() => {
    if (user?.role === 'accrediting') {
      // Se o usuário for uma credenciadora, filtra pelos planos dela
      const filtered = plans?.filter(
        (plan) => plan.accrediting_Id === user?.uid
      );
      setFilteredPlans(filtered || []);

      setIsAccreditorActive(false);
    } else if (selectedAccreditor) {
      // Se houver uma credenciadora selecionada, filtra por ela
      const filtered = plans?.filter(
        (plan) => plan.accrediting_Id === selectedAccreditor
      );
      setFilteredPlans(filtered || []);
      setIsAccreditorActive(false);
      if (filtered.length === 0) {
        setIsAccreditorActive(true);
      }
    } else {
      // Caso contrário, limpa a lista
      setFilteredPlans([]);

      setIsAccreditorActive(true);
    }
  }, [selectedAccreditor, plans, user?.role, user?.uid]);

  const { addDocument, loading: addLoading } = useFirestore({
    collectionName: 'empresas',
    onSuccess: () => {
      form.reset();
      toast.success('Empresa adicionada com sucesso!');
      router.push('/dashboard/empresas');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao adicionar a empresa.');
    }
  });

  const { addDocument: addUser } = useFirestore({
    collectionName: 'users'
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userUid = await createLogin(values.emailAcess);
    const userInfo = {
      uid: userUid,
      role: 'business',
      name: values.nomeFantasia,
      email: values.emailAcess
    };

    // Verifica se o campo accrediting_name existe, caso contrário, omite ou define como null
    const dataToSave = {
      ...values,
      accrediting_Id:
        user?.role === 'accrediting' ? user?.uid : values.accrediting_Id, // Se for acreditador, usa o UID do usuário
      accrediting_name:
        user?.role === 'accrediting'
          ? user?.displayName || null
          : values.accrediting_Id // Nome do acreditador ou undefined
    };

    // Remover o campo accrediting_name se ele for null ou undefined
    if (
      dataToSave.accrediting_name === undefined ||
      dataToSave.accrediting_name === null
    ) {
      delete dataToSave.accrediting_name;
    }

    addUser(userInfo, null);
    addDocument(dataToSave, userUid);
  }

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Criar Empresa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a razão social" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome fantasia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailAcess"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de acesso</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o email de acesso"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpjCaepf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ ou CAEPF</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o CNPJ ou CAEPF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o endereço" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o CEP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numeroFuncionarios"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Funcionários</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Digite o número de funcionários"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contatoRH.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do RH</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do RH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contatoRH.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do RH</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o email do RH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contatoRH.telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do RH</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o telefone do RH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contatoFinanceiro.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Financeiro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome do Financeiro"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contatoFinanceiro.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Financeiro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o email do Financeiro"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contatoFinanceiro.telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Financeiro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o telefone do Financeiro"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Formulário para Credenciadora */}
            {user?.role === 'accrediting' ? (
              <FormField
                control={form.control}
                name="accrediting_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Credenciadora</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled
                        defaultValue={user?.displayName || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="accrediting_Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecionar Credenciadora</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        disabled={accreditorsLoading} // Desabilita o select enquanto carrega as credenciadoras
                        onValueChange={(value) => {
                          field.onChange(value); // Atualiza o valor no campo do formulário
                          setSelectedAccreditor(value); // Atualiza o estado do accreditor selecionado
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma credenciadora" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {accreditors?.map((accreditor) => (
                              <SelectItem
                                key={accreditor.id}
                                value={accreditor.id}
                              >
                                {accreditor.nomeFantasia}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Seleção de Planos */}
            <FormField
              control={form.control}
              name="planos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planos</FormLabel>
                  <Select
                    onValueChange={field.onChange} // Conecta o evento ao react-hook-form
                    value={field.value} // Garante que o valor atual seja refletido
                    disabled={isAccreditorActive} // Desabilita até uma credenciadora ser selecionada
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredPlans.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.nome} - {doc.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={addLoading} type="submit">
              {addLoading ? 'Criando Empresa...' : 'Criar Empresa'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
