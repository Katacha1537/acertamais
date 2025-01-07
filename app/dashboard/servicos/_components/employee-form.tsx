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
import { useUser } from '@/context/UserContext'; // Adicionei o import
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Validação do Formulário
const formSchema = z.object({
  credenciado_id: z
    .string()
    .min(1, { message: 'Selecione um credenciado.' })
    .nullable(),
  nome_servico: z.string().min(2, {
    message: 'O nome do serviço deve ter pelo menos 2 caracteres.'
  }),
  descricao: z.string().min(10, {
    message: 'A descrição deve ter pelo menos 10 caracteres.'
  }),
  preco_original: z
    .number()
    .positive({ message: 'O preço original deve ser positivo.' }),
  preco_com_desconto: z
    .number()
    .positive({ message: 'O preço com desconto deve ser positivo.' })
});

export default function ServicoForm() {
  const { user } = useUser(); // Obtém o usuário atual
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credenciado_id:
        user?.role === 'accredited' ? user?.uid ?? undefined : undefined, // Garante que seja string ou undefined
      nome_servico: '',
      descricao: '',
      preco_original: 0,
      preco_com_desconto: 0
    }
  });

  const { documents, loading, error } = useFetchDocuments('credenciados');
  const router = useRouter();

  const { addDocument, loading: addLoading } = useFirestore({
    collectionName: 'servicos',
    onSuccess: () => {
      form.reset();
      toast.success('Serviço adicionado com sucesso!');
      router.push('/dashboard/servicos');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao adicionar o serviço.');
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addDocument(values, null);
  }

  if (loading) return <div>Carregando credenciados...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Criar Serviço
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Campo Credenciado */}
            <FormField
              control={form.control}
              name="credenciado_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credenciado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? undefined}
                    disabled={user?.role === 'accredited'} // Desabilita o select se for "accredited"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um credenciado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documents.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.nomeFantasia} - {doc.cnpj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Nome do Serviço */}
            <FormField
              control={form.control}
              name="nome_servico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do serviço" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descreva o serviço"
                      {...field}
                      className="h-24"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Preço Original */}
            <FormField
              control={form.control}
              name="preco_original"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Original</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Digite o preço original"
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

            {/* Campo Preço com Desconto */}
            <FormField
              control={form.control}
              name="preco_com_desconto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço com Desconto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Digite o preço com desconto"
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

            <Button disabled={addLoading} type="submit">
              {addLoading ? 'Criando Serviço...' : 'Criar Serviço'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
