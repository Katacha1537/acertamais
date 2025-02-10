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
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome do plano deve ter pelo menos 2 caracteres.'
  }),
  descricao: z.string().min(10, {
    message: 'Descrição deve ter pelo menos 10 caracteres.'
  }),
  accrediting_name: z.string().optional() // Make this optional or required as needed
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

  // Use o hook useFirestore
  const { addDocument, loading, error } = useFirestore({
    collectionName: 'planos', // Nome da coleção Firestore
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Verifica se o campo accrediting_name existe, caso contrário, omite ou define como null
    const dataToSave = {
      ...values,
      accrediting_Id: user?.uid, // Adiciona o ID do usuário atual
      accrediting_name:
        user?.role === 'accrediting' ? user?.displayName || null : undefined // Verifica se o nome do acreditador deve ser enviado
    };

    // Remover o campo accrediting_name se ele for null ou undefined
    if (
      dataToSave.accrediting_name === undefined ||
      dataToSave.accrediting_name === null
    ) {
      delete dataToSave.accrediting_name;
    }

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
              {user?.role === 'accrediting' && (
                <FormField
                  control={form.control}
                  name="accrediting_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Acreditador</FormLabel>
                      <FormControl>
                        {/* Garantindo que o valor é uma string */}
                        <Input
                          {...field} // 'field' already handles value and onChange
                          disabled
                          defaultValue={user?.displayName || ''} // Set default value if user.displayName is null
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <Button disabled={loading} type="submit">
              {loading ? 'Criando plano...' : 'Criar novo plano'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
