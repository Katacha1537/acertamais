'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox component
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
import { useDocumentById } from '@/hooks/useDocumentById';
import useFetchDocuments from '@/hooks/useFetchDocuments';
import { useFirestore } from '@/hooks/useFirestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import InputMask from 'react-input-mask';
import { toast } from 'sonner';
import * as z from 'zod';

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

// Updated Form Schema
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
    .optional()
    .refine((value) => !value || isValidCPF(value), {
      message: 'CPF inválido ou fictício.'
    }),
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
  empresaId: z.string().nullable().optional(),
  isActive: z.boolean().optional() // Add isActive to schema
});

export default function EmployeeFormEdit() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const employeeId = Array.isArray(params.employeeId)
    ? params.employeeId[0]
    : params.employeeId;

  const { data, loading: dataLoading } = useDocumentById(
    'funcionarios',
    employeeId
  );
  const { documents: empresas, loading: empresasLoading } =
    useFetchDocuments('empresas');
  const { updateDocument, loading: updateLoading } = useFirestore({
    collectionName: 'funcionarios',
    onSuccess: () => {
      toast.success('Funcionário atualizado com sucesso!');
      router.push('/dashboard/funcionarios');
      setLoading(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao atualizar o funcionário.');
      setLoading(false);
    }
  });

  const [loading, setLoading] = useState(false);

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
      empresaId:
        user?.role === 'business'
          ? user.uid
          : user?.role === 'adminBusiness'
          ? user.donoId
          : '',
      isActive: true // Default to true (active)
    }
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      // Determine isActive based on isDeleted and status
      const isDeleted = data.isDeleted ?? false;
      const status = data.status ?? 'enable';
      const isActive = !isDeleted && status === 'enable';

      form.reset({
        nome: data.nome || '',
        dataNascimento: data.dataNascimento || '',
        endereco: data.endereco || '',
        cpf: data.cpf || '',
        email: data.email || '',
        telefone: data.telefone || '',
        pessoasNaCasa: data.pessoasNaCasa || '',
        empresaId:
          data.empresaId ||
          (user?.role === 'business'
            ? user.uid
            : user?.role === 'adminBusiness'
            ? user.donoId
            : ''),
        isActive
      });
    }
  }, [data, form, user]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const updatedValues = {
      ...values,
      // Map isActive to isDeleted and status
      isDeleted: !values.isActive,
      status: values.isActive ? 'enable' : 'disabled'
    };

    if (user?.role === 'business' && user?.uid) {
      updatedValues.empresaId = user.uid;
    } else if (user?.role === 'adminBusiness' && user?.donoId) {
      updatedValues.empresaId = user.donoId;
    }

    // Remove isActive from the data sent to Firestore
    delete updatedValues.isActive;

    await updateDocument(employeeId, updatedValues);
  }

  if (empresasLoading || dataLoading || !data) {
    return <div>Carregando...</div>;
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Editar Funcionário - {employeeId}
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

              {/* Usuário Ativo Checkbox (Only for Admin) */}
              {user?.role === 'admin' && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium">
                        Usuário Ativo?
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button disabled={loading || updateLoading} type="submit">
              {loading || updateLoading
                ? 'Atualizando Funcionário...'
                : 'Atualizar Funcionário'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
