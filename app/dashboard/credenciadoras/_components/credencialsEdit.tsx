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
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

function maskCEP(value: string) {
  return value
    .replace(/\D/g, '') // Remove todos os caracteres não numéricos
    .replace(/(\d{5})(\d)/, '$1-$2') // Aplica o hífen após os 5 primeiros dígitos
    .substring(0, 9); // Limita o tamanho a 9 caracteres
}

function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, '') // Remove todos os caracteres não numéricos
    .replace(/(\d{2})(\d)/, '$1.$2') // Adiciona o ponto após os 2 primeiros números
    .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona o ponto após os 3 próximos números
    .replace(/(\d{3})(\d)/, '$1/$2') // Adiciona a barra após os 3 próximos números
    .replace(/(\d{4})(\d{2})$/, '$1-$2') // Adiciona o hífen após os 4 próximos números
    .substring(0, 18); // Limita o tamanho a 18 caracteres (formato final)
}

function maskTelefone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    .substring(0, 15);
}

// Esquema de validação
const formSchema = z.object({
  razaoSocial: z
    .string()
    .min(2, { message: 'Razão Social deve ter pelo menos 2 caracteres.' }),
  nomeFantasia: z
    .string()
    .min(2, { message: 'Nome Fantasia deve ter pelo menos 2 caracteres.' }),
  emailAcess: z.string().email({ message: 'Email inválido.' }),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve ter o formato correto.'
  }),
  endereco: z
    .string()
    .min(5, { message: 'Endereço deve ter pelo menos 5 caracteres.' }),
  cep: z.string().regex(/^\d{5}-\d{3}$/, {
    message: 'CEP deve ter o formato correto (XXXXX-XXX).'
  }),
  telefone: z
    .string()
    .min(13, { message: 'Telefone deve ter pelo menos 10 caracteres.' }),
  contatoRH: z.object({
    nome: z
      .string()
      .min(2, { message: 'Nome do contato deve ter pelo menos 2 caracteres.' }),
    email: z.string().email({ message: 'Email inválido.' }),
    telefone: z
      .string()
      .min(13, { message: 'Telefone deve ter pelo menos 13 caracteres.' })
  }),
  contatoResponsavel: z.object({
    nome: z.string().min(2, {
      message: 'Nome do responsável deve ter pelo menos 2 caracteres.'
    }),
    email: z.string().email({ message: 'Email inválido.' }),
    telefone: z
      .string()
      .min(13, { message: 'Telefone deve ter pelo menos 13 caracteres.' })
  }),
  segmento: z
    .string()
    .min(3, { message: 'Segmento deve ter pelo menos 3 caracteres.' })
});

export default function CredenciadoFormEdit() {
  const params = useParams();
  const router = useRouter();
  const credenciadoId = Array.isArray(params.credenciadoraId)
    ? params.credenciadoraId[0]
    : params.credenciadoraId;

  // Hook para pegar o documento do Firestore
  const { data, loading: dataLoading } = useDocumentById(
    'credenciadoras',
    credenciadoId
  );
  // Hook para atualizar o documento no Firestore
  const { updateDocument } = useFirestore({
    collectionName: 'credenciadoras',
    onSuccess: () => {
      toast.success('Credenciadora atualizada com sucesso!');
      router.push('/dashboard/credenciadoras');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao atualizar o credenciadora.');
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      emailAcess: '',
      cnpj: '',
      endereco: '',
      cep: '',
      telefone: '',
      contatoResponsavel: { nome: '', email: '', telefone: '' },
      segmento: ''
    }
  });

  const { documents: segmentos } = useFetchDocuments('segmentos');

  // Atualiza os valores do formulário quando os dados são carregados
  useEffect(() => {
    if (data) {
      form.reset({
        razaoSocial: data.razaoSocial || '',
        nomeFantasia: data.nomeFantasia || '',
        emailAcess: data.emailAcess || '',
        cnpj: data.cnpj || '',
        endereco: data.endereco || '',
        cep: data.cep || '',
        telefone: data.telefone || '',
        contatoResponsavel: data.contatoResponsavel || {
          nome: '',
          email: '',
          telefone: ''
        },
        segmento: data.segmento || ''
      });
    }
  }, [data, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Form Submitted with values:', values); // Verifique se chega aqui
    updateDocument(credenciadoId, values);
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Credenciadora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              console.log('Form Submitted with values:', values); // Verifique se chega aqui
              updateDocument(credenciadoId, values);
            })}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Razão Social */}
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

              {/* Nome Fantasia */}
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
                        disabled
                        placeholder="Digite o email de acesso"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CNPJ */}
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o CNPJ"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(maskCNPJ(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Endereço */}
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

              {/* CEP */}
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o CEP"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(maskCEP(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone */}
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o telefone"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(maskTelefone(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contato RH - Nome */}
              <FormField
                control={form.control}
                name="contatoResponsavel.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome do contato"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contato RH - Email */}
              <FormField
                control={form.control}
                name="contatoResponsavel.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Responsável</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o email do contato"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contato RH - Telefone */}
              <FormField
                control={form.control}
                name="contatoResponsavel.telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Responsável</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o telefone do contato"
                        {...field}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(maskTelefone(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Segmento */}
              <FormField
                control={form.control}
                name="segmento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o segmento" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {segmentos.map((segmento) => (
                          <SelectItem key={segmento.id} value={segmento.id}>
                            {segmento.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                ? 'Atualizando credenciadora...'
                : 'Atualizar Credenciadora'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
