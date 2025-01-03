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
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
  segmento: z.string().min(2, {
    message: 'Segmento deve ter pelo menos 2 caracteres.'
  }),
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
      segmento: '',
      planos: ''
    }
  });

  const router = useRouter();

  const { documents, loading, error } = useFetchDocuments('planos');

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    addDocument(values, null);
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
              name="segmento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segmento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o segmento da empresa"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      {documents.map((doc) => (
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
