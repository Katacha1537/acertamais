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
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome do segmento deve ter pelo menos 2 caracteres.'
  }),
  descricao: z.string().min(10, {
    message: 'Descrição deve ter pelo menos 10 caracteres.'
  })
});

export default function SegmentForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      descricao: ''
    }
  });

  const router = useRouter();
  const { addDocument, loading, error } = useFirestore({
    collectionName: 'segmentos',
    onSuccess: () => {
      form.reset();
      toast.success('Segmento adicionado com sucesso!');
      router.push('/dashboard/segmentos');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao adicionar o segmento.');
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addDocument(values, null);
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Informações do Segmento
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
                    <FormLabel>Nome do Segmento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome do segmento"
                        {...field}
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
                    <FormLabel>Descrição do Segmento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite a descrição do segmento"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button disabled={loading} type="submit">
              {loading ? 'Criando segmento...' : 'Criar novo segmento'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
