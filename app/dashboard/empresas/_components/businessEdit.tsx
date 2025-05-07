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
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useUser } from '@/context/UserContext';
import { useDocumentById } from '@/hooks/useDocumentById';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
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
  planos: z.string().min(1, {
    message: 'Selecione um plano.'
  }),
  accrediting_name: z.string().optional()
});

export default function BusinessFormEdit() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();

  // Garantir que businessId seja uma string
  const businessId = Array.isArray(params.businessId)
    ? params.businessId[0]
    : params.businessId;

  const { data, loading: dataLoading } = useDocumentById(
    'empresas',
    businessId
  );
  const { updateDocument } = useFirestore({ collectionName: 'empresas' });

  // Carregar os dados da empresa
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
      contatoRH: { nome: '', email: '', telefone: '' },
      contatoFinanceiro: { nome: '', email: '', telefone: '' },
      planos: ''
    }
  });

  useEffect(() => {
    if (data) {
      form.reset({
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia,
        emailAcess: data.emailAcess,
        cnpjCaepf: data.cnpjCaepf,
        endereco: data.endereco,
        cep: data.cep,
        numeroFuncionarios: data.numeroFuncionarios,
        contatoRH: data.contatoRH,
        contatoFinanceiro: data.contatoFinanceiro,
        planos: data.planos,
        accrediting_name: data.accrediting_name || ''
      });
    }
  }, [data]);

  const {
    documents: planos,
    loading: planosLoading,
    error: planosError
  } = useFetchDocuments('planos');

  const [filteredPlans, setFilteredPlans] = useState(planos);

  // Filtra os planos se o user.role for 'accrediting'
  useEffect(() => {
    if (user?.role === 'accrediting') {
      const filtered = planos?.filter(
        (plan) => plan.accrediting_Id === user?.uid
      );
      setFilteredPlans(filtered);
    } else {
      setFilteredPlans(planos);
    }
  }, [planos, user?.role]);

  // Função de envio do formulário
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const dataToSave = {
        ...values,
        accrediting_Id:
          user?.role === 'accrediting'
            ? user?.uid
            : user?.role === 'adminAccrediting'
            ? user?.donoId
            : user?.uid,
        accrediting_name:
          user?.role === 'accrediting' ? user?.displayName || null : undefined
      };

      if (
        dataToSave.accrediting_name === undefined ||
        dataToSave.accrediting_name === null
      ) {
        delete dataToSave.accrediting_name;
      }

      await updateDocument(businessId, dataToSave); // Atualiza a empresa no Firestore
      toast.success('Empresa atualizada com sucesso!');
      router.push('/dashboard/empresas');
    } catch (error) {
      toast.error('Erro ao atualizar a empresa.');
    }
  };

  if (planosLoading || dataLoading) return <div>Carregando...</div>;
  if (planosError) return <div>{planosError}</div>;

  return (
    <Card className="ml-2 w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Empresa
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
            <FormField
              control={form.control}
              name="planos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano Disponível</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
            {user?.role === 'accrediting' && (
              <FormField
                control={form.control}
                name="accrediting_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Acreditador</FormLabel>
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
            )}
            <Button disabled={dataLoading} type="submit">
              {dataLoading ? 'Atualizando Empresa...' : 'Atualizar Empresa'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
