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
import { useDocumentById } from '@/hooks/useDocumentById';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import useUploadImage from '@/hooks/useUploadImage';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// Schema de validação
const formSchema = z.object({
  credenciado_id: z.string().min(1, { message: 'Selecione um credenciado.' }),
  nome_servico: z
    .string()
    .min(2, { message: 'O nome do serviço deve ter pelo menos 2 caracteres.' }),
  descricao: z
    .string()
    .min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
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

export default function ServicoFormEdit() {
  const params = useParams();
  const router = useRouter();

const [existingImage, setExistingImage] = useState<string | null>(null);
  const { isUploading, progress, uploadImage } = useUploadImage();

  const servicoId = Array.isArray(params.planId)
    ? params.planId[0]
    : params.planId;
  // Hook para pegar o documento do Firestore
  const {
    data,
    loading: dataLoading,
    error
  } = useDocumentById('servicos', servicoId);
  const {
    documents,
    loading: loadingCredenciados,
    error: errorCredenciados
  } = useFetchDocuments('credenciados');

  // Hook para atualizar o documento no Firestore
  const { updateDocument, loading: updateLoading } = useFirestore({
    collectionName: 'servicos',
    onSuccess: () => {
      toast.success('Serviço atualizado com sucesso!');
      router.push('/dashboard/servicos');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao atualizar o serviço.');
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credenciado_id: '',
      nome_servico: '',
      descricao: '',
      preco_original: 0,
      preco_com_desconto: 0,
      imagem: undefined
    }
  });

  // Atualiza os valores do formulário quando os dados são carregados
  useEffect(() => {
    if (data) {
      form.reset({
        credenciado_id: data.credenciado_id || '',
        nome_servico: data.nome_servico || '',
        descricao: data.descricao || '',
        preco_original: data.preco_original || 0,
        preco_com_desconto: data.preco_com_desconto || 0
      });
      setExistingImage(data.imagemUrl || null);
    }
  }, [data, form]);

  // Função de submit
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let imageUrl = existingImage;

      // Se houver nova imagem, faz o upload
      if (values.imagem) {
        const newImageUrl = await uploadImage(
          values.imagem,
          'servicos',
          values.nome_servico.replace(/\s+/g, '-').toLowerCase()
        );
        
        if (!newImageUrl) {
          toast.error('Erro ao fazer upload da nova imagem');
          return;
        }
        imageUrl = newImageUrl;
      }

      // Atualiza os dados incluindo a URL da imagem
      const updatedData = {
        ...values,
        imagemUrl: imageUrl
      };
      
      delete updatedData.imagem;

      await updateDocument(servicoId, updatedData);

    } catch (err) {
      console.error('Erro ao atualizar:', err);
      toast.error('Erro durante a atualização');
    }
  };

  if (loadingCredenciados) return <div>Carregando credenciados...</div>;
  if (errorCredenciados) return <div>{errorCredenciados}</div>;
  if (dataLoading) return <div>Carregando dados do serviço...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Serviço
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

{/* Campo de Imagem */}
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
                          setExistingImage(null);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  
                  {/* Preview da imagem */}
                  {(field.value || existingImage) && (
                    <div className="mt-2">
                      <img
                        src={field.value ? 
                          URL.createObjectURL(field.value) : 
                          existingImage || ''}
                        alt="Imagem do serviço"
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {!field.value && 'Imagem atual'}
                      </p>
                    </div>
                  )}

                  {/* Progresso do upload */}
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
            <Button 
              disabled={updateLoading || isUploading} 
              type="submit"
              className="relative"
            >
              {isUploading ? (
                `Enviando imagem... ${progress}%`
              ) : updateLoading ? (
                'Salvando alterações...'
              ) : (
                'Atualizar Serviço'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
