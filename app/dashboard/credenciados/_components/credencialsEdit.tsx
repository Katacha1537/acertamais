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
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
      message: 'CNPJ deve ter o formato correto.'
    }),
  endereco: z
    .string()
    .min(5, { message: 'Endereço deve ter pelo menos 5 caracteres.' }),
  cep: z
    .string()
    .regex(/^\d{5}-\d{3}$/, {
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
  segmento: z
    .string()
    .min(3, { message: 'Segmento deve ter pelo menos 3 caracteres.' })
});

export default function CredenciadoFormEdit() {
  const params = useParams();
  const router = useRouter();
  const credenciadoId = Array.isArray(params.credenciadoId)
    ? params.credenciadoId[0]
    : params.credenciadoId;

  // Hook para pegar o documento do Firestore
  const { data, loading: dataLoading } = useDocumentById(
    'credenciados',
    credenciadoId
  );
  // Hook para atualizar o documento no Firestore
  const { updateDocument } = useFirestore({
    collectionName: 'credenciados',
    onSuccess: () => {
      toast.success('Credenciado atualizado com sucesso!');
      router.push('/dashboard/credenciados');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao atualizar o credenciado.');
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      endereco: '',
      cep: '',
      telefone: '',
      contatoRH: { nome: '', email: '', telefone: '' },
      segmento: ''
    }
  });

  // Atualiza os valores do formulário quando os dados são carregados
  useEffect(() => {
    if (data) {
      form.reset({
        razaoSocial: data.razaoSocial || '',
        nomeFantasia: data.nomeFantasia || '',
        cnpj: data.cnpj || '',
        endereco: data.endereco || '',
        cep: data.cep || '',
        telefone: data.telefone || '',
        contatoRH: data.contatoRH || { nome: '', email: '', telefone: '' },
        segmento: data.segmento || ''
      });
    }
  }, [data, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateDocument(credenciadoId, values);
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Credenciado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                name="contatoRH.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Contato RH</FormLabel>
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
                name="contatoRH.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Contato RH</FormLabel>
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
                name="contatoRH.telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone do Contato RH</FormLabel>
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
                        <SelectItem value="agronegocio">Agronegócio</SelectItem>
                        <SelectItem value="alimentacao">Alimentação</SelectItem>
                        <SelectItem value="artes_publicidade">
                          Artes e Publicidade
                        </SelectItem>
                        <SelectItem value="automotivo">Automotivo</SelectItem>
                        <SelectItem value="beleza_estetica">
                          Beleza e Estética
                        </SelectItem>
                        <SelectItem value="comercio">Comércio</SelectItem>
                        <SelectItem value="confeccoes">Confecções</SelectItem>
                        <SelectItem value="construcao">Construção</SelectItem>
                        <SelectItem value="consultoria">Consultoria</SelectItem>
                        <SelectItem value="educacao">Educação</SelectItem>
                        <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                        <SelectItem value="empresas_variadas">
                          Empresas Variadas
                        </SelectItem>
                        <SelectItem value="financas">Finanças</SelectItem>
                        <SelectItem value="hospedagem_turismo">
                          Hospedagem e Turismo
                        </SelectItem>
                        <SelectItem value="industria">Indústria</SelectItem>
                        <SelectItem value="logistica_transporte">
                          Logística e Transporte
                        </SelectItem>
                        <SelectItem value="saude">Saúde</SelectItem>
                        <SelectItem value="servicos_gerais">
                          Serviços Gerais
                        </SelectItem>
                        <SelectItem value="tecnologia">Tecnologia</SelectItem>
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
                ? 'Atualizando credenciado...'
                : 'Atualizar Credenciado'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
