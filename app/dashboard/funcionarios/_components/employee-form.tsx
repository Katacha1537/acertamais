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
import { createLogin } from '@/lib/createLogin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import InputMask from 'react-input-mask';
import { toast } from 'sonner';
import * as z from 'zod';

// Validação do Formulário
const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome do funcionário deve ter pelo menos 2 caracteres.'
  }),
  dataNascimento: z
    .string()
    .regex(
      /^\d{2}\/\d{2}\/\d{4}$/,
      'Data de nascimento inválida. Use o formato DD/MM/AAAA.'
    ),
  endereco: z
    .string()
    .min(5, { message: 'Endereço deve ter pelo menos 5 caracteres.' }),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido.')
    .refine(async (cpf) => {
      const response = await fetch(`/api/check-cpf?cpf=${cpf}`);
      const data = await response.json();
      return !data.exists;
    }, 'Este CPF já está cadastrado.'),
  email: z
    .string()
    .email({ message: 'Por favor, insira um endereço de email válido.' }),
  telefone: z
    .string()
    .regex(
      /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
      'Telefone inválido. Use o formato (XX) XXXXX-XXXX.'
    ),
  pessoasNaCasa: z
    .string()
    .optional()
    .refine(
      (val) => (val ? !isNaN(Number(val)) : true),
      'O número de pessoas na casa deve ser um número.'
    ),
  empresaId: z.string().nullable().optional()
});

export default function FuncionarioForm() {
  const { user } = useUser(); // Obtém o usuário atual

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      dataNascimento: '',
      endereco: '',
      cpf: '',
      email: '',
      telefone: '',
      pessoasNaCasa: '',
      empresaId: user?.role === 'business' ? user.uid : undefined
    }
  });

  const { documents: empresas, loading } = useFetchDocuments('empresas');
  const [loadingOn, setLoadingOn] = useState(false);
  const router = useRouter();

  const { addDocument, loading: addLoading } = useFirestore({
    collectionName: 'funcionarios',
    onSuccess: async () => {
      form.reset();
      toast.success('Funcionário adicionado com sucesso!');
      router.push('/dashboard/funcionarios');
      setLoadingOn(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao adicionar o funcionário.');
      setLoadingOn(false);
    }
  });

  const { addDocument: addUser } = useFirestore({
    collectionName: 'users'
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Valores enviados:', values);
    const newValues = { ...values };

    if (user?.role === 'business' && user?.uid) {
      newValues.empresaId = user.uid;
    } else {
      newValues.empresaId = '';
    }
    // Agora, você pode continuar o processo com o newValues
    const userCreated = await createLogin(newValues.email);
    const userInfo = {
      uid: userCreated,
      role: 'employee',
      name: newValues.nome,
      email: newValues.email
    };

    addUser(userInfo, null);
    addDocument(newValues, userCreated);
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Criar Funcionário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data de Nascimento */}
              <FormField
                control={form.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <InputMask
                        mask="99/99/9999"
                        placeholder="Digite a data de nascimento"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {(inputProps) => <Input {...inputProps} />}
                      </InputMask>
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
                    <FormLabel>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o endereço completo"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF */}
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <InputMask
                        mask="999.999.999-99"
                        placeholder="Digite o CPF"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {(inputProps) => <Input {...inputProps} />}
                      </InputMask>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o email" {...field} />
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
                      <InputMask
                        mask="(99) 99999-9999"
                        placeholder="Digite o telefone"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {(inputProps) => <Input {...inputProps} />}
                      </InputMask>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pessoas na Casa */}
              <FormField
                control={form.control}
                name="pessoasNaCasa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantas pessoas moram na mesma casa? (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o número" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Empresa */}
              {user?.role !== 'business' && (
                <FormField
                  control={form.control}
                  name="empresaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empresas.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.nomeFantasia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {user?.role === 'business' && (
                <FormField
                  control={form.control}
                  name="empresaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key={user.uid} value={user.uid || ''}>
                            {user.displayName}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button disabled={loadingOn} type="submit">
              {loadingOn ? 'Criando Funcionário...' : 'Criar Funcionário'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
