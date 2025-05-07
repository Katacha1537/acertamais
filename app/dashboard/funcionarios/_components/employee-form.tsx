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
import { db } from '@/service/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
    .optional()
    .refine((value) => !value || isValidCPF(value), {
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
      'O número de pessoas na casa deve be um número.'
    ),
  empresaId: z.string().nullable().optional()
});

export default function FuncionarioForm() {
  const { user } = useUser();
  const router = useRouter();
  const { documents: empresas, loading: empresasLoading } =
    useFetchDocuments('empresas');
  const [loadingOn, setLoadingOn] = useState(false);
  const [existingEmployee, setExistingEmployee] = useState<any>(null);
  const [isActiveEmployee, setIsActiveEmployee] = useState(false); // New state for active employee

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
          : undefined
    }
  });

  const {
    addDocument,
    updateDocument,
    loading: addLoading
  } = useFirestore({
    collectionName: 'funcionarios',
    onSuccess: async () => {
      form.reset();
      toast.success(
        existingEmployee
          ? 'Funcionário atualizado com sucesso!'
          : 'Funcionário adicionado com sucesso!'
      );
      router.push('/dashboard/funcionarios');
      setLoadingOn(false);
      setExistingEmployee(null);
      setIsActiveEmployee(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error(
        existingEmployee
          ? 'Erro ao atualizar o funcionário.'
          : 'Erro ao adicionar o funcionário.'
      );
      setLoadingOn(false);
    }
  });

  const { addDocument: addUser } = useFirestore({
    collectionName: 'users'
  });

  // Function to check if CPF exists in funcionarios
  const checkCPFExists = async (cpf: string) => {
    if (!cpf || !isValidCPF(cpf)) {
      setExistingEmployee(null);
      setIsActiveEmployee(false);
      form.reset({
        nome: '',
        dataNascimento: '',
        endereco: '',
        cpf,
        email: '',
        telefone: '',
        pessoasNaCasa: '',
        empresaId: user?.role === 'business' ? user.uid : undefined
      });
      return;
    }

    const cpfClean = cpf;
    const q = query(
      collection(db, 'funcionarios'),
      where('cpf', '==', cpfClean)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const employeeData = querySnapshot.docs[0].data();
      const employeeId = querySnapshot.docs[0].id;
      const isDeleted = employeeData.isDeleted ?? false;
      const status = employeeData.status ?? 'enable';

      if (isDeleted && status === 'disabled') {
        // Populate form with existing data
        setExistingEmployee({ id: employeeId, ...employeeData });
        setIsActiveEmployee(false);
        form.reset({
          nome: employeeData.nome || '',
          dataNascimento: employeeData.dataNascimento || '',
          endereco: employeeData.endereco || '',
          cpf: employeeData.cpf || '',
          email: employeeData.email || '',
          telefone: employeeData.telefone || '',
          pessoasNaCasa: employeeData.pessoasNaCasa || '',
          empresaId:
            employeeData.empresaId ||
            (user?.role === 'business' ? user.uid : undefined)
        });
      } else {
        // CPF exists but is active, reset form except CPF
        setExistingEmployee(null);
        setIsActiveEmployee(true); // Mark as active to disable button
        form.reset({
          nome: '',
          dataNascimento: '',
          endereco: '',
          cpf,
          email: '',
          telefone: '',
          pessoasNaCasa: '',
          empresaId: user?.role === 'business' ? user.uid : undefined
        });
        toast.error('Este CPF já está cadastrado e ativo.');
      }
    } else {
      // CPF does not exist, reset form except CPF
      setExistingEmployee(null);
      setIsActiveEmployee(false);
      form.reset({
        nome: '',
        dataNascimento: '',
        endereco: '',
        cpf,
        email: '',
        telefone: '',
        pessoasNaCasa: '',
        empresaId: user?.role === 'business' ? user.uid : undefined
      });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoadingOn(true);
    const newValues = { ...values };

    if (user?.role === 'business' && user?.uid) {
      newValues.empresaId = user.uid;
    } else if (user?.role === 'adminBusiness' && user?.donoId) {
      newValues.empresaId = user.donoId;
    } else {
      newValues.empresaId = values.empresaId || '';
    }

    if (existingEmployee) {
      // Update existing employee (only isDeleted and status)
      await updateDocument(existingEmployee.id, {
        isDeleted: false,
        status: 'enable'
      });
    } else {
      // Create new employee
      const userCreated = await createLogin(newValues.email);
      const userInfo = {
        uid: userCreated,
        role: 'employee',
        name: newValues.nome,
        email: newValues.email,
        firstLogin: true
      };

      await addUser(userInfo, null);
      await addDocument(
        { ...newValues, isDeleted: false, status: 'enable' },
        userCreated
      );
    }
  }

  if (empresasLoading) {
    return <div>Carregando...</div>;
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
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          checkCPFExists(e.target.value);
                        }}
                      >
                        {(inputProps) => <Input {...inputProps} />}
                      </InputMask>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
              {user?.role === 'admin' && (
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
                      <FormControl>
                        <Input
                          value={
                            empresas.find((doc) => doc.id === user?.uid)
                              ?.nomeFantasia || ''
                          }
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button
              disabled={addLoading || loadingOn || isActiveEmployee}
              type="submit"
            >
              {addLoading || loadingOn
                ? existingEmployee
                  ? 'Atualizando Funcionário...'
                  : 'Criando Funcionário...'
                : existingEmployee
                ? 'Atualizar Funcionário'
                : 'Criar Funcionário'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
