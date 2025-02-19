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
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
} from '@/components/ui/select';

const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome do plano deve ter pelo menos 2 caracteres.'
  }),
  descricao: z.string().min(10, {
    message: 'Descrição deve ter pelo menos 10 caracteres.'
  }),
  accrediting_name: z.string().optional(),
  accrediting_Id: z.string().optional()
});

export default function PlanFormEdit() {
  const router = useRouter();
  const params = useParams();
  const planId = Array.isArray(params.planId)
    ? params.planId[0]
    : params.planId;

  const { data, loading: dataLoading } = useDocumentById('planos', planId);
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

  const { user } = useUser();
  const {
    documents: accreditors,
    loading: accreditorsLoading,
    error: accreditorsError
  } = useFetchDocuments('credenciadoras');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      accrediting_name:
        user?.role === 'accrediting' ? user?.displayName || '' : undefined,
      accrediting_Id: ''
    }
  });

  useEffect(() => {
    if (data) {
      form.reset({
        nome: data.nome || '',
        descricao: data.descricao || '',
        accrediting_name:
          user?.role === 'accrediting'
            ? user?.displayName || ''
            : data.accrediting_name,
        accrediting_Id: data.accrediting_Id || ''
      });
    }
  }, [data, form, user]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const dataToUpdate = {
      ...values,
      accrediting_Id:
        user?.role === 'accrediting' ? user?.uid : values.accrediting_Id,
      accrediting_name:
        user?.role === 'accrediting' ? user?.displayName || null : undefined
    };

    if (
      dataToUpdate.accrediting_name === undefined ||
      dataToUpdate.accrediting_name === null
    ) {
      delete dataToUpdate.accrediting_name;
    }

    updateDocument(planId, dataToUpdate);
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
                      <FormLabel>Nome da Credenciadora</FormLabel>
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
                          {...field}
                          disabled={accreditorsLoading}
                          value={field.value}
                          onValueChange={field.onChange}
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
            <Button
              disabled={
                dataLoading || form.formState.isSubmitting || accreditorsLoading
              }
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
