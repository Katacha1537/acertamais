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
import { createLogin } from '@/lib/createLogin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

function maskCEP(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
}

function maskCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{2})$/, '$1-$2')
    .substring(0, 18);
}

function maskTelefone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    .substring(0, 15);
}

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

export default function CredenciadoraForm() {
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

  const router = useRouter();
  const { documents: segmentos } = useFetchDocuments('segmentos');
  const { addDocument, loading } = useFirestore({
    collectionName: 'credenciadoras',
    onSuccess: () => {
      form.reset();
      toast.success('Credenciadora cadastrada com sucesso!');
      router.push('/dashboard/credenciadoras');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao cadastrar a credenciadora.');
    }
  });

  const { addDocument: addUser } = useFirestore({
    collectionName: 'users'
  });

  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);

  // Função para consultar a API da ReceitaWS
  const fetchCNPJData = async (cnpj: string) => {
    try {
      setIsFetchingCNPJ(true);
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      const response = await fetch(`/api/cnpj/${cleanCNPJ}`);

      if (!response.ok) {
        throw new Error('Erro ao consultar CNPJ');
      }

      const data = await response.json();

      if (data.status === 'ERROR') {
        throw new Error(data.message || 'CNPJ inválido ou não encontrado');
      }

      form.setValue('razaoSocial', data.nome || '');
      form.setValue('nomeFantasia', data.fantasia || '');
      form.setValue('emailAcess', data.email || '');
      form.setValue(
        'endereco',
        `${data.logradouro || ''}, ${data.numero || ''}, ${
          data.municipio || ''
        } - ${data.uf || ''}`
      );
      form.setValue('cep', maskCEP(data.cep || ''));
      form.setValue('telefone', maskTelefone(data.telefone || ''));

      if (data.atividade_principal && data.atividade_principal.length > 0) {
        const atividade = data.atividade_principal[0].text;
        const segmentoMatch = segmentos.find((seg) =>
          atividade.toLowerCase().includes(seg.nome.toLowerCase())
        );
        if (segmentoMatch) {
          form.setValue('segmento', segmentoMatch.id);
        }
      }

      toast.success('Dados do CNPJ preenchidos com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao consultar os dados do CNPJ.'
      );
    } finally {
      setIsFetchingCNPJ(false);
    }
  };

  // Monitorar o campo CNPJ
  const cnpj = form.watch('cnpj');

  useEffect(() => {
    // Verificar se o CNPJ está no formato correto antes de consultar
    if (cnpj && /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj)) {
      fetchCNPJData(cnpj);
    }
  }, [cnpj]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const user = await createLogin(values.emailAcess);
    const userInfo = {
      uid: user,
      role: 'accrediting',
      name: values.nomeFantasia,
      email: values.emailAcess,
      firstLogin: true
    };
    addUser(userInfo, null);
    addDocument(values, user);
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Cadastro de Credenciadora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* CNPJ (movido para o topo para priorizar) */}
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
                        disabled={isFetchingCNPJ}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Razão Social */}
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite a razão social"
                        {...field}
                        disabled={isFetchingCNPJ}
                      />
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
                      <Input
                        placeholder="Digite o nome fantasia"
                        {...field}
                        disabled={isFetchingCNPJ}
                      />
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
                        placeholder="Digite o email de acesso"
                        {...field}
                        disabled={isFetchingCNPJ}
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
                      <Input
                        placeholder="Digite o endereço"
                        {...field}
                        disabled={isFetchingCNPJ}
                      />
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
                        disabled={isFetchingCNPJ}
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
                        disabled={isFetchingCNPJ}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contato Responsável - Nome */}
              <FormField
                control={form.control}
                name="contatoResponsavel.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome do responsável"
                        {...field}
                        disabled={isFetchingCNPJ}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contato Responsável - Email */}
              <FormField
                control={form.control}
                name="contatoResponsavel.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Responsável</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o email do responsável"
                        {...field}
                        disabled={isFetchingCNPJ}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contato Responsável - Telefone */}
              <FormField
                control={form.control}
                name="contatoResponsavel.telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Responsável</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o telefone do responsável"
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(maskTelefone(e.target.value))
                        }
                        disabled={isFetchingCNPJ}
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
                      defaultValue=""
                      disabled={isFetchingCNPJ}
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
            <Button disabled={loading || isFetchingCNPJ} type="submit">
              {loading
                ? 'Cadastrando credenciadora...'
                : 'Cadastrar Credenciadora'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
