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
import { useFirestore } from '@/hooks/useFirestore';
import useUploadImage from '@/hooks/useUploadImage';
import { createLogin } from '@/lib/createLogin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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

// Esquema de validação do Zod
const formSchema = z.object({
  razaoSocial: z
    .string()
    .min(2, { message: 'Razão Social deve ter pelo menos 2 caracteres.' }),
  nomeFantasia: z
    .string()
    .min(2, { message: 'Nome Fantasia deve ter pelo menos 2 caracteres.' }),
  emailAcess: z.string().email({ message: 'Email inválido.' }),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
      message: 'CNPJ deve ter o formato correto.'
    }), // Updated validation
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
    .min(3, { message: 'Segmento deve ter pelo menos 3 caracteres.' }),
  imagem: z
    .instanceof(File)
    .refine((file) => file.type.startsWith('image/'), {
      message: 'Apenas imagens são permitidas.'
    })
    .optional()
});

export default function CredenciadoForm() {
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
      contatoRH: { nome: '', email: '', telefone: '' },
      segmento: '',
      imagem: undefined
    }
  });

  const router = useRouter();

  const { isUploading, progress, url, error, uploadImage } = useUploadImage();

  // Hook do Firestore
  const { addDocument, loading } = useFirestore({
    collectionName: 'credenciados',
    onSuccess: () => {
      form.reset();
      toast.success('Credenciado adicionado com sucesso!');
      router.push('/dashboard/credenciados');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao adicionar o credenciado.');
    }
  });

  const { addDocument: addUser } = useFirestore({
    collectionName: 'users'
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      let imageUrl: string | null = null;

      // Upload da imagem se existir
      if (values.imagem) {
        try {
          imageUrl = await uploadImage(
            values.imagem,
            'credenciados',
            values.cnpj.replace(/\D/g, '')
          );

          if (!imageUrl) {
            toast.error('Erro ao fazer upload da imagem');
            return;
          }
        } catch (err) {
          console.error('Erro no upload:', err);
          toast.error('Falha no upload da imagem');
          return;
        }
      }

      // Criação do usuário
      let user: string;
      try {
        user = await createLogin(values.emailAcess);
      } catch (err) {
        console.error('Erro ao criar usuário:', err);
        toast.error('Erro ao criar acesso. Verifique se o email já está cadastrado.');
        return;
      }

      // Preparar dados para Firestore
      const firestoreData = {
        ...values,
        imagemUrl: imageUrl || null, // Garante null caso não tenha imagem
        createdAt: new Date().toISOString()
      };

      // Remove o campo File que não será armazenado
      delete firestoreData.imagem;

      // Adicionar dados ao Firestore
      await Promise.all([
        addUser({
          uid: user,
          role: 'accredited',
          name: values.nomeFantasia,
          email: values.emailAcess,
          avatar: imageUrl
        }, null),
        addDocument(firestoreData, user)
      ]);

      toast.success('Credenciado cadastrado com sucesso!');
      router.push('/dashboard/credenciados');

    } catch (err) {
      console.error('Erro geral:', err);
      toast.error('Ocorreu um erro inesperado');
    }
  }


  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Cadastro de Credenciados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="imagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo Empresa</FormLabel>
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
                    {/* Preview da imagem */}
                    {field.value && field.value instanceof File && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(field.value)}
                          alt="Imagem selecionada"
                          className="w-32 h-32 object-cover"
                        />
                      </div>
                    )}
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
                    <Select onValueChange={field.onChange} defaultValue="">
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
            {isUploading && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enviando imagem...
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            <Button disabled={loading || isUploading} type="submit">
              {loading ? `Cadastrando credenciado - ${progress}%` : 'Cadastrar Credenciado'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
