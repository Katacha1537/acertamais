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
import { useDocumentById } from '@/hooks/useDocumentById';
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Schema de validação
const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome do plano deve ter pelo menos 2 caracteres.'
  }),
  desconto: z.number().min(0).max(100, {
    message: 'Desconto deve ser um número entre 0 e 100.'
  }),
  descricao: z.string().min(10, {
    message: 'Descrição deve ter pelo menos 10 caracteres.'
  })
});

export default function PlanFormEdit() {
  const router = useRouter();

  const params = useParams();
  const planId = Array.isArray(params.planId)
    ? params.planId[0]
    : params.planId;

  // Hook para pegar o documento do Firestore
  const { data, loading: dataLoading } = useDocumentById('planos', planId);

  // Hook para atualizar o documento no Firestore
  const { updateDocument } = useFirestore({
    collectionName: 'planos',
    onSuccess: () => {
      toast.success('Plano atualizado com sucesso!');
      router.push('/dashboard/planos');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao atualizar o plano.');
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      desconto: 0,
      descricao: ''
    }
  });

  // Atualiza os valores do formulário quando os dados são carregados
  useEffect(() => {
    if (data) {
      form.reset({
        nome: data.nome || '',
        desconto: data.desconto || 0,
        descricao: data.descricao || ''
      });
    }
  }, [data, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateDocument(planId, values);
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Plano
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
                name="desconto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Digite o desconto"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
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
            </div>
            <Button
              disabled={dataLoading || form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting
                ? 'Atualizando plano...'
                : 'Atualizar plano'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
