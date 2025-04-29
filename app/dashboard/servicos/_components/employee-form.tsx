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
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import useUploadImage from '@/hooks/useUploadImage';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

function formatCurrency(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';
  const numberValue = (parseInt(numericValue, 10) / 100).toFixed(2);
  return `R$ ${numberValue.replace('.', ',')}`;
}

function parseCurrency(value: string): number | undefined {
  const numericValue = value.replace(/[^\d]/g, '');
  if (!numericValue) return undefined;
  const parsed = parseFloat((parseInt(numericValue, 10) / 100).toFixed(2));
  return isNaN(parsed) ? undefined : parsed;
}

const formSchema = z.object({
  credenciado_id: z
    .string()
    .min(1, { message: 'Selecione um credenciado.' })
    .nullable(),
  nome_servico: z.string().min(2, {
    message: 'O nome do serviço deve ter pelo menos 2 caracteres.'
  }),
  descricao: z.string().optional(),
  preco_original: z
    .number()
    .positive({ message: 'O preço original deve ser positivo.' }),
  preco_com_desconto: z
    .number()
    .positive({ message: 'O preço com desconto deve ser positivo.' }),
  imagem: z
    .instanceof(File)
    .refine((file) => file.type.startsWith('image/'), {
      message: 'Apenas imagens são permitidas.'
    })
    .optional()
});

export default function ServicoForm() {
  const { user } = useUser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credenciado_id:
        user?.role === 'accredited' ? user?.uid ?? undefined : undefined,
      nome_servico: '',
      descricao: '',
      preco_original: undefined,
      preco_com_desconto: undefined,
      imagem: undefined
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

  const {
    isUploading,
    progress,
    url,
    error: uploadError,
    uploadImage
  } = useUploadImage();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      let imageUrl: string | null = null;

      if (values.imagem) {
        try {
          imageUrl = await uploadImage(
            values.imagem,
            'servicos',
            values.nome_servico.replace(/\s+/g, '-').toLowerCase()
          );

          if (!imageUrl) {
            toast.error('Erro ao fazer upload da imagem');
            return;
          }
        } catch (err: any) {
          console.error('Erro no upload:', err);
          if (err.code === 'storage/unauthorized') {
            toast.error(
              'Você não tem permissão para fazer upload dessa imagem.'
            );
          } else {
            toast.error('Falha no upload da imagem');
          }
          return;
        }
      }

      const firestoreData = {
        ...values,
        preco_original: parseFloat(values.preco_original.toFixed(2)),
        preco_com_desconto: parseFloat(values.preco_com_desconto.toFixed(2)),
        imagemUrl: imageUrl || null,
        createdAt: new Date().toISOString()
      };

      delete firestoreData.imagem;

      await addDocument(firestoreData, null);
    } catch (err) {
      console.error('Erro geral:', err);
      toast.error('Ocorreu um erro inesperado');
    }
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
            <FormField
              control={form.control}
              name="imagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem do Serviço</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          field.onChange(e.target.files[0]);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {field.value && field.value instanceof File && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(field.value)}
                        alt="Imagem selecionada"
                        className="h-32 w-32 rounded-md object-cover"
                      />
                    </div>
                  )}
                  {isUploading && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Enviando imagem... {progress}%
                      </p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credenciado_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credenciado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? undefined}
                    disabled={user?.role === 'accredited'}
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
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
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
            <FormField
              control={form.control}
              name="preco_original"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Original</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Digite o preço original"
                      value={
                        field.value !== undefined
                          ? formatCurrency((field.value * 100).toString())
                          : ''
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsedValue = parseCurrency(value);
                        field.onChange(parsedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preco_com_desconto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço com Desconto</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Digite o preço com desconto"
                      value={
                        field.value !== undefined
                          ? formatCurrency((field.value * 100).toString())
                          : ''
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsedValue = parseCurrency(value);
                        field.onChange(parsedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
            <Button
              disabled={addLoading || isUploading}
              type="submit"
              className="relative"
            >
              {isUploading
                ? `Enviando imagem... ${progress}%`
                : addLoading
                ? 'Salvando dados...'
                : 'Criar Serviço'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
