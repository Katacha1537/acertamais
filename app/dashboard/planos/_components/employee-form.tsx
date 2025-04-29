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
import { useUser } from '@/context/UserContext';
import useFetchDocuments from '@/hooks/useFetchDocuments'; // Importando o hook para buscar as credenciadoras
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'; // Importando os componentes do Select ShadCN

const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome do plano deve ter pelo menos 2 caracteres.'
  }),
  descricao: z.string().optional(),
  accrediting_name: z.string().optional(),
  accrediting_Id: z.string().optional()
});

export default function PlanForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: ''
    }
  });

  const router = useRouter();
  const { user } = useUser(); // Obtém o usuário atual
  const { addDocument, loading, error } = useFirestore({
    collectionName: 'planos',
    onSuccess: () => {
      form.reset(); // Reseta o formulário após sucesso
      toast.success('Plano adicionado com sucesso!');
      router.push('/dashboard/planos');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao adicionar o plano.');
    }
  });

  // Usando o hook useFetchDocuments para buscar as credenciadoras
  const {
    documents: accreditors,
    loading: accreditorsLoading,
    error: accreditorsError
  } = useFetchDocuments('credenciadoras');

  function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSave = {
      ...values,
      accrediting_Id:
        user?.role === 'accrediting' ? user?.uid : values.accrediting_Id, // Se for acreditador, usa o UID do usuário
      accrediting_name:
        user?.role === 'accrediting'
          ? user?.displayName || null
          : values.accrediting_Id // Nome do acreditador ou undefined
    };

    if (
      dataToSave.accrediting_name === undefined ||
      dataToSave.accrediting_name === null
    ) {
      delete dataToSave.accrediting_name;
    }

    console.log(dataToSave);

    addDocument(dataToSave, null); // Envia os dados para o Firestore
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Informações do Plano
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Plano</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do plano" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Plano</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite a descrição do plano"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {user?.role === 'accrediting' ? (
                <FormField
                  control={form.control}
                  name="accrediting_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Credenciadora</FormLabel>
                      <FormControl>
                        {/* Garantindo que o valor é uma string */}
                        <Input
                          {...field}
                          disabled
                          defaultValue={user?.displayName || ''} // Set default value if user.displayName is null
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
                          onValueChange={field.onChange} // Conecta o evento ao react-hook-form
                          value={field.value} // Garante que o valor atual seja refletido
                          disabled={accreditorsLoading} // Desabilita o select enquanto carrega as credenciadoras
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
            </div>
            <Button disabled={loading || accreditorsLoading} type="submit">
              {loading || accreditorsLoading
                ? 'Criando plano...'
                : 'Criar novo plano'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
