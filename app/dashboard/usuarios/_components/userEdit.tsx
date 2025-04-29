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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useUser } from '@/context/UserContext';
import { useDocumentById } from '@/hooks/useDocumentById';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import InputMask from 'react-input-mask';
import { toast } from 'sonner';
import * as z from 'zod';

// CPF validation function
function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.charAt(i - 1)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.charAt(i - 1)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Form schema
const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome deve ter pelo menos 2 caracteres.'
  }),
  email: z
    .string()
    .email({ message: 'Por favor, insira um endereço de email válido.' }),
  cpf: z
    .string()
    .regex(
      /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      'CPF inválido. Use o formato 999.999.999-99.'
    )
    .refine((value) => isValidCPF(value), {
      message: 'CPF inválido ou fictício.'
    }),
  telefone: z
    .string()
    .regex(
      /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
      'Telefone inválido. Use o formato (XX) XXXXX-XXXX.'
    ),
  credenciado_Id: z
    .string()
    .min(1, { message: 'Selecione um credenciado.' })
    .nullable()
});

export default function UserFormEdit() {
  const router = useRouter();
  const params = useParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const { data, loading: dataLoading } = useDocumentById('users', userId);
  const { updateDocument } = useFirestore({
    collectionName: 'users',
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso!');
      router.push('/dashboard/usuarios');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao atualizar o usuário.');
    }
  });

  const { user } = useUser();
  const {
    documents: credenciados,
    loading: credenciadosLoading,
    error: credenciadosError
  } = useFetchDocuments('credenciados');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      cpf: '',
      telefone: '',
      credenciado_Id: user?.role === 'accredited' ? user?.uid : ''
    }
  });

  useEffect(() => {
    if (data) {
      form.reset({
        nome: data.name || '',
        email: data.email || '',
        cpf: data.cpf
          ? `${data.cpf.slice(0, 3)}.${data.cpf.slice(3, 6)}.${data.cpf.slice(
              6,
              9
            )}-${data.cpf.slice(9)}`
          : '',
        telefone: data.telefone || '',
        credenciado_Id: data.credenciado_Id || null
      });
    }
  }, [data, form, user]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const dataToUpdate = {
      name: values.nome,
      email: values.email,
      cpf: values.cpf.replace(/\D/g, ''),
      telefone: values.telefone,
      credenciado_Id: values.credenciado_Id
    };

    updateDocument(userId, dataToUpdate);
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Usuário
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
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              {user?.role === 'accredited' ? (
                <FormField
                  control={form.control}
                  name="credenciado_Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credenciado</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          value={user?.displayName || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="credenciado_Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecionar Credenciado</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                          disabled={credenciadosLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione um credenciado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {credenciados?.map((credenciado) => (
                                <SelectItem
                                  key={credenciado.id}
                                  value={credenciado.id}
                                >
                                  {credenciado.nomeFantasia}
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
                dataLoading ||
                form.formState.isSubmitting ||
                credenciadosLoading
              }
              type="submit"
            >
              {form.formState.isSubmitting
                ? 'Atualizando usuário...'
                : 'Atualizar usuário'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
