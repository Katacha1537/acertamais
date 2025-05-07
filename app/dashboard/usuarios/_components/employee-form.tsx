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
import { useFirestore } from '@/hooks/useFirestore';
import { createLogin } from '@/lib/createLogin';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
    })
    .refine(
      async (value) => {
        if (!value || !isValidCPF(value)) return true;
        const cpfClean = value.replace(/\D/g, '');
        const response = await fetch(`/api/check-cpf?cpf=${cpfClean}`);
        const data = await response.json();
        return !data.exists;
      },
      { message: 'Este CPF já está cadastrado.' }
    ),
  telefone: z
    .string()
    .regex(
      /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
      'Telefone inválido. Use o formato (XX) XXXXX-XXXX.'
    ),
  role: z.enum(
    [
      'admin',
      'adminAccrediting',
      'adminAccredited',
      'adminBusiness',
      'employeeAccredited'
    ],
    {
      errorMap: () => ({ message: 'Selecione um nível de acesso.' })
    }
  )
});

export default function UserForm() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Define available roles based on user.role
  const availableRoles = (() => {
    if (!user?.role) return [];
    switch (user.role) {
      case 'admin':
        return [{ value: 'admin', label: 'Administrador' }];
      case 'business':
        return [{ value: 'adminBusiness', label: 'Administrador da Empresa' }];
      case 'accredited':
        return [
          { value: 'adminAccredited', label: 'Administrador do Credenciado' },
          { value: 'employeeAccredited', label: 'Funcionário do Credenciado' }
        ];
      case 'accrediting':
        return [
          { value: 'adminAccrediting', label: 'Administrador da Credenciadora' }
        ];
      default:
        return [];
    }
  })();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      cpf: '',
      telefone: '',
      role: undefined
    }
  });

  const { addDocument: addUser } = useFirestore({
    collectionName: 'users',
    onSuccess: () => {
      form.reset();
      toast.success('Usuário adicionado com sucesso!');
      router.push('/dashboard/usuarios');
      setLoading(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao adicionar o usuário.');
      setLoading(false);
    }
  });
  const { addDocument: addUsuarios } = useFirestore({
    collectionName: 'usuarios'
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCreated = await createLogin(values.email);
      const userInfo: any = {
        uid: userCreated,
        role: values.role,
        name: values.nome,
        email: values.email,
        cpf: values.cpf,
        telefone: values.telefone,
        firstLogin: true,
        donoId: user?.uid
      };

      // Set entity ID based on user role
      if (user?.role === 'business') {
        userInfo.empresa_Id = user.uid;
      } else if (user?.role === 'accredited') {
        userInfo.credenciado_Id = user.uid;
      } else if (user?.role === 'accrediting') {
        userInfo.credenciadora_Id = user.uid;
      }

      await addUser(userInfo, userCreated);
      await addUsuarios(userInfo, null);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar o login do usuário.');
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Criar Usuário
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
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Acesso</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível de acesso" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button disabled={loading || !user?.role} type="submit">
              {loading ? 'Criando Usuário...' : 'Criar Usuário'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
